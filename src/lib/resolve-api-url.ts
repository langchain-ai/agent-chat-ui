export function resolveApiUrl(queryApiUrl: string, envApiUrl?: string): string {
  return envApiUrl || queryApiUrl;
}
