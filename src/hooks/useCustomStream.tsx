import { useState, useEffect, useCallback, useRef } from 'react';
import { type Message } from '@langchain/langgraph-sdk';

interface CustomStreamState {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  submit: (input: any, options?: any) => void;
  stop: () => void;
  // Allow external loaders (e.g., selecting a thread) to set messages
  setMessages: (msgs: Message[]) => void;
}

export function useCustomStream({
  apiUrl,
  apiKey,
  assistantId,
  threadId,
}: {
  apiUrl: string;
  apiKey?: string;
  assistantId: string;
  threadId: string | null;
}): CustomStreamState {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const submit = useCallback(async (input: any, options?: any) => {
    console.log("Custom stream submit called with:", input, options);
    console.log("Thread ID:", threadId);
    
    setIsLoading(true);
    setError(null);
    
    // Add only the new human message to the UI to avoid duplicating full history
    if (input?.messages && Array.isArray(input.messages) && input.messages.length > 0) {
      const last = input.messages[input.messages.length - 1] as Message;
      if (last?.type === 'human') {
        console.log('Adding last human message:', last);
        setMessages(prev => [...prev, last]);
        // Immediately append an empty AI placeholder so streaming is visible right away
        const aiPlaceholder: Message = {
          type: 'ai',
          id: `ai-${Date.now()}`,
          name: 'rag_agent',
          content: [{ type: 'text', text: '' }] as any,
          // optional fields kept minimal; reducers tolerate missing extras
        } as any;
        setMessages(prev => [...prev, aiPlaceholder]);
      }
    }

    let currentThreadId = threadId;
    
    // Create thread if it doesn't exist
    if (!currentThreadId) {
      console.log("Creating new thread...");
      try {
        const threadResponse = await fetch(`${apiUrl}/threads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey && { 'X-Api-Key': apiKey }),
          },
          body: JSON.stringify({ assistant_id: assistantId }),
        });
        
        if (!threadResponse.ok) {
          throw new Error(`Failed to create thread: ${threadResponse.status}`);
        }
        
        const threadData = await threadResponse.json();
        currentThreadId = threadData.thread_id;
        console.log("Created thread:", currentThreadId);
      } catch (err) {
        console.error("Failed to create thread:", err);
        setError(err instanceof Error ? err : new Error('Failed to create thread'));
        setIsLoading(false);
        return;
      }
    }

    // Ensure we have a valid thread ID before proceeding
    if (!currentThreadId) {
      setError(new Error('Failed to obtain thread ID'));
      setIsLoading(false);
      return;
    }

    // Update the thread ID in the URL only if it changed
    try {
      const url = new URL(window.location.href);
      const existing = url.searchParams.get('threadId');
      if (existing !== currentThreadId) {
        url.searchParams.set('threadId', currentThreadId);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(`${apiUrl}/threads/${currentThreadId}/runs/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-Api-Key': apiKey }),
        },
        body: JSON.stringify({ input }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.event === 'values' && data.data?.messages) {
                const incoming = data.data.messages as Message[];
                setMessages((prev) => {
                  if (!prev?.length) return incoming;
                  if (incoming.length >= prev.length) return incoming;
                  // Incoming is shorter (typical during streaming this turn).
                  // Keep prior history, but replace the last message with incoming's last.
                  const incomingLast = incoming[incoming.length - 1];
                  if (!incomingLast) return prev;
                  const next = prev.slice();
                  next[next.length - 1] = incomingLast;
                  return next;
                });
              } else if (data.event === 'end') {
                setIsLoading(false);
                // Reload canonical history from backend to ensure full continuity
                try {
                  const url = new URL(window.location.href);
                  const id = url.searchParams.get('threadId');
                  if (id) {
                    const histRes = await fetch(`${apiUrl}/threads/${id}/history`, {
                      headers: apiKey ? { 'X-Api-Key': apiKey } : undefined,
                    });
                    if (histRes.ok) {
                      const history = await histRes.json();
                      setMessages(history);
                    }
                  }
                } catch {}
                break;
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't set error
        return;
      }
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsLoading(false);
    }
  }, [apiUrl, apiKey, threadId]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    submit,
    stop,
    setMessages,
  };
}
