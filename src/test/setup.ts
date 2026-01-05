import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock nuqs
vi.mock('nuqs', () => ({
  useQueryState: (key: string, options?: { defaultValue?: string }) => {
    return [options?.defaultValue ?? null, vi.fn()];
  },
}));
