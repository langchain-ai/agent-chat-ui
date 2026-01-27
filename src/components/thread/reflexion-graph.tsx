"use client";

import React from "react";
import { useArtifact } from "./artifact";

interface ReflexionGraphProps {
    html?: string;
    artifactInstance?: ReturnType<typeof useArtifact>;
}

export function ReflexionGraph({ html, artifactInstance: providedInstance }: ReflexionGraphProps) {
    const internalInstance = useArtifact();
    const artifactInstance = providedInstance || internalInstance;
    const [Artifact, { setOpen, open }] = artifactInstance;
    const autoOpened = React.useRef(false);
    const id = React.useId();
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (html && !open && !autoOpened.current) {
            console.log(`[Local][ReflexionGraph] Auto-opening artifact panel. id: ${id}`);
            autoOpened.current = true;
            setOpen(true);
        }
    }, [html, setOpen, open, id]);

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            // Block scroll leakage to parent
            e.stopPropagation();
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, []);

    if (!html) return null;

    return (
        <Artifact title="Knowledge Graph">
            <div
                ref={containerRef}
                key={html.substring(0, 100)} // Force fresh render if content changes significantly
                style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "600px",
                    background: "white",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative"
                }}
            >
                <iframe
                    srcDoc={html}
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        flexGrow: 1,
                        position: "absolute",
                        top: 0,
                        left: 0
                    }}
                    sandbox="allow-scripts"
                    title="Reflexion Knowledge Graph"
                />
            </div>
        </Artifact>
    );
}
