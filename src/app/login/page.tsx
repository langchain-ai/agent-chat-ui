"use client";

import { Login } from "@/components/auth";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Sign In to Flyo - Your personal travel assistant',
  description: 'Sign in to your Flyo account to access your personal travel assistant. Book flights, manage trips, and get intelligent travel recommendations.',
  keywords: [
    'Flyo login',
    'personal travel assistant sign in',
    'travel assistant sign in',
    'AI travel account',
    'flight booking login',
    'travel app sign in'
  ],
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Sign In to Flyo - Your personal travel assistant',
    description: 'Access your personal travel assistant. Sign in to book flights and manage your trips.',
    url: 'https://flyo.ai/login',
  },
  twitter: {
    title: 'Sign In to Flyo - Your personal travel assistant',
    description: 'Access your personal travel assistant. Sign in to book flights and manage your trips.',
  },
};

export default function LoginPage(): React.ReactNode {
  return <Login />;
}
