import { Interrupt } from "@langchain/langgraph-sdk";
import { HITLRequest } from "@/components/thread/agent-inbox/types";

/**
 * Interface for a single middleware recommendation.
 */
export interface MiddlewareRecommendation {
  middleware_name: string;
  middleware_path: string;
  reason: string;
  suggested_config?: Record<string, unknown>;
}

/**
 * Interface for the confirm_middleware_recommendation tool arguments.
 */
export interface MiddlewareRecommendationArgs {
  recommendations: MiddlewareRecommendation[];
  summary: string;
}

/**
 * Type guard to check if an interrupt is a confirm_middleware_recommendation HITL interrupt.
 */
export function isMiddlewareRecommendationInterrupt(
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

  // Check if the first action request is confirm_middleware_recommendation
  const firstRequest = actionRequests[0];
  if (
    !firstRequest ||
    typeof firstRequest !== "object" ||
    firstRequest.name !== "confirm_middleware_recommendation"
  ) {
    return false;
  }

  // Validate args structure
  const args = firstRequest.args as Partial<MiddlewareRecommendationArgs>;
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
 * Extract the middleware recommendation args from an interrupt.
 */
export function getMiddlewareRecommendationArgs(
  interrupt: unknown
): MiddlewareRecommendationArgs | null {
  if (!isMiddlewareRecommendationInterrupt(interrupt)) {
    return null;
  }

  const interruptObj = Array.isArray(interrupt) ? interrupt[0] : interrupt;
  const hitlValue = (interruptObj as Interrupt<HITLRequest>).value;
  if (!hitlValue?.action_requests?.[0]) {
    return null;
  }
  const actionRequest = hitlValue.action_requests[0];
  return actionRequest.args as unknown as MiddlewareRecommendationArgs;
}

/**
 * Extract the full interrupt object for middleware recommendation.
 * This is needed to access the interrupt ID for resuming multiple interrupts.
 */
export function getMiddlewareRecommendationInterrupt(
  interrupt: unknown
): Interrupt<HITLRequest> | null {
  if (!isMiddlewareRecommendationInterrupt(interrupt)) {
    return null;
  }

  const interruptObj = Array.isArray(interrupt) ? interrupt[0] : interrupt;
  return interruptObj as Interrupt<HITLRequest>;
}
