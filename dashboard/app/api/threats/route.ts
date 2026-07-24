import { NextResponse } from "next/server";
import {
  fetchHistoricalThreats,
  fetchThreatStats,
  fetchAutoBanAlerts,
} from "@/lib/supabase";
import {
  queryCriticalTraces,
  queryPortScanTraces,
} from "@/lib/signoz";

export const dynamic = "force-dynamic";

export async function GET() {
  const endMs = Date.now();
  const startMs = endMs - 60 * 60 * 1000;

  const [historical, stats, signoz, portScans, autoBanAlerts] =
    await Promise.all([
      fetchHistoricalThreats(100),
      fetchThreatStats(),
      queryCriticalTraces(startMs, endMs),
      queryPortScanTraces(startMs, endMs),
      fetchAutoBanAlerts(5),
    ]);

  const supabaseConnected =
    Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return NextResponse.json({
    historical,
    stats,
    autoBanAlerts,
    signoz: {
      spans: [...signoz.spans, ...portScans],
      connected: signoz.connected,
      error: signoz.error,
    },
    status: {
      supabase: supabaseConnected,
      signoz: signoz.connected,
    },
    fetchedAt: new Date().toISOString(),
  });
}
