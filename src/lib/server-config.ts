export const serverConfig = {
  serverUrls: [
    process.env.NEXT_PUBLIC_API_URL || "",
    process.env.GSTUDIO_API || "",
  ].filter(Boolean),

  checkInterval: 3 * 60 * 1000,
  retryInterval: 5 * 1000,
};
