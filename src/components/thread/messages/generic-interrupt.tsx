import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { componentMap, ComponentType } from "@/components/widgets";
import { DebugPanel } from "@/components/debug/DebugPanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useStreamContext } from "@/providers/Stream";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { useArtifact } from "../artifact";

// Debug utility function
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.group(`🐛 GenericInterrupt Debug: ${message}`);
    if (data !== undefined) {
      console.log(data);
    }
    console.trace();
    console.groupEnd();
  }
};

interface DynamicRendererProps {
  interruptType: string;
  interrupt: Record<string, any>;
}

// State to preserve UI widgets during interrupt processing
const preservedUIWidgets = new Map<string, any>();

// Component to monitor and preserve UI widgets
export const UIWidgetPreserver: React.FC = () => {
  const stream = useStreamContext();

  useEffect(() => {
    if (stream.values.ui) {
      stream.values.ui.forEach((uiWidget) => {
        // Preserve by both id and message_id
        if (uiWidget.id) {
          preservedUIWidgets.set(uiWidget.id, uiWidget);
        }
        if (uiWidget.metadata?.message_id) {
          preservedUIWidgets.set(uiWidget.metadata.message_id, uiWidget);
        }
        console.log(
          "🔍 Preserved UI widget:",
          uiWidget.id,
          uiWidget.metadata?.message_id,
        );
      });
    }
  }, [stream.values.ui]);

  return null; // This component doesn't render anything
};

// Wrapper component for TravelerDetailsWidget with bottom sheet
const TravelerDetailsBottomSheet: React.FC<{ apiData: any; args: any }> = ({
  apiData,
  args,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Get the actual ReviewWidget component
  const ReviewWidget = componentMap.TravelerDetailsWidget;

  // Function to close the bottom sheet
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SheetContent
        side="bottom"
        className="flex h-[90vh] flex-col overflow-hidden p-0 sm:h-[85vh]"
      >
        <SheetHeader className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <SheetTitle className="text-xl font-semibold">
            Review Your Booking
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto">
          <ReviewWidget
            apiData={apiData}
            {...args}
            isInBottomSheet={true}
            onClose={handleClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Wrapper component for NonAgentFlowWidget with bottom sheet
const NonAgentFlowBottomSheet: React.FC<{ apiData: any; args: any }> = ({
  apiData,
  args,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Get the actual NonAgentFlowWidget component
  const NonAgentFlowWidget = componentMap.NonAgentFlowWidget;

  // Function to close the bottom sheet
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SheetContent
        side="bottom"
        className="flex h-[90vh] flex-col overflow-hidden p-0 sm:h-[85vh]"
      >
        <SheetHeader className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <SheetTitle className="text-xl font-semibold">
            Complete Your Booking
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto">
          <NonAgentFlowWidget
            apiData={apiData}
            {...args}
            onClose={handleClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

console.log("DynamicRendererProps interface defined - checking props:", {
  interruptType: "will be logged in component",
  interrupt: "will be logged in component",
});

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({
  interruptType,
  interrupt,
}) => {
  console.log("🔄 STREAMING DATA - DynamicRenderer received:", {
    interruptType,
    interrupt,
    timestamp: new Date().toISOString(),
  });
  debugLog("DynamicRenderer called", { interruptType, interrupt });

  // Additional debugging for widget type checking
  console.log("🔍 Widget type check:", {
    interruptType,
    widgetType: interrupt.value?.widget?.type,
    attachmentId: interrupt.value?.metadata?.attachmentId,
    availableWidgets: Object.keys(componentMap),
    isWidgetTypeInMap: interrupt.value?.widget?.type in componentMap,
  });

  // Handle widgetFromBE interrupt type
  if (interruptType === "widgetFromBE") {
    const attachmentId = interrupt.value?.metadata?.attachmentId;

    if (attachmentId) {
      const stream = useStreamContext();
      const artifact = useArtifact();

      // First try to find in current UI widgets
      let matchingUIWidget = stream.values.ui?.find(
        (ui) =>
          ui.id === attachmentId || ui.metadata?.message_id === attachmentId,
      );

      // If not found in current UI widgets, try preserved widgets
      if (!matchingUIWidget) {
        matchingUIWidget = preservedUIWidgets.get(attachmentId);
        console.log("🔍 Checking preserved widgets for:", attachmentId);
        console.log("🔍 Found in preserved widgets:", matchingUIWidget);
      }

      console.log("🔍 All UI widgets:", JSON.stringify(stream.values.ui));
      console.log(
        "🔍 Preserved widgets:",
        Array.from(preservedUIWidgets.keys()),
      );
      console.log("🔍 Looking for attachmentId:", attachmentId);
      console.log("🔍 Matching widget found:", matchingUIWidget);

      if (matchingUIWidget) {
        debugLog("WidgetFromBE UI widget found", {
          attachmentId,
          uiWidget: matchingUIWidget,
        });

        return (
          <LoadExternalComponent
            key={matchingUIWidget.id}
            stream={stream}
            message={matchingUIWidget}
            meta={{ ui: matchingUIWidget, artifact }}
          />
        );
      }

      debugLog("No widgetFromBE UI widget found", { attachmentId, interrupt });
      console.log(
        `No widgetFromBE UI widget found for attachmentId: ${attachmentId} and interrupt: ${JSON.stringify(interrupt)}`,
      );
      return null;
    }

    debugLog("No attachmentId found in widgetFromBE interrupt", { interrupt });
    console.log(
      `No attachmentId found in widgetFromBE interrupt: ${JSON.stringify(interrupt)}`,
    );
    return null;
  }

  // Check if the type exists in componentMap (existing logic for "widget" type)
  if (
    interruptType === "widget" &&
    interrupt.value.widget.type in componentMap
  ) {
    const Component =
      componentMap[interrupt.value.widget.type as ComponentType];
    debugLog("Widget component found", {
      componentType: interrupt.value.widget.type,
      args: interrupt.value.widget.args,
    });

    // For TravelerDetailsWidget, render in bottom sheet
    if (interrupt.value.widget.type === "TravelerDetailsWidget") {
      return (
        <TravelerDetailsBottomSheet
          apiData={interrupt}
          args={interrupt.value.widget.args}
        />
      );
    }

    if (interrupt.value.widget.type === "SeatPaymentWidget") {
      return <Component {...interrupt.value.widget.args} />;
    }

    if (interrupt.value.widget.type === "AddBaggageWidget") {
      return <Component {...interrupt.value.widget.args} />;
    }

    // For NonAgentFlowWidget, render in bottom sheet
    if (interrupt.value.widget.type === "NonAgentFlowWidget") {
      return (
        <NonAgentFlowBottomSheet
          apiData={interrupt}
          args={interrupt.value.widget.args}
        />
      );
    }

    // For seat-related widgets, render directly without bottom sheet
    if (["SeatPreferenceWidget", "SeatSelectionWidget", "SeatMapWidget", "SeatCombinedWidget"].includes(interrupt.value.widget.type)) {
      return <Component {...interrupt.value.widget.args} />;
    }

    // For other widgets, pass the args object directly to the component
    return <Component {...interrupt.value.widget.args} />;
  }

  debugLog("No widget found", { interruptType, interrupt });
  console.log(
    `No widget found for interruptType: ${interruptType} and interrupt: ${JSON.stringify(interrupt)}`,
  );
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
  console.log("🔄 STREAMING DATA - GenericInterruptView received:", {
    interrupt,
    isArray: Array.isArray(interrupt),
    timestamp: new Date().toISOString(),
  });
  debugLog("GenericInterruptView rendered", { interrupt });

  const [isExpanded, setIsExpanded] = useState(false);

  const contentStr = JSON.stringify(interrupt, null, 2);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;

  // Extract interrupt object and type
  const interruptObj = Array.isArray(interrupt) ? interrupt[0] : interrupt;
  const interruptType = interruptObj.type || interruptObj.value?.type;

  debugLog("Interrupt processing", {
    interruptObj,
    interruptType,
    shouldTruncate,
    contentLines: contentLines.length,
  });

  // Try to render dynamic widget first
  const dynamicWidget = interruptType ? (
    <DynamicRenderer
      interruptType={interruptType}
      interrupt={interruptObj}
    />
  ) : null;

  // If dynamic widget exists, render it instead of generic view
  if (dynamicWidget) {
    return dynamicWidget;
  }

  // Function to truncate long string values
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
        // Return plain text for truncated content instead of a JSON object
        return `Truncated ${strValue.length} characters...`;
      }
    }

    return value;
  };

  // Process entries based on expanded state
  const processEntries = () => {
    if (Array.isArray(interrupt)) {
      return isExpanded ? interrupt : interrupt.slice(0, 5);
    } else {
      const entries = Object.entries(interrupt);
      if (!isExpanded && shouldTruncate) {
        // When collapsed, process each value to potentially truncate it
        return entries.map(([key, value]) => [key, truncateValue(value)]);
      }
      return entries;
    }
  };

  const displayEntries = processEntries();

  return (
    <>
      <DebugPanel
        data={{ interrupt, interruptType, shouldTruncate, isExpanded }}
        label="Generic Interrupt Debug"
      />
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
    </>
  );
}
