import { useStreamContext } from "@/providers/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { getContentString } from "../utils";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { BranchSwitcher, CommandBar } from "./shared";
import { MultimodalPreview } from "@/components/thread/MultimodalPreview";
import { isBase64ContentBlock } from "@/lib/multimodal-utils";
import { getJwtToken, GetUserId } from "@/services/authService";
import { getCachedLocation } from "@/lib/location-cache";
import { v4 as uuidv4 } from "uuid";

function EditableContent({
  value,
  setValue,
  onSubmit,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-0"
    />
  );
}

export function HumanMessage({
  message,
  isLoading,
}: {
  message: Message;
  isLoading: boolean;
}) {
  const thread = useStreamContext();
  const meta = undefined as any;
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const contentString = getContentString(message.content);

  const handleSubmitEdit = async () => {
    setIsEditing(false);

    // Prune any cached messages/UI/interrupts that occur after this message
    try {
      if (
        (message as any)?.id &&
        typeof thread?.pruneAfterMessage === "function"
      ) {
        thread.pruneAfterMessage((message as any).id as string);
      }
    } catch {}

    // Get user ID from JWT token
    const jwtToken = getJwtToken();
    const userId = jwtToken ? GetUserId(jwtToken) : null;

    // Get location data from cache
    const locationData = await getCachedLocation();

    // Use a stable id so repeated values/events do not create duplicates
    const newMessage: Message = {
      id: (message as any)?.id ?? uuidv4(),
      type: "human",
      content: [{ type: "text", text: value }] as Message["content"],
    };

    // Include userId and location in the submission
    const submissionData: any = { messages: [newMessage] };
    if (userId) {
      submissionData.userId = userId;
    }
    if (locationData) {
      submissionData.userLocation = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp,
      };
    }

    thread.submit(submissionData, {
      checkpoint: parentCheckpoint,
      streamMode: ["updates"],
      streamSubgraphs: true,
      optimisticValues: undefined,
      metadata: {
        user_id: userId,
      },
    });
  };

  return (
    <div
      className={cn(
        "group ml-auto flex items-center gap-2",
        isEditing && "w-full max-w-xl",
      )}
    >
      <div className={cn("flex flex-col gap-2", isEditing && "w-full")}>
        {isEditing ? (
          <EditableContent
            value={value}
            setValue={setValue}
            onSubmit={handleSubmitEdit}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {/* Render images and files if no text */}
            {Array.isArray(message.content) && message.content.length > 0 && (
              <div className="flex flex-wrap items-end justify-end gap-2">
                {message.content.reduce<React.ReactNode[]>(
                  (acc, block, idx) => {
                    if (isBase64ContentBlock(block)) {
                      acc.push(
                        <MultimodalPreview
                          key={idx}
                          block={block}
                          size="md"
                        />,
                      );
                    }
                    return acc;
                  },
                  [],
                )}
              </div>
            )}
            {/* Render text if present, otherwise fallback to file/image name */}
            <p className="bg-muted ml-auto w-full max-w-[80vw] rounded-3xl px-4 py-2 text-right break-words whitespace-pre-wrap">
              {contentString}
            </p>
          </div>
        )}

        <div
          className={cn(
            "ml-auto flex items-center gap-2 transition-opacity",
            "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            isEditing && "opacity-100",
          )}
        >
          <BranchSwitcher
            branch={meta?.branch}
            branchOptions={meta?.branchOptions}
            onSelect={(branch) => thread.setBranch(branch)}
            isLoading={isLoading}
          />
          <CommandBar
            isLoading={isLoading}
            content={contentString}
            isEditing={isEditing}
            setIsEditing={(c) => {
              if (c) {
                setValue(contentString);
              }
              setIsEditing(c);
            }}
            handleSubmitEdit={handleSubmitEdit}
            isHumanMessage={true}
          />
        </div>
      </div>
    </div>
  );
}
