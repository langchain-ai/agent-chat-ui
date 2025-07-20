import { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import {
  InputAudioBufferAppendCommand,
  InputAudioBufferClearCommand,
  Message,
  ResponseAudioDelta,
  ResponseAudioTranscriptDelta,
  ResponseDone,
  SessionUpdateCommand,
  ExtensionMiddleTierToolResponse,
  ResponseInputAudioTranscriptionCompleted
} from "@/types/voice";

type Parameters = {
  useDirectAoaiApi?: boolean;
  aoaiEndpointOverride?: string;
  aoaiApiKeyOverride?: string;
  aoaiModelOverride?: string;
  enableInputAudioTranscription?: boolean;
  onWebSocketOpen?: () => void;
  onWebSocketClose?: () => void;
  onWebSocketError?: (event: Event) => void;
  onWebSocketMessage?: (event: MessageEvent<any>) => void;
  onReceivedResponseAudioDelta?: (message: ResponseAudioDelta) => void;
  onReceivedInputAudioBufferSpeechStarted?: (message: Message) => void;
  onReceivedResponseDone?: (message: ResponseDone) => void;
  onReceivedExtensionMiddleTierToolResponse?: (message: ExtensionMiddleTierToolResponse) => void;
  onReceivedResponseAudioTranscriptDelta?: (message: ResponseAudioTranscriptDelta) => void;
  onReceivedInputAudioTranscriptionCompleted?: (message: ResponseInputAudioTranscriptionCompleted) => void;
  onReceivedError?: (message: Message) => void;
};

export default function useRealTime({
  useDirectAoaiApi,
  aoaiEndpointOverride,
  aoaiApiKeyOverride,
  aoaiModelOverride,
  enableInputAudioTranscription,
  onWebSocketOpen,
  onWebSocketClose,
  onWebSocketError,
  onWebSocketMessage,
  onReceivedResponseDone,
  onReceivedResponseAudioDelta,
  onReceivedResponseAudioTranscriptDelta,
  onReceivedInputAudioBufferSpeechStarted,
  onReceivedExtensionMiddleTierToolResponse,
  onReceivedInputAudioTranscriptionCompleted,
  onReceivedError
}: Parameters) {
  
  const wsUrl = useDirectAoaiApi 
    ? `${aoaiEndpointOverride}/openai/realtime?api-version=2024-10-01-preview`
    : "ws://localhost:8765/realtime";

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    wsUrl,
    {
      onOpen: onWebSocketOpen,
      onClose: onWebSocketClose,
      onError: onWebSocketError,
      onMessage: onWebSocketMessage,
      shouldReconnect: () => true,
      protocols: useDirectAoaiApi ? ['realtime', `realtime-${aoaiApiKeyOverride}`] : undefined
    }
  );

  // Handle incoming messages with useEffect to avoid dependency issues
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data);
        
        switch (message.type) {
          case "response.audio.delta":
            onReceivedResponseAudioDelta?.(message);
            break;
          case "input_audio_buffer.speech_started":
            onReceivedInputAudioBufferSpeechStarted?.(message);
            break;
          case "response.done":
            onReceivedResponseDone?.(message);
            break;
          case "extension.middle_tier_tool_response":
            onReceivedExtensionMiddleTierToolResponse?.(message);
            break;
          case "response.audio_transcript.delta":
            onReceivedResponseAudioTranscriptDelta?.(message);
            break;
          case "conversation.item.input_audio_transcription.completed":
            onReceivedInputAudioTranscriptionCompleted?.(message);
            break;
          case "error":
            onReceivedError?.(message);
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }
  }, [lastMessage, onReceivedResponseAudioDelta, onReceivedInputAudioBufferSpeechStarted, onReceivedResponseDone, onReceivedExtensionMiddleTierToolResponse, onReceivedResponseAudioTranscriptDelta, onReceivedInputAudioTranscriptionCompleted, onReceivedError]);

  const startSession = () => {
    const sessionUpdate: SessionUpdateCommand = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: "You are a helpful assistant.",
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: enableInputAudioTranscription ? {
          model: "whisper-1"
        } : undefined,
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200
        },
        temperature: 0.8,
        max_response_output_tokens: 4096
      }
    };

    sendMessage(JSON.stringify(sessionUpdate));
  };

  const addUserAudio = (audioData: string) => {
    const command: InputAudioBufferAppendCommand = {
      type: "input_audio_buffer.append",
      audio: audioData
    };
    sendMessage(JSON.stringify(command));
  };

  const inputAudioBufferClear = () => {
    const command: InputAudioBufferClearCommand = {
      type: "input_audio_buffer.clear"
    };
    sendMessage(JSON.stringify(command));
  };

  return {
    startSession,
    addUserAudio,
    inputAudioBufferClear,
    readyState
  };
}
