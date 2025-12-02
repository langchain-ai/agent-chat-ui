import { BaseMessage, isBaseMessage } from "@langchain/core/messages";
import { format } from "date-fns";
import { startCase } from "lodash";
import {
  Action,
  Decision,
  DecisionWithEdits,
  HITLRequest,
  SubmitType,
} from "./types";

export function prettifyText(action: string) {
  return startCase(action.replace(/_/g, " "));
}

export function isArrayOfMessages(
  value: Record<string, any>[],
): value is BaseMessage[] {
  if (
    value.every(isBaseMessage) ||
    (Array.isArray(value) &&
      value.every(
        (v) =>
          typeof v === "object" &&
          "id" in v &&
          "type" in v &&
          "content" in v &&
          "additional_kwargs" in v,
      ))
  ) {
    return true;
  }
  return false;
}

export function baseMessageObject(item: unknown): string {
  if (isBaseMessage(item)) {
    const contentText =
      typeof item.content === "string"
        ? item.content
        : JSON.stringify(item.content, null);
    let toolCallText = "";
    if ("tool_calls" in item) {
      toolCallText = JSON.stringify(item.tool_calls, null);
    }
    if ("type" in item) {
      return `${item.type}:${contentText ? ` ${contentText}` : ""}${toolCallText ? ` - Tool calls: ${toolCallText}` : ""}`;
    } else if ("getType" in item) {
      return `${(item as BaseMessage).getType()}:${contentText ? ` ${contentText}` : ""}${toolCallText ? ` - Tool calls: ${toolCallText}` : ""}`;
    }
  } else if (
    typeof item === "object" &&
    item &&
    "type" in item &&
    "content" in item
  ) {
    const contentText =
      typeof item.content === "string"
        ? item.content
        : JSON.stringify(item.content, null);
    let toolCallText = "";
    if ("tool_calls" in item) {
      toolCallText = JSON.stringify(item.tool_calls, null);
    }
    return `${item.type}:${contentText ? ` ${contentText}` : ""}${toolCallText ? ` - Tool calls: ${toolCallText}` : ""}`;
  }

  if (typeof item === "object") {
    return JSON.stringify(item, null);
  } else {
    return item as string;
  }
}

export function unknownToPrettyDate(input: unknown): string | undefined {
  try {
    if (
      Object.prototype.toString.call(input) === "[object Date]" ||
      new Date(input as string)
    ) {
      return format(new Date(input as string), "MM/dd/yyyy hh:mm a");
    }
  } catch (_) {
    // failed to parse date. no-op
  }
  return undefined;
}

export function createDefaultHumanResponse(
  hitlRequest: HITLRequest,
  initialHumanInterruptEditValue: React.MutableRefObject<
    Record<string, string>
  >,
): {
  responses: DecisionWithEdits[];
  defaultSubmitType: SubmitType | undefined;
  hasApprove: boolean;
} {
  const responses: DecisionWithEdits[] = [];
  const actionRequest = hitlRequest.action_requests?.[0];
  const reviewConfig =
    hitlRequest.review_configs?.find(
      (config) => config.action_name === actionRequest?.name,
    ) ?? hitlRequest.review_configs?.[0];

  if (!actionRequest || !reviewConfig) {
    return { responses: [], defaultSubmitType: undefined, hasApprove: false };
  }

  const allowedDecisions = reviewConfig.allowed_decisions ?? [];

  if (allowedDecisions.includes("edit")) {
    Object.entries(actionRequest.args).forEach(([key, value]) => {
      const stringValue =
        typeof value === "string" || typeof value === "number"
          ? value.toString()
          : JSON.stringify(value, null);
      initialHumanInterruptEditValue.current = {
        ...initialHumanInterruptEditValue.current,
        [key]: stringValue,
      };
    });

    const editedAction: Action = {
      name: actionRequest.name,
      args: { ...actionRequest.args },
    };

    responses.push({
      type: "edit",
      edited_action: editedAction,
      acceptAllowed: allowedDecisions.includes("approve"),
      editsMade: false,
    });
  }

  if (allowedDecisions.includes("approve")) {
    responses.push({ type: "approve" });
  }

  if (allowedDecisions.includes("reject")) {
    responses.push({ type: "reject", message: "" });
  }

  // Determine default submit type. Priority: approve > reject > edit
  let defaultSubmitType: SubmitType | undefined;

  if (allowedDecisions.includes("approve")) {
    defaultSubmitType = "approve";
  } else if (allowedDecisions.includes("reject")) {
    defaultSubmitType = "reject";
  } else if (allowedDecisions.includes("edit")) {
    defaultSubmitType = "edit";
  }

  const hasApprove = allowedDecisions.includes("approve");

  return { responses, defaultSubmitType, hasApprove };
}

export function buildDecisionFromState(
  responses: DecisionWithEdits[],
  selectedSubmitType: SubmitType | undefined,
): { decision?: Decision; error?: string } {
  if (!responses.length) {
    return { error: "Please enter a response." };
  }

  const selectedDecision = responses.find(
    (response) => response.type === selectedSubmitType,
  );

  if (!selectedDecision) {
    return { error: "No response selected." };
  }

  if (selectedDecision.type === "approve") {
    return { decision: { type: "approve" } };
  }

  if (selectedDecision.type === "reject") {
    const message = selectedDecision.message?.trim();
    if (!message) {
      return { error: "Please provide a rejection reason." };
    }
    return { decision: { type: "reject", message } };
  }

  if (selectedDecision.type === "edit") {
    if (selectedDecision.acceptAllowed && !selectedDecision.editsMade) {
      return { decision: { type: "approve" } };
    }

    return {
      decision: {
        type: "edit",
        edited_action: selectedDecision.edited_action,
      },
    };
  }

  return { error: "Unsupported response type." };
}

export function constructOpenInStudioURL(
  deploymentUrl: string,
  threadId?: string,
) {
  const smithStudioURL = new URL("https://smith.langchain.com/studio/thread");
  // trim the trailing slash from deploymentUrl
  const trimmedDeploymentUrl = deploymentUrl.replace(/\/$/, "");

  if (threadId) {
    smithStudioURL.pathname += `/${threadId}`;
  }

  smithStudioURL.searchParams.append("baseUrl", trimmedDeploymentUrl);

  return smithStudioURL.toString();
}

export function haveArgsChanged(
  args: unknown,
  initialValues: Record<string, string>,
): boolean {
  if (typeof args !== "object" || !args) {
    return false;
  }

  const currentValues = args as Record<string, string>;

  return Object.entries(currentValues).some(([key, value]) => {
    const valueString = ["string", "number"].includes(typeof value)
      ? value.toString()
      : JSON.stringify(value, null);
    return initialValues[key] !== valueString;
  });
}
