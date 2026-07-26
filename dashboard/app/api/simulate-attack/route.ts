import { NextRequest, NextResponse } from "next/server";

const TRAP_API = process.env.TRAP_API_URL ?? "http://localhost:3001";
const AZURE_VM_IP = "20.235.243.29";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { type } = body as { type: string };

    const validHeaders = {
      "Content-Type": "application/json",
      "x-triage-api-key": "trg_live_SIMULATIONKEY_12345",
    };

    // 1. SQL Injection (Hits Render Backend)
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

    // 2. Data Leak (Hits Render Backend)
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

    // 3. SRE Auto-Ban (Hits Render Backend)
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

    // 4. TCP Honeypot Scan (Real Live HTTP Request from Vercel to Azure VM Port 8090)
    if (type === "portscan" || type === "tcp" || type === "scan") {
      const azureRes = await fetch(`http://${AZURE_VM_IP}:8090/health`, {
        method: "GET",
        signal: AbortSignal.timeout(4000), // 4 seconds timeout so it doesn't hang
      });
      
      return NextResponse.json({ 
        status: "fired", 
        code: azureRes.status, 
        target: `${AZURE_VM_IP}:8090`,
        message: "Real live request sent to Azure honeypot successfully" 
      });
    }

    return NextResponse.json({ error: "unknown attack type", received: type }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}