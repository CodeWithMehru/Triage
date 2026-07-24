import asyncio
import json
import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from supabase import create_client

from listeners.port_listener import start_port_listener
from otel_setup import shutdown_otel

# 🔥 YAHAN HAI FIX: Exact path load karo jo test_db.py mein chala tha
load_dotenv("../.env", override=True)

DEFAULT_PORTS = [
    {"port": 2222, "service": "ssh"},
    {"port": 63790, "service": "redis"},
]

servers: list[asyncio.Server] = []
loop: asyncio.AbstractEventLoop | None = None

def record_port_scan() -> None:
    """Direct, no-bullshit synchronous DB insert."""
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        # Debugging ke liye taaki console mein dikhe ki key mili ya nahi
        print(f"\n[supabase] Checking credentials -> URL: {bool(url)} | KEY: {bool(key)}")
        
        if not url or not key:
            print("[supabase] ERROR: URL or KEY missing in .env")
            return
        
        print("[supabase] Attempting direct insert to database...")
        supabase = create_client(url, key)
        supabase.table("threat_events").insert(
            {
                "threat_type": "PORT_SCAN",
                "source": "honeypot",
            }
        ).execute()
        print("[supabase] 🔥 Real PORT_SCAN event saved to database!")
    except Exception as exc:
        print(f"\n[supabase] honeypot insert failed: {exc}")

def parse_ports() -> list[dict[str, str | int]]:
    raw = os.getenv("HONEYPOT_PORTS", "")
    if not raw:
        return DEFAULT_PORTS
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list) and len(parsed) > 0:
            return parsed
    except json.JSONDecodeError:
        print("[honeypot] invalid HONEYPOT_PORTS JSON, using defaults")
    return DEFAULT_PORTS

async def run_listeners() -> None:
    global servers
    ports = parse_ports()
    for entry in ports:
        port = int(entry["port"])
        service = str(entry.get("service", "generic"))
        server = await start_port_listener(port, service, on_connection=record_port_scan)
        servers.append(server)

def start_asyncio_loop() -> None:
    global loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run_listeners())
    loop.run_forever()

@asynccontextmanager
async def lifespan(_app: FastAPI):
    import threading
    thread = threading.Thread(target=start_asyncio_loop, daemon=True)
    thread.start()
    yield
    if loop and loop.is_running():
        loop.call_soon_threadsafe(loop.stop)
    for server in servers:
        server.close()
    shutdown_otel()

app = FastAPI(title="Sentinel Honeypot", version="1.0.0", lifespan=lifespan)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "sentinel-honeypot",
        "listeners": len(servers),
        "ports": parse_ports(),
    }

def main() -> None:
    health_port = int(os.getenv("HONEYPOT_HEALTH_PORT", "8090"))
    print(f"[honeypot] health endpoint on http://0.0.0.0:{health_port}/health")
    uvicorn.run(app, host="0.0.0.0", port=health_port, log_level="info")

if __name__ == "__main__":
    main()