"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, MessageSquare, Lightbulb, ListTodo, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReleaseNotesTab } from "./ReleaseNotesTab";
import { FeatureRequestTab } from "./FeatureRequestTab";
import { BacklogTab } from "./BacklogTab";
import { SupportChatTab } from "./SupportChatTab";
import { ArchitectureTab } from "./ArchitectureTab";
import { cn } from "@/lib/utils";

type TabType = "release-notes" | "feature-request" | "backlog" | "support" | "architecture";

interface ProductPanelProps {
    open: boolean;
    onClose: () => void;
}

export function ProductPanel({ open, onClose }: ProductPanelProps) {
    const activeTabState = useState<TabType>("backlog");
    const activeTab = activeTabState[0];
    const setActiveTab = activeTabState[1];

    const tabs = [
        { id: "backlog" as TabType, label: "Backlog", icon: ListTodo },
        { id: "release-notes" as TabType, label: "Release Notes", icon: FileText },
        { id: "architecture" as TabType, label: "Architecture", icon: Network },
        { id: "feature-request" as TabType, label: "Request Feature", icon: Lightbulb },
        { id: "support" as TabType, label: "Support", icon: MessageSquare },
    ];

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 rounded-t-lg"
                        style={{ height: "60vh", maxHeight: "600px" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-4 overflow-x-auto pb-1 -mb-1 hide-scrollbar">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap",
                                                activeTab === tab.id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted"
                                            )}
                                        >
                                            <Icon className="size-4" />
                                            <span className="font-medium">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full"
                            >
                                <X className="size-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto h-[calc(100%-73px)] p-6">
                            {activeTab === "backlog" && <BacklogTab />}
                            {activeTab === "release-notes" && <ReleaseNotesTab />}
                            {activeTab === "architecture" && <ArchitectureTab />}
                            {activeTab === "feature-request" && <FeatureRequestTab />}
                            {activeTab === "support" && <SupportChatTab />}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
