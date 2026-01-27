/**
 * OpenTelemetry client-side instrumentation for browser.
 * 
 * Initializes OpenTelemetry Web SDK to trace thread operations and HTTP calls,
 * sending traces to LangSmith for unified observability.
 * 
 * Reference: https://opentelemetry.io/docs/instrumentation/js/getting-started/browser/
 */

let initialized = false;
let tracer: any = null;
let spanProcessor: any = null;

export async function initializeOpenTelemetry(): Promise<boolean> {
  // Only run in browser
  if (typeof window === 'undefined') {
    return false;
  }

  // Prevent double initialization
  if (initialized) {
    return true;
  }

  try {
    // Fetch LangSmith config from API route (similar to how Google auth tokens work)
    // This avoids build-time NEXT_PUBLIC_ variables which are difficult with Docker/Railway
    let apiKey: string | undefined;
    let endpoint: string = 'https://api.smith.langchain.com';
    let project: string = 'Reflexion';

    try {
      const configResponse = await fetch('/api/langsmith-config');
      if (configResponse.ok) {
        const config = await configResponse.json();
        apiKey = config.apiKey;
        endpoint = config.endpoint || endpoint;
        project = config.project || project;
        console.log('[OTEL] Fetched config from API route:', {
          hasApiKey: !!apiKey,
          endpoint,
          project,
        });
      } else {
        console.warn('[OTEL] Failed to fetch LangSmith config from API route:', configResponse.status);
        // Fallback to NEXT_PUBLIC_ vars if API route fails
        apiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY;
        endpoint = process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT || endpoint;
        project = process.env.NEXT_PUBLIC_LANGSMITH_PROJECT || project;
      }
    } catch (error) {
      console.warn('[OTEL] Error fetching LangSmith config, falling back to NEXT_PUBLIC_ vars:', error);
      // Fallback to NEXT_PUBLIC_ vars if fetch fails
      apiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY;
      endpoint = process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT || endpoint;
      project = process.env.NEXT_PUBLIC_LANGSMITH_PROJECT || project;
    }

    if (!apiKey) {
      console.warn('[OTEL] LangSmith API key not available (neither from API route nor NEXT_PUBLIC_), skipping OpenTelemetry initialization');
      return false;
    }

    // Dynamic imports to avoid SSR issues
    const { WebTracerProvider } = await import('@opentelemetry/sdk-trace-web');
    const { FetchInstrumentation } = await import('@opentelemetry/instrumentation-fetch');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const { registerInstrumentations } = await import('@opentelemetry/instrumentation');
    const { trace } = await import('@opentelemetry/api');
    const { resourceFromAttributes, defaultResource } = await import('@opentelemetry/resources');
    const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } = await import('@opentelemetry/semantic-conventions');

    // Configure OTLP exporter for LangSmith
    // According to LangSmith docs: https://docs.langchain.com/langsmith/trace-with-opentelemetry
    // Endpoint should be: https://api.smith.langchain.com/otel (not /otel/v1/traces)
    // Headers should include x-api-key and Langsmith-Project
    const otlpExporter = new OTLPTraceExporter({
      url: `${endpoint}/otel/v1/traces`, // Keep /v1/traces as that's the OTLP standard path
      headers: {
        'x-api-key': apiKey,
        'Langsmith-Project': project,
      },
    });

    // Create resource with service attributes
    // Use resourceFromAttributes helper function
    const resource = defaultResource().merge(
      resourceFromAttributes({
        [SEMRESATTRS_SERVICE_NAME]: 'agent-chat-ui',
        [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
      })
    );

    // Initialize Web Tracer Provider
    // WebTracerProvider accepts spanProcessor in constructor
    const { BatchSpanProcessor } = await import('@opentelemetry/sdk-trace-base');
    
    // Create a custom span processor that adds metadata to all spans
    class MetadataSpanProcessor {
      private batchProcessor: any;
      
      constructor(exporter: any, config?: any) {
        this.batchProcessor = new BatchSpanProcessor(exporter, config);
      }
      
      onStart(span: any, context: any) {
        // Forward to batch processor first (so span is fully initialized)
        if (this.batchProcessor.onStart) {
          this.batchProcessor.onStart(span, context);
        }
        
        // Add metadata after span is initialized
        try {
          const spanContext = span.spanContext();
          // Check if span context is valid by checking for traceId and spanId
          // In OpenTelemetry web SDK, spanContext() returns an object with traceId, spanId, etc.
          // isValid might not exist, so we check for the presence of traceId and spanId
          if (spanContext && spanContext.traceId && spanContext.spanId) {
            // Format trace ID and span ID as hex strings
            // traceId and spanId might be strings or Uint8Array
            let traceId: string;
            let spanId: string;
            
            if (typeof spanContext.traceId === 'string') {
              traceId = spanContext.traceId.padStart(32, '0');
            } else {
              // Convert Uint8Array to hex string
              traceId = Array.from(spanContext.traceId as Uint8Array)
                .map((b: number) => b.toString(16).padStart(2, '0'))
                .join('')
                .padStart(32, '0');
            }
            
            if (typeof spanContext.spanId === 'string') {
              spanId = spanContext.spanId.padStart(16, '0');
            } else {
              // Convert Uint8Array to hex string
              spanId = Array.from(spanContext.spanId as Uint8Array)
                .map((b: number) => b.toString(16).padStart(2, '0'))
                .join('')
                .padStart(16, '0');
            }
            
            // Use standard OpenTelemetry semantic convention attribute names
            // These are more likely to be preserved by LangSmith's OTEL endpoint
            // Reference: https://opentelemetry.io/docs/specs/semconv/
            
            // Set trace/span IDs using standard format
            // Note: These are already in span context, but we set them explicitly for visibility
            span.setAttribute('otel.trace_id', traceId);
            span.setAttribute('otel.span_id', spanId);
            
            // Also set in metadata format that LangSmith might recognize
            // According to LangSmith docs, metadata should be in config.metadata for LangChain
            // For OTEL spans, we use standard attribute names
            span.setAttribute('trace_id', traceId);
            span.setAttribute('span_id', spanId);
            
            // Set service name using semantic convention
            span.setAttribute(SEMRESATTRS_SERVICE_NAME, 'agent-chat-ui');
            
            // Set LangSmith span kind - use standard attribute name
            // LangSmith span.kind values: llm, chain, tool, retriever, embedding, prompt, parser
            const spanName = span.name || '';
            if (spanName.includes('thread.')) {
              span.setAttribute('langsmith.span.kind', 'chain');
            } else if (spanName.includes('message.')) {
              span.setAttribute('langsmith.span.kind', 'chain');
            }
            // Note: HTTP spans will have langsmith.span.kind set in applyCustomAttributesOnSpan()
            
            // Set langsmith.trace.name
            if (!span.attributes?.['langsmith.trace.name']) {
              span.setAttribute('langsmith.trace.name', spanName || 'langsmith.trace.name');
            }
            
            // langsmith.metadata.{key} - Custom metadata (maps to metadata.{key} in LangSmith)
            // Extract thread ID from span attributes first (more reliable)
            let threadId: string | undefined;
            if (span.attributes) {
              threadId = span.attributes['thread.id'] || span.attributes['thread_id'] || span.attributes['threadId'];
            }
            
            // If not in attributes, try to extract from span name (e.g., "thread.create: abc123")
            // Use word boundaries to avoid matching "create" from "created"
            if (!threadId) {
              const threadIdMatch = spanName.match(/thread\.(?:create|get|list|update|delete)[\s:]+([a-f0-9-]+)/i);
              if (threadIdMatch) {
                threadId = threadIdMatch[1];
              }
            }
            
            if (threadId && typeof threadId === 'string') {
              span.setAttribute('langsmith.metadata.thread_id', threadId);
            }
            
            // Set all GenAI attributes as placeholders to mimic AI trace
            // Using attribute name as value when we can't map to real data
            span.setAttribute('gen_ai.system', 'gen_ai.system');
            span.setAttribute('gen_ai.operation.name', 'gen_ai.operation.name');
            span.setAttribute('gen_ai.request.model', 'gen_ai.request.model');
            span.setAttribute('gen_ai.response.model', 'gen_ai.response.model');
            span.setAttribute('gen_ai.request.temperature', 'gen_ai.request.temperature');
            span.setAttribute('gen_ai.request.top_p', 'gen_ai.request.top_p');
            span.setAttribute('gen_ai.request.max_tokens', 'gen_ai.request.max_tokens');
            span.setAttribute('gen_ai.request.frequency_penalty', 'gen_ai.request.frequency_penalty');
            span.setAttribute('gen_ai.request.presence_penalty', 'gen_ai.request.presence_penalty');
            span.setAttribute('gen_ai.request.seed', 'gen_ai.request.seed');
            span.setAttribute('gen_ai.request.stop_sequences', 'gen_ai.request.stop_sequences');
            span.setAttribute('gen_ai.request.top_k', 'gen_ai.request.top_k');
            span.setAttribute('gen_ai.request.encoding_formats', 'gen_ai.request.encoding_formats');
            span.setAttribute('gen_ai.usage.input_tokens', 'gen_ai.usage.input_tokens');
            span.setAttribute('gen_ai.usage.output_tokens', 'gen_ai.usage.output_tokens');
            span.setAttribute('gen_ai.usage.total_tokens', 'gen_ai.usage.total_tokens');
            span.setAttribute('gen_ai.usage.prompt_tokens', 'gen_ai.usage.prompt_tokens');
            span.setAttribute('gen_ai.usage.completion_tokens', 'gen_ai.usage.completion_tokens');
            span.setAttribute('gen_ai.usage.details.reasoning_tokens', 'gen_ai.usage.details.reasoning_tokens');
            
            // Set all LLM attributes as placeholders to mimic AI trace
            span.setAttribute('llm.system', 'llm.system');
            span.setAttribute('llm.model_name', 'llm.model_name');
            span.setAttribute('llm.token_count.prompt', 'llm.token_count.prompt');
            span.setAttribute('llm.token_count.completion', 'llm.token_count.completion');
            span.setAttribute('llm.token_count.total', 'llm.token_count.total');
            span.setAttribute('llm.usage.total_tokens', 'llm.usage.total_tokens');
            span.setAttribute('llm.presence_penalty', 'llm.presence_penalty');
            span.setAttribute('llm.frequency_penalty', 'llm.frequency_penalty');
            
            console.log('[OTEL] Span processor onStart - added all attributes:', {
              name: spanName,
              traceId: traceId.substring(0, 16) + '...',
              spanId: spanId.substring(0, 8) + '...',
              hasLangSmithKind: !!span.attributes?.['langsmith.span.kind'],
            });
          } else {
            console.warn('[OTEL] Span processor onStart - invalid span context (missing traceId/spanId):', {
              hasTraceId: !!spanContext?.traceId,
              hasSpanId: !!spanContext?.spanId,
              spanContext: spanContext,
            });
          }
        } catch (error) {
          console.warn('[OTEL] Error adding metadata in span processor onStart:', error);
        }
      }
      
      onEnd(span: any) {
        // Add additional attributes from span if available
        try {
          // Ensure trace/span IDs are set (in case onStart didn't work)
          const spanContext = span.spanContext();
          // Check if span context is valid by checking for traceId and spanId
          if (spanContext && spanContext.traceId && spanContext.spanId) {
            let traceId: string;
            let spanId: string;
            
            if (typeof spanContext.traceId === 'string') {
              traceId = spanContext.traceId.padStart(32, '0');
            } else {
              traceId = Array.from(spanContext.traceId as Uint8Array)
                .map((b: number) => b.toString(16).padStart(2, '0'))
                .join('')
                .padStart(32, '0');
            }
            
            if (typeof spanContext.spanId === 'string') {
              spanId = spanContext.spanId.padStart(16, '0');
            } else {
              spanId = Array.from(spanContext.spanId as Uint8Array)
                .map((b: number) => b.toString(16).padStart(2, '0'))
                .join('')
                .padStart(16, '0');
            }
            
            // Minimal set: Only OTEL trace/span IDs and LangSmith attributes
            if (!span.attributes?.['otel.trace_id']) {
              span.setAttribute('otel.trace_id', traceId);
              span.setAttribute('otel.span_id', spanId);
              span.setAttribute('otel_trace_id', traceId);
              span.setAttribute('otel_span_id', spanId);
            }
            
            // Set LangSmith span kind if not already set (fallback for HTTP spans)
            const spanName = span.name || '';
            if (!span.attributes?.['langsmith.span.kind']) {
              if (spanName.includes('thread.')) {
                span.setAttribute('langsmith.span.kind', 'chain');
              } else if (spanName.includes('message.')) {
                span.setAttribute('langsmith.span.kind', 'chain');
              } else if (spanName.includes('HTTP') || spanName.includes('fetch')) {
                // Fallback: check http.url if it's available now
                // Try multiple attribute names that might contain the URL
                const url = span.attributes?.['http.url'] 
                  || span.attributes?.['url.full']
                  || span.attributes?.['http.target']
                  || span.attributes?.['url.path']
                  || '';
                
                if (url && typeof url === 'string') {
                  // Check if this is a request to our backend
                  const isBackendRequest = url.includes('/threads/') || url.includes('/api/');
                  if (isBackendRequest) {
                    span.setAttribute('langsmith.span.kind', 'tool');
                    console.log('[OTEL] onEnd fallback - set langsmith.span.kind for:', {
                      name: spanName,
                      url: url.length > 60 ? url.substring(0, 60) + '...' : url,
                    });
                  }
                }
              }
            }
            
            // Set langsmith.trace.name if not already set
            if (!span.attributes?.['langsmith.trace.name']) {
              span.setAttribute('langsmith.trace.name', spanName || 'langsmith.trace.name');
            }
            
            // langsmith.metadata.{key} - Custom metadata (maps to metadata.{key} in LangSmith)
            if (!span.attributes?.['gen_ai.system']) {
              span.setAttribute('gen_ai.system', 'gen_ai.system');
              span.setAttribute('gen_ai.operation.name', 'gen_ai.operation.name');
              span.setAttribute('gen_ai.request.model', 'gen_ai.request.model');
              span.setAttribute('gen_ai.response.model', 'gen_ai.response.model');
              span.setAttribute('gen_ai.request.temperature', 'gen_ai.request.temperature');
              span.setAttribute('gen_ai.request.top_p', 'gen_ai.request.top_p');
              span.setAttribute('gen_ai.request.max_tokens', 'gen_ai.request.max_tokens');
              span.setAttribute('gen_ai.request.frequency_penalty', 'gen_ai.request.frequency_penalty');
              span.setAttribute('gen_ai.request.presence_penalty', 'gen_ai.request.presence_penalty');
              span.setAttribute('gen_ai.request.seed', 'gen_ai.request.seed');
              span.setAttribute('gen_ai.request.stop_sequences', 'gen_ai.request.stop_sequences');
              span.setAttribute('gen_ai.request.top_k', 'gen_ai.request.top_k');
              span.setAttribute('gen_ai.request.encoding_formats', 'gen_ai.request.encoding_formats');
              span.setAttribute('gen_ai.usage.input_tokens', 'gen_ai.usage.input_tokens');
              span.setAttribute('gen_ai.usage.output_tokens', 'gen_ai.usage.output_tokens');
              span.setAttribute('gen_ai.usage.total_tokens', 'gen_ai.usage.total_tokens');
              span.setAttribute('gen_ai.usage.prompt_tokens', 'gen_ai.usage.prompt_tokens');
              span.setAttribute('gen_ai.usage.completion_tokens', 'gen_ai.usage.completion_tokens');
              span.setAttribute('gen_ai.usage.details.reasoning_tokens', 'gen_ai.usage.details.reasoning_tokens');
            }
            
            // Note: GenAI/LLM attributes are set by the backend when it calls the LLM
            if (!span.attributes?.['llm.system']) {
              span.setAttribute('llm.system', 'llm.system');
              span.setAttribute('llm.model_name', 'llm.model_name');
              span.setAttribute('llm.token_count.prompt', 'llm.token_count.prompt');
              span.setAttribute('llm.token_count.completion', 'llm.token_count.completion');
              span.setAttribute('llm.token_count.total', 'llm.token_count.total');
              span.setAttribute('llm.usage.total_tokens', 'llm.usage.total_tokens');
              span.setAttribute('llm.presence_penalty', 'llm.presence_penalty');
              span.setAttribute('llm.frequency_penalty', 'llm.frequency_penalty');
            }
            
            console.log('[OTEL] Span processor onEnd - added all attributes:', {
              name: spanName,
              hasTraceId: !!span.attributes?.['otel.trace_id'],
              hasLangSmithKind: !!span.attributes?.['langsmith.span.kind'],
              httpUrl: span.attributes?.['http.url'] ? (String(span.attributes['http.url']).length > 40 ? String(span.attributes['http.url']).substring(0, 40) + '...' : String(span.attributes['http.url'])) : 'none',
            });
          }
        } catch (error) {
          console.warn('[OTEL] Error adding end attributes:', error);
        }
        
        // Forward to batch processor
        if (this.batchProcessor.onEnd) {
          this.batchProcessor.onEnd(span);
        }
      }
      
      shutdown(): Promise<void> {
        return this.batchProcessor.shutdown ? this.batchProcessor.shutdown() : Promise.resolve();
      }
      
      forceFlush(): Promise<void> {
        return this.batchProcessor.forceFlush ? this.batchProcessor.forceFlush() : Promise.resolve();
      }
    }
    
    spanProcessor = new MetadataSpanProcessor(otlpExporter, {
      // Flush more aggressively for browser
      scheduledDelayMillis: 1000, // Flush every 1 second
      maxExportBatchSize: 10, // Smaller batches for faster export
    });
    
    const provider = new WebTracerProvider({
      resource,
      spanProcessors: [spanProcessor],
    });

    provider.register();

    // Register automatic fetch instrumentation with custom attributes hook
    registerInstrumentations({
      instrumentations: [
        new FetchInstrumentation({
          // Include request/response headers for better trace context
          propagateTraceHeaderCorsUrls: [
            new RegExp(endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/')),
          ],
          // Add custom attributes to all fetch spans (in addition to span processor)
          applyCustomAttributesOnSpan: (span: any, request: any, response: any) => {
            // Add trace ID and span ID
            const spanContext = span.spanContext();
            // Check if span context is valid by checking for traceId and spanId
            if (spanContext && spanContext.traceId && spanContext.spanId) {
              // traceId and spanId are already strings in web SDK
              const traceId = typeof spanContext.traceId === 'string' 
                ? spanContext.traceId.padStart(32, '0')
                : Array.from(spanContext.traceId as Uint8Array)
                    .map((b: number) => b.toString(16).padStart(2, '0'))
                    .join('')
                    .padStart(32, '0');
              const spanId = typeof spanContext.spanId === 'string'
                ? spanContext.spanId.padStart(16, '0')
                : Array.from(spanContext.spanId as Uint8Array)
                    .map((b: number) => b.toString(16).padStart(2, '0'))
                    .join('')
                    .padStart(16, '0');
              
              // Set all LangSmith-recognized attributes according to official documentation
              // Reference: https://docs.langchain.com/langsmith/trace-with-opentelemetry
              
              // Core OTEL trace/span IDs
              span.setAttribute('otel.trace_id', traceId);
              span.setAttribute('otel.span_id', spanId);
              span.setAttribute('otel_trace_id', traceId);
              span.setAttribute('otel_span_id', spanId);
              
              // Set service name using semantic convention
              span.setAttribute(SEMRESATTRS_SERVICE_NAME, 'agent-chat-ui');
              
              // Set langsmith.trace.name (overrides span name for the run)
              if (span.name) {
                span.setAttribute('langsmith.trace.name', span.name);
              }
              
              // Get URL from request object
              let url = '';
              if (request) {
                url = request.url || request.href || request.pathname || request.path || '';
                if (!url && typeof request === 'object' && 'url' in request) {
                  url = String(request.url || '');
                }
                if (!url && typeof request === 'string') {
                  url = request;
                }
              }
              
              // Also check if the span already has http.url set
              if (!url) {
                url = span.attributes?.['http.url'] || span.attributes?.['url.full'] || '';
              }
              
              // Set LangSmith span kind for backend requests
              // LangSmith span.kind values: llm, chain, tool, retriever, embedding, prompt, parser
              const isBackendRequest = typeof url === 'string' && (url.includes('/threads/') || url.includes('/api/'));
              if (isBackendRequest) {
                span.setAttribute('langsmith.span.kind', 'tool');
                
                // Extract thread ID from URL if present for metadata
                const threadIdMatch = url.match(/\/threads\/([^/?]+)/);
                if (threadIdMatch) {
                  const threadId = threadIdMatch[1];
                  span.setAttribute('langsmith.metadata.thread_id', threadId);
                }
              }
              
              // Extract thread ID from URL if present for metadata
              if (url && typeof url === 'string') {
                const threadIdMatch = url.match(/\/threads\/([^/?]+)/);
                if (threadIdMatch) {
                  const threadId = threadIdMatch[1];
                  span.setAttribute('langsmith.metadata.thread_id', threadId);
                }
              }
              
              // Set all GenAI attributes (using attribute name as value when we can't map)
              span.setAttribute('gen_ai.system', 'gen_ai.system');
              span.setAttribute('gen_ai.operation.name', 'gen_ai.operation.name');
              span.setAttribute('gen_ai.request.model', 'gen_ai.request.model');
              span.setAttribute('gen_ai.response.model', 'gen_ai.response.model');
              span.setAttribute('gen_ai.request.temperature', 'gen_ai.request.temperature');
              span.setAttribute('gen_ai.request.top_p', 'gen_ai.request.top_p');
              span.setAttribute('gen_ai.request.max_tokens', 'gen_ai.request.max_tokens');
              span.setAttribute('gen_ai.request.frequency_penalty', 'gen_ai.request.frequency_penalty');
              span.setAttribute('gen_ai.request.presence_penalty', 'gen_ai.request.presence_penalty');
              span.setAttribute('gen_ai.request.seed', 'gen_ai.request.seed');
              span.setAttribute('gen_ai.request.stop_sequences', 'gen_ai.request.stop_sequences');
              span.setAttribute('gen_ai.request.top_k', 'gen_ai.request.top_k');
              span.setAttribute('gen_ai.request.encoding_formats', 'gen_ai.request.encoding_formats');
              span.setAttribute('gen_ai.usage.input_tokens', 'gen_ai.usage.input_tokens');
              span.setAttribute('gen_ai.usage.output_tokens', 'gen_ai.usage.output_tokens');
              span.setAttribute('gen_ai.usage.total_tokens', 'gen_ai.usage.total_tokens');
              span.setAttribute('gen_ai.usage.prompt_tokens', 'gen_ai.usage.prompt_tokens');
              span.setAttribute('gen_ai.usage.completion_tokens', 'gen_ai.usage.completion_tokens');
              span.setAttribute('gen_ai.usage.details.reasoning_tokens', 'gen_ai.usage.details.reasoning_tokens');
              
              // Set LLM attributes
              span.setAttribute('llm.system', 'llm.system');
              span.setAttribute('llm.model_name', 'llm.model_name');
              span.setAttribute('llm.token_count.prompt', 'llm.token_count.prompt');
              span.setAttribute('llm.token_count.completion', 'llm.token_count.completion');
              span.setAttribute('llm.token_count.total', 'llm.token_count.total');
              span.setAttribute('llm.usage.total_tokens', 'llm.usage.total_tokens');
              span.setAttribute('llm.presence_penalty', 'llm.presence_penalty');
              span.setAttribute('llm.frequency_penalty', 'llm.frequency_penalty');
              
              console.log('[OTEL] applyCustomAttributesOnSpan:', {
                name: span.name,
                url: url ? (url.length > 50 ? url.substring(0, 50) + '...' : url) : 'none',
                isBackendRequest,
                hasLangSmithKind: !!span.attributes?.['langsmith.span.kind'],
                requestType: request ? typeof request : 'none',
                requestKeys: request && typeof request === 'object' ? Object.keys(request).slice(0, 5) : [],
              });
            }
          },
        }),
      ],
    });

    // Provider is already registered, no need to start

    // Get tracer for manual spans
    tracer = trace.getTracer('agent-chat-ui');

    initialized = true;
    console.log('[OTEL] OpenTelemetry initialized for client-side tracing');
    console.log('[OTEL] Endpoint:', `${endpoint}/otel/v1/traces`);
    console.log('[OTEL] Project:', project);
    console.log('[OTEL] Tracer available:', !!tracer);
    console.log('[OTEL] Span processor:', !!spanProcessor);
    
    // Test span creation to verify setup
    const testTracer = trace.getTracer('agent-chat-ui-test');
    const testSpan = testTracer.startSpan('otel.init.test');
    testSpan.setStatus({ code: 1 });
    testSpan.end();
    if (spanProcessor && typeof spanProcessor.forceFlush === 'function') {
      spanProcessor.forceFlush().then(() => {
        console.log('[OTEL] Test span flushed successfully');
      }).catch((err: any) => {
        console.error('[OTEL] Failed to flush test span:', err);
      });
    }
    
    return true;
  } catch (error) {
    console.error('[OTEL] Failed to initialize OpenTelemetry:', error);
    return false;
  }
}

/**
 * Get the tracer for manual span creation.
 * Returns null if OpenTelemetry is not initialized.
 */
export function getTracer(name: string = 'agent-chat-ui') {
  if (typeof window === 'undefined') {
    console.warn('[OTEL] getTracer called in non-browser environment');
    return null;
  }
  if (!initialized) {
    console.warn('[OTEL] OpenTelemetry not initialized yet');
    return null;
  }
  if (!tracer) {
    console.warn('[OTEL] Tracer not available');
    return null;
  }
  return tracer;
}

/**
 * Create a span for a thread operation.
 * Returns a no-op if OpenTelemetry is not initialized.
 */
export async function withThreadSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span?: any) => Promise<T>
): Promise<T> {
  const currentTracer = getTracer('thread-operations');
  if (!currentTracer) {
    // No-op if tracing not available
    return fn();
  }

  const span = currentTracer.startSpan(name, {
    attributes,
  });

    // Set all LangSmith-recognized attributes from documentation
    // For attributes we cannot map, set value to attribute name
    const spanContext = span.spanContext();
    if (spanContext && spanContext.traceId && spanContext.spanId) {
      const traceId = typeof spanContext.traceId === 'string' 
        ? spanContext.traceId.padStart(32, '0')
        : Array.from(spanContext.traceId as Uint8Array)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('')
            .padStart(32, '0');
      const spanId = typeof spanContext.spanId === 'string'
        ? spanContext.spanId.padStart(16, '0')
        : Array.from(spanContext.spanId as Uint8Array)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('')
            .padStart(16, '0');
      
      span.setAttribute('otel.trace_id', traceId);
      span.setAttribute('otel.span_id', spanId);
      span.setAttribute('otel_trace_id', traceId);
      span.setAttribute('otel_span_id', spanId);
    }
    
    // Set LangSmith core attributes
    span.setAttribute('langsmith.trace.name', name || 'langsmith.trace.name');
    
    // Extract thread ID from attributes if available
    const threadId = attributes['thread.id'] || attributes['thread_id'] || attributes['threadId'];
    if (threadId && typeof threadId === 'string') {
      span.setAttribute('langsmith.metadata.thread_id', threadId);
    }
    
    // Set LangSmith span kind
    // LangSmith span.kind values: llm, chain, tool, retriever, embedding, prompt, parser
    if (name.includes('thread.')) {
      span.setAttribute('langsmith.span.kind', 'chain');
    } else if (name.includes('message.')) {
      span.setAttribute('langsmith.span.kind', 'chain');
    } else {
      span.setAttribute('langsmith.span.kind', 'langsmith.span.kind');
    }
    
    // Set all GenAI attributes (using attribute name as value when we can't map)
    span.setAttribute('gen_ai.system', 'gen_ai.system');
    span.setAttribute('gen_ai.operation.name', 'gen_ai.operation.name');
    span.setAttribute('gen_ai.request.model', 'gen_ai.request.model');
    span.setAttribute('gen_ai.response.model', 'gen_ai.response.model');
    span.setAttribute('gen_ai.request.temperature', 'gen_ai.request.temperature');
    span.setAttribute('gen_ai.request.top_p', 'gen_ai.request.top_p');
    span.setAttribute('gen_ai.request.max_tokens', 'gen_ai.request.max_tokens');
    span.setAttribute('gen_ai.request.frequency_penalty', 'gen_ai.request.frequency_penalty');
    span.setAttribute('gen_ai.request.presence_penalty', 'gen_ai.request.presence_penalty');
    span.setAttribute('gen_ai.request.seed', 'gen_ai.request.seed');
    span.setAttribute('gen_ai.request.stop_sequences', 'gen_ai.request.stop_sequences');
    span.setAttribute('gen_ai.request.top_k', 'gen_ai.request.top_k');
    span.setAttribute('gen_ai.request.encoding_formats', 'gen_ai.request.encoding_formats');
    span.setAttribute('gen_ai.usage.input_tokens', 'gen_ai.usage.input_tokens');
    span.setAttribute('gen_ai.usage.output_tokens', 'gen_ai.usage.output_tokens');
    span.setAttribute('gen_ai.usage.total_tokens', 'gen_ai.usage.total_tokens');
    span.setAttribute('gen_ai.usage.prompt_tokens', 'gen_ai.usage.prompt_tokens');
    span.setAttribute('gen_ai.usage.completion_tokens', 'gen_ai.usage.completion_tokens');
    span.setAttribute('gen_ai.usage.details.reasoning_tokens', 'gen_ai.usage.details.reasoning_tokens');
    
    // Set LLM attributes
    span.setAttribute('llm.system', 'llm.system');
    span.setAttribute('llm.model_name', 'llm.model_name');
    span.setAttribute('llm.token_count.prompt', 'llm.token_count.prompt');
    span.setAttribute('llm.token_count.completion', 'llm.token_count.completion');
    span.setAttribute('llm.token_count.total', 'llm.token_count.total');
    span.setAttribute('llm.usage.total_tokens', 'llm.usage.total_tokens');
    span.setAttribute('llm.presence_penalty', 'llm.presence_penalty');
    span.setAttribute('llm.frequency_penalty', 'llm.frequency_penalty');
    
    // Set service name
    span.setAttribute('service.name', 'agent-chat-ui');
    
    console.log('[OTEL] withThreadSpan - added all attributes:', {
      name,
      hasTraceId: !!spanContext?.traceId,
      hasLangSmithKind: !!span.attributes?.['langsmith.span.kind'],
    });

  try {
    const result = await fn(span);
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (error: any) {
    span.setStatus({
      code: 2, // ERROR
      message: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
    // Force flush after ending span to ensure it's sent
    if (spanProcessor && typeof spanProcessor.forceFlush === 'function') {
      spanProcessor.forceFlush().catch((err: any) => {
        console.warn('[OTEL] Failed to flush span:', err);
      });
    }
  }
}
