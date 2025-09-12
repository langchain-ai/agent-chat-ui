import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect, useState } from "react";

import { getContentString } from "../utils";
import { parseAsBoolean, useQueryState } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { SquarePen, Grid3X3, X, MoreVertical, MessageCircle, DollarSign } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getJwtToken,
  decodeJwtPayload,
  getUserFullName,
} from "@/services/authService";
import { FlyoLogoSVG } from "@/components/icons/langgraph";
import { useStreamContext } from "@/providers/Stream";
import LogoutButton from "@/components/auth/LogoutButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { getSelectedCurrency, setSelectedCurrency, currencies } from "@/utils/currency-storage";
import { LanguageSelector } from "@/components/common/ui/LanguageSelector";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Logo component
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black">
        <div className="h-4 w-4 rounded-sm bg-white"></div>
      </div>
    </div>
  );
}

// Currency Search Select Component
interface CurrencySearchSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

function CurrencySearchSelect({ value, onValueChange }: CurrencySearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredCurrencies = currencies.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedCurrencies = showAll ? filteredCurrencies : filteredCurrencies.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search currencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Currency List */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {displayedCurrencies.map((currency) => (
          <div
            key={currency.code}
            className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${
              value === currency.code ? 'bg-gray-100 border border-gray-300' : ''
            }`}
            onClick={() => onValueChange(currency.code)}
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-sm">{currency.code}</span>
              <span className="text-sm text-gray-600">{currency.name}</span>
            </div>
            {value === currency.code && (
              <div className="w-2 h-2 bg-black rounded-full"></div>
            )}
          </div>
        ))}

        {/* Show More/Less Button */}
        {filteredCurrencies.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full p-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showAll ? 'Show Less' : `Show All Currencies`}
          </button>
        )}

        {filteredCurrencies.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No currencies found matching &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
    </div>
  );
}

// User Profile Component
function UserProfile() {
  const userName = getUserFullName();
  const userInitial = userName.charAt(0).toUpperCase();
  const [selectedCurrency, setSelectedCurrencyState] = useState(() => {
    return getSelectedCurrency();
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleWhatsAppClick = () => {
    const phoneNumber = "+918448549215";
    const message = encodeURIComponent("Chat with founder");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    try {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to open WhatsApp:', error);
      // Fallback: copy link to clipboard
      navigator.clipboard?.writeText(whatsappUrl).then(() => {
        alert('WhatsApp link copied to clipboard');
      }).catch(() => {
        alert('Please visit: ' + whatsappUrl);
      });
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrencyState(currencyCode);
    setSelectedCurrency(currencyCode);
    setIsSettingsOpen(false);
  };

  return (
    <div className="py-2 space-y-2">
      {/* WhatsApp Row */}
      <div
        className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
        onClick={handleWhatsAppClick}
      >
        <MessageCircle className="h-4 w-4 text-black flex-shrink-0" />
        <span className="text-sm text-black">Chat with founder</span>
      </div>

      {/* Language Row */}
      <LanguageSelector />

      {/* Currency Row - Fully Clickable */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <div className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
            <DollarSign className="h-4 w-4 text-black flex-shrink-0" />
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-black">Currency</span>
              <span className="text-sm text-gray-500">
              {selectedCurrency}
              </span>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Currency</DialogTitle>
          </DialogHeader>
          <CurrencySearchSelect
            value={selectedCurrency}
            onValueChange={handleCurrencyChange}
          />
        </DialogContent>
      </Dialog>

      {/* Black Separator Line */}
      <div className="border-t border-black mx-2"></div>

      {/* User Profile Row */}
      <div className="flex items-center gap-3 px-2 py-1.5">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-blue-500 text-sm font-medium text-white">
            {userInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate">{userName}</span>
          <LogoutButton className="text-xs text-gray-500 no-underline hover:text-gray-900 text-left" />
        </div>
      </div>
    </div>
  );
}

function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-1 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        let itemText = t.thread_id;
        if (
          typeof t.values === "object" &&
          t.values &&
          "messages" in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        const isActive = t.thread_id === threadId;

        return (
          <div
            key={t.thread_id}
            className={`group w-full cursor-pointer rounded-lg px-3 py-2 hover:bg-gray-100 ${
              isActive ? "bg-gray-100" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              onThreadClick?.(t.thread_id);
              if (t.thread_id === threadId) return;
              setThreadId(t.thread_id);
            }}
          >
            <div className="flex items-center justify-between">
              <p className="flex-1 truncate text-sm text-ellipsis text-gray-700">
                {itemText}
              </p>
              <MoreVertical className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="mx-3 h-10 w-full"
        />
      ))}
    </div>
  );
}

export default function ThreadHistory() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [threadId, _setThreadId] = useQueryState("threadId");
  const searchParams = useSearchParams();
  const router = useRouter();
  const stream = useStreamContext();

  const { getThreads, threads, threadsLoading } = useThreads();
  useEffect(() => {
    if (!threads.length) getThreads();
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden h-screen w-[260px] shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        {/* Header */}
        <div className="relative flex items-center justify-center border-b border-gray-200 p-0">
          <FlyoLogoSVG
            width={60}
            height={60}
            className="sm:h-[60px] sm:w-[60px]"
          />
          <div className="absolute right-3 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => setChatHistoryOpen((p) => !p)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-1 p-2">
          <div className="rounded-md border border-gray-300 p-1 shadow-sm">
            <Button
              variant="ghost"
              className="h-10 w-full justify-start gap-3 px-3 text-sm font-normal hover:bg-gray-100"
              onClick={() => {
                const params = new URLSearchParams(searchParams?.toString());
                params.delete("threadId");
                router.replace(
                  `${window.location.pathname}?${params.toString()}`,
                );
                setChatHistoryOpen(false);
                _setThreadId(null);
              }}
            >
              <SquarePen className="h-4 w-4" />
              New chat
            </Button>
          </div>
        </div>

        {/* Chats Section */}
        <div className="flex-1 overflow-hidden">
          <div className="px-3 py-2">
            <h3 className="text-xs font-medium tracking-wider text-gray-500 uppercase">
              Chats
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            {threadsLoading ? (
              <ThreadHistoryLoading />
            ) : (
              <ThreadList threads={threads} />
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-3">
          <UserProfile />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent
            side="left"
            className="flex w-[260px] flex-col p-0"
          >
            <VisuallyHidden>
              <SheetTitle>Chat History</SheetTitle>
            </VisuallyHidden>
            {/* Header */}
            <div className="flex items-center justify-center border-b border-gray-200 p-1">
              <FlyoLogoSVG
                width={50}
                height={50}
                className="sm:h-[50px] sm:w-[50px]"
              />
              <div className="flex items-center gap-2"></div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-1 p-2">
              <div className="rounded-md border border-gray-300 p-1 shadow-sm">
                <Button
                  variant="ghost"
                  className="h-10 w-full justify-start gap-3 px-3 text-sm font-normal hover:bg-gray-100"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams?.toString());
                    params.delete("threadId");
                    router.replace(
                      `${window.location.pathname}?${params.toString()}`,
                    );
                    setChatHistoryOpen(false);
                    _setThreadId(null);
                  }}
                >
                  <SquarePen className="h-4 w-4" />
                  New chat
                </Button>
              </div>
            </div>

            {/* Chats Section */}
            <div className="flex-1 overflow-hidden">
              <div className="px-3 py-2">
                <h3 className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Chats
                </h3>
              </div>
              <div className="flex-1 overflow-hidden">
                {threadsLoading ? (
                  <ThreadHistoryLoading />
                ) : (
                  <ThreadList
                    threads={threads}
                    onThreadClick={() => setChatHistoryOpen(false)}
                  />
                )}
              </div>
            </div>

            {/* User Profile */}
            <div className="border-t border-gray-200 p-3">
              <UserProfile />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
