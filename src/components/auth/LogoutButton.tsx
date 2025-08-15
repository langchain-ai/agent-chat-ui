"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/authService";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "brand";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = "link",
  size = "sm",
  className,
}) => {
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={cn(
        "h-auto p-0 px-0 text-gray-500 hover:text-gray-900",
        className,
      )}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
