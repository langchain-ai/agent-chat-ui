import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_CLIENT_NAME === "daikin" 
    ? "Reflexion | Daikin" 
    : process.env.NEXT_PUBLIC_CLIENT_NAME === "umn-morris"
    ? "Reflexion | UMN Morris"
    : "Reflexion Agent",
  description: "Advanced Agentic Coding Environment",
};

import { BrandingProvider } from "@/providers/Branding";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { ThreadProvider } from "@/providers/Thread";
import { StreamProvider } from "@/providers/Stream";
import { ArtifactProvider } from "@/components/thread/artifact";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { OtelInit } from "@/components/otel-init";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <OtelInit />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <NextAuthProvider>
            <BrandingProvider>
              <React.Suspense fallback={<></>}>
                <NuqsAdapter>
                  <TooltipProvider>
                    <Toaster />
                    <ErrorBoundary>
                      <ThreadProvider>
                        <StreamProvider>
                          <ArtifactProvider>
                            {children}
                          </ArtifactProvider>
                        </StreamProvider>
                      </ThreadProvider>
                    </ErrorBoundary>
                  </TooltipProvider>
                </NuqsAdapter>
              </React.Suspense>
            </BrandingProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
