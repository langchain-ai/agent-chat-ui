/**
 * Analytics Debugging Utility
 * Helps identify and debug analytics tracking issues
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    analyticsDebugger: {
      enable: () => void;
      disable: () => void;
      getEvents: () => any[];
      clearEvents: () => void;
      checkSetup: () => void;
    };
  }
}

class AnalyticsDebugger {
  private enabled: boolean = false;
  private events: any[] = [];
  private originalGtag: ((...args: any[]) => void) | null = null;

  enable(): void {
    if (this.enabled) return;

    this.enabled = true;
    console.log("🔍 Analytics Debugger enabled");

    // Store original gtag function
    if (typeof window !== "undefined" && window.gtag) {
      this.originalGtag = window.gtag;

      // Wrap gtag to capture events
      window.gtag = (...args: any[]) => {
        this.events.push({
          timestamp: new Date().toISOString(),
          args: args,
        });

        console.log("📊 Analytics Event Captured:", args);

        // Call original gtag
        if (this.originalGtag) {
          this.originalGtag(...args);
        }
      };
    }
  }

  disable(): void {
    if (!this.enabled) return;

    this.enabled = false;
    console.log("🔍 Analytics Debugger disabled");

    // Restore original gtag
    if (this.originalGtag && typeof window !== "undefined") {
      window.gtag = this.originalGtag;
      this.originalGtag = null;
    }
  }

  getEvents(): any[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
    console.log("🗑️ Analytics events cleared");
  }

  checkSetup(): void {
    console.log("🔧 Analytics Setup Check:");

    if (typeof window === "undefined") {
      console.error("❌ Window object not available (SSR context)");
      return;
    }

    // Check if gtag is available
    const gtagAvailable = typeof window.gtag === "function";
    console.log(`gtag function: ${gtagAvailable ? "✅" : "❌"}`);

    // Check if dataLayer exists
    const dataLayerExists = Array.isArray(window.dataLayer);
    console.log(`dataLayer array: ${dataLayerExists ? "✅" : "❌"}`);

    // Check Google Analytics script
    const gaScript = document.querySelector(
      'script[src*="googletagmanager.com/gtag/js"]',
    );
    console.log(`GA script loaded: ${gaScript ? "✅" : "❌"}`);

    // Check GA config script
    const configScript = document.querySelector("script#google-analytics");
    console.log(`GA config script: ${configScript ? "✅" : "❌"}`);

    // Check network connectivity to GA
    if (gtagAvailable) {
      try {
        window.gtag("event", "debug_test", {
          event_category: "debug",
          event_label: "setup_check",
          debug: true,
        });
        console.log("✅ Test event sent successfully");
      } catch (error) {
        console.error("❌ Error sending test event:", error);
      }
    }

    // Display recent events
    if (this.events.length > 0) {
      console.log(`📊 Recent events (${this.events.length}):`);
      this.events.slice(-5).forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.args[0]} - ${event.timestamp}`);
      });
    } else {
      console.log("📊 No events captured yet");
    }
  }
}

// Create global instance
const analyticsDebuggerInstance = new AnalyticsDebugger();

// Make it available globally for browser console access
if (typeof window !== "undefined") {
  window.analyticsDebugger = {
    enable: () => analyticsDebuggerInstance.enable(),
    disable: () => analyticsDebuggerInstance.disable(),
    getEvents: () => analyticsDebuggerInstance.getEvents(),
    clearEvents: () => analyticsDebuggerInstance.clearEvents(),
    checkSetup: () => analyticsDebuggerInstance.checkSetup(),
  };
}

export default analyticsDebuggerInstance;

// Auto-enable in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔍 Analytics debugger available at window.analyticsDebugger");
  console.log("Commands:");
  console.log("  window.analyticsDebugger.enable() - Start capturing events");
  console.log("  window.analyticsDebugger.disable() - Stop capturing events");
  console.log("  window.analyticsDebugger.getEvents() - View captured events");
  console.log("  window.analyticsDebugger.clearEvents() - Clear event history");
  console.log("  window.analyticsDebugger.checkSetup() - Check GA setup");
}
