import { RagResult } from "@/types/voice";

interface RagResultsProps {
  results: RagResult[];
  onSelected: (result: RagResult) => void;
}

export default function RagResults({ results, onSelected }: RagResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium text-white/90">RAG Results:</h3>
      <div className="flex flex-wrap gap-2">
        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => onSelected(result)}
            className="rounded-md bg-green-500/20 border border-green-400/30 px-3 py-1 text-sm text-green-200 hover:bg-green-500/30 backdrop-blur-sm transition-colors"
          >
            {result.title}
          </button>
        ))}
      </div>
    </div>
  );
}
