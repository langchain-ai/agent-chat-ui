import { UIConfigProvider } from "@/lib/ui-config-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agent Inbox",
  description: "Agent Inbox UX by LangChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UIConfigProvider>
      <html lang="en">
        <body className={inter.className}>
          <NuqsAdapter>{children}</NuqsAdapter>
        </body>
      </html>
    </UIConfigProvider>
  );
}
