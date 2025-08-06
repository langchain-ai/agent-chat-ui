import * as React from "react";
import { cn } from "@/lib/utils";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "absolute top-auto left-[-10000px] h-[1px] w-[1px] overflow-hidden",
          className,
        )}
        {...props}
      />
    );
  },
);
VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };
