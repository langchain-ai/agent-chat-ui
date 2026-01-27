"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ClientBranding, getBranding } from "@/lib/branding";

interface BrandingContextType {
    branding: ClientBranding;
    loading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({
    children,
    client = process.env.NEXT_PUBLIC_CLIENT_NAME,
}: {
    children: React.ReactNode;
    client?: string;
}) {
    const [branding, setBranding] = useState<ClientBranding>(getBranding(client));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Apply branding styles to CSS variables
        const root = document.documentElement;
        root.style.setProperty("--primary", branding.colors.primary);
        root.style.setProperty("--radius", branding.style.border_radius);
        root.style.setProperty("--radius-button", branding.style.button_radius);

        setLoading(false);
    }, [branding]);

    return (
        <BrandingContext.Provider value={{ branding, loading }}>
            {children}
        </BrandingContext.Provider>
    );
}

export function useBranding() {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error("useBranding must be used within a BrandingProvider");
    }
    return context;
}
