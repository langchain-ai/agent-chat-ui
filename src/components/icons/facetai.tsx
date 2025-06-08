import React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

export function FacetAILogoSVG({
  width = 32,
  height = 32,
  className = "",
  variant = "violet",
}: {
  width?: number;
  height?: number;
  className?: string;
  variant?: "violet" | "black" | "white";
}) {
  const logoSrc =
    variant === "violet"
      ? "/Logo/SVG/Violet icon.svg"
      : variant === "black"
        ? "/Logo/SVG/Black icon.svg"
        : "/Logo/SVG/Whte Icon.svg";

  return (
    <Image
      src={logoSrc}
      alt="FacetAI Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}

export function FacetAITextLogoSVG({
  width = 120,
  height = 32,
  className = "",
  variant,
}: {
  width?: number;
  height?: number;
  className?: string;
  variant?: "violet-black" | "violet-white" | "black" | "white";
}) {
  const { theme, resolvedTheme } = useTheme();

  // Auto-select variant based on theme if not explicitly provided
  const effectiveVariant =
    variant ||
    (resolvedTheme === "dark" || theme === "dark"
      ? "violet-white"
      : "violet-black");

  const logoSrc =
    effectiveVariant === "violet-black"
      ? "/Logo + right text/SVG/Icon Violet Text Black Right.svg"
      : effectiveVariant === "violet-white"
        ? "/Logo + right text/SVG/Icon Violet Text White Right.svg"
        : effectiveVariant === "black"
          ? "/Logo + right text/SVG/Icon black Text Black Right.svg"
          : "/Logo + right text/SVG/Icon white Text white Right.svg";

  return (
    <Image
      src={logoSrc}
      alt="FacetAI Logo with Text"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
