"use client";

import { ProfileConfirmation } from "@/components/auth";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

export default function ProfileConfirmationPage(): React.ReactNode {
  return (
    <>
      <Toaster />
      <ProfileConfirmation />
    </>
  );
}
