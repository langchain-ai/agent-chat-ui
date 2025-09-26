import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  detectOnAppLoad,
  detectOnLogin,
  getCurrentCurrencyInfo,
  refreshCurrencyDetection,
  initializeCurrencyDetection,
  type CurrencyDetectionResult
} from "@/services/currencyDetectionService";

interface CurrencyDetectionContextType {
  isInitialized: boolean;
  isDetecting: boolean;
  lastDetectionResult: CurrencyDetectionResult | null;
  currentCurrency: string;
  currentCountry: string;
  currencyDetails?: {
    code: string;
    name: string;
    symbol: string;
  };
  countryName?: string;
  detectCurrency: () => Promise<CurrencyDetectionResult>;
  refreshDetection: () => Promise<CurrencyDetectionResult>;
  error: string | null;
}

const CurrencyDetectionContext = createContext<CurrencyDetectionContextType | undefined>(
  undefined,
);

export const useCurrencyDetection = (): CurrencyDetectionContextType => {
  const context = useContext(CurrencyDetectionContext);
  if (context === undefined) {
    throw new Error(
      "useCurrencyDetection must be used within a CurrencyDetectionProvider",
    );
  }
  return context;
};

interface CurrencyDetectionProviderProps {
  children: ReactNode;
  autoInitialize?: boolean; // Whether to automatically initialize on mount
}

export const CurrencyDetectionProvider: React.FC<CurrencyDetectionProviderProps> = ({
  children,
  autoInitialize = true,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetectionResult, setLastDetectionResult] = useState<CurrencyDetectionResult | null>(null);
  const [currentCurrency, setCurrentCurrency] = useState("INR");
  const [currentCountry, setCurrentCountry] = useState("IN");
  const [currencyDetails, setCurrencyDetails] = useState<any>(undefined);
  const [countryName, setCountryName] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Update current info from the currency detection service
  const updateCurrentInfo = () => {
    try {
      const info = getCurrentCurrencyInfo();
      setCurrentCurrency(info.currency);
      setCurrentCountry(info.country);
      setCurrencyDetails(info.currencyDetails);
      setCountryName(info.countryName);
    } catch (err) {
      console.error("Failed to update current currency info:", err);
    }
  };

  // Initialize currency detection on mount
  useEffect(() => {
    if (!autoInitialize) return;

    const initialize = async () => {
      try {
        setIsDetecting(true);
        setError(null);

        console.log("🚀 Initializing currency detection on app load...");
        const result = await detectOnAppLoad();

        if (result) {
          setLastDetectionResult(result);
          if (!result.success && result.error) {
            setError(result.error.message);
          }
        }

        // Update current info after initialization
        updateCurrentInfo();

        setIsInitialized(true);
        console.log("✅ Currency detection initialized successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize currency detection";
        console.error("❌ Currency detection initialization failed:", errorMessage);
        setError(errorMessage);

        // Still update current info to show fallback values
        updateCurrentInfo();
        setIsInitialized(true); // Mark as initialized even if detection failed
      } finally {
        setIsDetecting(false);
      }
    };

    initialize();
  }, [autoInitialize]);

  // Manual currency detection
  const detectCurrency = async (): Promise<CurrencyDetectionResult> => {
    try {
      setIsDetecting(true);
      setError(null);

      console.log("🔍 Manual currency detection triggered...");
      const result = await detectOnLogin(); // Use login detection for manual triggers

      setLastDetectionResult(result);
      updateCurrentInfo();

      if (!result.success && result.error) {
        setError(result.error.message);
      }

      console.log("✅ Manual currency detection completed:", result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Currency detection failed";
      console.error("❌ Manual currency detection failed:", errorMessage);
      setError(errorMessage);

      const fallbackResult: CurrencyDetectionResult = {
        success: false,
        currency: currentCurrency,
        country: currentCountry,
        source: "fallback",
        data: { wasUpdated: false },
        error: { code: "DETECTION_FAILED", message: errorMessage },
      };

      setLastDetectionResult(fallbackResult);
      return fallbackResult;
    } finally {
      setIsDetecting(false);
    }
  };

  // Refresh currency detection (clears cache)
  const refreshDetection = async (): Promise<CurrencyDetectionResult> => {
    try {
      setIsDetecting(true);
      setError(null);
      
      console.log("🔄 Refreshing currency detection...");
      const result = await refreshCurrencyDetection();
      
      setLastDetectionResult(result);
      updateCurrentInfo();
      
      if (!result.success && result.error) {
        setError(result.error.message);
      }
      
      console.log("✅ Currency detection refresh completed:", result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Currency detection refresh failed";
      console.error("❌ Currency detection refresh failed:", errorMessage);
      setError(errorMessage);
      
      const fallbackResult: CurrencyDetectionResult = {
        success: false,
        currency: currentCurrency,
        country: currentCountry,
        source: "fallback",
        data: { wasUpdated: false },
        error: { code: "REFRESH_FAILED", message: errorMessage },
      };
      
      setLastDetectionResult(fallbackResult);
      return fallbackResult;
    } finally {
      setIsDetecting(false);
    }
  };

  const contextValue: CurrencyDetectionContextType = {
    isInitialized,
    isDetecting,
    lastDetectionResult,
    currentCurrency,
    currentCountry,
    currencyDetails,
    countryName,
    detectCurrency,
    refreshDetection,
    error,
  };

  return (
    <CurrencyDetectionContext.Provider value={contextValue}>
      {children}
    </CurrencyDetectionContext.Provider>
  );
};

// Hook to get just the current currency info without the full context
export const useCurrentCurrency = () => {
  const context = useCurrencyDetection();
  return {
    currency: context.currentCurrency,
    country: context.currentCountry,
    currencyDetails: context.currencyDetails,
    countryName: context.countryName,
    isInitialized: context.isInitialized,
  };
};

// Hook to check if currency detection is in progress
export const useCurrencyDetectionStatus = () => {
  const context = useCurrencyDetection();
  return {
    isInitialized: context.isInitialized,
    isDetecting: context.isDetecting,
    error: context.error,
    lastResult: context.lastDetectionResult,
  };
};
