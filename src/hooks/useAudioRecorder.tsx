import { useRef } from "react";
import { Recorder } from "@/components/audio/recorder";

const BUFFER_SIZE = 4800;

interface AudioRecorderHooks {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

interface AudioRecorderProps {
  onAudioRecorded: (audioData: string) => void;
}

export default function useAudioRecorder({ onAudioRecorded }: AudioRecorderProps): AudioRecorderHooks {
  const audioRecorderRef = useRef<Recorder | null>(null);
  let buffer = new Uint8Array();

  const appendToBuffer = (newData: Uint8Array) => {
    const newBuffer = new Uint8Array(buffer.length + newData.length);
    newBuffer.set(buffer);
    newBuffer.set(newData, buffer.length);
    buffer = newBuffer;
  };

  const handleAudioData = (data: Iterable<number>) => {
    const uint8Array = new Uint8Array(data);
    appendToBuffer(uint8Array);

    if (buffer.length >= BUFFER_SIZE) {
      const toSend = new Uint8Array(buffer.slice(0, BUFFER_SIZE));
      buffer = new Uint8Array(buffer.slice(BUFFER_SIZE));

      const regularArray = String.fromCharCode(...toSend);
      const base64 = btoa(regularArray);

      onAudioRecorded(base64);
    }
  };

  const start = async () => {
    try {
      if (!audioRecorderRef.current) {
        audioRecorderRef.current = new Recorder(handleAudioData);
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await audioRecorderRef.current.start(stream);
    } catch (error) {
      console.error("Error starting audio recording:", error);
    }
  };

  const stop = async () => {
    if (audioRecorderRef.current) {
      await audioRecorderRef.current.stop();
    }
  };

  return { start, stop };
}
