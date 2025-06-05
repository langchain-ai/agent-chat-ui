import React from "react";
import Image from "next/image";

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
  const logoSrc = variant === "violet" 
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
  variant = "violet-black",
}: {
  width?: number;
  height?: number;
  className?: string;
  variant?: "violet-black" | "violet-white" | "black" | "white";
}) {
  const logoSrc = variant === "violet-black"
    ? "/Logo + right text/SVG/Icon Violet Text Black Right.svg"
    : variant === "violet-white"
    ? "/Logo + right text/SVG/Icon Violet Text White Right.svg"
    : variant === "black"
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
