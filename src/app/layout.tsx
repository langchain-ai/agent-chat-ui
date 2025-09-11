import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Script from "next/script";
import { StructuredData, organizationStructuredData, websiteStructuredData, webApplicationStructuredData } from "@/components/seo/StructuredData";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Flyo - Your personal travel assistant",
    template: "%s | Flyo - Your personal travel assistant"
  },
  description: "Flyo is your personal travel assistant powered by AI. Book flights, get travel recommendations, and plan your perfect trip with our conversational AI interface. Fast, smart, and personalized travel booking.",
  keywords: [
    "personal travel assistant",
    "AI travel assistant",
    "flight booking",
    "travel AI",
    "book flights online",
    "travel chatbot",
    "intelligent travel planning",
    "AI flight search",
    "travel recommendations",
    "flight deals",
    "travel booking platform",
    "personal travel planner"
  ],
  authors: [{ name: "HavaHavai" }],
  creator: "HavaHavai",
  publisher: "HavaHavai",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://flyo.ai',
    siteName: 'Flyo - Your personal travel assistant',
    title: 'Flyo - Your personal travel assistant',
    description: 'Flyo is your personal travel assistant powered by AI. Book flights, get travel recommendations, and plan your perfect trip with our conversational AI interface.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Flyo - Your personal travel assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flyo - Your personal travel assistant',
    description: 'Your personal travel assistant powered by AI. Book flights and plan travel with smart, personalized recommendations.',
    images: ['/twitter-image.png'],
    creator: '@havahavai',
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: ["/favicon.svg"],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://flyo.ai',
    languages: {
      'en-US': 'https://flyo.ai/en',
      'ar-SA': 'https://flyo.ai/ar',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-[100dvh]"
    >
      <body
        className={`${inter.className} fixed inset-0 h-[100dvh] w-full touch-manipulation overflow-hidden overscroll-none`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SLRTVD2EYS"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SLRTVD2EYS', {
              // Disable automatic enhanced measurement events
              send_page_view: true,  // Keep page views
              enhanced_measurement: {
                scrolls: false,      // Disable scroll tracking
                outbound_clicks: false, // Disable outbound click tracking
                site_search: false,  // Disable site search tracking
                video_engagement: false, // Disable video tracking
                file_downloads: false,   // Disable file download tracking
                form_interactions: false // Disable automatic form tracking (form_start, form_submit)
              }
            });
          `}
        </Script>

        {/* Analytics Debugger for Development */}
        {process.env.NODE_ENV === 'development' && (
          <Script
            id="analytics-debugger"
            strategy="afterInteractive"
          >
            {`
              // Import and initialize analytics debugger
              import('/utils/analyticsDebugger.js').then(module => {
                console.log('🔍 Analytics debugger loaded');
              }).catch(err => {
                console.warn('Analytics debugger failed to load:', err);
              });
            `}
          </Script>
        )}

        {/* Structured Data */}
        <StructuredData data={organizationStructuredData} />
        <StructuredData data={websiteStructuredData} />
        <StructuredData data={webApplicationStructuredData} />

        <NuqsAdapter>{children}</NuqsAdapter>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Image Size Enforcer - Inline for immediate execution (exclude airline logos)
              (function() {
                function resizeImage(img) {
                  // Skip airline logos
                  if (img.alt && img.alt.toLowerCase().includes('logo')) {
                    return;
                  }
                  // Also skip images with airline-logo class
                  if (img.classList && img.classList.contains('airline-logo')) {
                    return;
                  }

                  const size = window.innerWidth <= 480 ? 32 : window.innerWidth <= 768 ? 40 : 48;
                  img.style.setProperty('max-width', size + 'px', 'important');
                  img.style.setProperty('width', size + 'px', 'important');
                  img.style.setProperty('height', size + 'px', 'important');
                  img.style.setProperty('max-height', size + 'px', 'important');
                  img.style.setProperty('object-fit', 'cover', 'important');
                  img.style.setProperty('border-radius', '50%', 'important');
                  img.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.1)', 'important');
                  img.style.setProperty('display', 'inline-block', 'important');
                  img.style.setProperty('margin', '0.5rem', 'important');
                }

                function processImages() {
                  document.querySelectorAll('img').forEach(resizeImage);
                }

                // Process immediately
                processImages();

                // Set up mutation observer
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                      if (node.nodeType === 1) {
                        if (node.tagName === 'IMG') resizeImage(node);
                        node.querySelectorAll && node.querySelectorAll('img').forEach(resizeImage);
                      }
                    });
                  });
                });

                observer.observe(document.body, { childList: true, subtree: true });

                // Handle resize
                let resizeTimeout;
                window.addEventListener('resize', function() {
                  clearTimeout(resizeTimeout);
                  resizeTimeout = setTimeout(processImages, 100);
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
