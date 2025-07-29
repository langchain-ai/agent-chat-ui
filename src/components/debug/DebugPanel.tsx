import React, { useState } from 'react';

interface DebugPanelProps {
  data: any;
  label?: string;
  collapsed?: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  data, 
  label = 'Debug Data', 
  collapsed = true 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-gray-900 text-white rounded-lg shadow-lg">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer bg-gray-800 rounded-t-lg"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="font-mono text-sm font-semibold">{label}</span>
        <span className="text-xs">
          {isCollapsed ? '▶' : '▼'}
        </span>
      </div>
      
      {!isCollapsed && (
        <div className="p-3 max-h-96 overflow-auto">
          <pre className="text-xs whitespace-pre-wrap break-words">
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
    if (process.env.NODE_ENV === 'development') {
      console.group(`🐛 Debug: ${label || 'Value'}`);
      console.log(value);
      console.groupEnd();
    }
  }, [value, label]);
};

// Component wrapper for debugging props
export const withDebug = <P extends object>(
  Component: React.ComponentType<P>,
  debugLabel?: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    useDebugLog(props, debugLabel || Component.displayName || Component.name);
    return <Component {...props} ref={ref} />;
  });
};
