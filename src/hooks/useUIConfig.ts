import { useContext } from "react";
import UIConfigContext from "@/lib/ui-config-provider";

export const useUIConfig = () => {
  const ctx = useContext(UIConfigContext);
  if (!ctx)
    throw new Error("useUIConfig must be used within a UIConfigProvider");
  return ctx;
};
