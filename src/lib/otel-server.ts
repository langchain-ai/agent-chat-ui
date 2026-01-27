/**
 * OpenTelemetry server-side instrumentation for Next.js.
 * 
 * This module initializes OpenTelemetry for server-side code (API routes, server components, etc.)
 * and sends traces to LangSmith for unified observability.
 * 
 * Reference: https://nextjs.org/docs/pages/guides/open-telemetry
 */

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// Fetch LangSmith configuration from environment
const apiKey = process.env.LANGSMITH_API_KEY;
const endpoint = process.env.LANGSMITH_ENDPOINT || process.env.LANGSMITH_URL || 'https://api.smith.langchain.com';
const project = process.env.LANGSMITH_PROJECT || process.env.LANGCHAIN_PROJECT || 'Reflexion';

if (!apiKey) {
  console.warn('[OTEL] LANGSMITH_API_KEY not set, skipping server-side OpenTelemetry initialization');
} else {
  try {
    // Configure OTLP exporter for LangSmith
    const otlpExporter = new OTLPTraceExporter({
      url: `${endpoint}/otel/v1/traces`,
      headers: {
        'x-api-key': apiKey,
        'Langsmith-Project': project,
      },
    });

    // Create resource with service attributes
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'agent-chat-ui-server',
      'service.version': '1.0.0',
      'deployment.environment': process.env.NODE_ENV || 'development',
    });

    // Initialize NodeSDK with batch span processor
    const sdk = new NodeSDK({
      resource,
      spanProcessor: new BatchSpanProcessor(otlpExporter, {
        scheduledDelayMillis: 1000, // Flush every 1 second
        maxExportBatchSize: 50,
      }),
    });

    // Start the SDK
    sdk.start();

    console.log('[OTEL] Server-side OpenTelemetry initialized');
    console.log('[OTEL] Endpoint:', `${endpoint}/otel/v1/traces`);
    console.log('[OTEL] Project:', project);
    console.log('[OTEL] Service:', 'agent-chat-ui-server');
  } catch (error) {
    console.error('[OTEL] Failed to initialize server-side OpenTelemetry:', error);
  }
}
