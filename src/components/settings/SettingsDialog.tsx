"use client";

import { Settings as SettingsIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/providers/Settings";

export function SettingsDialog() {
  const { userSettings, updateUserSettings, resetUserSettings } = useSettings();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 hover:bg-accent"
        >
          <SettingsIcon className="size-5" />
          <span>설정</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Settings</DialogTitle>
          <DialogDescription>
            Customize your chat experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Font Family Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Appearance</h3>
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="font-family">Font Style</Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      userSettings.fontFamily === "sans" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontFamily: "sans" })
                    }
                    className="flex-1"
                  >
                    Sans Serif
                  </Button>
                  <Button
                    variant={
                      userSettings.fontFamily === "serif" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontFamily: "serif" })
                    }
                    className="flex-1"
                  >
                    Serif
                  </Button>
                  <Button
                    variant={
                      userSettings.fontFamily === "mono" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontFamily: "mono" })
                    }
                    className="flex-1"
                  >
                    Monospace
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      userSettings.fontSize === "small" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontSize: "small" })
                    }
                    className="flex-1"
                  >
                    Small
                  </Button>
                  <Button
                    variant={
                      userSettings.fontSize === "medium" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontSize: "medium" })
                    }
                    className="flex-1"
                  >
                    Medium
                  </Button>
                  <Button
                    variant={
                      userSettings.fontSize === "large" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontSize: "large" })
                    }
                    className="flex-1"
                  >
                    Large
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-scheme">Color Scheme</Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      userSettings.colorScheme === "light" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ colorScheme: "light" })
                    }
                    className="flex-1"
                  >
                    Light
                  </Button>
                  <Button
                    variant={
                      userSettings.colorScheme === "dark" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ colorScheme: "dark" })
                    }
                    className="flex-1"
                  >
                    Dark
                  </Button>
                  <Button
                    variant={
                      userSettings.colorScheme === "auto" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ colorScheme: "auto" })
                    }
                    className="flex-1"
                  >
                    Auto
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* UI Behavior Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">UI Behavior</h3>
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-collapse">Auto-collapse Tool Calls</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically collapse tool call details after response completes
                  </p>
                </div>
                <Switch
                  id="auto-collapse"
                  checked={userSettings.autoCollapseToolCalls}
                  onCheckedChange={(checked) =>
                    updateUserSettings({ autoCollapseToolCalls: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-width">Chat Width</Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      userSettings.chatWidth === "default" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ chatWidth: "default" })
                    }
                    className="flex-1"
                  >
                    Default
                  </Button>
                  <Button
                    variant={
                      userSettings.chatWidth === "wide" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ chatWidth: "wide" })
                    }
                    className="flex-1"
                  >
                    Wide
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Section */}
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={resetUserSettings}
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
