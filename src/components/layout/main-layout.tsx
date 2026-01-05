"use client";

import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSidebarState } from "@/hooks/useSidebarState";
import Sidebar from "@/components/sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen] = useSidebarState();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar />
      </div>

      {/* Desktop Sidebar - No initial animation */}
      <div className="relative hidden lg:flex">
        <motion.div
          className="absolute z-20 h-full overflow-hidden border-r bg-white dark:bg-gray-900 dark:border-gray-700"
          style={{ width: 280 }}
          initial={false}
          animate={{ x: sidebarOpen ? 0 : -280 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="relative h-full" style={{ width: 280 }}>
            <Sidebar />
          </div>
        </motion.div>
      </div>

      {/* Main Content - CSS transition, no framer-motion */}
      <div
        className="relative flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ease-out"
        style={{
          marginLeft: sidebarOpen && isLargeScreen ? 280 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
