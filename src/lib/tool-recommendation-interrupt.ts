import { Interrupt } from "@langchain/langgraph-sdk";
import { HITLRequest } from "@/components/thread/agent-inbox/types";

/**
 * Interface for a single tool recommendation.
 */
export interface ToolRecommendation {
  tool_name: string;
  tool_path: string;
  reason: string;
}

/**
 * Interface for the confirm_tool_recommendation tool arguments.
 */
export interface ToolRecommendationArgs {
  recommendations: ToolRecommendation[];
  summary: string;
}

/**
 * Type guard to check if an interrupt is a confirm_tool_recommendation HITL interrupt.
 */
export function isToolRecommendationInterrupt(
  value: unknown
): value is Interrupt<HITLRequest> | Interrupt<HITLRequest>[] {
  const valueAsObject = Array.isArray(value) ? value[0] : value;
  if (!valueAsObject || typeof valueAsObject !== "object") {
    return false;
  }

  const interrupt = valueAsObject as Interrupt<HITLRequest>;
  if (!interrupt.value || typeof interrupt.value !== "object") {
    return false;
  }

  const hitlValue = interrupt.value as Partial<HITLRequest>;
  const { action_requests: actionRequests } = hitlValue;

  if (!Array.isArray(actionRequests) || actionRequests.length === 0) {
    return false;
  }

  // Check if the first action request is confirm_tool_recommendation
  const firstRequest = actionRequests[0];
  if (
    !firstRequest ||
    typeof firstRequest !== "object" ||
    firstRequest.name !== "confirm_tool_recommendation"
  ) {
    return false;
  }

  // Validate args structure
  const args = firstRequest.args as Partial<ToolRecommendationArgs>;
  if (!args || typeof args !== "object") {
    return false;
  }

  if (!Array.isArray(args.recommendations)) {
    return false;
  }

  if (typeof args.summary !== "string") {
    return false;
  }

  return true;
}

/**
 * Extract the full interrupt object for tool recommendation.
 * This is needed to access the interrupt ID for resuming multiple interrupts.
 */
export function getToolRecommendationInterrupt(
  interrupt: unknown
): Interrupt<HITLRequest> | null {
  if (!isToolRecommendationInterrupt(interrupt)) {
    return null;
  }

  const interruptObj = Array.isArray(interrupt) ? interrupt[0] : interrupt;
  return interruptObj as Interrupt<HITLRequest>;
}
