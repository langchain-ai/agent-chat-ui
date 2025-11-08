// Sidebar dimensions
export const SIDEBAR_WIDTH = 300;

// Thread display settings
export const MAX_THREAD_TITLE_LENGTH = 16;
export const SKELETON_LOADING_COUNT = 30;

// Styling constants
export const SCROLLBAR_STYLES =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent";

export const THREAD_ITEM_PADDING = "px-3 py-2";
export const ICON_SIZE_SM = "size-5";
export const BUTTON_SIZE_SM = "h-7 w-7";

// UI Text (Korean)
export const UI_TEXT = {
  newChat: "새 채팅",
  rename: "이름 바꾸기",
  delete: "삭제",
  deleteConfirm: "Are you sure you want to delete this conversation?",
  deleteSuccess: "Conversation deleted successfully",
  deleteError: "Failed to delete conversation",
  updateSuccess: "Conversation title updated",
  updateError: "Failed to update title",
} as const;
