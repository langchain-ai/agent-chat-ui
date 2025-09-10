import React from 'react';

interface StructuredDataProps {
  data: object;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Predefined structured data for different page types
export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Flyo",
  "alternateName": "Flyo - Your personal travel assistant",
  "url": "https://flyo.ai",
  "logo": "https://flyo.ai/logo.png",
  "description": "Your personal travel assistant powered by AI for intelligent flight booking and travel planning",
  "foundingDate": "2024",
  "founder": {
    "@type": "Organization",
    "name": "HavaHavai"
  },
  "sameAs": [
    "https://twitter.com/havahavai",
    "https://linkedin.com/company/havahavai"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "https://flyo.ai/contact"
  }
};

export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Flyo - Your personal travel assistant",
  "url": "https://flyo.ai",
  "description": "Your personal travel assistant powered by AI. Book flights and plan travel with smart, personalized recommendations.",
  "publisher": {
    "@type": "Organization",
    "name": "HavaHavai"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://flyo.ai/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

export const webApplicationStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Flyo - Your personal travel assistant",
  "url": "https://flyo.ai",
  "description": "Your personal travel assistant powered by conversational AI for booking flights and planning trips",
  "applicationCategory": "TravelApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "featureList": [
    "Personal AI-powered flight search",
    "Conversational booking interface",
    "Personalized travel recommendations",
    "Multi-language support (English & Arabic)",
    "Real-time flight information",
    "Personal travel planning"
  ],
  "screenshot": "https://flyo.ai/screenshot.png",
  "softwareVersion": "1.0",
  "author": {
    "@type": "Organization",
    "name": "HavaHavai"
  }
};

export const breadcrumbStructuredData = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does Flyo's personal travel assistant work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Flyo is your personal travel assistant that uses advanced AI to understand your travel needs through natural conversation. Simply chat with your personal assistant to search for flights, get personalized recommendations, and book your perfect trip."
      }
    },
    {
      "@type": "Question",
      "name": "Is Flyo free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Flyo is free to use. You only pay for the flights you book, with no additional booking fees from our platform."
      }
    },
    {
      "@type": "Question",
      "name": "What languages does Flyo support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Flyo currently supports English and Arabic, with plans to add more languages in the future."
      }
    },
    {
      "@type": "Question",
      "name": "How secure is my booking information?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Flyo uses industry-standard encryption and security measures to protect your personal and payment information. We comply with international data protection standards."
      }
    }
  ]
};
