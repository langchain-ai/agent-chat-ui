"use client";

import { ThreadContent } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";

export default function HomePage() {
  return (
    <ThreadProvider>
      <StreamProvider>
        <ArtifactProvider>
          <ThreadContent />
        </ArtifactProvider>
      </StreamProvider>
    </ThreadProvider>
  );
}
