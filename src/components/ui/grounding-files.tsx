import { GroundingFile } from "@/types/voice";

interface GroundingFilesProps {
  files: GroundingFile[];
  onSelected: (file: GroundingFile) => void;
}

export function GroundingFiles({ files, onSelected }: GroundingFilesProps) {
  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium text-white/90">Grounding Files:</h3>
      <div className="flex flex-wrap gap-2">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => onSelected(file)}
            className="rounded-md bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-sm text-blue-200 hover:bg-blue-500/30 backdrop-blur-sm transition-colors"
          >
            {file.name}
          </button>
        ))}
      </div>
    </div>
  );
}
