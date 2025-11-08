import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { BUTTON_SIZE_SM } from "../../constants";

interface ThreadItemEditingProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ThreadItemEditing({
  value,
  onChange,
  onSave,
  onCancel,
}: ThreadItemEditingProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-7 flex-1 text-sm"
        autoFocus
      />
      <Button
        size="icon"
        variant="ghost"
        className={BUTTON_SIZE_SM}
        onClick={onSave}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className={BUTTON_SIZE_SM}
        onClick={onCancel}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
