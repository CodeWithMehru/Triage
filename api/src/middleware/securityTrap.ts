import type { Request, Response, NextFunction } from "express";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { scanSurface, type ThreatMatch } from "../rules/threatPatterns.js";
import { runTarpit } from "../services/tarpit.js";
import { persistThreatEvent } from "../services/supabaseWriter.js";
import {
  analyzePayload,
  type AiAnalysisResult,
} from "../services/aiAnalyzer.js";
import {
  isIpBanned,
  recordAttackAndCheckBan,
} from "../services/sreSidekick.js";

const AI_TIMEOUT_MS = 10_000;
const AI_FALLBACK = "AI Analysis Unavailable / Timeout";

const SCAN_HEADERS = [
  "user-agent",
  "referer",
  "authorization",
  "cookie",
  "x-forwarded-for",
  "x-api-key",
] as const;

function serializeBody(body: unknown): string {
  if (body === undefined || body === null) return "";
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
}

function serializeQuery(query: Request["query"]): string {
  try {
    return JSON.stringify(query);
  } catch {
    return "";
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "unknown";
  }
  return req.socket.remoteAddress ?? "unknown";
}

/**
 * Extract the full raw attack payload for AI analysis.
 * GET  → entire query string (everything after ?)
 * POST/PUT/PATCH → entire raw JSON body
 * Other → matched surface content in full
 */
function extractFullAttackPayload(
  req: Request,
  matchedSurface: string,
  matchedContent: string
): string {
  const method = req.method.toUpperCase();

  if (method === "GET" || method === "DELETE") {
    const url = req.originalUrl ?? req.url;
    const qIndex = url.indexOf("?");
    if (qIndex >= 0) {
      return decodeURIComponent(url.slice(qIndex + 1));
    }
    return url;
  }

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    const body = serializeBody(req.body);
    if (body.length > 0) return body;
  }

  return matchedContent;
}

function collectSurfaces(req: Request): Array<{ surface: string; content: string }> {
  const surfaces: Array<{ surface: string; content: string }> = [
    { surface: "url", content: req.originalUrl ?? req.url },
    { surface: "query", content: serializeQuery(req.query) },
    { surface: "body", content: serializeBody(req.body) },
  ];

  for (const header of SCAN_HEADERS) {
    const value = req.headers[header];
    if (value) {
      surfaces.push({
        surface: `header:${header}`,
        content: Array.isArray(value) ? value.join(" ") : value,
      });
    }
  }

  return surfaces;
}

function tagSpan(span: ReturnType<typeof trace.getActiveSpan>, match: ThreatMatch, ip: string): void {
  if (!span) return;

  span.setAttribute("security.severity", "CRITICAL");
  span.setAttribute("security.threat_type", match.type);
  span.setAttribute("security.matched_pattern", match.ruleName);
  span.setAttribute("security.matched_text", match.matchedText);
  span.setAttribute("security.source_ip", ip);
  span.setAttribute("security.scan_surface", match.surface);
  span.setAttribute("http.status_code", 403);
  span.setStatus({ code: SpanStatusCode.ERROR, message: match.type });
  span.addEvent("security_trap_triggered", {
    threat_type: match.type,
    rule: match.ruleName,
  });
}

async function analyzePayloadSafe(
  payload: string,
  threatType: string
): Promise<AiAnalysisResult> {
  const fallbackModel = process.env.GROQ_MODEL ?? "llama3-8b-8192";
  let timer: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`AI analysis timed out after ${AI_TIMEOUT_MS}ms`)),
      AI_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([
      analyzePayload(payload, threatType),
      timeoutPromise,
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[AI Error]: ${message}`);
    return {
      goal: AI_FALLBACK,
      latencyMs: AI_TIMEOUT_MS,
      tokenUsage: 0,
      provider: "error",
      model: fallbackModel,
    };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function sendTrapResponse(
  res: Response,
  match: ThreatMatch,
  aiAnalysis: string
): void {
  if (res.headersSent) return;
  res.status(403).json({
    error: "Forbidden",
    code: "SECURITY_TRAP",
    threat_type: match.type,
    ai_analysis: aiAnalysis,
  });
}

export async function securityTrapMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const tracer = trace.getTracer("sentinel-trap-api");
  const clientIp = getClientIp(req);

  try {
    if (await isIpBanned(clientIp)) {
      res.status(403).json({
        error: "Forbidden",
        code: "IP_AUTO_BANNED",
        message: "Your IP has been auto-banned by SRE Sidekick",
      });
      return;
    }
  } catch (ipErr) {
    const msg = ipErr instanceof Error ? ipErr.message : String(ipErr);
    console.error(`[trap] IP ban check error: ${msg}`);
  }

  for (const { surface, content } of collectSurfaces(req)) {
    const match = scanSurface(surface, content);
    if (!match) continue;

    await tracer.startActiveSpan("security.trap", async (span) => {
      let aiAnalysis = AI_FALLBACK;

      try {
        tagSpan(span, match, clientIp);

        try {
          await runTarpit();
        } catch (tarpitErr) {
          const msg = tarpitErr instanceof Error ? tarpitErr.message : String(tarpitErr);
          console.error(`[trap] tarpit error: ${msg}`);
        }

        const fullPayload = extractFullAttackPayload(req, surface, content);
        const analysis = await analyzePayloadSafe(fullPayload, match.type);

        aiAnalysis = analysis.goal;
        span.setAttribute("threat.goal", analysis.goal);
        span.setAttribute("ai.payload.full_length", fullPayload.length);

        try {
          await persistThreatEvent(match, clientIp, req.path, fullPayload, {
            goal: analysis.goal,
            latencyMs: analysis.latencyMs,
            tokenUsage: analysis.tokenUsage,
            model: analysis.model,
            provider: analysis.provider,
          });
          await recordAttackAndCheckBan(clientIp);
        } catch (persistErr) {
          const msg =
            persistErr instanceof Error ? persistErr.message : String(persistErr);
          console.error(`[trap] persist/ban error: ${msg}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[trap] unexpected error: ${msg}`);
        span.recordException(err instanceof Error ? err : new Error(msg));
        span.setStatus({ code: SpanStatusCode.ERROR, message: msg });
      } finally {
        sendTrapResponse(res, match, aiAnalysis);
        span.end();
      }
    });

    return;
  }

  next();
}
