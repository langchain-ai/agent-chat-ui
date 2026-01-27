"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background text-foreground">Loading...</div>}>
            <NotFoundContent />
        </Suspense>
    );
}

function NotFoundContent() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground gap-4">
            <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
            <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
            <Button asChild variant="outline">
                <Link href="/">Return Home</Link>
            </Button>
        </div>
    );
}
