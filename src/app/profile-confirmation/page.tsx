"use client";

import { ProfileConfirmation } from "@/components/auth";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Confirm Your Profile - Complete Flyo Setup',
  description: 'Confirm your profile details to complete your Flyo account setup. Verify your information for secure and personalized travel booking.',
  keywords: [
    'profile confirmation',
    'account setup',
    'verify profile',
    'complete registration',
    'travel account verification',
    'personal travel assistant setup'
  ],
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Confirm Your Profile - Complete Flyo Setup',
    description: 'Complete your account setup by confirming your profile details for secure travel booking.',
    url: 'https://flyo.ai/profile-confirmation',
  },
  twitter: {
    title: 'Confirm Your Profile - Complete Flyo Setup',
    description: 'Complete your account setup by confirming your profile details for secure travel booking.',
  },
};

export default function ProfileConfirmationPage(): React.ReactNode {
  return (
    <>
      <Toaster />
      <ProfileConfirmation />
    </>
  );
}
