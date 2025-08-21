import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getAirlineLogoPath } from "./utils";

interface AirlineLogoProps {
  airlineIata: string;
  airlineName: string;
  size?: "sm" | "md" | "lg";
}

export const AirlineLogo = ({
  airlineIata,
  airlineName,
  size = "md",
}: AirlineLogoProps) => {
  const logoPath = getAirlineLogoPath(airlineIata);

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-6 h-6", fallback: "w-4 h-4" },
    md: { container: "w-8 h-8", fallback: "w-6 h-6" },
    lg: { container: "w-10 h-10", fallback: "w-8 h-8" },
  };

  const { container, fallback } = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200",
        container,
      )}
    >
      {logoPath ? (
        <Image
          src={logoPath}
          alt={`${airlineName} logo`}
          width={size === "sm" ? 24 : size === "md" ? 32 : 40}
          height={size === "sm" ? 24 : size === "md" ? 32 : 40}
          className="airline-logo rounded-full object-contain"
          onError={(e) => {
            // Fallback to gray circle if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="${cn("rounded-full bg-gray-400", fallback)}"></div>`;
            }
          }}
        />
      ) : (
        <div className={cn("rounded-full bg-gray-400", fallback)}></div>
      )}
    </div>
  );
};
