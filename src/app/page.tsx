"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { AgentProvider } from "@/providers/Agent";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

export default function DemoPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <AgentProvider>
        <ThreadProvider>
          <StreamProvider>
            <ArtifactProvider>
              <Thread />
            </ArtifactProvider>
          </StreamProvider>
        </ThreadProvider>
      </AgentProvider>
    </React.Suspense>
  );
}
