FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm if not present
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy application code
COPY . .

# Add non-root user for security (use different UID/GID to avoid conflicts)
RUN addgroup -S appuser && \
    adduser -S appuser -G appuser && \
    chown -R appuser:appuser /app && \
    mkdir -p /app/.next && \
    chown -R appuser:appuser /app/.next

# Expose port (Next.js uses 3000 internally)
EXPOSE 3000

USER appuser
