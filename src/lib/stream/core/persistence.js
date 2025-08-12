/* eslint-disable */

const STORAGE_KEY = "langgraph-stream-cache";
const MAX_THREADS = 50;

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export class Persistence {
  constructor() {}

  loadAll() {
    if (typeof window === "undefined") return { threads: {}, schemaVersion: 2 };
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? safeParse(raw) : null;
    if (!parsed || typeof parsed !== "object") return { threads: {}, schemaVersion: 2 };
    const { threads = {}, schemaVersion = 2 } = parsed;
    return { threads, schemaVersion };
  }

  saveThread(threadId, snapshot) {
    if (typeof window === "undefined") return;
    const current = this.loadAll();
    current.threads[threadId] = {
      blocks: snapshot.blocks ?? [],
      lastUpdatedAt: snapshot.lastUpdatedAt ?? Date.now(),
    };
    this._prune(current);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...current, schemaVersion: 2 })
      );
    } catch (e) {
      console.warn("[PERSIST] failed to save cache", e);
    }
  }

  _prune(current) {
    const entries = Object.entries(current.threads);
    if (entries.length <= MAX_THREADS) return;
    entries.sort((a, b) => (a[1].lastUpdatedAt ?? 0) - (b[1].lastUpdatedAt ?? 0));
    const toDelete = entries.slice(0, entries.length - MAX_THREADS);
    for (const [id] of toDelete) delete current.threads[id];
  }
} 