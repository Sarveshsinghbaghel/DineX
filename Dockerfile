# Multi-Stage Production Dockerfile for DineX API
# Stage 1: Build Workspace
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root manifest files
COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies and build typescript packages
RUN npm ci
RUN npm run build --workspace=@x10think/api

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install curl for healthcheck probe
RUN apk add --no-cache curl

# Copy root manifest files
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built JavaScript output from builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Use non-root node user for runtime security
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
