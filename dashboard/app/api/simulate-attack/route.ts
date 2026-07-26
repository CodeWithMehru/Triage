import { NextRequest, NextResponse } from "next/server";

const TRAP_API = process.env.TRAP_API_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { type } = body as { type: string };

    const validHeaders = {
      "Content-Type": "application/json",
      "x-triage-api-key": "trg_live_SIMULATIONKEY_12345",
    };

    // SQL Injection converted to POST so it matches backend expectations
    if (type === "sqli") {
      const res = await fetch(`${TRAP_API}/api/search`, {
        method: "POST",
        headers: validHeaders,
        body: JSON.stringify({
          query: "' OR 1=1--",
          payload: "sqli"
        }),
      });
      return NextResponse.json({ status: "fired", code: res.status });
    }

    // Data Leak (Already working)
    if (type === "leak") {
      const res = await fetch(`${TRAP_API}/api/search`, {
        method: "POST",
        headers: validHeaders,
        body: JSON.stringify({
          key: "sk-1234567890abcdefghijklmnopqrstuvwxyz",
        }),
      });
      return NextResponse.json({ status: "fired", code: res.status });
    }

    // Auto-Ban converted to POST loop
    if (type === "autoban") {
      const results: number[] = [];
      for (let i = 0; i < 6; i++) {
        const res = await fetch(`${TRAP_API}/api/search`, {
          method: "POST",
          headers: validHeaders,
          body: JSON.stringify({
            query: "' OR 1=1--",
            payload: "autoban_strike_" + i
          }),
        });
        results.push(res.status);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      return NextResponse.json({ status: "stressed", results });
    }

    // TCP / Port scan converted to POST
    if (type === "portscan" || type === "tcp" || type === "scan") {
      const res = await fetch(`${TRAP_API}/api/search`, {
        method: "POST",
        headers: validHeaders,
        body: JSON.stringify({
          action: "portscan",
          target: "127.0.0.1:2222"
        }),
      });
      return NextResponse.json({ status: "fired", code: res.status });
    }

    return NextResponse.json({ error: "unknown attack type", received: type }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}