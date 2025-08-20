import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationWarningIconProps {
  show: boolean;
  className?: string;
}

export const ValidationWarningIcon: React.FC<ValidationWarningIconProps> = ({
  show,
  className = "h-4 w-4"
}) => {
  if (!show) return null;
  return (
    <AlertCircle className={cn("text-red-500", className)} />
  );
};
