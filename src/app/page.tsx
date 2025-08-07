"use client";

import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { NonAgentFlowProvider } from "@/providers/NonAgentFlowContext";
import { Toaster } from "@/components/ui/sonner";
import { ProtectedRoute } from "@/components/auth";
import React, { useState } from "react";
import { TabsLayout } from "@/components/thread/TabsLayout";

export default function DemoPage(): React.ReactNode {

  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <ProtectedRoute>
        <ThreadProvider>
          <StreamProvider>
            <ArtifactProvider>
              <NonAgentFlowProvider>
                <div className="flex flex-col h-screen">
                  <div className="flex-1 min-h-0">
                    <TabsLayout/>
                  </div>
                </div>
              </NonAgentFlowProvider>
            </ArtifactProvider>
          </StreamProvider>
        </ThreadProvider>
      </ProtectedRoute>
    </React.Suspense>
  );
}
