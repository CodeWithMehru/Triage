import asyncio
import os
import time
from collections.abc import Callable

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

from otel_setup import tracer, connection_counter, connection_duration

BANNERS: dict[str, bytes] = {
    "ssh": b"SSH-2.0-SentinelHoneypot_1.0\r\n",
    "redis": b"+OK\r\n",
    "mysql": b"\x4a\x00\x00\x00\x0a8.0.32-SentinelHoneypot\x00",
    "generic": b"220 Sentinel Honeypot Ready\r\n",
}

IDLE_SEC = int(os.getenv("HONEYPOT_IDLE_SEC", "10"))


def _sanitize(data: bytes, limit: int = 256) -> str:
    text = data.decode("utf-8", errors="replace")
    return text[:limit].replace("\n", "\\n").replace("\r", "\\r")


async def _handle_client(
    reader: asyncio.StreamReader,
    writer: asyncio.StreamWriter,
    *,
    port: int,
    service: str,
    on_connection: Callable[[str], None] | None = None,
) -> None:
    peer = writer.get_extra_info("peername")
    source_ip = peer[0] if peer else "unknown"
    source_port = peer[1] if peer and len(peer) > 1 else 0
    start = time.monotonic()
    payload_snippet: str | None = None

    print(f"[honeypot] connection detected from {source_ip}:{source_port} -> {service}:{port}")

    # 🔥 Yahan se Supabase trigger fire hoga
    if on_connection is not None:
        try:
            on_connection(source_ip)
        except Exception as exc:
            print(f"[honeypot] on_connection callback failed: {exc}")

    with tracer.start_as_current_span("honeypot.port_scan") as span:
        span.set_attribute("security.severity", "CRITICAL")
        span.set_attribute("security.threat_type", "PORT_SCAN")
        span.set_attribute("security.source_ip", source_ip)
        span.set_attribute("network.peer.address", source_ip)
        span.set_attribute("network.peer.port", source_port)
        span.set_attribute("honeypot.service", service)
        span.set_attribute("honeypot.port", port)

        try:
            banner = BANNERS.get(service, BANNERS["generic"])
            writer.write(banner)
            await writer.drain()

            try:
                data = await asyncio.wait_for(reader.read(512), timeout=IDLE_SEC)
                if data:
                    payload_snippet = _sanitize(data)
                    span.set_attribute("honeypot.payload_snippet", payload_snippet)
            except asyncio.TimeoutError:
                span.add_event("connection_idle_timeout")

            span.set_status(Status(StatusCode.ERROR, "port_scan_detected"))
        except Exception as exc:
            span.record_exception(exc)
            span.set_status(Status(StatusCode.ERROR, str(exc)))
        finally:
            duration_ms = (time.monotonic() - start) * 1000
            connection_counter.add(
                1,
                {"honeypot.service": service, "honeypot.port": str(port)},
            )
            connection_duration.record(
                duration_ms,
                {"honeypot.service": service, "honeypot.port": str(port)},
            )
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass


async def start_port_listener(
    port: int,
    service: str,
    on_connection: Callable[[str], None] | None = None,
) -> asyncio.Server:
    async def handler(
        reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        await _handle_client(
            reader, writer, port=port, service=service, on_connection=on_connection
        )

    server = await asyncio.start_server(handler, host="0.0.0.0", port=port)
    sockets = ", ".join(str(s.getsockname()) for s in server.sockets or [])
    print(f"[honeypot] listening {service} on {sockets}")
    return server