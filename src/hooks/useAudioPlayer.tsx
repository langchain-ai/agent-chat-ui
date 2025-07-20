import { useRef } from "react";
import { Player } from "@/components/audio/player";

const SAMPLE_RATE = 24000;

interface AudioPlayerHooks {
  reset: () => void;
  play: (base64Audio: string) => void;
  stop: () => void;
}

export default function useAudioPlayer(): AudioPlayerHooks {
  const audioPlayerRef = useRef<Player | null>(null);

  const reset = () => {
    audioPlayerRef.current = new Player();
    audioPlayerRef.current.init(SAMPLE_RATE);
  };

  const play = (base64Audio: string) => {
    try {
      const binary = atob(base64Audio);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      const pcmData = new Int16Array(bytes.buffer);

      audioPlayerRef.current?.play(pcmData);
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const stop = () => {
    audioPlayerRef.current?.stop();
  };

  return { reset, play, stop };
}
