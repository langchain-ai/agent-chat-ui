/* eslint-disable */

const DEFAULT_TIMEOUT_MS = 5000;

export class ThreadActor {
  constructor({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    this.chains = new Map();
    this.lastStartedAt = new Map();
    this.timeoutMs = timeoutMs;
  }

  enqueue(threadId, op) {
    const current = this.chains.get(threadId) ?? Promise.resolve();
    const next = current
      .then(async () => {
        this.lastStartedAt.set(threadId, Date.now());
        await op();
      })
      .catch((err) => {
        console.warn("[ACTOR] op failed", threadId, err);
      })
      .finally(() => {
        this.lastStartedAt.delete(threadId);
      });

    this.chains.set(threadId, next);
    this._armWatchdog(threadId);
  }

  async flush(threadId) {
    const chain = this.chains.get(threadId);
    if (chain) await chain;
  }

  reset(threadId) {
    this.chains.set(threadId, Promise.resolve());
    this.lastStartedAt.delete(threadId);
  }

  _armWatchdog(threadId) {
    const startedAt = this.lastStartedAt.get(threadId);
    if (!startedAt) return;

    setTimeout(() => {
      const stillRunning = this.lastStartedAt.get(threadId);
      if (stillRunning && Date.now() - stillRunning >= this.timeoutMs) {
        console.warn("[ACTOR] watchdog timeout, resetting chain", threadId);
        this.reset(threadId);
      }
    }, this.timeoutMs + 10);
  }
} 