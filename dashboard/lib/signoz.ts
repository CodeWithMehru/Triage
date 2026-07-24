export interface SigNozSpan {
  id: string;
  timestamp: string;
  serviceName: string;
  operation: string;
  threatType: string;
  severity: string;
  sourceIp: string;
  statusCode: number;
  durationMs: number;
}

export interface SigNozQueryResult {
  spans: SigNozSpan[];
  connected: boolean;
  error?: string;
}

const SIGNOZ_URL =
  process.env.SIGNOZ_API_URL ?? "http://localhost:8080";

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = process.env.SIGNOZ_API_KEY;
  if (apiKey) {
    headers["SIGNOZ-API-KEY"] = apiKey;
  }
  return headers;
}

export async function queryCriticalTraces(
  startMs: number,
  endMs: number
): Promise<SigNozQueryResult> {
  const payload = {
    start: startMs,
    end: endMs,
    requestType: "raw",
    compositeQuery: {
      queries: [
        {
          type: "builder_query",
          spec: {
            name: "A",
            signal: "traces",
            stepInterval: 60,
            filter: {
              expression:
                "http.status_code = 403 AND security.severity = 'CRITICAL'",
            },
            selectFields: [
              { name: "service.name", fieldContext: "resource" },
              { name: "name", fieldContext: "span" },
              { name: "security.threat_type", fieldContext: "span" },
              { name: "security.severity", fieldContext: "span" },
              { name: "security.source_ip", fieldContext: "span" },
              { name: "http.status_code", fieldContext: "span" },
              { name: "durationNano", fieldContext: "span" },
              { name: "timestamp", fieldContext: "span" },
            ],
            order: [{ key: { name: "timestamp" }, direction: "desc" }],
            limit: 20,
            offset: 0,
          },
        },
      ],
    },
  };

  try {
    const res = await fetch(`${SIGNOZ_URL}/api/v5/query_range`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        spans: [],
        connected: false,
        error: `SigNoz API ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const json = await res.json();
    const spans = parseSigNozResponse(json);
    return { spans, connected: true };
  } catch (err) {
    return {
      spans: [],
      connected: false,
      error: err instanceof Error ? err.message : "SigNoz unreachable",
    };
  }
}

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseSigNozResponse(json: unknown): SigNozSpan[] {
  const result = json as {
    data?: {
      result?: Array<{
        list?: Array<{
          data?: Record<string, unknown>;
        }>;
      }>;
    };
  };

  const list = result?.data?.result?.[0]?.list ?? [];
  const spans: SigNozSpan[] = [];

  for (const item of list) {
    const d = item.data ?? item;
    const record = d as Record<string, unknown>;

    spans.push({
      id: String(record.spanID ?? record.span_id ?? randomId()),
      timestamp: String(record.timestamp ?? new Date().toISOString()),
      serviceName: String(record["service.name"] ?? "unknown"),
      operation: String(record.name ?? record.operation ?? "unknown"),
      threatType: String(record["security.threat_type"] ?? "UNKNOWN"),
      severity: String(record["security.severity"] ?? "CRITICAL"),
      sourceIp: String(record["security.source_ip"] ?? "—"),
      statusCode: Number(record["http.status_code"] ?? 403),
      durationMs: Number(record.durationNano ?? 0) / 1_000_000,
    });
  }

  return spans;
}

export async function queryPortScanTraces(
  startMs: number,
  endMs: number
): Promise<SigNozSpan[]> {
  const payload = {
    start: startMs,
    end: endMs,
    requestType: "raw",
    compositeQuery: {
      queries: [
        {
          type: "builder_query",
          spec: {
            name: "A",
            signal: "traces",
            stepInterval: 60,
            filter: {
              expression:
                "service.name = 'sentinel-honeypot' AND security.threat_type = 'PORT_SCAN'",
            },
            selectFields: [
              { name: "service.name", fieldContext: "resource" },
              { name: "name", fieldContext: "span" },
              { name: "security.threat_type", fieldContext: "span" },
              { name: "network.peer.address", fieldContext: "span" },
              { name: "honeypot.service", fieldContext: "span" },
              { name: "timestamp", fieldContext: "span" },
            ],
            order: [{ key: { name: "timestamp" }, direction: "desc" }],
            limit: 10,
            offset: 0,
          },
        },
      ],
    },
  };

  try {
    const res = await fetch(`${SIGNOZ_URL}/api/v5/query_range`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) return [];
    const json = await res.json();
    return parseSigNozResponse(json);
  } catch {
    return [];
  }
}
