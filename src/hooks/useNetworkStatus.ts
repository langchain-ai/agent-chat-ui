import { useEffect, useMemo, useRef, useState } from "react";

type NetworkStatusOptions = {
  pingUrl?: string;
  pingIntervalMs?: number;
  timeoutMs?: number;
};

export function useNetworkStatus(options: NetworkStatusOptions = {}) {
  const { pingIntervalMs = 10000, timeoutMs = 4000 } = options;
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [effectiveType, setEffectiveType] = useState<string | undefined>(
    typeof navigator !== "undefined" && (navigator as any).connection
      ? (navigator as any).connection.effectiveType
      : undefined,
  );
  const [rtt, setRtt] = useState<number | undefined>(
    typeof navigator !== "undefined" && (navigator as any).connection
      ? (navigator as any).connection.rtt
      : undefined,
  );
  const [downlink, setDownlink] = useState<number | undefined>(
    typeof navigator !== "undefined" && (navigator as any).connection
      ? (navigator as any).connection.downlink
      : undefined,
  );
  const [lastPingMs, setLastPingMs] = useState<number | undefined>(undefined);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const defaultPingUrl = useMemo(() => {
    const apiUrl =
      (process.env.NEXT_PUBLIC_API_URL as string | undefined) || "";
    if (options.pingUrl) return options.pingUrl;
    if (apiUrl) return apiUrl.replace(/\/$/, "") + "/info";
    // Same-origin lightweight asset
    return "/logo.svg";
  }, [options.pingUrl]);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const conn: any = (navigator as any).connection;
    function handleConnChange() {
      try {
        setEffectiveType(conn?.effectiveType);
        setRtt(typeof conn?.rtt === "number" ? conn.rtt : undefined);
        setDownlink(
          typeof conn?.downlink === "number" ? conn.downlink : undefined,
        );
      } catch {}
    }
    if (conn && typeof conn.addEventListener === "function") {
      conn.addEventListener("change", handleConnChange);
    }

    let intervalId: any;
    function startPinging() {
      if (intervalId) return;
      intervalId = setInterval(async () => {
        if (!online) return;
        const controller = new AbortController();
        const start = Date.now();
        const to = setTimeout(() => controller.abort(), timeoutMs);
        try {
          await fetch(defaultPingUrl, {
            method: "HEAD",
            cache: "no-store",
            mode: "no-cors",
            signal: controller.signal,
          });
          const ms = Date.now() - start;
          setLastPingMs(ms);
          setConsecutiveFailures(0);
        } catch {
          setConsecutiveFailures((p) => p + 1);
        } finally {
          clearTimeout(to);
        }
      }, pingIntervalMs);
    }

    if (online) startPinging();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (conn && typeof conn.removeEventListener === "function") {
        conn.removeEventListener("change", handleConnChange);
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [defaultPingUrl, online, pingIntervalMs, timeoutMs]);

  const isSlow = useMemo(() => {
    if (!online) return false;
    const byEffective = effectiveType ? /(^|-)2g/.test(effectiveType) : false;
    const byHighRtt = typeof rtt === "number" && rtt > 800; // ms
    const byPing = typeof lastPingMs === "number" && lastPingMs > 1500; // ms
    const byDownlink = typeof downlink === "number" && downlink < 0.8; // Mbps
    const byFailures = consecutiveFailures >= 2; // repeated ping failures
    return byEffective || byHighRtt || byPing || byDownlink || byFailures;
  }, [online, effectiveType, rtt, lastPingMs, downlink, consecutiveFailures]);

  return {
    online,
    isSlow,
    metrics: { effectiveType, rtt, downlink, lastPingMs, consecutiveFailures },
  };
}
