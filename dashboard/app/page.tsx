"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ChevronRight, Copy, Check, Terminal, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "generated">("idle");
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const generateApiKey = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const segments = [8, 4, 12];
    const parts = segments.map((len) => {
      const arr = new Uint8Array(len);
      crypto.getRandomValues(arr);
      return Array.from(arr, (b) => chars[b % chars.length]).join("");
    });
    return `trg_live_${parts.join("_")}`;
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setStatus("generating");
    const key = generateApiKey();
    setTimeout(() => {
      setApiKey(key);
      setStatus("generated");
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const snippet = `// 1. Install the SDK
npm install @triage/otel-node

// 2. Initialize in your app entry point
import { initTriage } from "@triage/otel-node";

initTriage({
  apiKey: "${apiKey || "trg_live_..."}",
  target: "${url || "https://api.example.com"}",
  mode: "active-defense"
});`;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#030305] font-sans text-slate-200 antialiased selection:bg-cyan-500/30 selection:text-cyan-100 overflow-x-hidden">
      
      {/* Animated Watercolor & Neon Mirror Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-cyan-500/20 blur-[150px] animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute top-[30%] right-[-10%] h-[900px] w-[900px] rounded-full bg-pink-500/15 blur-[150px] animate-pulse" style={{ animationDuration: '11s' }} />
        <div className="absolute bottom-[-20%] left-[20%] h-[700px] w-[700px] rounded-full bg-emerald-500/10 blur-[150px] animate-pulse" style={{ animationDuration: '9s' }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-6 py-24 flex flex-col items-center">
        
        {/* HERO SECTION */}
        <div className="mb-20 flex flex-col items-center text-center animate-fade-in w-full max-w-4xl">
          <div className="mb-8 flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-5 py-2 backdrop-blur-3xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Next-Gen Security Observability
            </span>
          </div>

          <h1 className="mb-10 text-6xl md:text-9xl font-extrabold tracking-tighter text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            TRIAGE
          </h1>

          <p className="text-lg md:text-xl leading-relaxed text-slate-300 font-light max-w-3xl tracking-wide">
            While everyone else uses OpenTelemetry to monitor standard CPU usage, latency, and memory, no one is observing the real 'weird' stuff: <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.4)]">Cyber Attacks</span>. In this AI era, security is paramount. We built <span className="font-semibold text-white">Triage</span> as a <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">Blue Team SOC</span> to observe hackers, not just hardware. This makes it a highly unique, security-first use-case for SigNoz.
          </p>
        </div>

        {/* 3 FEATURE CARDS (Luxury iOS Cyberpunk) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-24 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="group relative flex flex-col p-8 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl transition-all duration-500 overflow-hidden hover:border-cyan-500/50 hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]">
            <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors duration-500 blur-2xl" />
            <h3 className="relative z-10 text-white text-lg font-semibold tracking-wide mb-3">Active Defense</h3>
            <p className="relative z-10 text-sm text-slate-400 leading-relaxed font-light tracking-wide">Self-healing auto-bans isolate malicious actors dynamically at the application layer.</p>
          </div>
          <div className="group relative flex flex-col p-8 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl transition-all duration-500 overflow-hidden hover:border-pink-500/50 hover:shadow-[0_0_40px_rgba(236,72,153,0.15)]">
            <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/10 transition-colors duration-500 blur-2xl" />
            <h3 className="relative z-10 text-white text-lg font-semibold tracking-wide mb-3">Threat Explainer</h3>
            <p className="relative z-10 text-sm text-slate-400 leading-relaxed font-light tracking-wide">Real-time deep payload inspection powered by Groq translates exploit logic instantly.</p>
          </div>
          <div className="group relative flex flex-col p-8 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl transition-all duration-500 overflow-hidden hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]">
            <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors duration-500 blur-2xl" />
            <h3 className="relative z-10 text-white text-lg font-semibold tracking-wide mb-3">Zero-Trust</h3>
            <p className="relative z-10 text-sm text-slate-400 leading-relaxed font-light tracking-wide">Vetted OTLP payloads are cryptographically signed to ensure absolute validation.</p>
          </div>
        </div>

        {/* INTERACTIVE WORKFLOW CARD */}
        <div className="w-full max-w-xl animate-fade-in" style={{ animationDelay: '200ms' }}>
          
          {/* State: Idle */}
          {status === "idle" && (
            <form onSubmit={handleGenerate} className="flex flex-col gap-6 items-center">
              <div className="w-full relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <input
                  type="url"
                  required
                  placeholder="Enter target application URL (e.g. https://api.yourcompany.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="relative w-full rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/10 px-6 py-5 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-cyan-500/50 focus:bg-black/80"
                />
              </div>
              
              <button
                type="submit"
                className="group relative flex items-center justify-center gap-2 w-full max-w-md rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white font-semibold tracking-wide px-6 py-4 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center gap-2">
                  Generate Agent SDK
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </form>
          )}

          {/* State: Generating */}
          {status === "generating" && (
            <div className="flex flex-col items-center justify-center py-16 rounded-3xl bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] shadow-[0_0_50px_rgba(6,182,212,0.1)]">
              <Loader2 className="mb-6 h-10 w-10 animate-spin text-cyan-400" />
              <p className="font-sans text-xs font-semibold tracking-[0.15em] text-slate-300 uppercase">
                Provisioning Secure Keys...
              </p>
            </div>
          )}

          {/* State: Generated */}
          {status === "generated" && (
            <div className="flex flex-col gap-6">
              <div className="relative group overflow-hidden rounded-3xl bg-black/60 backdrop-blur-3xl border border-white/[0.1] shadow-2xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-3xl blur opacity-20 transition duration-500" />
                <div className="relative flex items-center justify-between border-b border-white/[0.08] bg-white/[0.01] px-6 py-4">
                  <div className="flex items-center gap-3 text-cyan-400">
                    <Terminal className="h-4 w-4" />
                    <span className="font-sans text-[11px] font-semibold uppercase tracking-widest">Node.js Integration</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/15"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "COPIED" : "COPY"}
                  </button>
                </div>
                <div className="relative p-6 bg-transparent">
                  <pre className="font-mono text-[13px] leading-relaxed text-slate-300 overflow-x-auto">
                    <code>{snippet}</code>
                  </pre>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
                </span>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Awaiting Telemetry Ping...
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white font-semibold tracking-wide px-6 py-4 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center gap-2">
                  Skip Verification & Open Command Center
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
