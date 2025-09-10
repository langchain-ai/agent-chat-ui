import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://flyo.ai'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/en',
          '/ar',
          '/login',
          '/profile-confirmation',
          '/onboarding-quiz',
          '/personalize-travel',
        ],
        disallow: [
          '/api/',
          '/widgets',
          '/analytics-test',
          '/test-baggage',
          '/_next/',
          '/static/',
          '*.json',
          '/admin/',
          '/dashboard/',
          '/internal/',
        ],
      },
      // Special rules for specific bots
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/en',
          '/ar',
        ],
        disallow: [
          '/api/',
          '/widgets',
          '/analytics-test',
          '/login',
          '/profile-confirmation',
          '/onboarding-quiz',
          '/personalize-travel',
        ],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: [
          '/',
          '/en',
          '/ar',
        ],
        disallow: [
          '/api/',
          '/widgets',
          '/analytics-test',
          '/login',
          '/profile-confirmation',
          '/onboarding-quiz',
          '/personalize-travel',
        ],
      },
      {
        userAgent: 'Claude-Web',
        allow: [
          '/',
          '/en',
          '/ar',
        ],
        disallow: [
          '/api/',
          '/widgets',
          '/analytics-test',
          '/login',
          '/profile-confirmation',
          '/onboarding-quiz',
          '/personalize-travel',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
