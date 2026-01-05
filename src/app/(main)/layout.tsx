"use client";

import React from "react";
import { Toaster } from "sonner";
import { AgentProvider } from "@/providers/Agent";
import { MainLayout } from "@/components/layout/main-layout";

export default function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <Toaster />
      <AgentProvider>
        <MainLayout>{children}</MainLayout>
      </AgentProvider>
    </React.Suspense>
  );
}
