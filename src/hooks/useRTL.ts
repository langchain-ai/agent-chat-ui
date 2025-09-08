import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  getCurrentLanguage, 
  isRTLLanguage, 
  getTextDirection,
  SupportedLanguage 
} from "@/utils/i18n";

/**
 * Hook for RTL support in React components
 */
export function useRTL() {
  const pathname = usePathname();
  const [isRTL, setIsRTL] = useState(false);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [language, setLanguage] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const currentLang = getCurrentLanguage();
    const currentDirection = getTextDirection(currentLang);
    const currentIsRTL = isRTLLanguage(currentLang);

    setLanguage(currentLang);
    setDirection(currentDirection);
    setIsRTL(currentIsRTL);
  }, [pathname]);

  return {
    isRTL,
    direction,
    language,
    // Helper functions
    getDirectionClass: (ltrClass: string, rtlClass: string) => 
      isRTL ? rtlClass : ltrClass,
    getMarginClass: (side: "left" | "right", size: string) => 
      side === "left" 
        ? (isRTL ? `mr-${size}` : `ml-${size}`)
        : (isRTL ? `ml-${size}` : `mr-${size}`),
    getPaddingClass: (side: "left" | "right", size: string) => 
      side === "left" 
        ? (isRTL ? `pr-${size}` : `pl-${size}`)
        : (isRTL ? `pl-${size}` : `pr-${size}`),
    getTextAlignClass: (align: "left" | "right") =>
      align === "left"
        ? (isRTL ? "text-right" : "text-left")
        : (isRTL ? "text-left" : "text-right"),
    getFlexDirectionClass: () => isRTL ? "flex-row-reverse" : "flex-row",
    getJustifyClass: (justify: "start" | "end") =>
      justify === "start"
        ? (isRTL ? "justify-end" : "justify-start")
        : (isRTL ? "justify-start" : "justify-end"),
  };
}

/**
 * Hook specifically for form RTL support
 */
export function useFormRTL() {
  const { isRTL, direction } = useRTL();

  return {
    isRTL,
    direction,
    // Form-specific utilities
    getLabelPosition: () => isRTL ? "right" : "left",
    getInputDirection: () => direction,
    getFormRowClass: () => isRTL ? "flex-row-reverse" : "flex-row",
    getFieldIconClass: () => isRTL ? "order-2" : "order-1",
    getFieldInputClass: () => isRTL ? "order-1" : "order-2",
    getValidationIconClass: () => isRTL ? "left-2" : "right-2",
  };
}

/**
 * Hook for button RTL support
 */
export function useButtonRTL() {
  const { isRTL } = useRTL();

  return {
    isRTL,
    getButtonIconClass: (position: "left" | "right") => {
      if (position === "left") {
        return isRTL ? "order-2 ml-2" : "order-1 mr-2";
      } else {
        return isRTL ? "order-1 mr-2" : "order-2 ml-2";
      }
    },
    getButtonContentClass: () => isRTL ? "flex-row-reverse" : "flex-row",
  };
}
