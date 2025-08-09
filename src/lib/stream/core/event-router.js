/* eslint-disable */
import { isUIMessage, isRemoveUIMessage } from "@langchain/langgraph-sdk/react-ui";

// Normalize LangGraph stream events to a small internal set
// Types: 'message', 'ui', 'values', 'ignore'
// For messages, we also add a 'subtype': 'partial' | 'metadata' | 'base'
export function normalizeEvent(eventName, data) {
  const receivedAt = Date.now();

  const name = typeof eventName === "string" ? eventName : String(eventName ?? "");
  const pipeBase = name.split("|")[0];
  const slashBase = name.split("/")[0];
  const baseEvent = pipeBase || slashBase || name;

  // messages family: support subtype detection
  if (baseEvent === "messages" || name.startsWith("messages")) {
    let subtype = "base";
    if (name.includes("/partial")) subtype = "partial";
    else if (name.includes("/metadata")) subtype = "metadata";
    return { type: "message", subtype, payload: data, receivedAt };
  }

  // custom family: 'custom', 'custom|subgraph', potentially 'custom/...' (future)
  if (baseEvent === "custom" || name.startsWith("custom")) {
    if (isUIMessage(data) || isRemoveUIMessage(data)) {
      return { type: "ui", payload: data, receivedAt };
    }
    return { type: "ignore", payload: data, receivedAt };
  }

  if (baseEvent === "values") {
    return { type: "values", payload: data, receivedAt };
  }

  // pass-through other events for now
  return { type: "ignore", payload: data, receivedAt };
} 