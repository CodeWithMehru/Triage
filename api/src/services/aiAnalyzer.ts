import Groq from "groq-sdk";
import { trace, SpanStatusCode } from "@opentelemetry/api";

export interface AiAnalysisResult {
  goal: string;
  latencyMs: number;
  tokenUsage: number;
  provider: string;
  model: string;
}

const ANALYSIS_PROMPT =
  "You are a senior cybersecurity SOC analyst analyzing malicious security events and payloads. You MUST ALWAYS provide a detailed, consistent, 2-to-3 sentence explanation for EVERY threat type (e.g., SQL_INJECTION, SENSITIVE_DATA_LEAK, XSS, AUTO_BAN, PORT_SCAN). Your explanation must explicitly state: 1) What the payload or threat event is, 2) The exact technical mechanism of the attack or exposure, and 3) The ultimate goal or security impact. Write exactly 2 to 3 clear, complete sentences without bullet points.";

const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

function useGroq(): boolean {
  const provider = (process.env.LLM_PROVIDER ?? "groq").toLowerCase();
  return provider === "groq" && Boolean(process.env.GROQ_API_KEY);
}

function mockAnalysis(payload: string, threatType: string): string {
  const snippet = payload.slice(0, 50);
  const goals: Record<string, string> = {
    SQL_INJECTION: `The input "${snippet}" contains SQL injection syntax targeting application queries. It operates by manipulating database query logic to bypass authentication controls. The attacker's ultimate goal is unauthorized access to sensitive database records.`,
    XSS: `The input "${snippet}" contains cross-site scripting constructs targeting web applications. It operates by attempting to inject unescaped executable script tags into client responses. The attacker's ultimate goal is session hijacking and credential theft.`,
    SENSITIVE_DATA_LEAK: `The input "${snippet}" contains sensitive API key or secret token patterns. It operates by transmitting private secrets across unencrypted request parameters. The attacker's ultimate goal is exfiltrating authentication credentials to compromise backend services.`,
    AUTO_BAN: `The event for "${snippet}" indicates automated rate-limit enforcement against an aggressive client IP. The system operates by monitoring rapid threat events and applying automated perimeter blocklists. The system's ultimate goal is neutralizing persistent brute-force or scanning attempts to safeguard platform availability.`,
  };
  return goals[threatType] ?? `The payload "${snippet}" matches a ${threatType} security trap rule. It operates by identifying anomalous input structures against active threat signature definitions. The system's ultimate goal is mitigating unauthorized access and protecting infrastructure integrity.`;
}

async function callGroq(
  payload: string,
  threatType: string
): Promise<{ goal: string; tokens: number; model: string }> {
  const client = getGroqClient();
  if (!client) {
    return {
      goal: mockAnalysis(payload, threatType),
      tokens: 0,
      model: "mock",
    };
  }

  let model = process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL;
  if (model === "llama3-8b-8192") {
    model = DEFAULT_GROQ_MODEL;
  }

  const userPrompt = `Threat Category: ${threatType}\nPayload/Content to Analyze: ${payload}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: ANALYSIS_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 250,
    temperature: 0.2,
  });

  const goal =
    completion.choices[0]?.message?.content?.trim() ??
    mockAnalysis(payload, threatType);

  return {
    goal,
    tokens: completion.usage?.total_tokens ?? 0,
    model,
  };
}

/**
 * Analyze a malicious payload with Groq LLM, wrapped in an OTel span.
 * Falls back to mock analysis if GROQ_API_KEY is not set.
 */
export async function analyzePayload(
  payload: string,
  threatType: string
): Promise<AiAnalysisResult> {
  const tracer = trace.getTracer("sentinel-trap-api");
  const start = Date.now();

  return tracer.startActiveSpan("ai.payload.analysis", async (span) => {
    span.setAttribute("security.threat_type", threatType);
    span.setAttribute("ai.payload.length", payload.length);

    try {
      const provider = useGroq() ? "groq" : "mock";
      span.setAttribute("llm.provider", provider);

      const activeModel =
        process.env.GROQ_MODEL && process.env.GROQ_MODEL !== "llama3-8b-8192"
          ? process.env.GROQ_MODEL
          : DEFAULT_GROQ_MODEL;

      const { goal, tokens, model } = useGroq()
        ? await callGroq(payload, threatType)
        : {
            goal: mockAnalysis(payload, threatType),
            tokens: 0,
            model: activeModel,
          };

      const latencyMs = Date.now() - start;

      span.setAttribute("llm.latency", latencyMs);
      span.setAttribute("llm.token_usage", tokens);
      span.setAttribute("llm.model", model);
      span.setAttribute("threat.goal", goal);
      span.setStatus({ code: SpanStatusCode.OK });

      return { goal, latencyMs, tokenUsage: tokens, provider, model };
    } catch (err) {
      const latencyMs = Date.now() - start;
      const goal = mockAnalysis(payload, threatType);
      const activeModel =
        process.env.GROQ_MODEL && process.env.GROQ_MODEL !== "llama3-8b-8192"
          ? process.env.GROQ_MODEL
          : DEFAULT_GROQ_MODEL;

      span.setAttribute("llm.latency", latencyMs);
      span.setAttribute("llm.token_usage", 0);
      span.setAttribute("threat.goal", goal);
      span.setAttribute("llm.provider", "groq-fallback");
      span.setAttribute("llm.model", activeModel);
      span.recordException(err instanceof Error ? err : new Error(String(err)));
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : "Groq analysis failed",
      });

      return {
        goal,
        latencyMs,
        tokenUsage: 0,
        provider: "groq-fallback",
        model: activeModel,
      };
    } finally {
      span.end();
    }
  });
}
