# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG GROQ_API_KEY
ARG UPSTASH_REDIS_REST_URL
ARG UPSTASH_REDIS_REST_TOKEN

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_BUILD=true

# Set environment variables from build args (with dummy defaults for local builds)
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL:-https://dummy.convex.cloud}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-pk_test_dummy_key_for_build}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY:-sk_test_dummy_key_for_build}
ENV GROQ_API_KEY=${GROQ_API_KEY:-dummy_key}
ENV UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL:-https://dummy.upstash.io}
ENV UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN:-dummy_token}

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]