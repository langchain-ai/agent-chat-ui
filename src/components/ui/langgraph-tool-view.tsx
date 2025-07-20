import React from "react";
import { LangGraphTool } from "@/types/voice";

interface LangGraphToolViewProps {
    result: LangGraphTool | null;
    onClosed: () => void;
}

const LangGraphToolView: React.FC<LangGraphToolViewProps> = ({ result, onClosed }) => {
    if (!result) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg relative">
                <button
                    onClick={onClosed}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                    aria-label="Close"
                >
                    ×
                </button>
                <h2 className="text-xl font-bold mb-4">LangGraph Tool Result</h2>
                <div className="mb-2">
                    <strong>Thread ID:</strong> {result.thread_id}
                </div>
                <div>
                    <strong>Response:</strong>
                    <pre className="bg-gray-100 rounded p-2 mt-1 whitespace-pre-wrap break-all">
                        {result.response}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default LangGraphToolView; 