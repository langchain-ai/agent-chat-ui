import { RagResult } from "@/types/voice";
import { Button } from "./button";
import { X } from "lucide-react";

interface RagResultViewProps {
  result: RagResult | null;
  onClosed: () => void;
}

export default function RagResultView({ result, onClosed }: RagResultViewProps) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{result.title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClosed}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="prose max-w-none">
          {result.source && (
            <p className="mb-4 text-sm text-gray-600">Source: {result.source}</p>
          )}
          <div className="text-sm">{result.content}</div>
        </div>
      </div>
    </div>
  );
}
