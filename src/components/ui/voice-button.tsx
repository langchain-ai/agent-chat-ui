// src/components/ui/voice-button.tsx
import React from 'react';
import { Button, ButtonProps } from './button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export interface VoiceButtonProps extends Omit<ButtonProps, 'onClick'> {
  isRecording: boolean;
  isTranscribing: boolean;
  onToggleRecording: () => void;
  disabled?: boolean;
}

export function VoiceButton({
  isRecording,
  isTranscribing,
  onToggleRecording,
  disabled = false,
  className,
  ...props
}: VoiceButtonProps) {
  const getTooltipText = () => {
    if (isTranscribing) return 'Transcribing...';
    if (isRecording) return 'Stop recording';
    return 'Start voice recording';
  };

  const getIcon = () => {
    if (isTranscribing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (isRecording) {
      return <MicOff className="h-4 w-4" />;
    }
    return <Mic className="h-4 w-4" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            onClick={onToggleRecording}
            disabled={disabled || isTranscribing}
            className={cn(
              "transition-all duration-200",
              isRecording && "animate-pulse bg-red-500 hover:bg-red-600",
              isTranscribing && "cursor-not-allowed",
              className
            )}
            {...props}
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}