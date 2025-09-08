import { getCurrentLanguage, isRTLLanguage, getTextDirection } from "./i18n";
import { cn } from "@/lib/utils";

/**
 * RTL-aware utility functions for styling and layout
 */

/**
 * Get RTL-aware margin/padding classes
 */
export const rtlAware = {
  // Margin utilities
  ml: (size: string) => `ltr:ml-${size} rtl:mr-${size}`,
  mr: (size: string) => `ltr:mr-${size} rtl:ml-${size}`,
  pl: (size: string) => `ltr:pl-${size} rtl:pr-${size}`,
  pr: (size: string) => `ltr:pr-${size} rtl:pl-${size}`,
  
  // Border utilities
  borderL: (size: string = "") => `ltr:border-l${size ? `-${size}` : ""} rtl:border-r${size ? `-${size}` : ""}`,
  borderR: (size: string = "") => `ltr:border-r${size ? `-${size}` : ""} rtl:border-l${size ? `-${size}` : ""}`,
  
  // Rounded corners
  roundedL: (size: string = "") => `ltr:rounded-l${size ? `-${size}` : ""} rtl:rounded-r${size ? `-${size}` : ""}`,
  roundedR: (size: string = "") => `ltr:rounded-r${size ? `-${size}` : ""} rtl:rounded-l${size ? `-${size}` : ""}`,
  
  // Text alignment
  textLeft: () => "ltr:text-left rtl:text-right",
  textRight: () => "ltr:text-right rtl:text-left",
  
  // Flexbox utilities
  justifyStart: () => "ltr:justify-start rtl:justify-end",
  justifyEnd: () => "ltr:justify-end rtl:justify-start",
  itemsStart: () => "ltr:items-start rtl:items-end",
  itemsEnd: () => "ltr:items-end rtl:items-start",
  
  // Positioning
  left: (size: string) => `ltr:left-${size} rtl:right-${size}`,
  right: (size: string) => `ltr:right-${size} rtl:left-${size}`,
  
  // Transform utilities for icons
  scaleX: () => "rtl:scale-x-[-1]",
  
  // Float utilities
  floatLeft: () => "ltr:float-left rtl:float-right",
  floatRight: () => "ltr:float-right rtl:float-left",
};

/**
 * Create RTL-aware className with conditional direction classes
 */
export function createRTLAwareClass(
  baseClasses: string,
  ltrClasses?: string,
  rtlClasses?: string,
  currentLanguage?: string
): string {
  const language = currentLanguage || getCurrentLanguage();
  const isRTL = isRTLLanguage(language as any);
  
  const classes = [baseClasses];
  
  if (ltrClasses) {
    classes.push(`ltr:${ltrClasses}`);
  }
  
  if (rtlClasses) {
    classes.push(`rtl:${rtlClasses}`);
  }
  
  return cn(...classes);
}

/**
 * Get direction attribute for HTML elements
 */
export function getDirectionAttribute(language?: string): "ltr" | "rtl" {
  const lang = language || getCurrentLanguage();
  return getTextDirection(lang as any);
}

/**
 * RTL-aware icon rotation classes
 */
export const rtlIconClasses = {
  // For directional icons like arrows
  arrow: "rtl:rotate-180",
  chevron: "rtl:rotate-180",
  
  // For icons that should be mirrored
  mirror: "rtl:scale-x-[-1]",
  
  // For icons that should not change
  neutral: "",
};

/**
 * Common RTL-aware layout patterns
 */
export const rtlLayouts = {
  // Form field with icon
  fieldWithIcon: "flex items-center ltr:flex-row rtl:flex-row-reverse gap-2",
  
  // Button with icon
  buttonWithIcon: "flex items-center ltr:flex-row rtl:flex-row-reverse gap-2",
  
  // Card with action on the side
  cardWithAction: "flex items-center justify-between ltr:flex-row rtl:flex-row-reverse",
  
  // Navigation items
  navItem: "flex items-center ltr:flex-row rtl:flex-row-reverse gap-3",
  
  // Form row with label and input
  formRow: "flex ltr:flex-row rtl:flex-row-reverse items-center gap-4",
  
  // Grid that should reverse in RTL
  gridReverse: "ltr:grid-flow-col rtl:grid-flow-col-reverse",
};

/**
 * Get RTL-aware spacing classes
 */
export function getRTLSpacing(property: "margin" | "padding", side: "left" | "right", size: string): string {
  const prefix = property === "margin" ? "m" : "p";
  
  if (side === "left") {
    return `ltr:${prefix}l-${size} rtl:${prefix}r-${size}`;
  } else {
    return `ltr:${prefix}r-${size} rtl:${prefix}l-${size}`;
  }
}

/**
 * RTL-aware flex direction utilities
 */
export const rtlFlex = {
  row: "ltr:flex-row rtl:flex-row-reverse",
  rowReverse: "ltr:flex-row-reverse rtl:flex-row",
  col: "flex-col", // Column direction doesn't change in RTL
  colReverse: "flex-col-reverse", // Column reverse doesn't change in RTL
};

/**
 * Check if current context is RTL
 */
export function useIsRTL(): boolean {
  return isRTLLanguage(getCurrentLanguage() as any);
}

/**
 * Get appropriate text alignment class based on direction
 */
export function getTextAlign(align: "left" | "right" | "center" | "justify"): string {
  switch (align) {
    case "left":
      return "ltr:text-left rtl:text-right";
    case "right":
      return "ltr:text-right rtl:text-left";
    case "center":
      return "text-center";
    case "justify":
      return "text-justify";
    default:
      return "ltr:text-left rtl:text-right";
  }
}
