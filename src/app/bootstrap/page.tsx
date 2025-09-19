"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  storeJwtTokenWithValidation,
  setHideOwnerActions,
} from "@/services/authService";

export default function Bootstrap(): React.ReactNode {
  const params = useSearchParams();

  useEffect(() => {
    const jwt = params.get("jwt");
    const userType = params.get("userType") ?? "customer";
    const firstName = params.get("firstName") ?? undefined;
    const lastName = params.get("lastName") ?? undefined;
    const hideOwnerActionsParam = params.get("hideOwnerActions");

    if (jwt) {
      try {
        storeJwtTokenWithValidation(jwt, userType, firstName, lastName);
        // Persist UI flag if provided and propagate to next page as a fallback
        let redirectUrl = "/";
        if (hideOwnerActionsParam != null) {
          const normalized = hideOwnerActionsParam.toLowerCase();
          const hide = normalized === "true" || normalized === "1";
          setHideOwnerActions(hide);
          const qp = new URLSearchParams();
          qp.set("hideOwnerActions", hide ? "true" : "false");
          redirectUrl = `/${qp.toString() ? `?${qp.toString()}` : ""}`;
        }
        // Give WebViews a moment to flush storage before navigating
        setTimeout(() => {
          window.location.replace(redirectUrl);
        }, 100);
      } catch (err) {
        console.error("Bootstrap auth failed:", err);
        setTimeout(() => {
          window.location.replace("/login");
        }, 100);
      }
    } else {
      setTimeout(() => {
        window.location.replace("/login");
      }, 100);
    }
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-gray-600">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-400" />
        <p>Setting up your session…</p>
      </div>
    </div>
  );
}
