import HomePage from '../page';

export default function EnglishPage() {
  return <HomePage />;
}

export const metadata = {
  title: 'Flyo - Your personal travel assistant',
  description: 'Experience the future of travel booking with Flyo, your personal travel assistant. Chat naturally to find and book flights, get personalized recommendations, and plan your perfect trip. Fast, intelligent, and user-friendly.',
  keywords: [
    'personal travel assistant',
    'AI travel assistant',
    'conversational flight booking',
    'chat to book flights',
    'intelligent travel planning',
    'AI flight search',
    'travel chatbot',
    'smart flight booking',
    'personalized travel recommendations',
    'personal travel planner'
  ],
  openGraph: {
    title: 'Flyo - Your personal travel assistant',
    description: 'Your personal travel assistant powered by AI. Chat naturally to book flights and plan travel with intelligent, personalized recommendations.',
    url: 'https://flyo.ai/en',
    locale: 'en_US',
  },
  twitter: {
    title: 'Flyo - Your personal travel assistant',
    description: 'Your personal travel assistant powered by AI. Chat naturally to book flights and plan travel with intelligent recommendations.',
  },
  alternates: {
    canonical: 'https://flyo.ai/en',
    languages: {
      'ar-SA': 'https://flyo.ai/ar',
    },
  },
};
