"use client";

import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TemplatesButton() {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50"
      onClick={() => {
        // Placeholder - no functionality yet
      }}
    >
      <LayoutGrid className="size-4" />
      <span className="text-sm font-medium">Templates</span>
    </Button>
  );
}
