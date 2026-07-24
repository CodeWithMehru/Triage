import os
from opentelemetry import trace, metrics
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter

SERVICE_NAME = "sentinel-honeypot"
OTLP_BASE = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318")

_resource = Resource.create(
    {
        "service.name": SERVICE_NAME,
        "service.version": "1.0.0",
        "deployment.environment": os.getenv("NODE_ENV", "local"),
    }
)

_trace_exporter = OTLPSpanExporter(endpoint=f"{OTLP_BASE}/v1/traces")
_tracer_provider = TracerProvider(resource=_resource)
_tracer_provider.add_span_processor(BatchSpanProcessor(_trace_exporter))
trace.set_tracer_provider(_tracer_provider)

_metric_exporter = OTLPMetricExporter(endpoint=f"{OTLP_BASE}/v1/metrics")
_metric_reader = PeriodicExportingMetricReader(_metric_exporter, export_interval_millis=10_000)
_meter_provider = MeterProvider(resource=_resource, metric_readers=[_metric_reader])
metrics.set_meter_provider(_meter_provider)

tracer = trace.get_tracer(SERVICE_NAME)
meter = metrics.get_meter(SERVICE_NAME)

connection_counter = meter.create_counter(
    "honeypot.connections.total",
    description="Total honeypot connection attempts",
)
connection_duration = meter.create_histogram(
    "honeypot.connection.duration",
    unit="ms",
    description="Honeypot connection duration in milliseconds",
)


def shutdown_otel() -> None:
    _tracer_provider.shutdown()
    _meter_provider.shutdown()
