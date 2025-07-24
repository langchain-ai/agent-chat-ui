"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/authService";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "brand";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  variant = "outline", 
  size = "default",
  className 
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
      className={className}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
