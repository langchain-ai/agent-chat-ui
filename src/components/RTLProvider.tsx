"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getCurrentLanguage, getTextDirection, isRTLLanguage } from "@/utils/i18n";

/**
 * RTL Provider component that dynamically updates the document direction
 * based on the current language route
 */
export function RTLProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const currentLang = getCurrentLanguage();
    const direction = getTextDirection(currentLang);
    const isRTL = isRTLLanguage(currentLang);

    // Update document direction
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLang;
    
    // Update HTML class for RTL/LTR styling
    if (isRTL) {
      document.documentElement.classList.add('rtl');
      document.documentElement.classList.remove('ltr');
    } else {
      document.documentElement.classList.add('ltr');
      document.documentElement.classList.remove('rtl');
    }

    // Update body class for additional styling if needed
    document.body.style.direction = direction;
    
    if (process.env.NODE_ENV === "development") {
      console.log(`RTL Provider: Updated direction to ${direction} for language ${currentLang}`);
    }
  }, [pathname]);

  return <>{children}</>;
}

export default RTLProvider;
