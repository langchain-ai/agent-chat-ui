import PersonalizeTravelAssistant from "@/components/auth/PersonalizeTravelAssistant";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Personalize Your Travel Assistant - Flyo Setup',
  description: 'Customize your Flyo personal travel assistant with your preferences, frequent destinations, and travel habits for a truly personalized booking experience.',
  keywords: [
    'personalize travel assistant',
    'personal travel assistant setup',
    'AI travel customization',
    'travel preferences setup',
    'custom travel AI',
    'travel assistant configuration'
  ],
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Personalize Your Travel Assistant - Flyo Setup',
    description: 'Customize your personal travel assistant with your preferences for a personalized booking experience.',
    url: 'https://flyo.ai/personalize-travel',
  },
  twitter: {
    title: 'Personalize Your Travel Assistant - Flyo Setup',
    description: 'Customize your personal travel assistant with your preferences for a personalized booking experience.',
  },
};

export default function PersonalizeTravelPage() {
  return <PersonalizeTravelAssistant />;
}
