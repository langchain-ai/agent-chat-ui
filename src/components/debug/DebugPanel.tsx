import React, { useState } from "react";

interface DebugPanelProps {
  data: any;
  label?: string;
  collapsed?: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  data,
  label = "Debug Data",
  collapsed = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  // Only render in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-md rounded-lg bg-gray-900 text-white shadow-lg">
      <div
        className="flex cursor-pointer items-center justify-between rounded-t-lg bg-gray-800 p-3"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="font-mono text-sm font-semibold">{label}</span>
        <span className="text-xs">{isCollapsed ? "▶" : "▼"}</span>
      </div>

      {!isCollapsed && (
        <div className="max-h-96 overflow-auto p-3">
          <pre className="text-xs break-words whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Hook for easy debugging
export const useDebugLog = (value: any, label?: string) => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.group(`🐛 Debug: ${label || "Value"}`);
      console.log(value);
      console.groupEnd();
    }
  }, [value, label]);
};

// Component wrapper for debugging props
export const withDebug = <P extends object>(
  Component: React.ComponentType<P>,
  debugLabel?: string,
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    useDebugLog(props, debugLabel || Component.displayName || Component.name);
    return (
      <Component
        {...(props as P)}
        ref={ref}
      />
    );
  });

  WrappedComponent.displayName = `withDebug(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
