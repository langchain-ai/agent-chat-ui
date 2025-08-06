/* __LC_ALLOW_ENTRYPOINT_SIDE_EFFECTS__ */
/* eslint-disable */
"use client";
import { useCallback, useEffect, useMemo, useRef, useState, } from "react";
import { coerceMessageLikeToMessage, convertToChunk, isBaseMessageChunk, } from "@langchain/core/messages";
import { Client } from "@langchain/langgraph-sdk";
// import { getClientConfigHash } from "@langchain/langgraph-sdk/client";

class StreamError extends Error {
    constructor(data) {
        super(data.message);
        this.name = data.name ?? data.error ?? "StreamError";
    }
    static isStructuredError(error) {
        return typeof error === "object" && error != null && "message" in error;
    }
}

function tryConvertToChunk(message) {
    try {
        return convertToChunk(message);
    }
    catch {
        return null;
    }
}

class MessageTupleManager {
    constructor() {
        Object.defineProperty(this, "chunks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        this.chunks = {};
    }
    add(serialized) {
        // TODO: this is sometimes sent from the API
        // figure out how to prevent this or move this to LC.js
        if (serialized.type.endsWith("MessageChunk")) {
            // eslint-disable-next-line no-param-reassign
            serialized.type = serialized.type
                .slice(0, -"MessageChunk".length)
                .toLowerCase();
        }
        const message = coerceMessageLikeToMessage(serialized);
        const chunk = tryConvertToChunk(message);
        const { id } = chunk ?? message;
        if (!id) {
            console.warn("No message ID found for chunk, ignoring in state", serialized);
            return null;
        }
        this.chunks[id] ??= {};
        if (chunk) {
            const prev = this.chunks[id].chunk;
            this.chunks[id].chunk =
                (isBaseMessageChunk(prev) ? prev : null)?.concat(chunk) ?? chunk;
        }
        else {
            this.chunks[id].chunk = message;
        }
        return id;
    }
    clear() {
        this.chunks = {};
    }
    get(id, defaultIndex) {
        if (this.chunks[id] == null)
            return null;
        this.chunks[id].index ??= defaultIndex;
        return this.chunks[id];
    }
}

const toMessageDict = (chunk) => {
    const { type, data } = chunk.toDict();
    return { ...data, type };
};

function unique(array) {
    return [...new Set(array)];
}

function findLastIndex(array, predicate) {
    for (let i = array.length - 1; i >= 0; i -= 1) {
        if (predicate(array[i]))
            return i;
    }
    return -1;
}

function getBranchSequence(history) {
    const childrenMap = {};
    // Short circuit if there's only a singular one state
    // TODO: I think we can make this more generalizable for all `fetchStateHistory` values.
    if (history.length <= 1) {
        return {
            rootSequence: {
                type: "sequence",
                items: history.map((value) => ({ type: "node", value, path: [] })),
            },
            paths: [],
        };
    }
    // First pass - collect nodes for each checkpoint
    history.forEach((state) => {
        const checkpointId = state.parent_checkpoint?.checkpoint_id ?? "$";
        childrenMap[checkpointId] ??= [];
        childrenMap[checkpointId].push(state);
    });
    const rootSequence = { type: "sequence", items: [] };
    const queue = [{ id: "$", sequence: rootSequence, path: [] }];
    const paths = [];
    const visited = new Set();
    while (queue.length > 0) {
        const task = queue.shift();
        if (visited.has(task.id))
            continue;
        visited.add(task.id);
        const children = childrenMap[task.id];
        if (children == null || children.length === 0)
            continue;
        // If we've encountered a fork (2+ children), push the fork
        // to the sequence and add a new sequence for each child
        let fork;
        if (children.length > 1) {
            fork = { type: "fork", items: [] };
            task.sequence.items.push(fork);
        }
        for (const value of children) {
            const id = value.checkpoint?.checkpoint_id;
            if (id == null)
                continue;
            let { sequence } = task;
            let { path } = task;
            if (fork != null) {
                sequence = { type: "sequence", items: [] };
                fork.items.unshift(sequence);
                path = path.slice();
                path.push(id);
                paths.push(path);
            }
            sequence.items.push({ type: "node", value, path });
            queue.push({ id, sequence, path });
        }
    }
    return { rootSequence, paths };
}

const PATH_SEP = ">";
const ROOT_ID = "$";

// Get flat view
function getBranchView(sequence, paths, branch) {
    const path = branch.split(PATH_SEP);
    const pathMap = {};
    for (const path of paths) {
        const parent = path.at(-2) ?? ROOT_ID;
        pathMap[parent] ??= [];
        pathMap[parent].unshift(path);
    }
    const history = [];
    const branchByCheckpoint = {};
    const forkStack = path.slice();
    const queue = [...sequence.items];
    while (queue.length > 0) {
        const item = queue.shift();
        if (item.type === "node") {
            history.push(item.value);
            const checkpointId = item.value.checkpoint?.checkpoint_id;
            if (checkpointId == null)
                continue;
            branchByCheckpoint[checkpointId] = {
                branch: item.path.join(PATH_SEP),
                branchOptions: (item.path.length > 0
                    ? pathMap[item.path.at(-2) ?? ROOT_ID] ?? []
                    : []).map((p) => p.join(PATH_SEP)),
            };
        }
        if (item.type === "fork") {
            const forkId = forkStack.shift();
            const index = forkId != null
                ? item.items.findIndex((value) => {
                    const firstItem = value.items.at(0);
                    if (!firstItem || firstItem.type !== "node")
                        return false;
                    return firstItem.value.checkpoint?.checkpoint_id === forkId;
                })
                : -1;
            const nextItems = item.items.at(index)?.items ?? [];
            queue.push(...nextItems);
        }
    }
    return { history, branchByCheckpoint };
}

function fetchHistory(client, threadId, options) {
    if (options?.limit === false) {
        return client.threads.getState(threadId).then((state) => {
            if (state.checkpoint == null)
                return [];
            return [state];
        });
    }
    const limit = typeof options?.limit === "number" ? options.limit : 1000;
    return client.threads.getHistory(threadId, { limit });
}

function useThreadHistory(threadId, client, limit, clearCallbackRef, submittingRef, onErrorRef) {
    const [history, setHistory] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(undefined);
    const clientHash = JSON.stringify(client?.config || {});
    const clientRef = useRef(client);
    clientRef.current = client;
    const fetcher = useCallback((threadId) => {
        if (threadId != null) {
            const client = clientRef.current;
            setIsLoading(true);
            return fetchHistory(client, threadId, {
                limit,
            })
                .then((history) => {
                setHistory(history);
                return history;
            }, (error) => {
                setError(error);
                onErrorRef.current?.(error);
                return Promise.reject(error);
            })
                .finally(() => {
                setIsLoading(false);
            });
        }
        setHistory(undefined);
        setError(undefined);
        setIsLoading(false);
        clearCallbackRef.current?.();
        return Promise.resolve([]);
    }, [clearCallbackRef, onErrorRef, limit]);
    useEffect(() => {
        if (submittingRef.current)
            return;
        void fetcher(threadId);
    }, [fetcher, clientHash, limit, submittingRef, threadId]);
    return {
        data: history,
        isLoading,
        error,
        mutate: (mutateId) => fetcher(mutateId ?? threadId),
    };
}

const useControllableThreadId = (options) => {
    const [localThreadId, _setLocalThreadId] = useState(options?.threadId ?? null);
    const onThreadIdRef = useRef(options?.onThreadId);
    onThreadIdRef.current = options?.onThreadId;
    const onThreadId = useCallback((threadId) => {
        _setLocalThreadId(threadId);
        onThreadIdRef.current?.(threadId);
    }, []);
    if (!options || !("threadId" in options)) {
        return [localThreadId, onThreadId];
    }
    return [options.threadId ?? null, onThreadId];
};

function useStreamValuesState() {
    const [values, setValues] = useState(null);
    const setStreamValues = useCallback((values, kind = "stream") => {
        if (typeof values === "function") {
            setValues((prevTuple) => {
                const [prevValues, prevKind] = prevTuple ?? [null, "stream"];
                const next = values(prevValues, prevKind);
                if (next == null)
                    return null;
                return [next, kind];
            });
            return;
        }
        if (values == null)
            setValues(null);
        setValues([values, kind]);
    }, []);
    const mutate = useCallback((kind, serverValues) => (update) => {
        setStreamValues((clientValues) => {
            const prev = { ...serverValues, ...clientValues };
            const next = typeof update === "function" ? update(prev) : update;
            return { ...prev, ...next };
        }, kind);
    }, [setStreamValues]);
    return [values?.[0] ?? null, setStreamValues, mutate];
}

export function useStream(options) {
    let { messagesKey } = options;
    const { assistantId, fetchStateHistory } = options;
    const { onCreated, onError, onFinish } = options;
    const reconnectOnMountRef = useRef(options.reconnectOnMount);
    const runMetadataStorage = useMemo(() => {
        if (typeof window === "undefined")
            return null;
        const storage = reconnectOnMountRef.current;
        if (storage === true)
            return window.sessionStorage;
        if (typeof storage === "function")
            return storage();
        return null;
    }, []);
    messagesKey ??= "messages";
    const client = useMemo(() => options.client ??
        new Client({
            apiUrl: options.apiUrl,
            apiKey: options.apiKey,
            callerOptions: options.callerOptions,
            defaultHeaders: options.defaultHeaders,
        }), [
        options.client,
        options.apiKey,
        options.apiUrl,
        options.callerOptions,
        options.defaultHeaders,
    ]);
    const [threadId, onThreadId] = useControllableThreadId(options);
    const [branch, setBranch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamError, setStreamError] = useState(undefined);
    const [streamValues, setStreamValues, getMutateFn] = useStreamValuesState();
    
    // ENHANCED: Stream values cache for subgraph message persistence - thread-specific
    const streamValuesCacheRef = useRef(new Map()); // Map<threadId, cachedValues>
    
    const messageManagerRef = useRef(new MessageTupleManager());
    const submittingRef = useRef(false);
    const abortRef = useRef(null);
    const trackStreamModeRef = useRef([]);
    const trackStreamMode = useCallback((...mode) => {
        for (const m of mode) {
            if (!trackStreamModeRef.current.includes(m)) {
                trackStreamModeRef.current.push(m);
            }
        }
    }, []);
    const hasUpdateListener = options.onUpdateEvent != null;
    const hasCustomListener = options.onCustomEvent != null;
    const hasLangChainListener = options.onLangChainEvent != null;
    const hasDebugListener = options.onDebugEvent != null;
    const hasCheckpointListener = options.onCheckpointEvent != null;
    const hasTaskListener = options.onTaskEvent != null;
    const callbackStreamMode = useMemo(() => {
        const modes = [];
        if (hasUpdateListener)
            modes.push("updates");
        if (hasCustomListener)
            modes.push("custom");
        if (hasLangChainListener)
            modes.push("events");
        if (hasDebugListener)
            modes.push("debug");
        if (hasCheckpointListener)
            modes.push("checkpoints");
        if (hasTaskListener)
            modes.push("tasks");
        return modes;
    }, [
        hasUpdateListener,
        hasCustomListener,
        hasLangChainListener,
        hasDebugListener,
        hasCheckpointListener,
        hasTaskListener,
    ]);
    const clearCallbackRef = useRef(null);
    clearCallbackRef.current = () => {
        setStreamError(undefined);
        setStreamValues(null);
        messageManagerRef.current.clear();
    };
    const onErrorRef = useRef(undefined);
    onErrorRef.current = options.onError;
    const historyLimit = typeof fetchStateHistory === "object" && fetchStateHistory != null
        ? fetchStateHistory.limit ?? true
        : fetchStateHistory ?? true;
    const history = useThreadHistory(threadId, client, historyLimit, clearCallbackRef, submittingRef, onErrorRef);
    const getMessages = useMemo(() => {
        return (value) => Array.isArray(value[messagesKey])
            ? value[messagesKey]
            : [];
    }, [messagesKey]);
    const { rootSequence, paths } = getBranchSequence(history.data ?? []);
    const { history: flatHistory, branchByCheckpoint } = getBranchView(rootSequence, paths, branch);
    const threadHead = flatHistory.at(-1);
    const historyValues = threadHead?.values ?? options.initialValues ?? {};
    const historyValueError = (() => {
        const error = threadHead?.tasks?.at(-1)?.error;
        if (error == null)
            return undefined;
        try {
            const parsed = JSON.parse(error);
            if (StreamError.isStructuredError(parsed)) {
                return new StreamError(parsed);
            }
            return parsed;
        }
        catch {
            // do nothing
        }
        return error;
    })();
    const messageMetadata = (() => {
        const alreadyShown = new Set();
        return getMessages(historyValues).map((message, idx) => {
            const messageId = message.id ?? idx;
            const firstSeenIdx = findLastIndex(history.data ?? [], (state) => getMessages(state.values)
                .map((m, idx) => m.id ?? idx)
                .includes(messageId));
            const firstSeen = history.data?.[firstSeenIdx];
            const checkpointId = firstSeen?.checkpoint?.checkpoint_id;
            let branch = firstSeen && checkpointId != null
                ? branchByCheckpoint[checkpointId]
                : undefined;
            if (!branch?.branch?.length)
                branch = undefined;
            // serialize branches
            const optionsShown = branch?.branchOptions?.flat(2).join(",");
            if (optionsShown) {
                if (alreadyShown.has(optionsShown))
                    branch = undefined;
                alreadyShown.add(optionsShown);
            }
            return {
                messageId: messageId.toString(),
                firstSeenState: firstSeen,
                branch: branch?.branch,
                branchOptions: branch?.branchOptions,
            };
        });
    })();
    const stop = () => {
        if (abortRef.current != null)
            abortRef.current.abort();
        abortRef.current = null;
        if (runMetadataStorage && threadId) {
            const runId = runMetadataStorage.getItem(`lg:stream:${threadId}`);
            if (runId)
                void client.runs.cancel(threadId, runId);
            runMetadataStorage.removeItem(`lg:stream:${threadId}`);
        }
        options?.onStop?.({ mutate: getMutateFn("stop", historyValues) });
    };
    async function consumeStream(action) {
        let getCallbackMeta;
        try {
            setIsLoading(true);
            setStreamError(undefined);
            submittingRef.current = true;
            abortRef.current = new AbortController();
            const run = await action(abortRef.current.signal);
            getCallbackMeta = run.getCallbackMeta;
            let streamError;
            for await (const { event, data } of run.stream) {
                if (event === "error") {
                    streamError = new StreamError(data);
                    break;
                }
                if (event === "updates")
                    options.onUpdateEvent?.(data);
                if (event === "custom" ||
                    // if `streamSubgraphs: true`, then we also want
                    // to also receive custom events from subgraphs
                    event.startsWith("custom|"))
                    options.onCustomEvent?.(data, {
                        mutate: getMutateFn("stream", historyValues),
                    });
                if (event === "metadata")
                    options.onMetadataEvent?.(data);
                if (event === "events")
                    options.onLangChainEvent?.(data);
                if (event === "debug")
                    options.onDebugEvent?.(data);
                if (event === "checkpoints")
                    options.onCheckpointEvent?.(data);
                if (event === "tasks")
                    options.onTaskEvent?.(data);
                if (event === "values") {
                    // ENHANCED: Handle interrupt values events properly
                    if ("__interrupt__" in data) {
                        console.log("🔍 Interrupt values event detected - preserving values");
                        setStreamValues(data); // Now updates values even for interrupts
                        continue;
                    }
                    setStreamValues(data);
                }
                if (event === "messages" ||
                    // if `streamSubgraphs: true`, then we also want
                    // to also receive messages from subgraphs
                    event.startsWith("messages|")) {
                    const [serialized] = data;
                    const messageId = messageManagerRef.current.add(serialized);
                    if (!messageId) {
                        console.warn("Failed to add message to manager, no message ID found");
                        continue;
                    }
                    setStreamValues((streamValues) => {
                        const values = { ...historyValues, ...streamValues };
                        // Assumption: we're concatenating the message
                        const messages = getMessages(values).slice();
                        const { chunk, index } = messageManagerRef.current.get(messageId, messages.length) ?? {};
                        if (!chunk || index == null)
                            return values;
                        messages[index] = toMessageDict(chunk);
                        return { ...values, [messagesKey]: messages };
                    });
                }
            }
            // TODO: stream created checkpoints to avoid an unnecessary network request
            const result = await run.onSuccess();
            setStreamValues((values, kind) => {
                // ENHANCED: Preserve values instead of clearing them
                if (kind === "stop")
                    return values;
                console.log("🔍 Stream ended - preserving values instead of clearing");
                return values; // Now preserves values
            });
            if (streamError != null)
                throw streamError;
            const lastHead = result.at(0);
            if (lastHead)
                onFinish?.(lastHead, getCallbackMeta?.());
        }
        catch (error) {
            if (!(error instanceof Error && // eslint-disable-line no-instanceof/no-instanceof
                (error.name === "AbortError" || error.name === "TimeoutError"))) {
                console.error(error);
                setStreamError(error);
                onError?.(error, getCallbackMeta?.());
            }
        }
        finally {
            setIsLoading(false);
            submittingRef.current = false;
            abortRef.current = null;
        }
    }
    const joinStream = async (runId, lastEventId, options) => {
        // eslint-disable-next-line no-param-reassign
        lastEventId ??= "-1";
        if (!threadId)
            return;
        await consumeStream(async (signal) => {
            const stream = client.runs.joinStream(threadId, runId, {
                signal,
                lastEventId,
                streamMode: options?.streamMode,
            });
            return {
                onSuccess: () => {
                    runMetadataStorage?.removeItem(`lg:stream:${threadId}`);
                    return history.mutate(threadId);
                },
                stream,
                getCallbackMeta: () => ({ thread_id: threadId, run_id: runId }),
            };
        });
    };
    const submit = async (values, submitOptions) => {
        await consumeStream(async (signal) => {
            // Unbranch things
            const newPath = submitOptions?.checkpoint?.checkpoint_id
                ? branchByCheckpoint[submitOptions?.checkpoint?.checkpoint_id]?.branch
                : undefined;
            if (newPath != null)
                setBranch(newPath ?? "");
            setStreamValues(() => {
                if (submitOptions?.optimisticValues != null) {
                    return {
                        ...historyValues,
                        ...(typeof submitOptions.optimisticValues === "function"
                            ? submitOptions.optimisticValues(historyValues)
                            : submitOptions.optimisticValues),
                    };
                }
                return { ...historyValues };
            });
            let usableThreadId = threadId;
            if (!usableThreadId) {
                const thread = await client.threads.create({
                    threadId: submitOptions?.threadId,
                    metadata: submitOptions?.metadata,
                });
                onThreadId(thread.thread_id);
                usableThreadId = thread.thread_id;
            }
            if (!usableThreadId)
                throw new Error("Failed to obtain valid thread ID.");
            const streamMode = unique([
                ...(submitOptions?.streamMode ?? []),
                ...trackStreamModeRef.current,
                ...callbackStreamMode,
            ]);
            const checkpoint = submitOptions?.checkpoint ?? threadHead?.checkpoint ?? undefined;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            if (checkpoint != null)
                delete checkpoint.thread_id;
            let rejoinKey;
            let callbackMeta;
            const streamResumable = submitOptions?.streamResumable ?? !!runMetadataStorage;
            const stream = client.runs.stream(usableThreadId, assistantId, {
                input: values,
                config: submitOptions?.config,
                context: submitOptions?.context,
                command: submitOptions?.command,
                interruptBefore: submitOptions?.interruptBefore,
                interruptAfter: submitOptions?.interruptAfter,
                metadata: submitOptions?.metadata,
                multitaskStrategy: submitOptions?.multitaskStrategy,
                onCompletion: submitOptions?.onCompletion,
                onDisconnect: submitOptions?.onDisconnect ??
                    (streamResumable ? "continue" : "cancel"),
                signal,
                checkpoint,
                streamMode,
                streamSubgraphs: submitOptions?.streamSubgraphs,
                streamResumable,
                onRunCreated(params) {
                    callbackMeta = {
                        run_id: params.run_id,
                        thread_id: params.thread_id ?? usableThreadId,
                    };
                    if (runMetadataStorage) {
                        rejoinKey = `lg:stream:${callbackMeta.thread_id}`;
                        runMetadataStorage.setItem(rejoinKey, callbackMeta.run_id);
                    }
                    onCreated?.(callbackMeta);
                },
            });
            return {
                stream,
                getCallbackMeta: () => callbackMeta,
                onSuccess: () => {
                    if (rejoinKey)
                        runMetadataStorage?.removeItem(rejoinKey);
                    return history.mutate(usableThreadId);
                },
            };
        });
    };
    const reconnectKey = useMemo(() => {
        if (!runMetadataStorage || isLoading)
            return undefined;
        if (typeof window === "undefined")
            return undefined;
        const runId = runMetadataStorage?.getItem(`lg:stream:${threadId}`);
        if (!runId)
            return undefined;
        return { runId, threadId };
    }, [runMetadataStorage, isLoading, threadId]);
    const shouldReconnect = !!runMetadataStorage;
    const reconnectRef = useRef({ threadId, shouldReconnect });
    const joinStreamRef = useRef(joinStream);
    joinStreamRef.current = joinStream;
    useEffect(() => {
        // reset shouldReconnect when switching threads
        if (reconnectRef.current.threadId !== threadId) {
            reconnectRef.current = { threadId, shouldReconnect };
        }
    }, [threadId, shouldReconnect]);
    useEffect(() => {
        if (reconnectKey && reconnectRef.current.shouldReconnect) {
            reconnectRef.current.shouldReconnect = false;
            void joinStreamRef.current?.(reconnectKey.runId);
        }
    }, [reconnectKey]);
    const error = streamError ?? historyValueError ?? history.error;
    
    // ENHANCED: Cache stream values when they are available, preserving all messages
    useEffect(() => {
        // Clear cache when threadId changes to prevent cross-contamination
        if (threadId) {
            console.log("🔍 [CACHE DEBUG] Thread changed to:", threadId);
        }
        
        if (streamValues) {
            // Cache if we have any messages, UI widgets, or interrupt data
            const hasMessages = streamValues.messages?.length > 0;
            const hasUI = streamValues.ui?.length > 0;
            const hasInterrupt = streamValues.__interrupt__;
            const hasOtherValues = Object.keys(streamValues).length > 0;
            
            console.log("🔍 [CACHE DEBUG] streamValues changed for thread:", threadId, "- hasMessages:", hasMessages, "hasUI:", hasUI, "hasInterrupt:", hasInterrupt, "hasOtherValues:", hasOtherValues);
            console.log("🔍 [CACHE DEBUG] streamValues keys:", Object.keys(streamValues));
            if (hasMessages) {
                console.log("🔍 [CACHE DEBUG] Messages to cache for thread:", threadId, ":", streamValues.messages.map(m => ({
                    id: m.id,
                    type: m.type,
                    content: m.content?.slice(0, 100) || 'no content'
                })));
            }
            
                        if (hasMessages || hasUI || hasInterrupt || hasOtherValues) {
                // ENHANCED: Merge with existing cache instead of overwriting
                // Only cache if we have a valid threadId
                if (!threadId) {
                    console.log("🔍 [CACHE DEBUG] Skipping cache - no valid threadId");
                    return;
                }
                const currentCache = streamValuesCacheRef.current.get(threadId);
                if (currentCache && streamValues.messages) {
                const existingCache = currentCache;
                const newMessages = streamValues.messages;
                    
                    console.log("🔍 [CACHE DEBUG] Merging cache - existing messages:", existingCache.messages?.length || 0, "new messages:", newMessages.length);
                    if (existingCache.messages) {
                        console.log("🔍 [CACHE DEBUG] Existing message IDs:", existingCache.messages.map(m => m.id));
                    }
                    console.log("🔍 [CACHE DEBUG] New message IDs:", newMessages.map(m => m.id));
                    
                    // Combine existing cached messages with new messages, removing duplicates
                    const allMessages = [...(existingCache.messages || [])];
                    let addedCount = 0;
                    let updatedCount = 0;
                    newMessages.forEach(msg => {
                        const existingIndex = allMessages.findIndex(existing => existing.id === msg.id);
                        if (existingIndex === -1) {
                            allMessages.push(msg);
                            addedCount++;
                            console.log("🔍 [CACHE DEBUG] Added to cache:", msg.id, msg.type, msg.content?.slice(0, 50));
                        } else {
                            // Update existing message with new content
                            const existingMsg = allMessages[existingIndex];
                            const oldContent = existingMsg.content;
                            allMessages[existingIndex] = msg; // Replace with updated message
                            updatedCount++;
                            console.log("🔍 [CACHE DEBUG] Updated in cache:", msg.id, msg.type, "old content:", oldContent?.slice(0, 50), "new content:", msg.content?.slice(0, 50));
                        }
                    });
                    
                    // Create merged cache
                    const mergedCache = {
                        ...existingCache,
                        ...streamValues,
                        messages: allMessages
                    };
                    
                    streamValuesCacheRef.current.set(threadId, mergedCache);
                    console.log("🔍 [CACHE DEBUG] Merged cache - existing:", existingCache.messages?.length || 0, "new:", newMessages.length, "added:", addedCount, "updated:", updatedCount, "total:", allMessages.length);
                } else {
                    // No existing cache, just store the new values
                    streamValuesCacheRef.current.set(threadId, streamValues);
                    console.log("🔍 [CACHE DEBUG] New cache created for thread:", threadId, Object.keys(streamValues), hasMessages ? `(${streamValues.messages.length} messages)` : "");
                }
            } else {
                console.log("🔍 [CACHE DEBUG] Skipping cache - no meaningful values to cache");
            }
        }
    }, [streamValues]);
    
    return {
        get values() {
            trackStreamMode("values");
            // ENHANCED: Smart merging of current and cached values to preserve all messages
            let finalValues = streamValues ?? historyValues;
            
            // If we have cached values, always merge them with current values
            // Only use cache if we have a valid threadId
            const cached = threadId ? streamValuesCacheRef.current.get(threadId) : null;
            if (cached && streamValues) {
                const current = streamValues;
                
                console.log("🔍 [MERGE DEBUG] Cached values keys:", Object.keys(cached));
                console.log("🔍 [MERGE DEBUG] Current values keys:", Object.keys(current));
                console.log("🔍 [MERGE DEBUG] Cached messages count:", cached.messages?.length || 0);
                console.log("🔍 [MERGE DEBUG] Current messages count:", current.messages?.length || 0);
                
                if (cached.messages) {
                    console.log("🔍 [MERGE DEBUG] Cached messages content:", cached.messages.map(m => ({
                        id: m.id,
                        type: m.type,
                        content: m.content?.slice(0, 100) || 'no content'
                    })));
                }
                if (current.messages) {
                    console.log("🔍 [MERGE DEBUG] Current messages content:", current.messages.map(m => ({
                        id: m.id,
                        type: m.type,
                        content: m.content?.slice(0, 100) || 'no content'
                    })));
                }
                
                // Always merge ALL cached messages with current messages
                if (cached.messages && current.messages) {
                    // Combine cached and current messages, removing duplicates by ID
                    const allMessages = [...cached.messages];
                    console.log("🔍 [MERGE DEBUG] Starting with cached messages:", allMessages.length);
                    
                    let addedCount = 0;
                    let updatedCount = 0;
                    current.messages.forEach(msg => {
                        const existingIndex = allMessages.findIndex(existing => existing.id === msg.id);
                        if (existingIndex === -1) {
                            allMessages.push(msg);
                            addedCount++;
                            console.log("🔍 [MERGE DEBUG] Added new message:", msg.id, msg.type, msg.content?.slice(0, 50));
                        } else {
                            // Update existing message with new content
                            const existingMsg = allMessages[existingIndex];
                            const oldContent = existingMsg.content;
                            allMessages[existingIndex] = msg; // Replace with updated message
                            updatedCount++;
                            console.log("🔍 [MERGE DEBUG] Updated existing message:", msg.id, msg.type, "old content:", oldContent?.slice(0, 50), "new content:", msg.content?.slice(0, 50));
                        }
                    });
                    
                    finalValues = { ...finalValues, messages: allMessages };
                    console.log("🔍 [MERGE DEBUG] Merged ALL cached messages:", cached.messages.length, "with current:", current.messages.length, "added:", addedCount, "updated:", updatedCount, "total:", allMessages.length);
                    console.log("🔍 [MERGE DEBUG] Final merged message content:", allMessages.map(m => ({
                        id: m.id,
                        type: m.type,
                        content: m.content?.slice(0, 100) || 'no content'
                    })));
                } else if (cached.messages) {
                    // Use cached messages if no current messages
                    finalValues = { ...finalValues, messages: cached.messages };
                    console.log("🔍 [MERGE DEBUG] Using cached messages (no current messages):", cached.messages.length);
                }
                
                // Always merge ALL cached UI widgets with current UI widgets
                if (cached.ui && current.ui) {
                    // Combine cached and current UI widgets, removing duplicates by ID
                    const allUI = [...cached.ui];
                    current.ui.forEach(widget => {
                        if (!allUI.find(existing => existing.id === widget.id)) {
                            allUI.push(widget);
                        }
                    });
                    finalValues = { ...finalValues, ui: allUI };
                    console.log("🔍 [MERGE DEBUG] Merged ALL cached UI widgets:", cached.ui.length, "with current:", current.ui.length, "total:", allUI.length);
                } else if (cached.ui) {
                    // Use cached UI widgets if no current UI widgets
                    finalValues = { ...finalValues, ui: cached.ui };
                    console.log("🔍 [MERGE DEBUG] Using cached UI widgets (no current UI widgets):", cached.ui.length);
                }
                
                // Preserve other cached values that might be missing in current
                Object.keys(cached).forEach(key => {
                    if (key !== 'messages' && key !== 'ui' && !(key in finalValues)) {
                        finalValues[key] = cached[key];
                        console.log("🔍 [MERGE DEBUG] Preserved cached value:", key);
                    }
                });
            } else if (cached && !streamValues) {
                // Use cached values if no current values
                finalValues = cached;
                console.log("🔍 [MERGE DEBUG] Using cached values (no current values)");
            }
            
            return finalValues;
        },
        client,
        assistantId,
        error,
        isLoading,
        stop,
        submit, // eslint-disable-line @typescript-eslint/no-misused-promises
        joinStream,
        branch,
        setBranch,
        history: flatHistory,
        isThreadLoading: history.isLoading && history.data == null,
        get experimental_branchTree() {
            if (historyLimit === false) {
                throw new Error("`experimental_branchTree` is not available when `fetchStateHistory` is set to `false`");
            }
            return rootSequence;
        },
        get interrupt() {
            // Don't show the interrupt if the stream is loading
            if (isLoading)
                return undefined;
            const interrupts = threadHead?.tasks?.at(-1)?.interrupts;
            if (interrupts == null || interrupts.length === 0) {
                // ENHANCED: Only clear cache if there's an error - preserve all messages
                const currentCache = streamValuesCacheRef.current.get(threadId);
                if (currentCache && error != null) {
                    console.log("🔍 [INTERRUPT DEBUG] Error detected - clearing stream values cache for thread:", threadId);
                    streamValuesCacheRef.current.delete(threadId);
                } else {
                    console.log("🔍 [INTERRUPT DEBUG] No interrupts active, cache preserved for thread:", threadId);
                }
                // check if there's a next task present
                const next = threadHead?.next ?? [];
                if (!next.length || error != null)
                    return undefined;
                return { when: "breakpoint" };
            }
            // Return only the current interrupt
            return interrupts.at(-1);
        },
        get messages() {
            trackStreamMode("messages-tuple", "values");
            // Use the same smart merging logic as the values getter
            let finalValues = streamValues ?? historyValues;
            
            // If we have cached values, always merge them with current values
            // Only use cache if we have a valid threadId
            const cached = threadId ? streamValuesCacheRef.current.get(threadId) : null;
            if (cached && streamValues) {
                const current = streamValues;
                
                console.log("🔍 [MESSAGES MERGE DEBUG] Cached values keys:", Object.keys(cached));
                console.log("🔍 [MESSAGES MERGE DEBUG] Current values keys:", Object.keys(current));
                console.log("🔍 [MESSAGES MERGE DEBUG] Cached messages count:", cached.messages?.length || 0);
                console.log("🔍 [MESSAGES MERGE DEBUG] Current messages count:", current.messages?.length || 0);
                
                if (cached.messages) {
                    console.log("🔍 [MESSAGES MERGE DEBUG] Cached messages content:", cached.messages.map(m => ({
                        id: m.id,
                        type: m.type,
                        content: m.content?.slice(0, 100) || 'no content'
                    })));
                }
                if (current.messages) {
                    console.log("🔍 [MESSAGES MERGE DEBUG] Current messages content:", current.messages.map(m => ({
                        id: m.id,
                        type: m.type,
                        content: m.content?.slice(0, 100) || 'no content'
                    })));
                }
                
                // Always merge ALL cached messages with current messages
                if (cached.messages && current.messages) {
                    // Combine cached and current messages, removing duplicates by ID
                    const allMessages = [...cached.messages];
                    console.log("🔍 [MESSAGES MERGE DEBUG] Starting with cached messages:", allMessages.length);
                    
                    let addedCount = 0;
                    let updatedCount = 0;
                    current.messages.forEach(msg => {
                        const existingIndex = allMessages.findIndex(existing => existing.id === msg.id);
                        if (existingIndex === -1) {
                            allMessages.push(msg);
                            addedCount++;
                            console.log("🔍 [MESSAGES MERGE DEBUG] Added new message:", msg.id, msg.type, msg.content?.slice(0, 50));
                        } else {
                            // Update existing message with new content
                            const existingMsg = allMessages[existingIndex];
                            const oldContent = existingMsg.content;
                            allMessages[existingIndex] = msg; // Replace with updated message
                            updatedCount++;
                            console.log("🔍 [MESSAGES MERGE DEBUG] Updated existing message:", msg.id, msg.type, "old content:", oldContent?.slice(0, 50), "new content:", msg.content?.slice(0, 50));
                        }
                    });
                    
                    finalValues = { ...finalValues, messages: allMessages };
                    console.log("🔍 [MESSAGES MERGE DEBUG] Merged ALL cached messages:", cached.messages.length, "with current:", current.messages.length, "added:", addedCount, "updated:", updatedCount, "total:", allMessages.length);
                    console.log("🔍 [MESSAGES MERGE DEBUG] Final merged message content:", allMessages.map(m => ({
                        id: m.id,
                        type: m.type,
                        content: m.content?.slice(0, 100) || 'no content'
                    })));
                } else if (cached.messages) {
                    // Use cached messages if no current messages
                    finalValues = { ...finalValues, messages: cached.messages };
                    console.log("🔍 [MESSAGES MERGE DEBUG] Using cached messages (no current messages):", cached.messages.length);
                }
                
                // Always merge ALL cached UI widgets with current UI widgets
                if (cached.ui && current.ui) {
                    // Combine cached and current UI widgets, removing duplicates by ID
                    const allUI = [...cached.ui];
                    current.ui.forEach(widget => {
                        if (!allUI.find(existing => existing.id === widget.id)) {
                            allUI.push(widget);
                        }
                    });
                    finalValues = { ...finalValues, ui: allUI };
                    console.log("🔍 [MESSAGES MERGE DEBUG] Merged ALL cached UI widgets:", cached.ui.length, "with current:", current.ui.length, "total:", allUI.length);
                } else if (cached.ui) {
                    // Use cached UI widgets if no current UI widgets
                    finalValues = { ...finalValues, ui: cached.ui };
                    console.log("🔍 [MESSAGES MERGE DEBUG] Using cached UI widgets (no current UI widgets):", cached.ui.length);
                }
                
                // Preserve other cached values that might be missing in current
                Object.keys(cached).forEach(key => {
                    if (key !== 'messages' && key !== 'ui' && !(key in finalValues)) {
                        finalValues[key] = cached[key];
                        console.log("🔍 [MESSAGES MERGE DEBUG] Preserved cached value:", key);
                    }
                });
            } else if (cached && !streamValues) {
                // Use cached values if no current values
                finalValues = cached;
                console.log("🔍 [MESSAGES MERGE DEBUG] Using cached values (no current values)");
            }
            
            return getMessages(finalValues);
        },
        getMessagesMetadata(message, index) {
            trackStreamMode("messages-tuple", "values");
            return messageMetadata?.find((m) => m.messageId === (message.id ?? index));
        },
    };
} 