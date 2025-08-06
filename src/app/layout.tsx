import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flyo Chat",
  description: "Flyo Chat by HavaHavai",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NuqsAdapter>{children}</NuqsAdapter>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Image Size Enforcer - Inline for immediate execution
              (function() {
                function resizeImage(img) {
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
