import { useStreamContext } from "@/providers/Stream";
import { useThreads } from "@/providers/Thread";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { UI_TEXT } from "../constants";

/**
 * Custom hook for thread CRUD operations
 * Centralizes delete and update logic with error handling
 */
export function useThreadOperations() {
  const { client } = useStreamContext();
  const { getThreads, setThreads } = useThreads();
  const [threadId, setThreadId] = useQueryState("threadId");

  const deleteThread = async (threadIdToDelete: string) => {
    try {
      await client?.threads.delete(threadIdToDelete);
      toast.success(UI_TEXT.deleteSuccess);

      // Refresh threads list
      const updatedThreads = await getThreads();
      setThreads(updatedThreads);

      // If the deleted thread was active, reset the thread
      if (threadId === threadIdToDelete) {
        setThreadId(null);
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
      toast.error(UI_TEXT.deleteError);
    }
  };

  const updateThreadTitle = async (threadIdToUpdate: string, newTitle: string) => {
    try {
      // Update thread metadata with new title
      await client?.threads.update(threadIdToUpdate, {
        metadata: { title: newTitle },
      });
      toast.success(UI_TEXT.updateSuccess);

      // Refresh threads list
      const updatedThreads = await getThreads();
      setThreads(updatedThreads);
    } catch (error) {
      console.error("Error updating thread title:", error);
      toast.error(UI_TEXT.updateError);
    }
  };

  return {
    deleteThread,
    updateThreadTitle,
  };
}
