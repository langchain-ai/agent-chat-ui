import { Button } from "@/components/ui/button";
import { ThreadIdCopyable } from "./thread-id";
import { InboxItemInput } from "./inbox-item-input";
import useInterruptedActions from "../hooks/use-interrupted-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryState } from "nuqs";
import { constructOpenInStudioURL } from "../utils";
import { HumanInterrupt } from "@langchain/langgraph/prebuilt";

interface ThreadActionsViewProps {
  interrupt: HumanInterrupt;
  handleShowSidePanel: (showState: boolean, showDescription: boolean) => void;
  showState: boolean;
  showDescription: boolean;
}

function ButtonGroup({
  handleShowState,
  handleShowDescription,
  showingState,
  showingDescription,
}: {
  handleShowState: () => void;
  handleShowDescription: () => void;
  showingState: boolean;
  showingDescription: boolean;
}) {
  return (
    <div className="flex flex-row items-center justify-center gap-0">
      <Button
        variant="outline"
        className={cn(
          "rounded-l-md rounded-r-none border-r-[0px]",
          showingState ? "text-black" : "bg-white",
        )}
        size="sm"
        onClick={handleShowState}
      >
        State
      </Button>
      <Button
        variant="outline"
        className={cn(
          "rounded-l-none rounded-r-md border-l-[0px]",
          showingDescription ? "text-black" : "bg-white",
        )}
        size="sm"
        onClick={handleShowDescription}
      >
        Description
      </Button>
    </div>
  );
}

export function ThreadActionsView({
  interrupt,
  handleShowSidePanel,
  showDescription,
  showState,
}: ThreadActionsViewProps) {
  const [threadId] = useQueryState("threadId");
  const {
    acceptAllowed,
    hasEdited,
    hasAddedResponse,
    streaming,
    supportsMultipleMethods,
    streamFinished,
    loading,
    handleSubmit,
    handleIgnore,
    handleResolve,
    setSelectedSubmitType,
    setHasAddedResponse,
    setHasEdited,
    humanResponse,
    setHumanResponse,
    initialHumanInterruptEditValue,
  } = useInterruptedActions({
    interrupt,
  });
  const [apiUrl] = useQueryState("apiUrl");

  const handleOpenInStudio = () => {
    if (!apiUrl) {
      toast.error("Error", {
        description: "Please set the LangGraph deployment URL in settings.",
        duration: 5000,
        richColors: true,
        closeButton: true,
      });
      return;
    }

    const studioUrl = constructOpenInStudioURL(apiUrl, threadId ?? undefined);
    window.open(studioUrl, "_blank");
  };

  const threadTitle = interrupt.action_request.action || "Unknown";
  const actionsDisabled = loading || streaming;
  const ignoreAllowed = interrupt.config.allow_ignore;

  // Hide the component content while resolving/ignoring
  if (streaming && !hasEdited && !hasAddedResponse) {
    return (
      <div className="flex min-h-full w-full flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-foreground/50 h-2 w-2 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full"></div>
          <div className="bg-foreground/50 h-2 w-2 animate-[pulse_1.5s_ease-in-out_0.5s_infinite] rounded-full"></div>
          <div className="bg-foreground/50 h-2 w-2 animate-[pulse_1.5s_ease-in-out_1s_infinite] rounded-full"></div>
        </div>
        <p className="text-muted-foreground text-sm">Processing...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* Header */}
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <div className="flex items-center justify-start gap-2">
          <p className="text-xl font-semibold tracking-tight">{threadTitle}</p>
          {threadId && <ThreadIdCopyable threadId={threadId} />}
        </div>
        <div className="flex flex-row items-center justify-start gap-2">
          {apiUrl && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 bg-white"
              onClick={handleOpenInStudio}
            >
              Studio
            </Button>
          )}
          <ButtonGroup
            handleShowState={() => handleShowSidePanel(true, false)}
            handleShowDescription={() => handleShowSidePanel(false, true)}
            showingState={showState}
            showingDescription={showDescription}
          />
        </div>
      </div>

      {/* Actions */}
      <InboxItemInput
        acceptAllowed={acceptAllowed}
        hasEdited={hasEdited}
        hasAddedResponse={hasAddedResponse}
        interruptValue={interrupt}
        humanResponse={humanResponse}
        initialValues={initialHumanInterruptEditValue.current}
        setHumanResponse={setHumanResponse}
        streaming={streaming}
        streamFinished={streamFinished}
        supportsMultipleMethods={supportsMultipleMethods}
        setSelectedSubmitType={setSelectedSubmitType}
        setHasAddedResponse={setHasAddedResponse}
        setHasEdited={setHasEdited}
        handleSubmit={handleSubmit}
      />

      {/* Action Buttons - Compact row at bottom */}
      <div className="flex w-full flex-row items-center justify-start gap-2">
        <Button
          variant="default"
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={handleResolve}
          disabled={actionsDisabled}
        >
          Accept
        </Button>
        {ignoreAllowed && (
          <Button
            variant="outline"
            size="sm"
            className="border-gray-400 text-gray-700"
            onClick={handleIgnore}
            disabled={actionsDisabled}
          >
            Ignore
          </Button>
        )}
      </div>
    </div>
  );
}
