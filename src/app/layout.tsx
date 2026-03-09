import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { APP_TITLE } from "@/lib/app-config";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_TITLE,
  description: `${APP_TITLE} UX by LangChain`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
