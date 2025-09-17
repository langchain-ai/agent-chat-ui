"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { storeJwtTokenWithValidation } from "@/services/authService";

export default function Bootstrap(): React.ReactNode {
  const params = useSearchParams();

  useEffect(() => {
    const jwt = params.get("jwt");
    const userType = params.get("userType") ?? "customer";
    const firstName = params.get("firstName") ?? undefined;
    const lastName = params.get("lastName") ?? undefined;

    if (jwt) {
      try {
        storeJwtTokenWithValidation(jwt, userType, firstName, lastName);
        window.location.replace("/");
      } catch (err) {
        console.error("Bootstrap auth failed:", err);
        window.location.replace("/login");
      }
    } else {
      window.location.replace("/login");
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
