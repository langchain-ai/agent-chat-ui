"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/authService";
import { cn } from "@/lib/utils";
import { useConfirmation } from "@/hooks/useConfirmation";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

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
  const { isOpen, options, confirm, handleConfirm, handleCancel } =
    useConfirmation();
  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Confirm Logout",
      message:
        "Are you sure you want to logout? You will need to sign in again to access your account.",
      confirmText: "Yes, Logout",
      cancelText: "Cancel",
    });

    if (confirmed) {
      logout();
    }
  };

  return (
    <>
      <Button
        onClick={handleLogout}
        variant={variant}
        size={size}
        className={cn(
          "h-auto w-full justify-start p-0 px-0 text-left text-gray-500 hover:text-gray-900",
          className,
        )}
      >
        Logout
      </Button>
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        confirmVariant={options.confirmVariant}
      />
    </>
  );
};

export default LogoutButton;
