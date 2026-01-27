
"use client";

import { useBranding } from "@/providers/Branding";
import { Button } from "./ui/button";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function Login() {
    const { branding, loading } = useBranding();
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleLogin = async () => {
        setIsSigningIn(true);
        await signIn("google");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg dark:bg-gray-800">
                <div className="flex flex-col items-center">
                    {/* Logo */}
                    <div
                        className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
                        style={{ backgroundColor: branding.colors.primary + "10" }} // 10% opacity
                    >
                        {branding.logo_url ? (
                            <img
                                src={branding.logo_url}
                                alt={branding.name}
                                className="h-12 w-12 object-contain"
                            />
                        ) : (
                            <div
                                className="h-12 w-12 rounded-full"
                                style={{ backgroundColor: branding.colors.primary }}
                            />
                        )}
                    </div>

                    <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Welcome to {branding.name}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Sign in to access your intelligent agent workspace
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <Button
                        onClick={handleLogin}
                        disabled={isSigningIn}
                        className="flex w-full items-center justify-center gap-3 py-6 text-base font-medium transition-all hover:scale-[1.02]"
                        style={{
                            backgroundColor: branding.colors.primary,
                            // Add a subtle glow effect with the brand color
                            boxShadow: `0 4px 14px 0 ${branding.colors.primary}66`
                        }}
                    >
                        {isSigningIn ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                            </svg>
                        )}
                        Sign in with Google
                    </Button>

                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
