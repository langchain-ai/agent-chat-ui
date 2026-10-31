const API_KEY_STORAGE_KEY = "lg:chat:apiKey";
const API_KEY_HOST_STORAGE_KEY = "lg:chat:apiKeyHost";

function originOf(apiUrl: string): string | null {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return null;
  }
}

export function getApiKey(apiUrl: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    const storedHost = window.localStorage.getItem(API_KEY_HOST_STORAGE_KEY);
    const currentHost = originOf(apiUrl);
    if (!storedHost || !currentHost || storedHost !== currentHost) {
      return null;
    }
    return window.localStorage.getItem(API_KEY_STORAGE_KEY) ?? null;
  } catch {
    // no-op
  }

  return null;
}

export function setApiKey(apiUrl: string, apiKey: string): void {
  const host = originOf(apiUrl);
  if (typeof window === "undefined" || !host) return;
  window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  window.localStorage.setItem(API_KEY_HOST_STORAGE_KEY, host);
}
