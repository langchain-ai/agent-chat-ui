"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const DUMMY_USER = {
  name: "John Doe",
  email: "john.doe@example.com",
  initials: "JD",
};

export function UserProfile() {
  return (
    <div className="flex items-center gap-3 border-t border-gray-200 p-4 dark:border-gray-700">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-gray-200 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {DUMMY_USER.initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
          {DUMMY_USER.name}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{DUMMY_USER.email}</p>
      </div>
    </div>
  );
}
