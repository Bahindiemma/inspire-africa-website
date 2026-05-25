# syntax=docker/dockerfile:1
# Multi-stage build for the INSPIRE AFRICA website (Next.js 15 / React 19).
# Produces a slim standalone runtime image. Requires `output: 'standalone'`
# in next.config.mjs.

# ---------- 1. Dependencies ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Pin npm to the version that generated package-lock.json so `npm ci`'s strict
# lock validation resolves the dependency tree identically to local dev
# (the base image's bundled npm rejects the lock otherwise).
RUN npm install -g npm@10.9.8
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2. Builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Public site URL is inlined into the client bundle at build time.
ARG NEXT_PUBLIC_SITE_URL=http://37.60.225.220
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

# ---------- 3. Runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Static assets + the standalone server output.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
