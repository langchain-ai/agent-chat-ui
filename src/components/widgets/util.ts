// src/utils/submitInterruptResponse.ts

import { toast } from "sonner";
import { getJwtToken, GetUserId } from "@/services/authService";

export async function submitInterruptResponse(
  thread: any, // Replace with proper type from your stream context
  type: string,
  data: Record<string, any>,
): Promise<void> {
  try {
    // Get user ID from JWT token
    const jwtToken = getJwtToken();
    const userId = jwtToken ? GetUserId(jwtToken) : null;

    await thread.submit(
      { userId },
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
