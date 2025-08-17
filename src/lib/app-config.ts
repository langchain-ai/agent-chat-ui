export const APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE || "Agent Chat";

export const ENABLE_FILE_UPLOAD = 
  process.env.NEXT_PUBLIC_ENABLE_FILE_UPLOAD?.toLowerCase() !== 'false';