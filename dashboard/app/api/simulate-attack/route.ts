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

    if (type === "sqli") {
      const res = await fetch(
        `${TRAP_API}/api/search?q=%27%20OR%201%3D1--`,
        { headers: validHeaders }
      );
      return NextResponse.json({ status: "fired", code: res.status });
    }

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

    if (type === "autoban") {
      const results: number[] = [];
      for (let i = 0; i < 6; i++) {
        const res = await fetch(
          `${TRAP_API}/api/search?q=%27%20OR%201%3D1--`,
          { headers: validHeaders }
        );
        results.push(res.status);
        // 350ms delay between each strike so the rate-limiter registers them individually
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      return NextResponse.json({ status: "stressed", results });
    }

    // Added handler for TCP / Port scan button so it doesn't fail
    if (type === "portscan" || type === "tcp" || type === "scan") {
      const res = await fetch(
        `${TRAP_API}/api/search?q=portscan`,
        { headers: validHeaders }
      );
      return NextResponse.json({ status: "fired", code: res.status });
    }

    return NextResponse.json({ error: "unknown attack type", received: type }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}