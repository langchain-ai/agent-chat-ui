# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Install pnpm globally (cached layer)
RUN npm install -g pnpm@10.5.1

# Copy only package files first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
# Railway's native build cache will cache this layer if package files don't change
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Install pnpm globally (cached layer)
RUN npm install -g pnpm@10.5.1

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Copy source files (this should be after node_modules for better caching)
COPY . .

# Accept build arguments for NEXT_PUBLIC_ environment variables
ARG NEXT_PUBLIC_LANGSMITH_API_KEY
ARG NEXT_PUBLIC_LANGSMITH_ENDPOINT
ARG NEXT_PUBLIC_LANGSMITH_PROJECT

# Set environment variables for build
ENV NEXT_PUBLIC_LANGSMITH_API_KEY=${NEXT_PUBLIC_LANGSMITH_API_KEY}
ENV NEXT_PUBLIC_LANGSMITH_ENDPOINT=${NEXT_PUBLIC_LANGSMITH_ENDPOINT}
ENV NEXT_PUBLIC_LANGSMITH_PROJECT=${NEXT_PUBLIC_LANGSMITH_PROJECT}

# Set NODE_ENV for faster builds
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
# Railway's native build cache will cache this layer when source code doesn't change
RUN pnpm run build

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
