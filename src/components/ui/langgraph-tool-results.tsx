import React from "react";
import { LangGraphTool } from "@/types/voice";

interface LangGraphToolResultsProps {
    results: LangGraphTool[];
    onSelected: (result: LangGraphTool) => void;
}

const LangGraphToolResults: React.FC<LangGraphToolResultsProps> = ({ results, onSelected }) => {
    if (!results.length) return null;
    return (
        <div>
            <h3 className="text-white/80 mb-2">LangGraph Tool Results</h3>
            <ul>
                {results.map((result, idx) => (
                    <li
                        key={result.thread_id || idx}
                        className="cursor-pointer text-white/90 hover:underline"
                        onClick={() => onSelected(result)}
                    >
                        <div>
                            <strong>Thread:</strong> {result.thread_id}
                        </div>
                        <div>
                            <strong>Response:</strong> {typeof result.response === "string" ? result.response : JSON.stringify(result.response)}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LangGraphToolResults; 