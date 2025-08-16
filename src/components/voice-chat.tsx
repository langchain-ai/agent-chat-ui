import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, X, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import RagResults from "@/components/ui/rag-results";
import LangGraphToolResults from "@/components/ui/langgraph-tool-results";
import RagResultView from "@/components/ui/rag-result-view";
import LangGraphToolView from "@/components/ui/langgraph-tool-view";
import useRealTime from "@/hooks/useRealtime";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import useAudioPlayer from "@/hooks/useAudioPlayer";
import { RagResult, LangGraphTool } from "@/types/voice";

interface ConversationEntry {
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  type: 'voice';
}

interface VoiceChatProps {
  onClose: () => void;
  onVoiceModeChange: (active: boolean) => void;
  onTranscriptComplete: (transcript: ConversationEntry[]) => void;
  postVoiceChatMessage: (text: string, type: 'human' | 'ai') => void;
}

export default function VoiceChat({ onClose, onVoiceModeChange, onTranscriptComplete, postVoiceChatMessage }: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [ragResults, setRagResults] = useState<RagResult[]>([]);
  const [selectedRag, setSelectedRag] = useState<RagResult | null>(null);
  const [langgraphTool, setLannggraphTool] = useState<LangGraphTool[]>([]);
  const [selectedLanggraph, setSelectedLannggraph] = useState<LangGraphTool | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationTranscript, setConversationTranscript] = useState<ConversationEntry[]>([]);

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true);
    // Automatically start voice mode when component mounts
    onVoiceModeChange(true);

    return () => {
      // Clean up when component unmounts
      onVoiceModeChange(false);
    };
  }, [onVoiceModeChange]);

  // Initialize audio hooks only on client side
  const { reset: resetAudioPlayer, play: playAudio, stop: stopAudioPlayer } = useAudioPlayer();

  // Use ref to store addUserAudio function to avoid dependency issues
  const addUserAudioRef = useRef<((audioData: string) => void) | null>(null);

  // Guard: track last posted transcript and response
  const lastPostedTranscript = useRef<string | null>(null);
  const lastPostedLangGraphResponse = useRef<string | null>(null);

  // Define audio callback functions
  const handleAudioRecorded = (audioData: string) => {
    if (addUserAudioRef.current) {
      addUserAudioRef.current(audioData);
    }
  };

  const { start: startAudioRecording, stop: stopAudioRecording } = useAudioRecorder({
    onAudioRecorded: handleAudioRecorded
  });

  const { startSession, addUserAudio, inputAudioBufferClear } = useRealTime({
    enableInputAudioTranscription: true, // Enable transcription
    onWebSocketOpen: () => {
      console.log("WebSocket connection opened");
      setIsConnected(true);
      setConnectionStatus("Connected to FieldGenie Voice Backend");
    },
    onWebSocketClose: () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      setConnectionStatus("Disconnected");
    },
    onWebSocketError: event => {
      console.error("WebSocket error:", event);
      setIsConnected(false);
      setConnectionStatus("Connection Error");
    },
    onReceivedError: message => {
      console.error("error", message);
      setConnectionStatus(`Error: ${message.error?.message || "Unknown error"}`);
    },
    onReceivedResponseAudioDelta: message => {
      if (isRecording) playAudio(message.delta);
    },
    onReceivedInputAudioBufferSpeechStarted: () => {
      stopAudioPlayer();
    },
    onReceivedInputAudioTranscriptionCompleted: (message) => {
      if (
        message.transcript &&
        message.transcript.trim() &&
        message.transcript !== lastPostedTranscript.current
      ) {
        postVoiceChatMessage(message.transcript, 'human');
        lastPostedTranscript.current = message.transcript;
      }
    },
    onReceivedResponseAudioTranscriptDelta: (message) => {
      // // Assistant response transcription
      // console.log("Assistant transcript delta:", message.delta);
      // if (message.delta && message.delta.trim()) {
      //   setConversationTranscript(prev => {
      //     const lastEntry = prev[prev.length - 1];
      //     if (lastEntry?.speaker === 'assistant') {
      //       // Update existing assistant message
      //       return [...prev.slice(0, -1), {
      //         ...lastEntry,
      //         text: lastEntry.text + message.delta
      //       }];
      //     } else {
      //       // New assistant message
      //       return [...prev, {
      //         speaker: 'assistant',
      //         text: message.delta,
      //         timestamp: new Date(),
      //         type: 'voice'
      //       }];
      //     }
      //   });
      // }
    },
    onReceivedExtensionMiddleTierToolResponse: message => {
      if (message.tool_name === "report_rag") {
        const res: RagResult = JSON.parse(message.tool_result);
        setRagResults(prev => [...prev, res]);
      } else if (message.tool_name === "langgraph") {
        const res: LangGraphTool = JSON.parse(message.tool_result);
        setLannggraphTool(prev => [...prev, res]);
        // Extract the latest message from the response array and post it to the main chat UI
        if (res && Array.isArray(res.response) && res.response.length > 0) {
          const last = res.response[res.response.length - 1];
          // Try to extract text from the last message
          let text = "";
          if (typeof last === "string") {
            text = last;
          } else if (last && typeof last === "object" && last.content) {
            if (typeof last.content === "string") {
              text = last.content;
            } else if (Array.isArray(last.content)) {
              // If content is an array, join text fields
              text = last.content.map((c: any) => c.text).filter(Boolean).join(" ");
            }
          }
          if (text.trim() && text !== lastPostedLangGraphResponse.current) {
            postVoiceChatMessage(text, 'ai');
            lastPostedLangGraphResponse.current = text;
          }
        }
      }
    }
  });

  // Set up the ref after addUserAudio is available
  addUserAudioRef.current = addUserAudio;

  // Check if backend2 is running when component mounts
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:8765/', {
          method: 'GET',
          mode: 'no-cors' // This allows us to detect if the server is running
        });
        setConnectionStatus("Backend2 server detected");
      } catch (error) {
        setConnectionStatus("Backend2 server not running on port 8765");
      }
    };

    checkBackendStatus();
  }, []);

  // Initialize WebSocket session immediately when component mounts
  useEffect(() => {
    if (isClient) {
      console.log("Initializing voice session...");
      startSession();
    }
  }, [isClient, startSession]);

  // Auto-start recording when connected (unless muted)
  useEffect(() => {
    if (isConnected && !isRecording && isClient && !isMuted) {
      const autoStart = async () => {
        try {
          console.log("Auto-starting voice recording...");
          startSession();
          await startAudioRecording();
          resetAudioPlayer();
          setIsRecording(true);
        } catch (error) {
          console.error("Failed to auto-start recording:", error);
        }
      };

      // Start immediately when connected
      autoStart();
    }
  }, [isConnected, isClient, isRecording, isMuted, startSession, startAudioRecording, resetAudioPlayer]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const onToggleListening = async () => {
    if (!isRecording) {
      startSession();
      await startAudioRecording();
      resetAudioPlayer();
      setIsRecording(true);
    } else {
      await stopAudioRecording();
      stopAudioPlayer();
      inputAudioBufferClear();
      setIsRecording(false);
    }
  };

  // Handle close with cleanup
  const handleClose = async () => {
    if (isRecording) {
      await stopAudioRecording();
      stopAudioPlayer();
      inputAudioBufferClear();
      setIsRecording(false);
    }

    // Send transcript to parent chat component
    // if (conversationTranscript.length > 0) {
    //   console.log("Sending transcript to chat:", conversationTranscript);
    //   onTranscriptComplete(conversationTranscript);
    // }

    onVoiceModeChange(false);
    onClose();
  };

  // Handle mute toggle (mutes user input/microphone)
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      // When muting, stop recording but keep the session active
      if (isRecording) {
        stopAudioRecording();
        setIsRecording(false);
      }
    } else {
      // When unmuting, restart recording if we were previously recording
      if (isConnected) {
        startAudioRecording();
        setIsRecording(true);
      }
    }
  };

  // Don't render on server side to prevent hydration issues
  if (!isClient) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >

      {/* Main voice interface */}
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          {/* Large microphone icon */}
          <motion.button
            onClick={isRecording ? onToggleListening : undefined}
            disabled={!isRecording}
            className={`mx-auto mb-8 flex h-48 w-48 items-center justify-center rounded-full transition-all ${isMuted
              ? "bg-gray-500 shadow-lg shadow-gray-500/30 cursor-not-allowed"
              : isRecording
                ? "bg-gray-500 shadow-lg shadow-gray-500/30 hover:bg-gray-600 cursor-pointer"
                : isConnected
                  ? "bg-gray-500 shadow-lg shadow-gray-500/30"
                  : "bg-gray-400"
              }`}
            style={{ opacity: 0.5 }}
            animate={isRecording && !isMuted ? {
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 0 0 rgb(80, 77, 77)",
                "0 0 0 20px rgba(69, 63, 63, 0.58)",
                "0 0 0 0 rgba(239, 68, 68, 0)"
              ]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: isRecording && !isMuted ? Infinity : 0,
              ease: "easeInOut"
            }}
            whileHover={isRecording && !isMuted ? { scale: 1.02 } : {}}
            whileTap={isRecording && !isMuted ? { scale: 0.98 } : {}}
            title={isMuted ? "Microphone muted" : isRecording ? "Click to stop recording" : ""}
          >
            {isMuted ? <MicOff className="h-20 w-20 text-gray" /> : <Mic className="h-20 w-20 text-gray" />}
          </motion.button>

          {/* Status text */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h2 className="text-4xl font-bold text-gray">
              {isMuted ? "Muted" : isRecording ? "Listening..." : isConnected ? "Ready" : "Connecting..."}
            </h2>
            <p className="text-xl text-gray/80">
              {isMuted
                ? "Microphone is muted"
                : isRecording
                  ? "Voice mode active"
                  : isConnected
                    ? "Voice mode active"
                    : "Waiting for backend connection"
              }
            </p>
          </motion.div> */}

          {/* Controls below microphone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center justify-center gap-4"
          >
            <button
              onClick={handleMuteToggle}
              className={`rounded-full p-3 text-grey transition-colors ${isMuted
                ? "bg-red-500/20 hover:bg-red-500/30"
                : "bg-gray/20 hover:bg-gray/30"
                }`}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              title={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>

            <button
              onClick={handleClose}
              className="rounded-full bg-gray/20 p-3 text-gray hover:bg-gray/30 transition-colors"
              aria-label="Close voice chat"
              title="Close voice chat"
            >
              <X className="h-6 w-6" />
            </button>
          </motion.div>

          {/* Backend instructions */}
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 rounded-lg bg-gray/10 p-6 text-center"
            >
              <p className="text-gray/90 mb-2">Make sure backend2 is running:</p>
              <code className="bg-gray/20 px-3 py-1 rounded text-gray/80 text-sm">
                cd backend2 && python app.py
              </code>
            </motion.div>
          )}
        </div>
      </div>

      {(langgraphTool.length > 0 || ragResults.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-6 right-6 max-h-32 overflow-y-auto rounded-lg bg-gray/10 p-4"
        >
          <RagResults results={ragResults} onSelected={setSelectedRag} />
          <LangGraphToolResults results={langgraphTool} onSelected={setSelectedLannggraph} />
        </motion.div>
      )}

      {/* Modals */}
      <RagResultView result={selectedRag} onClosed={() => setSelectedRag(null)} />
      <LangGraphToolView result={selectedLanggraph} onClosed={() => setSelectedLannggraph(null)} />
    </motion.div>
  );
}
