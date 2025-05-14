// 伺服器配置
// 這裡配置需要監控的Cloud Run服務的URL
export const serverConfig = {
  // 伺服器URL列表，這些URL將被定期檢查
  serverUrls: [
    // LangGraph API URL
    process.env.NEXT_PUBLIC_API_URL || "",
    // GSTUDIO API URL
    process.env.GSTUDIO_API || "",
  ].filter(Boolean), // 過濾掉空字串

  // 檢查間隔，單位為毫秒，預設為3分鐘
  checkInterval: 3 * 60 * 1000,

  // 重試間隔，單位為毫秒，預設為5秒
  retryInterval: 5 * 1000,
};
