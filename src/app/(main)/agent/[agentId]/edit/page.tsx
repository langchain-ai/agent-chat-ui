"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { AgentEditProvider, useAgentEdit } from "@/providers/AgentEdit";
import {
  EditHeader,
  InstructionsEditor,
  Toolbox,
  TestChat,
} from "@/components/agent-edit";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function EditPageContent() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.agentId as string;
  const { isLoading, error } = useAgentEdit();

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-white dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">{error}</p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-900">
      <EditHeader agentId={agentId} />

      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0">
        {/* Left Panel: Editor */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <ResizablePanelGroup orientation="vertical">
            {/* Instructions Section */}
            <ResizablePanel defaultSize={60} minSize={20}>
              <div className="h-full overflow-auto border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <InstructionsEditor />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Toolbox Section */}
            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="h-full overflow-auto border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <Toolbox />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Test Chat */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full bg-white dark:bg-black">
            <TestChat />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default function AgentEditPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  return (
    <AgentEditProvider agentId={agentId}>
      <EditPageContent />
    </AgentEditProvider>
  );
}
