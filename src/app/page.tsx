"use client";

import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { NonAgentFlowProvider } from "@/providers/NonAgentFlowContext";
import { TabProvider } from "@/providers/TabContext";
import { ItineraryWidgetProvider } from "@/providers/ItineraryWidgetContext";
import { LocationProvider } from "@/providers/LocationContext";
import { Toaster } from "@/components/ui/sonner";
import { ProtectedRoute } from "@/components/auth";
import React from "react";
import { TabsLayout } from "@/components/thread/TabsLayout";
import { Navbar } from "@/components/ui/Navbar";

export default function DemoPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <ProtectedRoute>
        <LocationProvider>
        <ThreadProvider>
          <StreamProvider>
            <ArtifactProvider>
              <NonAgentFlowProvider>
                <TabProvider>
                  <ItineraryWidgetProvider>
                    <div className="flex h-screen flex-col">
                      <div className="min-h-0 flex-1">
                        <TabsLayout />
                      </div>
                    </div>
                  </ItineraryWidgetProvider>
                </TabProvider>
              </NonAgentFlowProvider>
            </ArtifactProvider>
          </StreamProvider>
        </ThreadProvider>
        </LocationProvider>
      </ProtectedRoute>
    </React.Suspense>
  );
}
