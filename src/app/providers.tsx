"use client";

import { ChakraProvider } from "@chakra-ui/react";
import sitecoreTheme from "@sitecore/blok-theme";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider theme={sitecoreTheme}>{children}</ChakraProvider>;
}