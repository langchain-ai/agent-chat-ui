"use client";

import { FC, ReactNode } from "react";
import {
  CircleAlert,
  Download,
  ExternalLink,
  File as FileIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MarkdownText } from "@/components/thread/markdown-text";
import { SyntaxHighlighter } from "@/components/thread/syntax-highlighter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArtifactChartSeries,
  ArtifactPayload,
  isSafeMediaUrl,
  isSafeUrl,
  normalizeArtifactPayload,
} from "./types";

const CHART_COLORS = ["#2F6868", "#4f46e5", "#d97706", "#dc2626", "#059669"];

const HIGHLIGHT_LANGUAGES: Record<string, string> = {
  js: "js",
  jsx: "jsx",
  ts: "ts",
  tsx: "tsx",
  python: "python",
  javascript: "js",
  typescript: "ts",
  py: "python",
  mjs: "js",
  cjs: "js",
};

function renderScalar(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Section(props: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 p-4", props.className)}>
      {props.children}
    </div>
  );
}

function Description({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="text-muted-foreground text-sm">{text}</p>;
}

function FallbackArtifact({ payload }: { payload: ArtifactPayload }) {
  return (
    <Section>
      <div className="flex items-center gap-2 text-sm font-medium">
        <CircleAlert className="size-4" />
        Unable to render this artifact
      </div>
      <p className="text-muted-foreground text-sm">
        The payload is missing or malformed. Raw contents:
      </p>
      <pre className="bg-muted max-h-96 overflow-auto rounded-md p-4 text-xs break-all whitespace-pre-wrap">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </Section>
  );
}

function MarkdownArtifact({ payload }: { payload: ArtifactPayload }) {
  if (!payload.content) return <FallbackArtifact payload={payload} />;
  return (
    <Section>
      <Description text={payload.description} />
      <MarkdownText>{payload.content}</MarkdownText>
    </Section>
  );
}

function HtmlArtifact({ payload }: { payload: ArtifactPayload }) {
  if (!payload.content) return <FallbackArtifact payload={payload} />;
  return (
    <Section className="h-full p-0">
      <iframe
        sandbox=""
        srcDoc={payload.content}
        title={payload.title ?? "HTML artifact"}
        className="min-h-[70vh] w-full flex-grow rounded-md border bg-white"
      />
    </Section>
  );
}

function TextArtifact({ payload }: { payload: ArtifactPayload }) {
  if (payload.content == null) return <FallbackArtifact payload={payload} />;
  return (
    <Section>
      <Description text={payload.description} />
      <p className="text-sm break-words whitespace-pre-wrap">
        {payload.content}
      </p>
    </Section>
  );
}

function CodeArtifact({ payload }: { payload: ArtifactPayload }) {
  if (payload.content == null) return <FallbackArtifact payload={payload} />;

  const requested = (payload.language ?? "").toLowerCase();
  const language = HIGHLIGHT_LANGUAGES[requested];

  return (
    <Section className="p-0">
      {payload.description && <Description text={payload.description} />}
      {language ? (
        <div className="overflow-x-auto rounded-lg bg-zinc-900 text-white">
          <SyntaxHighlighter language={language}>
            {payload.content}
          </SyntaxHighlighter>
        </div>
      ) : (
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-white">
          <code>{payload.content}</code>
        </pre>
      )}
    </Section>
  );
}

function MissingUrl({ payload }: { payload: ArtifactPayload }) {
  return (
    <Section>
      <div className="flex items-center gap-2 text-sm font-medium">
        <CircleAlert className="size-4" />
        No renderable URL was provided for this artifact.
      </div>
    </Section>
  );
}

function ImageArtifact({ payload }: { payload: ArtifactPayload }) {
  if (!isSafeMediaUrl(payload.url)) return <MissingUrl payload={payload} />;
  return (
    <Section>
      <Description text={payload.description} />
      <img
        src={payload.url}
        alt={payload.title ?? payload.fileName ?? "Artifact image"}
        className="max-h-[80vh] w-auto max-w-full rounded-md border object-contain"
      />
    </Section>
  );
}

function AudioArtifact({ payload }: { payload: ArtifactPayload }) {
  if (!isSafeMediaUrl(payload.url)) return <MissingUrl payload={payload} />;
  return (
    <Section>
      <Description text={payload.description} />
      <audio
        controls
        preload="metadata"
        src={payload.url}
        className="w-full"
      />
    </Section>
  );
}

function VideoArtifact({ payload }: { payload: ArtifactPayload }) {
  if (!isSafeMediaUrl(payload.url)) return <MissingUrl payload={payload} />;
  return (
    <Section>
      <Description text={payload.description} />
      <video
        controls
        preload="metadata"
        src={payload.url}
        className="max-h-[80vh] w-full rounded-md border"
      />
    </Section>
  );
}

function PdfArtifact({ payload }: { payload: ArtifactPayload }) {
  if (!isSafeUrl(payload.url)) return <MissingUrl payload={payload} />;
  const name = payload.fileName ?? payload.title ?? "document.pdf";
  return (
    <Section className="h-full">
      <Description text={payload.description} />
      <iframe
        src={payload.url}
        title={payload.title ?? name}
        className="min-h-[70vh] w-full flex-grow rounded-md border"
      />
      <div>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a
            href={payload.url}
            download={name}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download />
            Download {name}
          </a>
        </Button>
      </div>
    </Section>
  );
}

function FileArtifact({ payload }: { payload: ArtifactPayload }) {
  const name = payload.fileName ?? payload.title ?? "file";
  return (
    <Section>
      <Description text={payload.description} />
      <div className="flex items-center gap-3 rounded-lg border p-4">
        <FileIcon className="text-muted-foreground size-8 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{name}</span>
          {payload.mimeType && (
            <span className="text-muted-foreground text-xs">
              {payload.mimeType}
            </span>
          )}
        </div>
        {isSafeUrl(payload.url) && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            asChild
          >
            <a
              href={payload.url}
              download={name}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download />
              Download
            </a>
          </Button>
        )}
      </div>
    </Section>
  );
}

function LinkArtifact({ payload }: { payload: ArtifactPayload }) {
  if (!isSafeUrl(payload.url)) return <MissingUrl payload={payload} />;
  return (
    <Section>
      <Description text={payload.description} />
      <a
        href={payload.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group hover:bg-accent flex items-center gap-3 rounded-lg border p-4 transition-colors"
      >
        <ExternalLink className="text-muted-foreground size-5 shrink-0" />
        <span className="text-primary truncate text-sm font-medium underline-offset-4 group-hover:underline">
          {payload.title ?? payload.url}
        </span>
      </a>
    </Section>
  );
}

function JsonArtifact({ payload }: { payload: ArtifactPayload }) {
  let value = payload.data;
  if (value === undefined && payload.content != null) {
    try {
      value = JSON.parse(payload.content);
    } catch {
      value = payload.content;
    }
  }
  if (value === undefined) return <FallbackArtifact payload={payload} />;

  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <Section>
      <Description text={payload.description} />
      <pre className="bg-muted overflow-auto rounded-md p-4 text-xs break-all whitespace-pre-wrap">
        {text}
      </pre>
    </Section>
  );
}

function TableArtifact({ payload }: { payload: ArtifactPayload }) {
  const rows = Array.isArray(payload.data)
    ? payload.data.filter(
        (row): row is Record<string, unknown> =>
          typeof row === "object" && row !== null && !Array.isArray(row),
      )
    : [];

  if (!rows.length) return <FallbackArtifact payload={payload} />;

  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }

  return (
    <Section>
      <Description text={payload.description} />
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="bg-muted px-4 py-2 text-left font-bold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td
                    key={column}
                    className="border-t px-4 py-2 text-left align-top break-words"
                  >
                    {renderScalar(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function ChartArtifact({ payload }: { payload: ArtifactPayload }) {
  const rows = Array.isArray(payload.data)
    ? payload.data.filter(
        (row): row is Record<string, unknown> =>
          typeof row === "object" && row !== null && !Array.isArray(row),
      )
    : [];

  if (!rows.length) return <FallbackArtifact payload={payload} />;

  const keys = Object.keys(rows[0]);
  const xKey =
    payload.chart?.xKey && keys.includes(payload.chart.xKey)
      ? payload.chart.xKey
      : keys[0];

  const series: ArtifactChartSeries[] =
    payload.chart?.series?.filter((s) => keys.includes(s.key)) ??
    keys
      .filter((key) => key !== xKey)
      .filter((key) => rows.some((row) => typeof row[key] === "number"))
      .map((key) => ({ key }));

  if (!series.length) return <FallbackArtifact payload={payload} />;

  const kind = payload.chart?.kind ?? "line";
  const seriesColors = series.map(
    (s, index) => s.color ?? CHART_COLORS[index % CHART_COLORS.length],
  );

  const shared = (
    <>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
    </>
  );

  return (
    <Section>
      <Description text={payload.description} />
      <div className="h-72 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          {kind === "bar" ? (
            <BarChart data={rows}>
              {shared}
              {series.map((s, index) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label ?? s.key}
                  fill={seriesColors[index]}
                />
              ))}
            </BarChart>
          ) : kind === "area" ? (
            <AreaChart data={rows}>
              {shared}
              {series.map((s, index) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label ?? s.key}
                  stroke={seriesColors[index]}
                  fill={seriesColors[index]}
                  fillOpacity={0.2}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={rows}>
              {shared}
              {series.map((s, index) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label ?? s.key}
                  stroke={seriesColors[index]}
                  dot={false}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Section>
  );
}

export const ArtifactRenderer: FC<{ artifact: unknown }> = ({ artifact }) => {
  const payload = normalizeArtifactPayload(artifact);

  switch (payload.type) {
    case "markdown":
      return <MarkdownArtifact payload={payload} />;
    case "html":
      return <HtmlArtifact payload={payload} />;
    case "text":
      return <TextArtifact payload={payload} />;
    case "code":
      return <CodeArtifact payload={payload} />;
    case "image":
      return <ImageArtifact payload={payload} />;
    case "audio":
      return <AudioArtifact payload={payload} />;
    case "video":
      return <VideoArtifact payload={payload} />;
    case "pdf":
      return <PdfArtifact payload={payload} />;
    case "file":
      return <FileArtifact payload={payload} />;
    case "link":
      return <LinkArtifact payload={payload} />;
    case "json":
      return <JsonArtifact payload={payload} />;
    case "table":
      return <TableArtifact payload={payload} />;
    case "chart":
      return <ChartArtifact payload={payload} />;
    default:
      return <FallbackArtifact payload={payload} />;
  }
};
