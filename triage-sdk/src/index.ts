import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';

export interface TriageConfig {
  apiKey: string;
  target: string;
  mode?: 'active-defense' | 'monitor';
  serviceName?: string;
}

export function initTriage(config: TriageConfig) {
  if (!config.apiKey) {
    console.warn("[Triage SDK] Warning: No API key provided.");
  }

  const baseUrl = config.target.replace(/\/$/, "");

  // Attach the apiKey to headers so the Sentinel Trap API can validate/attribute it
  const headers = {
    'x-triage-api-key': config.apiKey,
  };

  const sdk = new NodeSDK({
    resource: new Resource({
      'service.name': config.serviceName || 'triage-agent',
      'triage.mode': config.mode || 'active-defense',
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${baseUrl}/v1/traces`,
      headers,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${baseUrl}/v1/metrics`,
        headers,
      }),
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  try {
    sdk.start();
    console.log(`[Triage SDK] Successfully initialized in ${config.mode || 'active-defense'} mode.`);
  } catch (error) {
    console.error('[Triage SDK] Error initializing OTel SDK', error);
  }

  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('[Triage SDK] Shutting down'))
      .catch((error) => console.log('Error shutting down Triage SDK', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}
