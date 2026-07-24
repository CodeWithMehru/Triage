import os
from typing import Any

from supabase import create_client, Client

_client: Client | None = None


def get_supabase() -> Client | None:
    global _client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    if _client is None:
        _client = create_client(url, key)
    return _client


def persist_honeypot_event(
    *,
    source_ip: str,
    service: str,
    port: int,
    payload_snippet: str | None,
) -> None:
    client = get_supabase()
    if client is None:
        return

    event: dict[str, Any] = {
        "source": "honeypot",
        "threat_type": "PORT_SCAN",
        "severity": "CRITICAL",
        "source_ip": source_ip,
        "payload_snippet": payload_snippet,
        "matched_pattern": f"port_probe:{service}:{port}",
        "metadata": {"service": service, "port": port},
    }

    try:
        client.table("threat_events").insert(event).execute()
    except Exception as exc:
        print(f"[supabase] honeypot insert failed: {exc}")
