/* __LC_ALLOW_ENTRYPOINT_SIDE_EFFECTS__ */
/* eslint-disable */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@langchain/langgraph-sdk";
import { normalizeEvent } from "./core/event-router.js";
import { ThreadActor } from "./core/thread-actor.js";
import { Store } from "./core/store.js";
import { Persistence } from "./core/persistence.js";

/** @typedef {import("@langchain/langgraph-sdk").Message} SdkMessage */
/**
 * @typedef {{ blocks: any[], ui?: any[], messages?: any[], lastUpdatedAt?: number }} ValuesSnapshot
 */
/**
 * @typedef {{ value?: any } | null} UseStreamInterrupt
 */
/**
 * @typedef {Object} UseStreamReturn
 * @property {ValuesSnapshot} values
 * @property {any} client
 * @property {any} assistantId
 * @property {any} error
 * @property {boolean} isLoading
 * @property {() => void} stop
 * @property {(inputValues: any, submitOptions: any) => Promise<void>} submit
 * @property {(runId: string, lastEventId?: string, joinOptions?: any) => Promise<void>} joinStream
 * @property {string} branch
 * @property {(b: string) => void} setBranch
 * @property {any[]} history
 * @property {boolean} isThreadLoading
 * @property {UseStreamInterrupt} interrupt
 * @property {(newThreadId: string) => void} resetForThreadSwitch
 * @property {() => void} clearInMemoryValues
 * @property {(threadIdToClear: string) => void} clearThreadCache
 * @property {(interruptId: string, frozenValue?: any) => void} completeInterrupt
 * @property {(humanMessage: any) => void} addOptimisticHumanBlock
 * @property {(messageId: string) => void} pruneAfterMessage
 * @property {(interruptIdOrValue: string | any) => void} pruneAfterInterrupt
 */

function unique(array) {
  return [...new Set(array)];
}

/** @returns {UseStreamReturn} */
export function useStream(options) {
  const { assistantId, fetchStateHistory } = options;
  const { onCreated, onError, onFinish } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(undefined);
  /** @type {[ValuesSnapshot, any]} */
  const [values, setValues] = useState(/** @type {ValuesSnapshot} */({ blocks: [], ui: [], messages: [] }));
  const [branch, setBranch] = useState("");
  /** @type {[UseStreamInterrupt, any]} */
  const [interrupt, setInterrupt] = useState(/** @type {UseStreamInterrupt} */(null));

  const client = useMemo(() => options.client ?? new Client({
    apiUrl: options.apiUrl,
    apiKey: options.apiKey,
    callerOptions: options.callerOptions,
    defaultHeaders: options.defaultHeaders,
  }), [options.client, options.apiKey, options.apiUrl, options.callerOptions, options.defaultHeaders]);

  // Controllable thread id
  const [localThreadId, _setLocalThreadId] = useState(options?.threadId ?? null);
  const onThreadIdRef = useRef(options?.onThreadId);
  onThreadIdRef.current = options?.onThreadId;
  const setThreadId = useCallback((tid) => {
    _setLocalThreadId(tid);
    onThreadIdRef.current?.(tid);
  }, []);
  const threadId = (options && "threadId" in options) ? (options.threadId ?? null) : localThreadId;

  // Internals
  const actorRef = useRef(new ThreadActor());
  const storeRef = useRef(new Store());
  const persistRef = useRef(new Persistence());
  // When true and threadId is null, do not reflect incoming updates into `values`
  // This avoids leaking old-thread updates into the blank new-chat screen
  const suspendWhenNullRef = useRef(false);

  // Apply partial display mode if provided
  useEffect(() => {
    const mode = options?.partialDisplay === "hold" ? "hold" : "append";
    storeRef.current.setPartialMode(mode);
  }, [options?.partialDisplay]);

  // Hydrate from persistence on first mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { threads } = persistRef.current.loadAll();
    if (threads && threadId && threads[threadId]) {
      storeRef.current.hydrate(threadId, threads[threadId]);
      const snap = storeRef.current.snapshot(threadId);
      setValues(snap);
    }
  }, [threadId]);

  const stopRef = useRef(null);

  const applyNormalized = useCallback((tid, normalized) => {
    actorRef.current.enqueue(tid, async () => {
      if (process.env.NODE_ENV === "development") {
        console.log("[STREAM] applying", { tid, type: normalized.type, subtype: normalized.subtype, receivedAt: normalized.receivedAt });
      }
      if (normalized.type === "message") {
        // messages stream sends [serialized]
        storeRef.current.applyMessage(tid, normalized.payload, normalized.subtype);
      } else if (normalized.type === "ui") {
        storeRef.current.applyUI(tid, normalized.payload);
      } else if (normalized.type === "values") {
        storeRef.current.applyValues(tid, normalized.payload);
        // track last interrupt if present
        if (normalized.payload && typeof normalized.payload === "object" && "__interrupt__" in normalized.payload) {
          setInterrupt({ value: normalized.payload.__interrupt__ });
        }
      } else if (normalized.type === "interrupt") {
        storeRef.current.applyInterrupt(tid, normalized.payload);
      } else {
        // ignore
      }

      const snap = storeRef.current.snapshot(tid);
      persistRef.current.saveThread(tid, snap);
      if (tid === threadId || (threadId == null && !suspendWhenNullRef.current)) {
        setValues(snap);
      }
    });
  }, [threadId]);

  async function consumeStream(action) {
    let getCallbackMeta;
    try {
      setIsLoading(true);
      setError(undefined);
      const controller = new AbortController();
      stopRef.current = () => controller.abort();
      const run = await action(controller.signal);
      getCallbackMeta = run.getCallbackMeta;
      const fixedThreadId = run.fixedThreadId; // prefer this for routing

      let streamError;
      for await (const { event, data } of run.stream) {
        if (process.env.NODE_ENV === "development") {
          console.log("[STREAM] event", event, data);
        }
        if (event === "error") {
          streamError = data instanceof Error ? data : new Error(data?.message || "Stream error");
          break;
        }
        const norm = normalizeEvent(event, data);
        if (process.env.NODE_ENV === "development") {
          console.log("[STREAM] normalized", norm);
        }
        if (norm.type !== "ignore") {
          const tid = fixedThreadId ?? threadId ?? getCallbackMeta?.()?.thread_id;
          if (tid) applyNormalized(tid, norm);
        }
      }

      const result = await run.onSuccess();
      if (streamError != null) throw streamError;
      const lastHead = result.at(0);
      if (lastHead) onFinish?.(lastHead, getCallbackMeta?.());
    } catch (e) {
      setError(e);
      onError?.(e, getCallbackMeta?.());
    } finally {
      setIsLoading(false);
      stopRef.current = null;
    }
  }

  const defaultStreamModes = ["values", "messages", "custom"]; // essential for UI + messages

  const joinStream = async (runId, lastEventId, joinOptions) => {
    lastEventId ??= "-1";
    if (!threadId) return;
    await consumeStream(async (signal) => {
      const streamMode = unique([...(joinOptions?.streamMode ?? []), ...defaultStreamModes]);
      const stream = client.runs.joinStream(threadId, runId, {
        signal,
        lastEventId,
        streamMode,
      });
      return {
        onSuccess: () => Promise.resolve([]),
        stream,
        getCallbackMeta: () => ({ thread_id: threadId, run_id: runId }),
        fixedThreadId: threadId,
      };
    });
  };

  const submit = async (inputValues, submitOptions) => {
    // Allow updates while threadId is still null for the new run
    suspendWhenNullRef.current = false;
    await consumeStream(async (signal) => {
      let usableThreadId = threadId;

      // If there's no active thread yet but a client-supplied threadId exists,
      // assign it immediately so we can render optimistic content without waiting
      // for the server roundtrip to create the thread.
      if (!usableThreadId && submitOptions?.threadId) {
        setThreadId(submitOptions.threadId);
        usableThreadId = submitOptions.threadId;
      }

      // Optimistic echo ASAP if we already have a usable thread id
      if (submitOptions?.optimisticHumanMessage && usableThreadId) {
        const optimistic = submitOptions.optimisticHumanMessage;
        actorRef.current.enqueue(usableThreadId, async () => {
          storeRef.current.addOptimisticHumanBlock(usableThreadId, optimistic);
          const snap = storeRef.current.snapshot(usableThreadId);
          persistRef.current.saveThread(usableThreadId, snap);
          if (usableThreadId === threadId || threadId == null) {
            setValues(snap);
          }
        });
      }

      // Ensure the thread exists server-side. If we pre-assigned a client
      // thread id above, create the server thread with that id.
      if (!threadId) {
        const thread = await client.threads.create({
          threadId: usableThreadId ?? submitOptions?.threadId,
          metadata: submitOptions?.metadata,
        });
        setThreadId(thread.thread_id);
        usableThreadId = thread.thread_id;
      }
      if (!usableThreadId) {
        // Fallback: if for any reason we still do not have a thread, create one now
        const thread = await client.threads.create({
          threadId: submitOptions?.threadId,
          metadata: submitOptions?.metadata,
        });
        setThreadId(thread.thread_id);
        usableThreadId = thread.thread_id;
      }
      if (!usableThreadId) throw new Error("Failed to obtain valid thread ID.");

      const streamMode = unique([...(submitOptions?.streamMode ?? []), ...defaultStreamModes]);

      let callbackMeta;
      const stream = client.runs.stream(usableThreadId, assistantId, {
        input: inputValues,
        config: submitOptions?.config,
        context: submitOptions?.context,
        command: submitOptions?.command,
        interruptBefore: submitOptions?.interruptBefore,
        interruptAfter: submitOptions?.interruptAfter,
        metadata: submitOptions?.metadata,
        multitaskStrategy: submitOptions?.multitaskStrategy,
        onCompletion: submitOptions?.onCompletion,
        onDisconnect: submitOptions?.onDisconnect ?? "cancel",
        signal,
        streamMode,
        streamSubgraphs: submitOptions?.streamSubgraphs,
        onRunCreated(params) {
          callbackMeta = { run_id: params.run_id, thread_id: params.thread_id ?? usableThreadId };
          onCreated?.(callbackMeta);
        },
      });

      return {
        stream,
        getCallbackMeta: () => callbackMeta,
        onSuccess: () => Promise.resolve([]),
        fixedThreadId: usableThreadId,
      };
    });
  };

  const stop = () => {
    try { stopRef.current?.(); } catch {}
  };

  /** @type {UseStreamReturn} */
  const api = {
    get values() {
      return values;
    },
    client,
    assistantId,
    error,
    isLoading,
    stop,
    submit,
    joinStream,
    branch,
    setBranch,
    history: [],
    isThreadLoading: false,
    /** last interrupt object from values events (if any) */
    get interrupt() {
      return interrupt;
    },
    resetForThreadSwitch(newThreadId) {
      // No clearing of persisted cache; only switch active view
      if (newThreadId && newThreadId !== threadId) {
        const { threads } = persistRef.current.loadAll();
        if (threads && threads[newThreadId]) {
          storeRef.current.hydrate(newThreadId, threads[newThreadId]);
        }
        const snap = storeRef.current.snapshot(newThreadId);
        setValues(snap);
      }
    },
    /** Clear only in-memory snapshot for a new chat (keep persistence) */
    clearInMemoryValues() {
      suspendWhenNullRef.current = true;
      setValues({ blocks: [], ui: [], messages: [], lastUpdatedAt: Date.now() });
    },
    clearThreadCache(threadIdToClear) {
      if (!threadIdToClear) return;
      if (typeof window === "undefined") return;
      const all = persistRef.current.loadAll();
      delete all.threads[threadIdToClear];
      try {
        window.localStorage.setItem("langgraph-stream-cache", JSON.stringify(all));
      } catch (e) {
        console.warn("[PERSIST] failed to clear thread cache", e);
      }
    },
    completeInterrupt(interruptId, frozenValue) {
      const tid = threadId;
      if (!tid || !interruptId) return;
      actorRef.current.enqueue(tid, async () => {
        storeRef.current.completeInterrupt(tid, interruptId, frozenValue);
        const snap = storeRef.current.snapshot(tid);
        persistRef.current.saveThread(tid, snap);
        setValues(snap);
      });
    },
    addOptimisticHumanBlock(humanMessage) {
      const tid = threadId;
      if (!tid || !humanMessage) return;
      actorRef.current.enqueue(tid, async () => {
        storeRef.current.addOptimisticHumanBlock(tid, humanMessage);
        const snap = storeRef.current.snapshot(tid);
        persistRef.current.saveThread(tid, snap);
        setValues(snap);
      });
    },
    pruneAfterMessage(messageId) {
      const tid = threadId;
      if (!tid || !messageId) return;
      actorRef.current.enqueue(tid, async () => {
        storeRef.current.pruneAfterMessage(tid, messageId);
        const snap = storeRef.current.snapshot(tid);
        persistRef.current.saveThread(tid, snap);
        setValues(snap);
      });
    },
    pruneAfterInterrupt(interruptIdOrValue) {
      const tid = threadId;
      if (!tid || !interruptIdOrValue) return;
      actorRef.current.enqueue(tid, async () => {
        if (typeof interruptIdOrValue === "string") {
          storeRef.current.pruneAfterInterruptId(tid, interruptIdOrValue);
        } else {
          storeRef.current.pruneAfterInterruptValue(tid, interruptIdOrValue);
        }
        const snap = storeRef.current.snapshot(tid);
        persistRef.current.saveThread(tid, snap);
        setValues(snap);
      });
    },
  };

  return api;
} 