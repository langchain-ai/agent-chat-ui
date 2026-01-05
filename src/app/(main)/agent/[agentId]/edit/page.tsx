"use client";

import { useParams, useRouter } from "next/navigation";
import { AgentEditProvider, useAgentEdit } from "@/providers/AgentEdit";
import {
  EditHeader,
  InstructionsEditor,
  Toolbox,
  Middlewares,
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

      <div className="flex flex-1 min-h-0">
        {/* Left Panel: 50% */}
        <div className="flex w-1/2 flex-col border-r border-gray-200 dark:border-gray-700">
          {/* Instructions: flex-grow, 스크롤 가능 */}
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-white dark:bg-gray-900">
            <InstructionsEditor />
          </div>

          {/* Toolbox + Middlewares: 고정 높이, 좌우 배치 */}
          <div className="flex h-[320px] shrink-0 border-t border-gray-200 dark:border-gray-700">
            <div className="w-1/2 overflow-auto border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <Toolbox />
            </div>
            <div className="w-1/2 overflow-auto bg-white dark:bg-gray-900">
              <Middlewares />
            </div>
          </div>
        </div>

        {/* Right Panel: 50% - TestChat */}
        <div className="w-1/2 bg-white dark:bg-black">
          <TestChat />
        </div>
      </div>
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
