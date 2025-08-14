import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { componentMap, ComponentType } from "@/components/widgets";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { useStreamContext } from "@/providers/Stream";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { useArtifact } from "../artifact";
import { useTabContext } from "@/providers/TabContext";
import { useItineraryWidget } from "@/providers/ItineraryWidgetContext";
import { NonAgentFlowProvider } from "@/providers/NonAgentFlowContext";
import ReviewWidget from "@/components/widgets/review.widget";

// Debug utility function
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.group(`🐛 Interrupt Debug: ${message}`);
    if (data !== undefined) {
      console.log(data);
    }
    console.groupEnd();
  }
};

// Build a normalized ApiResponse-like envelope from an interrupt-like input
function normalizeApiDataEnvelope(
  interruptLike: any,
): { value: { type: string; widget: any } } | undefined {
  if (!interruptLike) return undefined;
  const block = (interruptLike as any)?.__block;
  const original = block?.value ?? interruptLike;
  const frozen = block?.frozenValue ?? null;
  const pickInner = (obj: any) =>
    obj?.value?.value?.widget
      ? obj.value.value
      : obj?.value?.widget
        ? obj.value
        : obj?.widget
          ? obj
          : undefined;
  const originalInner = pickInner(original);
  const frozenInner = pickInner(frozen);
  if (!originalInner && !frozenInner) return undefined;
  const base = originalInner ?? frozenInner;
  return {
    value: {
      ...base,
      widget: {
        ...base.widget,
        args: {
          ...(base.widget?.args ?? {}),
          ...(frozenInner?.widget?.args
            ? {
                submission:
                  frozenInner.widget.args.submission ?? frozenInner.widget.args,
              }
            : {}),
        },
      },
    },
  };
}

interface DynamicRendererProps {
  interruptType: string;
  interrupt: Record<string, any>;
  onRendered?: (rendered: boolean) => void;
}

const ReadOnlyGuard: React.FC<{
  disabled: boolean;
  children: React.ReactNode;
}> = ({ disabled, children }) => {
  if (!disabled) return <>{children}</>;
  return <div className="pointer-events-none">{children}</div>;
};

// Wrapper component for TravelerDetailsWidget with bottom sheet
const TravelerDetailsBottomSheet: React.FC<{
  apiData: any;
  args: any;
  readOnly?: boolean;
}> = ({ apiData, args, readOnly }) => {
  const [isOpen, setIsOpen] = useState(true);

  const ReviewWidget = componentMap.TravelerDetailsWidget;

  const handleClose = () => {
    setIsOpen(false);
  };

  // Prefer frozenValue if present to expose submitted snapshot alongside original
  const normalizedApiData = normalizeApiDataEnvelope(apiData);

  return (
    <ReviewWidget
      apiData={normalizedApiData}
      readOnly={readOnly}
      {...args}
    />
  );
};

// Wrapper component for NonAgentFlowWidget with bottom sheet
const NonAgentFlowBottomSheet: React.FC<{
  apiData: any;
  args: any;
  readOnly?: boolean;
}> = ({ apiData, args, readOnly }) => {
  const NonAgentFlowWidget = componentMap.NonAgentFlowWidget;

  const normalizedApiData = normalizeApiDataEnvelope(apiData);
  return (
    <NonAgentFlowProvider>
      <NonAgentFlowWidget
        apiData={normalizedApiData}
        readOnly={readOnly}
        {...args}
      />
    </NonAgentFlowProvider>
  );
};

// Global tracking for switched widgets to persist across re-renders
const globalSwitchedWidgets = new Set<string>();

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({
  interruptType,
  interrupt,
  onRendered,
}) => {
  const stream = useStreamContext();
  const artifact = useArtifact();
  const { switchToReview } = useTabContext();
  const { addWidget } = useItineraryWidget();

  const processedWidgetsRef = useRef<Set<string>>(new Set());
  const [foundInterruptWidget, setFoundInterruptWidget] = useState<any>(null);

  // Normalize widget envelope from various shapes
  const widget = useMemo(() => {
    const i: any = interrupt;
    return (
      i?.widget || i?.value?.widget || i?.value?.value?.widget || undefined
    );
  }, [interrupt]);

  // Resolve type from multiple shapes
  const resolvedType = useMemo(() => {
    const i: any = interrupt;
    return i?.type || i?.value?.type || i?.value?.value?.type || interruptType;
  }, [interrupt, interruptType]);

  // Stable key for ui list (best-effort; safe if UI is still exposed)
  const uiKey = useMemo(() => {
    const ui = (stream.values as any)?.ui as any[] | undefined;
    return Array.isArray(ui) ? ui.map((u) => u.id).join("|") : "";
  }, [(stream.values as any)?.ui]);

  // Capture the latest message id from blocks timeline
  const lastMessageId = useMemo(() => {
    const blocks = (stream.values?.blocks ?? []) as Array<{
      kind: string;
      data: any;
    }>;
    const messages = Array.isArray(blocks)
      ? blocks.filter((b) => b.kind === "message" && b.data)
      : [];
    if (messages.length === 0) return undefined;
    return messages[messages.length - 1]?.data?.id;
  }, [stream.values?.blocks]);

  // Dev diagnostics
  try {
    const uiCount = Array.isArray((stream.values as any)?.ui)
      ? (stream.values as any).ui.length
      : 0;
    const blocks = (stream.values?.blocks ?? []) as any[];
    const msgCount = Array.isArray(blocks)
      ? blocks.filter((b) => b.kind === "message" && b.data).length
      : 0;
    debugLog("[INTERRUPT/DYN] render", {
      interruptType,
      resolvedType,
      uiCount,
      msgCount,
      uiKey,
      lastMessageId,
    });
  } catch {}

  // Helper to collect candidate IDs from a generic object location
  const collectIds = (obj: any): (string | undefined)[] => {
    if (!obj || typeof obj !== "object") return [];
    return [
      obj?.metadata?.attachmentId,
      obj?.metadata?.attachment_id,
      obj?.metadata?.message_id,
      obj?.widget?.args?.attachmentId,
      obj?.widget?.args?.attachment_id,
      obj?.widget?.args?.message_id,
    ];
  };

  // Gather candidate IDs from top-level interrupt and nested shapes + last message id
  const rawVal: any = (interrupt as any)?.value ?? interrupt;
  const nestedVal: any =
    rawVal && typeof rawVal === "object" ? rawVal.value : undefined;
  const candidateIds: (string | undefined)[] = [
    ...collectIds(interrupt),
    ...collectIds(rawVal),
    ...collectIds(nestedVal),
    lastMessageId,
  ];
  const firstCandidateId: string | undefined = candidateIds.find(
    (v): v is string => typeof v === "string" && v.length > 0,
  );

  // Determine if we can render a chat widget directly
  const canRenderWidget = useMemo(() => {
    const type = widget?.type as string | undefined;
    return !!(resolvedType === "widget" && type && type in componentMap);
  }, [resolvedType, widget?.type]);

  // Notify parent about renderability without setting state during render
  useEffect(() => {
    if (!onRendered) return;
    onRendered(!!canRenderWidget || !!foundInterruptWidget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRenderWidget, !!foundInterruptWidget]);

  // Itinerary window side-effect (process-only; not for normal chat render)
  // Skip for NonAgentFlowWidget to keep it inline in chat as per requirement
  useEffect(() => {
    if (
      (resolvedType === "widget" || resolvedType === "interruptWidget") &&
      widget?.args?.renderingWindow === "itinerary" &&
      widget?.type !== "NonAgentFlowWidget"
    ) {
      const interruptId =
        (interrupt as any)?.value?.interrupt_id || widget?.args?.interrupt_id;
      const argsHash = JSON.stringify(widget?.args || {});
      const widgetId =
        interruptId || `${widget?.type}-${btoa(argsHash).slice(0, 8)}`;

      if (!processedWidgetsRef.current.has(widgetId)) {
        processedWidgetsRef.current.add(widgetId);
        const Component = componentMap[widget?.type as ComponentType];
        const widgetComponent =
          widget?.type === "NonAgentFlowWidget" ? (
            <NonAgentFlowBottomSheet
              apiData={interrupt}
              args={widget?.args}
            />
          ) : widget?.type === "TravelerDetailsWidget" ? (
            <ReviewWidget
              interruptId={interruptId}
              readOnly={!!(interrupt as any)?._readOnly}
              apiData={interrupt}
              args={widget?.args}
            />
          ) : (
            <Component {...(widget?.args ?? {})} />
          );
        addWidget(widgetId, widgetComponent);
        try {
          switchToReview();
        } catch {}
      }
    }
  }, [
    resolvedType,
    widget?.args,
    widget?.type,
    interrupt,
    addWidget,
    switchToReview,
  ]);

  // Attachment-based rendering: if an attached UI widget is available (future: setFoundInterruptWidget)
  if (firstCandidateId && foundInterruptWidget) {
    return (
      <LoadExternalComponent
        key={foundInterruptWidget.id}
        stream={stream as any}
        message={foundInterruptWidget}
        meta={{ ui: foundInterruptWidget, artifact }}
      />
    );
  }

  // Component-map rendering (chat inline)
  if (canRenderWidget) {
    const Component = componentMap[widget?.type as ComponentType];
    const renderingWindow = widget?.args?.renderingWindow || "chat";
    const allowInlineForNonAgent = widget?.type === "NonAgentFlowWidget";

    if (renderingWindow === "itinerary" && !allowInlineForNonAgent) {
      return null; // handled by effect above
    }

    const interruptObj: any = interrupt as any;
    const computedReadOnly = !!interruptObj?._readOnly;
    const interruptId =
      interruptObj?.interrupt_id ||
      interruptObj?.value?.interrupt_id ||
      interruptObj?.value?.value?.interrupt_id;
    debugLog("[INTERRUPT/DYN] passing widget props", {
      widgetType: widget?.type,
      readOnly: computedReadOnly,
      interruptId,
      hasArgs: !!widget?.args,
    });

    if (widget?.type === "NonAgentFlowWidget") {
      return (
        <ReadOnlyGuard disabled={computedReadOnly}>
          <NonAgentFlowBottomSheet
            apiData={interrupt}
            args={widget?.args}
            readOnly={computedReadOnly}
          />
        </ReadOnlyGuard>
      );
    }
    if (widget?.type === "TravelerDetailsWidget") {
      return (
        <ReadOnlyGuard disabled={computedReadOnly}>
          <ReviewWidget
            apiData={interrupt}
            args={widget?.args}
            interruptId={interruptId}
            readOnly={computedReadOnly}
          />
        </ReadOnlyGuard>
      );
    }
    const normalizedApiData = normalizeApiDataEnvelope(interrupt);
    return (
      <ReadOnlyGuard disabled={computedReadOnly}>
        <Component
          {...(widget?.args ?? {})}
          apiData={normalizedApiData}
          readOnly={computedReadOnly}
          interruptId={interruptId}
        />
      </ReadOnlyGuard>
    );
  }

  // Nothing to render
  return null;
};

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function GenericInterruptView({
  interrupt,
}: {
  interrupt: Record<string, any> | Record<string, any>[];
}) {
  debugLog("GenericInterruptView rendered", { interrupt });

  const [renderedByDynamic, setRenderedByDynamic] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  // If we receive full block data, prefer frozen value when completed
  const blockLike = interrupt as any;
  const rawValue = blockLike?.value ?? interrupt;
  const readOnly = !!blockLike?.completed;
  const effectiveValue = blockLike?.frozenValue ?? rawValue;

  const contentStr = JSON.stringify(effectiveValue, null, 2);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;

  const interruptObj = Array.isArray(effectiveValue)
    ? effectiveValue[0]
    : effectiveValue;
  const interruptType =
    interruptObj.type ||
    interruptObj.value?.type ||
    interruptObj.value?.value?.type;

  // Always mount DynamicRenderer so its effects run and it can render UI when available
  const dynamicWidget = (
    <DynamicRenderer
      interruptType={interruptType}
      interrupt={{
        // Keep previous top-level shape for backward-compat (widget/type etc.)
        ...interruptObj,
        // Ensure we propagate the persisted id used in the timeline store
        interrupt_id:
          (blockLike as any)?.interrupt_id ??
          (interruptObj as any)?.interrupt_id,
        _readOnly: readOnly,
        // New: include full block pointers so widgets can access both
        __block: {
          value: rawValue,
          frozenValue: (blockLike as any)?.frozenValue,
          completed: readOnly,
        },
      }}
      onRendered={setRenderedByDynamic}
    />
  );

  debugLog(
    renderedByDynamic
      ? "[INTERRUPT] rendering dynamic widget (and hiding fallback)"
      : "[INTERRUPT] no dynamic render yet; showing generic fallback",
  );
  if (readOnly) {
    debugLog("[INTERRUPT] block is completed; widgets should be readOnly");
  }
  debugLog("[INTERRUPT] generic->dynamic props", {
    blockCompleted: readOnly,
    hasFrozen: !!blockLike?.frozenValue,
    interruptType,
  });

  const truncateValue = (value: any): any => {
    if (typeof value === "string" && value.length > 100) {
      return value.substring(0, 100) + "...";
    }

    if (Array.isArray(value) && !isExpanded) {
      return value.slice(0, 2).map(truncateValue);
    }

    if (isComplexValue(value) && !isExpanded) {
      const strValue = JSON.stringify(value, null, 2);
      if (strValue.length > 100) {
        return `Truncated ${strValue.length} characters...`;
      }
    }

    return value;
  };

  const processEntries = () => {
    if (Array.isArray(effectiveValue)) {
      return isExpanded ? effectiveValue : effectiveValue.slice(0, 5);
    } else {
      const entries = Object.entries(effectiveValue);
      if (!isExpanded && shouldTruncate) {
        return entries.map(([key, value]) => [key, truncateValue(value)]);
      }
      return entries;
    }
  };

  const displayEntries = processEntries();

  return (
    <>
      {dynamicWidget}
      {!renderedByDynamic && (
        <DebugPanel
          data={{
            interrupt: effectiveValue,
            interruptType,
            shouldTruncate,
            isExpanded,
            readOnly,
          }}
          label="Generic Interrupt Debug"
        />
      )}
      {!renderedByDynamic && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium text-gray-900">Human Interrupt</h3>
            </div>
          </div>
          <motion.div
            className="min-w-full bg-gray-100"
            initial={false}
            animate={{ height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-3">
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                <motion.div
                  key={isExpanded ? "expanded" : "collapsed"}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    maxHeight: isExpanded ? "none" : "500px",
                    overflow: "auto",
                  }}
                >
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      {displayEntries.map((item, argIdx) => {
                        const [key, value] = Array.isArray(effectiveValue)
                          ? [argIdx.toString(), item]
                          : (item as [string, any]);
                        return (
                          <tr key={argIdx}>
                            <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                              {key}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {isComplexValue(value) ? (
                                <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm">
                                  {JSON.stringify(value, null, 2)}
                                </code>
                              ) : (
                                String(value)
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>
              </AnimatePresence>
            </div>
            {(shouldTruncate ||
              (Array.isArray(effectiveValue) && effectiveValue.length > 5)) && (
              <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full cursor-pointer items-center justify-center border-t-[1px] border-gray-200 py-2 text-gray-500 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-600"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </motion.button>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}
