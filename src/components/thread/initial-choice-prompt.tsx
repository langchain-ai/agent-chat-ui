import { v4 as uuidv4 } from "uuid";
import { Message } from "@langchain/langgraph-sdk";
import { useStreamContext } from "@/providers/Stream";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Video, RefreshCw } from "lucide-react";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { useArtifactContext } from "./artifact";

export function InitialChoicePrompt() {
  const stream = useStreamContext();
  const [artifactContext] = useArtifactContext();

  const handleChoice = (choice: "create" | "refine") => {
    const messageText = choice === "create" 
      ? "I would like to create a new video."
      : "I would like to refine a previous video.";

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [{ type: "text", text: messageText }] as Message["content"],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], context },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          context,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );
  };

  return (
    <div className="flex w-full items-center justify-center py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl">What would you like to do?</CardTitle>
          <CardDescription>
            Choose an option to get started with your video generation agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              onClick={() => handleChoice("create")}
              variant="default"
              size="lg"
              className="flex-1 flex-col h-auto py-6 gap-3"
              disabled={stream.isLoading}
            >
              <Video className="h-6 w-6" />
              <span className="text-base font-semibold">Create a New Video</span>
              <span className="text-sm font-normal opacity-90">
                Start from scratch with a new video project
              </span>
            </Button>
            <Button
              onClick={() => handleChoice("refine")}
              variant="outline"
              size="lg"
              className="flex-1 flex-col h-auto py-6 gap-3"
              disabled={stream.isLoading}
            >
              <RefreshCw className="h-6 w-6" />
              <span className="text-base font-semibold">Refine a Previous Video</span>
              <span className="text-sm font-normal opacity-90">
                Improve or modify an existing video
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
