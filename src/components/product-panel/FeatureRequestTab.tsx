"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function FeatureRequestTab() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [category, setCategory] = useState("ui");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/features", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, priority, category }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit request");
            }

            toast.success("Feature request submitted!", {
                description: `Track your issue here: ${data.url}`,
                action: {
                    label: "View Issue",
                    onClick: () => window.open(data.url, "_blank"),
                },
            });

            // Reset form
            setTitle("");
            setDescription("");
            setPriority("medium");
            setCategory("ui");

        } catch (error: any) {
            toast.error("Error submitting feature request", {
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Request a Feature</h2>
                <p className="text-muted-foreground">
                    Have an idea to improve Reflexion? We'd love to hear it!
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Feature Title *</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief description of the feature"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the feature in detail. What problem does it solve? How would it work?"
                        rows={6}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger id="priority">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger id="category">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ui">UI/UX</SelectItem>
                                <SelectItem value="backend">Backend</SelectItem>
                                <SelectItem value="integration">Integration</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Feature Request"}
                </Button>
            </form>
        </div>
    );
}
