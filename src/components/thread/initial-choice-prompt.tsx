import { v4 as uuidv4 } from "uuid";
import { Message } from "@langchain/langgraph-sdk";
import { useStreamContext } from "@/providers/Stream";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState, FormEvent } from "react";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { useArtifactContext } from "./artifact";
import { User } from "lucide-react";

export function InitialChoicePrompt() {
  const stream = useStreamContext();
  const [artifactContext] = useArtifactContext();
  const [patientId, setPatientId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!patientId.trim() || isSubmitting || stream.isLoading) return;

    setIsSubmitting(true);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [{ type: "text", text: `the patient id is: ${patientId.trim()}` }] as Message["content"],
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

    setPatientId("");
    setIsSubmitting(false);
  };

  return (
    <div className="flex w-full items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5" />
            Enter Patient ID
          </CardTitle>
          <CardDescription>
            Please enter the patient ID to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient-id">Patient ID</Label>
              <Input
                id="patient-id"
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter patient ID"
                disabled={isSubmitting || stream.isLoading}
                autoFocus
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!patientId.trim() || isSubmitting || stream.isLoading}
            >
              {isSubmitting || stream.isLoading ? "Submitting..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
