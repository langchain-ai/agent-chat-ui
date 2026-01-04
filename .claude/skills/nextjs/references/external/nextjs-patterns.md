# Next.js 15 Patterns & Best Practices

**Last Updated:** November 2025
**Documentation Version:** Next.js 15.3.3+
**Primary Source:** https://nextjs.org/docs

## Critical Patterns

### 1. App Router vs Pages Router

✅ **CORRECT - Use App Router (Future-Proof)**
```typescript
// app/layout.tsx - Root layout (required)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// app/page.tsx - Home page
export default function HomePage() {
  return <h1>Welcome to Next.js 15</h1>;
}

// app/dashboard/page.tsx - Nested route
export default function DashboardPage() {
  return <h1>Dashboard</h1>;
}
```

❌ **AVOID - Pages Router (Legacy)**
```typescript
// pages/index.tsx - Old pattern
export default function Home() {
  return <h1>Home</h1>;
}
```

**Why it matters:** App Router uses React Server Components, Suspense, and modern React features. It's the future of Next.js.

---

### 2. Server Components vs Client Components

✅ **CORRECT - Server Components by Default**
```typescript
// app/blog/page.tsx (Server Component - default)
import { prisma } from '@/lib/prisma';

export default async function BlogPage() {
  // Fetch data directly in component
  const posts = await prisma.post.findMany();

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

✅ **CORRECT - Client Components When Needed**
```typescript
// app/components/Counter.tsx
'use client'; // Mark as client component

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

❌ **WRONG - Using 'use client' Unnecessarily**
```typescript
// DON'T DO THIS - No need for 'use client' here
'use client';

export default function StaticContent() {
  return <div>Static content</div>;
}
```

**Why it matters:** Server Components reduce JavaScript bundle size, improve performance, and enable direct database access.

---

### 3. Data Fetching Strategies

✅ **CORRECT - Server Component Data Fetching**
```typescript
// app/products/page.tsx
import { db } from '@/lib/db';

export default async function ProductsPage() {
  const products = await db.product.findMany();

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

✅ **CORRECT - With Loading State (Suspense)**
```typescript
// app/products/page.tsx
import { Suspense } from 'react';
import { ProductList } from './ProductList';

export default function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>
      <Suspense fallback={<LoadingSkeleton />}>
        <ProductList />
      </Suspense>
    </div>
  );
}

// app/products/ProductList.tsx
async function ProductList() {
  const products = await db.product.findMany();
  return <div>{/* Render products */}</div>;
}
```

❌ **WRONG - useEffect in SSR Page**
```typescript
// DON'T DO THIS - Causes double fetching
'use client';
import { useEffect, useState } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Server already rendered, now fetching again on client
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts);
  }, []);

  return <div>{/* ... */}</div>;
}
```

**Why it matters:** Server-side fetching is faster, reduces client JavaScript, and improves SEO.

---

### 4. Rendering Strategies

✅ **CORRECT - Static Generation (SSG)**
```typescript
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';

// Generate static paths at build time
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    select: { slug: true }
  });

  return posts.map(post => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
  });

  if (!post) notFound();

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

✅ **CORRECT - Incremental Static Regeneration (ISR)**
```typescript
// app/products/[id]/page.tsx

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  return <div>{/* Render product */}</div>;
}
```

✅ **CORRECT - Dynamic Rendering (SSR)**
```typescript
// app/dashboard/page.tsx

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Fresh data on every request
  const user = await getCurrentUser();
  const stats = await getRealtimeStats(user.id);

  return <div>{/* Render dashboard */}</div>;
}
```

---

### 5. Route Handlers (API Routes)

✅ **CORRECT - Modern Route Handlers**
```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const posts = await prisma.post.findMany({
    where: { userId },
  });

  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, content } = await request.json();

  const post = await prisma.post.create({
    data: { title, content, userId },
  });

  return NextResponse.json(post, { status: 201 });
}
```

✅ **CORRECT - Dynamic Route Handler**
```typescript
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
  });

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(post);
}
```

---

### 6. Server Actions (Next.js 15)

✅ **CORRECT - Server Action Pattern**
```typescript
// app/actions/posts.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export async function createPost(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    title: formData.get('title'),
    content: formData.get('content'),
  };

  const validatedData = createPostSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: 'Invalid data', details: validatedData.error };
  }

  const post = await prisma.post.create({
    data: {
      ...validatedData.data,
      userId,
    },
  });

  revalidatePath('/posts');
  return { success: true, post };
}
```

✅ **CORRECT - Using Server Action in Form**
```typescript
// app/posts/new/page.tsx
import { createPost } from '@/app/actions/posts';

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

---

### 7. TypeScript Configuration

✅ **CORRECT - next.config.ts (Next.js 15+)**
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Recommended: fail build on type errors
    ignoreBuildErrors: false,
  },
  images: {
    domains: ['example.com'],
  },
};

export default nextConfig;
```

✅ **CORRECT - Strict TypeScript Config**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Common Mistakes

### 1. **Storing Sensitive Data in Client Components**

**Symptom:** API keys exposed in browser
**Cause:** Using environment variables in client components
**Fix:**
```typescript
// ❌ WRONG - Client component (exposed in browser)
'use client';
const apiKey = process.env.NEXT_PUBLIC_API_KEY; // EXPOSED!

// ✅ CORRECT - Server component or API route
// app/api/data/route.ts
const apiKey = process.env.API_KEY; // Server-side only
```

---

### 2. **Not Using Dynamic Imports for Large Dependencies**

**Symptom:** Large JavaScript bundle, slow page loads
**Cause:** Importing heavy libraries directly
**Fix:**
```typescript
// ❌ WRONG
import Chart from 'heavy-chart-library';

// ✅ CORRECT - Dynamic import
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('heavy-chart-library'), {
  ssr: false,
  loading: () => <p>Loading chart...</p>,
});
```

---

### 3. **Improper Cache Configuration**

**Symptom:** Stale data or excessive API calls
**Cause:** Not understanding Next.js 15 caching changes
**Fix:**

Next.js 15 changes: `fetch` requests, GET Route Handlers, and client navigations are **no longer cached by default**.

```typescript
// ✅ Explicit caching when needed
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 }, // Cache for 1 hour
});

// ✅ Or use route segment config
export const revalidate = 3600; // ISR
```

---

### 4. **Mixing Server and Client Data Fetching**

**Symptom:** Confusing data flow, hydration errors
**Cause:** Fetching data in both server and client
**Fix:**
```typescript
// ✅ CORRECT - Fetch in server, pass to client
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const data = await fetchData();

  return <ClientDashboard data={data} />;
}

// app/components/ClientDashboard.tsx
'use client';
export function ClientDashboard({ data }: { data: Data }) {
  // Use data, no fetching here
  return <div>{/* Interactive UI */}</div>;
}
```

---

### 5. **Overly Deep Directory Structures**

**Symptom:** Hard to navigate codebase
**Cause:** Too many nested folders
**Fix:**
```
❌ WRONG:
src/components/features/dashboard/widgets/weather/current/small/index.tsx

✅ CORRECT:
src/components/dashboard/WeatherWidget.tsx
src/components/dashboard/SmallWeatherWidget.tsx
```

---

### 6. **Single Massive utils.ts File**

**Symptom:** 2000+ line utility file
**Cause:** Not organizing utilities by domain
**Fix:**
```
❌ WRONG:
src/utils.ts (2000 lines)

✅ CORRECT:
src/lib/
  ├── date-utils.ts
  ├── string-utils.ts
  ├── validation.ts
  └── api-client.ts
```

---

### 7. **Not Using Turbopack (Next.js 15)**

**Symptom:** Slow development builds
**Cause:** Using old bundler
**Fix:**
```bash
# Next.js 15 uses Turbopack by default
npm run dev  # Automatically uses Turbopack
```

---

### 8. **Missing Image Optimization**

**Symptom:** Slow page loads, poor performance scores
**Cause:** Using regular `<img>` tags
**Fix:**
```typescript
// ❌ WRONG
<img src="/photo.jpg" alt="Photo" />

// ✅ CORRECT
import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  priority // Above the fold
/>
```

---

## Integration Patterns

### Pattern 1: Prisma Integration

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

### Pattern 2: Tailwind CSS v4 Setup

```typescript
// app/globals.css
@import "tailwindcss";

// postcss.config.mjs
export default {
  plugins: {
    tailwindcss: {},
  },
};
```

---

### Pattern 3: Environment Variables

```bash
# .env.local

# Public (accessible in browser)
NEXT_PUBLIC_APP_URL=https://example.com

# Private (server-side only)
DATABASE_URL=postgresql://...
API_SECRET_KEY=secret123
```

```typescript
// Usage
const publicUrl = process.env.NEXT_PUBLIC_APP_URL; // ✅ Works everywhere
const secret = process.env.API_SECRET_KEY; // ✅ Server-side only
```

---

### Pattern 4: Metadata & SEO

```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'My App',
    template: '%s | My App',
  },
  description: 'My awesome app',
  openGraph: {
    images: ['/og-image.jpg'],
  },
};

// app/blog/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
  });

  return {
    title: post?.title,
    description: post?.excerpt,
  };
}
```

---

### Pattern 5: Error Handling

```typescript
// app/error.tsx (Error boundary)
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

// app/not-found.tsx
export default function NotFound() {
  return <h1>404 - Page Not Found</h1>;
}
```

---

## Quick Reference

### Installation
```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
npm run dev
```

### Essential Imports

**Server Components:**
```typescript
import { headers, cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
```

**Client Components:**
```typescript
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
```

**Images:**
```typescript
import Image from 'next/image';
```

**Fonts:**
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
```

---

### Route Segment Config

```typescript
// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ISR - revalidate every 60 seconds
export const revalidate = 60;

// Fetch cache (Next.js 15)
export const fetchCache = 'force-cache';

// Runtime
export const runtime = 'edge'; // or 'nodejs'
```

---

## Performance Checklist

- [ ] Use Server Components by default
- [ ] Add 'use client' only when necessary
- [ ] Implement Suspense for loading states
- [ ] Use `next/image` for all images
- [ ] Dynamic import heavy libraries
- [ ] Configure ISR for semi-static pages
- [ ] Use route segment configs appropriately
- [ ] Enable TypeScript strict mode
- [ ] Implement proper error boundaries
- [ ] Use Turbopack (default in Next.js 15)

---

## Security Checklist

- [ ] Never expose secrets in client components
- [ ] Use NEXT_PUBLIC_ prefix only for truly public vars
- [ ] Implement CSRF protection for mutations
- [ ] Sanitize user inputs in Server Actions
- [ ] Use Zod or similar for input validation
- [ ] Implement rate limiting on API routes
- [ ] Use HttpOnly cookies for auth tokens
- [ ] Keep Next.js updated (security patches)

---

## Troubleshooting

### Hydration Errors

**Cause:** Server/client mismatch
**Fix:**
```typescript
// Use suppressHydrationWarning for dynamic content
<time suppressHydrationWarning>{new Date().toLocaleString()}</time>

// Or render client-side only
import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
);
```

---

### "Cannot find module" Errors

**Cause:** Path alias misconfiguration
**Fix:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### Build Failures

**Cause:** Type errors or ESLint issues
**Fix:**
```bash
# Check types
npx tsc --noEmit

# Check linting
npm run lint

# Fix linting
npm run lint -- --fix
```

---

## Resources

- **Official Docs:** https://nextjs.org/docs
- **Next.js 15 Release:** https://nextjs.org/blog/next-15
- **API Reference:** https://nextjs.org/docs/app/api-reference
- **Examples:** https://github.com/vercel/next.js/tree/canary/examples
- **Learn:** https://nextjs.org/learn

---

**Word Count:** ~2,600 words
**Last Verified:** November 12, 2025
**Next Review:** December 2025
