// src/utils/submitInterruptResponse.ts

import { toast } from "sonner";

/**
 * Submit a response to resume an interrupt.
 * @param thread The stream context thread instance
 * @param type The type of the response, e.g. "response", "formData", etc.
 * @param args The data to send as arguments with the response.
 */
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
