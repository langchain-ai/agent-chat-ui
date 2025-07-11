export interface GroundingFile {
  id: string;
  name: string;
  content: string;
}

export interface RagResult {
  id: string;
  title: string;
  content: string;
  source?: string;
}

export interface ToolResult {
  sources: Array<{
    chunk_id: string;
    title: string;
    chunk: string;
  }>;
}

// WebSocket message types
export interface Message {
  type: string;
  [key: string]: any;
}

export interface ResponseAudioDelta {
  delta: string;
}

export interface ResponseAudioTranscriptDelta {
  delta: string;
}

export interface ResponseDone {
  status: string;
}

export interface ExtensionMiddleTierToolResponse {
  tool_name: string;
  tool_result: string;
}

export interface ResponseInputAudioTranscriptionCompleted {
  transcript: string;
}

export interface InputAudioBufferAppendCommand {
  type: "input_audio_buffer.append";
  audio: string;
}

export interface InputAudioBufferClearCommand {
  type: "input_audio_buffer.clear";
}

export interface SessionUpdateCommand {
  type: "session.update";
  session: {
    modalities: string[];
    instructions: string;
    voice: string;
    input_audio_format: string;
    output_audio_format: string;
    input_audio_transcription?: {
      model: string;
    };
    turn_detection?: {
      type: string;
      threshold: number;
      prefix_padding_ms: number;
      silence_duration_ms: number;
    };
    tools?: any[];
    tool_choice?: string;
    temperature?: number;
    max_response_output_tokens?: number;
  };
}
