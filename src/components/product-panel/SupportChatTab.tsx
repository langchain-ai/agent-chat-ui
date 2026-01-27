"use client";

import React from "react";
import { MessageSquare, Mail, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SupportChatTab() {
    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Get Support</h2>
                <p className="text-muted-foreground">
                    Need help? We're here to assist you.
                </p>
            </div>

            <div className="space-y-4">
                <div className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <MessageSquare className="size-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-2">Live Chat Support</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Chat with our support team in real-time. Available Monday-Friday, 9AM-5PM EST.
                            </p>
                            <Button disabled>
                                Start Chat (Coming Soon)
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <Mail className="size-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-2">Email Support</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Send us an email and we'll get back to you within 24 hours.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = "mailto:support@reflexion.ai"}
                            >
                                Email Us
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <Github className="size-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-2">Source Code</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                View the source code for this project on GitHub.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => window.open("https://github.com/bcolemanau/Reflexion", "_blank")}
                            >
                                View on GitHub
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
