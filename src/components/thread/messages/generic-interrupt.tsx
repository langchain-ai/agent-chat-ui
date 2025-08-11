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

interface DynamicRendererProps {
  interruptType: string;
  interrupt: Record<string, any>;
  onRendered?: (rendered: boolean) => void;
}

// Wrapper component for TravelerDetailsWidget with bottom sheet
const TravelerDetailsBottomSheet: React.FC<{ apiData: any; args: any }> = ({
  apiData,
  args,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const ReviewWidget = componentMap.TravelerDetailsWidget;

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <ReviewWidget
      apiData={apiData}
      {...args}
    />
  );
};

// Wrapper component for NonAgentFlowWidget with bottom sheet
const NonAgentFlowBottomSheet: React.FC<{ apiData: any; args: any }> = ({
  apiData,
  args,
}) => {
  const NonAgentFlowWidget = componentMap.NonAgentFlowWidget;

  return (
    <NonAgentFlowWidget
      apiData={apiData}
      {...args}
    />
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
  const { switchToItinerary } = useTabContext();
  const { addWidget } = useItineraryWidget();

  const processedWidgetsRef = useRef<Set<string>>(new Set());
  const [foundInterruptWidget, setFoundInterruptWidget] = useState<any>(null);

  // Stable key for ui list
  const uiKey = useMemo(() => {
    const ui = (stream.values as any)?.ui as any[] | undefined;
    return Array.isArray(ui) ? ui.map((u) => u.id).join("|") : "";
  }, [(stream.values as any)?.ui]);

  // Also capture the latest message id in the thread for matching by message_id
  const lastMessageId = useMemo(() => {
    const msgs = stream.messages as any[];
    return Array.isArray(msgs) && msgs.length > 0
      ? msgs[msgs.length - 1]?.id
      : undefined;
  }, [stream.messages]);

  // Confirm mount and current snapshot sizes every render
  try {
    const uiCount = Array.isArray((stream.values as any)?.ui)
      ? (stream.values as any).ui.length
      : 0;
    const msgCount = Array.isArray(stream.messages)
      ? stream.messages.length
      : 0;
    debugLog("[INTERRUPT/DYN] render", {
      interruptType,
      uiCount,
      msgCount,
      uiKey,
      lastMessageId,
    });
  } catch {}
  // Avoid logging full values snapshot every render; rely on counts above

  // Robustly resolve interrupt shape (it can be nested under value.value)
  const rawVal = interrupt?.value;
  const nestedVal =
    rawVal && typeof rawVal === "object" ? (rawVal as any).value : undefined;
  const resolvedType: string | undefined =
    (interrupt as any)?.type || rawVal?.type || nestedVal?.type;

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

  // Gather candidate IDs from top-level interrupt, raw value, nested value, and last message id
  const candidateIds: (string | undefined)[] = [
    ...collectIds(interrupt),
    ...collectIds(rawVal),
    ...collectIds(nestedVal),
    lastMessageId,
  ];

  const firstCandidateId: string | undefined = candidateIds.find(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  const hasAnyCandidateId = !!firstCandidateId;

  // Dev-only logs for field resolution
  debugLog("[INTERRUPT RESOLVE]", {
    incomingType: interruptType,
    resolvedType,
    firstCandidateId,
    allCandidates: candidateIds.filter((v) => typeof v === "string"),
    lastMessageId,
  });

  useEffect(() => {
    debugLog("[INTERRUPT] itinerary effect check", {
      interruptType,
      hasWidget: !!interrupt?.value?.widget,
      renderingWindow: interrupt?.value?.widget?.args?.renderingWindow,
    });
    if (
      (interruptType === "widget" || interruptType === "interruptWidget") &&
      interrupt.value?.widget?.args?.renderingWindow === "itinerary"
    ) {
      debugLog("[INTERRUPT] itinerary path engaged");
      const interruptId =
        interrupt.value?.interrupt_id ||
        interrupt.value?.widget?.args?.interrupt_id;
      const argsHash = JSON.stringify(interrupt.value.widget.args || {});
      const widgetId =
        interruptId ||
        `${interrupt.value.widget.type}-${btoa(argsHash).slice(0, 8)}`;

      if (!processedWidgetsRef.current.has(widgetId)) {
        processedWidgetsRef.current.add(widgetId);

        const Component =
          componentMap[interrupt.value.widget.type as ComponentType];
        let widgetComponent: React.ReactNode;

        if (interrupt.value.widget.type === "TravelerDetailsWidget") {
          widgetComponent = (
            <TravelerDetailsBottomSheet
              apiData={interrupt}
              args={interrupt.value.widget.args}
            />
          );
        } else if (interrupt.value.widget.type === "NonAgentFlowWidget") {
          widgetComponent = (
            <NonAgentFlowBottomSheet
              apiData={interrupt}
              args={interrupt.value.widget.args}
            />
          );
        } else {
          widgetComponent = <Component {...interrupt.value.widget.args} />;
        }

        debugLog("[INTERRUPT] adding itinerary widget", { widgetId });
        addWidget(widgetId, widgetComponent);
        onRendered?.(true);

        if (!globalSwitchedWidgets.has(widgetId)) {
          switchToItinerary();
          globalSwitchedWidgets.add(widgetId);
          debugLog(`Switching to Itinerary for widget: ${widgetId}`);
        }
      }
    }
  }, [interruptType, interrupt, addWidget, switchToItinerary]);

  // Handle interruptWidget processing looking up matching UI widget (no preservation)
  useEffect(() => {
    const idCandidates = candidateIds.filter(
      (v): v is string => typeof v === "string" && v.length > 0,
    );

    const currentUi: any[] = ((stream.values as any)?.ui as any[]) || [];

    // Dev-only debug log for the scanning step
    debugLog("[INTERRUPT WIDGET] scanning UI entries", {
      idCandidates,
      uiCount: currentUi.length,
      uiSummaries: currentUi.map((u) => ({
        id: u?.id,
        name: u?.name,
        metaMsgId: u?.metadata?.message_id,
        metaAttach: u?.metadata?.attachmentId ?? u?.metadata?.attachment_id,
        propsAttach: u?.props?.attachmentId ?? u?.props?.attachment_id,
      })),
    });

    const matchesAttachment = (ui: any, id: string) => {
      return (
        ui?.id === id ||
        ui?.metadata?.message_id === id ||
        ui?.metadata?.attachmentId === id ||
        ui?.metadata?.attachment_id === id ||
        ui?.props?.attachmentId === id ||
        ui?.props?.attachment_id === id ||
        ui?.props?.metadata?.attachmentId === id ||
        ui?.props?.metadata?.attachment_id === id
      );
    };

    let matchingUIWidget: any | undefined;
    if (idCandidates.length > 0) {
      matchingUIWidget = currentUi.find((ui) =>
        idCandidates.some((id) => matchesAttachment(ui, id)),
      );
    }

    // Fallback: if no candidates found, and there is a single UI entry, pick it.
    if (!matchingUIWidget && currentUi.length === 1) {
      matchingUIWidget = currentUi[0];
    }

    debugLog("[INTERRUPT WIDGET] match result", {
      found: !!matchingUIWidget,
      matchingUIWidget,
    });

    if (matchingUIWidget) {
      setFoundInterruptWidget(matchingUIWidget);
      onRendered?.(true);
    } else {
      onRendered?.(false);
    }
  }, [candidateIds, uiKey, stream.values]);

  debugLog("DynamicRenderer called", { interruptType, interrupt });

  if (hasAnyCandidateId) {
    const attachmentId = firstCandidateId as string;

    if (attachmentId) {
      if (foundInterruptWidget) {
        return (
          <LoadExternalComponent
            key={foundInterruptWidget.id}
            stream={stream as any}
            message={foundInterruptWidget}
            meta={{ ui: foundInterruptWidget, artifact }}
          />
        );
      }
      return null;
    }

    debugLog("No attachmentId found in interruptWidget interrupt", {
      interrupt,
    });
    return null;
  }

  if (
    interruptType === "widget" &&
    interrupt.value.widget.type in componentMap
  ) {
    const Component =
      componentMap[interrupt.value.widget.type as ComponentType];

    const renderingWindow =
      interrupt.value.widget.args?.renderingWindow || "chat";

    let widgetComponent: React.ReactNode;

    if (interrupt.value.widget.type === "TravelerDetailsWidget") {
      widgetComponent = (
        <TravelerDetailsBottomSheet
          apiData={interrupt}
          args={interrupt.value.widget.args}
        />
      );
    } else if (interrupt.value.widget.type === "SeatPaymentWidget") {
      widgetComponent = <Component {...interrupt.value.widget.args} />;
    } else if (interrupt.value.widget.type === "AddBaggageWidget") {
      widgetComponent = <Component {...interrupt.value.widget.args} />;
    } else if (interrupt.value.widget.type === "NonAgentFlowWidget") {
      widgetComponent = (
        <NonAgentFlowBottomSheet
          apiData={interrupt}
          args={interrupt.value.widget.args}
        />
      );
    } else if (
      [
        "SeatPreferenceWidget",
        "SeatSelectionWidget",
        "SeatMapWidget",
        "SeatCombinedWidget",
      ].includes(interrupt.value.widget.type)
    ) {
      widgetComponent = <Component {...interrupt.value.widget.args} />;
    } else {
      widgetComponent = <Component {...interrupt.value.widget.args} />;
    }

    if (renderingWindow === "itinerary") {
      const interruptId =
        interrupt.value?.interrupt_id ||
        interrupt.value?.widget?.args?.interrupt_id;
      const argsHash = JSON.stringify(interrupt.value.widget.args || {});
      const widgetId =
        interruptId ||
        `${interrupt.value.widget.type}-${btoa(argsHash).slice(0, 8)}`;
      onRendered?.(true);
      return null;
    }

    onRendered?.(true);
    return widgetComponent;
  }

  debugLog("No widget found", { interruptType, interrupt });
  onRendered?.(false);
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

  const contentStr = JSON.stringify(interrupt, null, 2);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;

  const interruptObj = Array.isArray(interrupt) ? interrupt[0] : interrupt;
  const interruptType =
    interruptObj.type ||
    interruptObj.value?.type ||
    interruptObj.value?.value?.type;

  // Always mount DynamicRenderer so its effects run and it can render UI when available
  const dynamicWidget = (
    <DynamicRenderer
      interruptType={interruptType}
      interrupt={interruptObj}
      onRendered={setRenderedByDynamic}
    />
  );

  debugLog(
    renderedByDynamic
      ? "[INTERRUPT] rendering dynamic widget (and hiding fallback)"
      : "[INTERRUPT] no dynamic render yet; showing generic fallback",
  );

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
    if (Array.isArray(interrupt)) {
      return isExpanded ? interrupt : interrupt.slice(0, 5);
    } else {
      const entries = Object.entries(interrupt);
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
          data={{ interrupt, interruptType, shouldTruncate, isExpanded }}
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
                        const [key, value] = Array.isArray(interrupt)
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
              (Array.isArray(interrupt) && interrupt.length > 5)) && (
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
