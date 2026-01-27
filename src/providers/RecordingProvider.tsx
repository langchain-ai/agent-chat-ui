"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";

interface RecordingContextType {
    isRecording: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    downloadRecording: (name?: string) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

const ENABLE_RECORD = process.env.NEXT_PUBLIC_ENABLE_RECORD === "true";

export function RecordingProvider({ children }: { children: React.ReactNode }) {
    const [isRecording, setIsRecording] = useState(false);
    const events = useRef<any[]>([]);
    const stopFn = useRef<(() => void) | null>(null);

    const startRecording = async () => {
        if (!ENABLE_RECORD) {
            console.warn("Recording is disabled. Set NEXT_PUBLIC_ENABLE_RECORD=true to enable.");
            alert("Recording is disabled. Set NEXT_PUBLIC_ENABLE_RECORD=true in your environment variables to enable session recording.");
            return;
        }

        if (isRecording) {
            console.warn("Recording is already in progress");
            return;
        }

        try {
            events.current = [];

            // Dynamically import rrweb to avoid SSR issues
            const { record } = await import("rrweb");
            
            if (!record) {
                throw new Error("Failed to import rrweb record function");
            }

            stopFn.current = record({
                emit(event: any) {
                    events.current.push(event);
                },
            }) || null;

            setIsRecording(true);
            console.log("Session recording started");
        } catch (error) {
            console.error("Failed to start recording:", error);
            alert(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (stopFn.current) {
            stopFn.current();
            stopFn.current = null;
        }
        setIsRecording(false);
        console.log("Session recording stopped. Captured events:", events.current.length);
    };

    const downloadRecording = (name = "reflexion-session") => {
        if (events.current.length === 0) {
            alert("No events captured to download.");
            return;
        }

        try {
            const data = JSON.stringify(events.current);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${name}-${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log(`Downloaded recording with ${events.current.length} events`);
        } catch (error) {
            console.error("Failed to download recording:", error);
            alert(`Failed to download recording: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // Auto-cleanup on unmount
    useEffect(() => {
        return () => {
            if (stopFn.current) {
                stopFn.current();
            }
        };
    }, []);

    return (
        <RecordingContext.Provider value={{ isRecording, startRecording, stopRecording, downloadRecording }}>
            {children}
        </RecordingContext.Provider>
    );
}

export function useRecording() {
    const context = useContext(RecordingContext);
    if (context === undefined) {
        throw new Error("useRecording must be used within a RecordingProvider");
    }
    return context;
}
