import OnboardingQuiz from "@/components/auth/OnboardingQuiz";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Travel Preferences Quiz - Personalize Your Flyo Experience',
  description: 'Complete our quick travel preferences quiz to personalize your Flyo personal travel assistant. Help us understand your travel style for better flight recommendations.',
  keywords: [
    'travel preferences',
    'travel quiz',
    'personalize travel assistant',
    'personal travel assistant setup',
    'travel style quiz',
    'AI travel personalization'
  ],
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Travel Preferences Quiz - Personalize Your Flyo Experience',
    description: 'Complete our quick quiz to personalize your personal travel assistant for better recommendations.',
    url: 'https://flyo.ai/onboarding-quiz',
  },
  twitter: {
    title: 'Travel Preferences Quiz - Personalize Your Flyo Experience',
    description: 'Complete our quick quiz to personalize your personal travel assistant for better recommendations.',
  },
};

export default function OnboardingQuizPage() {
  return <OnboardingQuiz />;
}
