// src/utils/submitInterruptResponse.ts

import { toast } from "sonner";
export async function submitInterruptResponse(
  thread: any, // Replace with proper type from your stream context
  type: string,
  data: Record<string, any>,
): Promise<void> {
  try {
    await thread.submit(
      {},
      {
        command: {
          resume: [
            {
              type,
              data,
            },
          ],
        },
      },
    );
  } catch (error) {
    console.error("Error submitting response:", error);
    toast.error("Error", {
      description: "Failed to submit response.",
      richColors: true,
      closeButton: true,
      duration: 5000,
    });
    throw error; // rethrow if the calling function needs to handle it
  }
}
