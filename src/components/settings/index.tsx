"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Monitor,
  Sun,
  Moon,
  Globe,
  Bell,
  Shield,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ icon, title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {icon}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-50">{title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-[200px]" />;
  }

  const options = [
    { value: "system", icon: Monitor, label: "System" },
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <div className="flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            theme === value
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function LanguageSelector() {
  const [language, setLanguage] = useState("ko");

  const languages = [
    { value: "ko", label: "한국어" },
    { value: "en", label: "English" },
    { value: "ja", label: "日本語" },
  ];

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
    >
      {languages.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="size-5 text-gray-600 dark:text-gray-400" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your application preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Appearance Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Appearance
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <SettingRow
                icon={<Sun className="size-5" />}
                title="Theme"
                description="Select your preferred color theme"
              >
                <ThemeSelector />
              </SettingRow>
            </div>
          </section>

          {/* Language Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Language & Region
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <SettingRow
                icon={<Globe className="size-5" />}
                title="Display Language"
                description="Choose your preferred language"
              >
                <LanguageSelector />
              </SettingRow>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Notifications
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <SettingRow
                icon={<Bell className="size-5" />}
                title="Push Notifications"
                description="Receive notifications for agent updates"
              >
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </SettingRow>
            </div>
          </section>

          {/* Privacy Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Privacy
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <SettingRow
                icon={<Shield className="size-5" />}
                title="Usage Analytics"
                description="Help improve the app by sharing anonymous usage data"
              >
                <Switch checked={analytics} onCheckedChange={setAnalytics} />
              </SettingRow>
            </div>
          </section>

          {/* About Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              About
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <SettingRow
                icon={<Info className="size-5" />}
                title="Deep Agent Builder"
                description="Version 1.0.0"
              >
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  v1.0.0
                </span>
              </SettingRow>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
