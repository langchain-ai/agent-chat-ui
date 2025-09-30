"use client";

import { ChakraProvider } from "@chakra-ui/react";
import sitecoreTheme, { toastOptions } from "@sitecore/blok-theme";
import { NuqsAdapter } from "nuqs/adapters/next/app";
// import sitecoreTheme, { toastOptions } from "@sitecore/blok-theme";
// import { ChakraProvider } from "@chakra-ui/react";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function BlokProvider({ children }: Props) {
  return (
    <ChakraProvider
      theme={sitecoreTheme}
      toastOptions={toastOptions}
    >
      <NuqsAdapter>{children}</NuqsAdapter>
    </ChakraProvider>
  );
}
