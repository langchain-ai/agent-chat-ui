/**
 * Payload contract for the generic `artifact` UI message.
 *
 * Python agents emit it with:
 *   push_ui_message("artifact", payload, message=ai_message)
 *
 * All fields are optional so malformed payloads can still be handled
 * gracefully by the renderer, but `type` should always be provided.
 */
export type ArtifactType =
  | "markdown"
  | "html"
  | "text"
  | "code"
  | "image"
  | "audio"
  | "video"
  | "pdf"
  | "file"
  | "link"
  | "json"
  | "table"
  | "chart";

export type ArtifactChartKind = "line" | "bar" | "area";

export interface ArtifactChartSeries {
  /** Key of the numeric value in each data record. */
  key: string;
  /** Optional label used for the legend / tooltip. */
  label?: string;
  /** Optional CSS color for this series. */
  color?: string;
}

export interface ArtifactChartConfig {
  /** Chart variant. Defaults to "line". */
  kind?: ArtifactChartKind;
  /** Key of the x-axis value in each data record. Defaults to the first key. */
  xKey?: string;
  /** Series to plot. Defaults to every numeric key except `xKey`. */
  series?: ArtifactChartSeries[];
}

export interface ArtifactPayload {
  /** Discriminator used by the renderer. */
  type?: ArtifactType;
  /** Human readable title shown in the card and the side panel. */
  title?: string;
  /** Short description shown in the card. */
  description?: string;
  /** Text content for markdown, text, code and json artifacts. */
  content?: string;
  /** Remote URL for image, audio, video, pdf, file and link artifacts. */
  url?: string;
  /** Structured data for json, table (array of records) and chart artifacts. */
  data?: unknown;
  /** MIME type hint, e.g. "application/pdf". */
  mimeType?: string;
  /** Displayed file name for file/pdf artifacts. */
  fileName?: string;
  /** Language hint for code artifacts, e.g. "python". */
  language?: string;
  /** Chart configuration for chart artifacts. */
  chart?: ArtifactChartConfig;
}

const ARTIFACT_TYPES: readonly string[] = [
  "markdown",
  "html",
  "text",
  "code",
  "image",
  "audio",
  "video",
  "pdf",
  "file",
  "link",
  "json",
  "table",
  "chart",
];

export function isArtifactType(value: unknown): value is ArtifactType {
  return typeof value === "string" && ARTIFACT_TYPES.includes(value);
}

/**
 * Coerces an arbitrary UI message props object into a best-effort
 * ArtifactPayload. Never throws; unknown fields are ignored.
 */
export function normalizeArtifactPayload(value: unknown): ArtifactPayload {
  if (typeof value !== "object" || value === null) {
    return { type: "json", data: value };
  }

  const raw = value as Record<string, unknown>;
  const payload: ArtifactPayload = {
    type: isArtifactType(raw.type) ? raw.type : undefined,
    title: typeof raw.title === "string" ? raw.title : undefined,
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    content: typeof raw.content === "string" ? raw.content : undefined,
    url: typeof raw.url === "string" ? raw.url : undefined,
    data: raw.data,
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : undefined,
    fileName: typeof raw.fileName === "string" ? raw.fileName : undefined,
    language: typeof raw.language === "string" ? raw.language : undefined,
    chart:
      typeof raw.chart === "object" && raw.chart !== null
        ? (raw.chart as ArtifactChartConfig)
        : undefined,
  };

  if (!payload.type) {
    if (Array.isArray(payload.data)) {
      payload.type = "table";
    } else if (payload.url) {
      payload.type = "link";
    } else if (payload.content) {
      payload.type = "markdown";
    } else {
      payload.type = "json";
    }
  }

  return payload;
}

/** Only allow URLs that are safe to navigate to or embed. */
export function isSafeUrl(url: string | undefined): url is string {
  if (!url) return false;
  if (url.startsWith("/") || url.startsWith("#")) return true;
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:", "blob:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/** Allows data URLs in addition to isSafeUrl, for inline media payloads. */
export function isSafeMediaUrl(url: string | undefined): url is string {
  if (!url) return false;
  if (
    url.startsWith("data:image/") ||
    url.startsWith("data:audio/") ||
    url.startsWith("data:video/")
  ) {
    return true;
  }
  return isSafeUrl(url);
}
