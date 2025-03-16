export function getAccessToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("lg:chat:accessToken") ?? null;
  } catch {
    // no-op
  }

  return null;
}

export function setAccessToken(token: string | null) {
  try {
    if (typeof window === "undefined") return;
    if (token === null) {
      window.localStorage.removeItem("lg:chat:accessToken");
    } else {
      window.localStorage.setItem("lg:chat:accessToken", token);
    }
  } catch {
    // no-op
  }
}

// Keeping for backward compatibility
export function getApiKey(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("lg:chat:apiKey") ?? null;
  } catch {
    // no-op
  }

  return null;
}

export function setApiKey(key: string | null) {
  try {
    if (typeof window === "undefined") return;
    if (key === null) {
      window.localStorage.removeItem("lg:chat:apiKey");
    } else {
      window.localStorage.setItem("lg:chat:apiKey", key);
    }
  } catch {
    // no-op
  }
}
