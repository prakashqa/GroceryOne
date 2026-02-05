# ================================
# GroceryOne Backend Dockerfile
# Multi-stage build for monorepo structure
# ================================

# -------- Stage 1: Build --------
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ jq

WORKDIR /app

# Copy shared package first
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
RUN npm install --legacy-peer-deps
RUN npm run build

# Copy backend package.json
WORKDIR /app/backend
COPY backend/package*.json ./

# Remove @groceryone/shared from package.json using jq
RUN jq 'del(.dependencies["@groceryone/shared"])' package.json > package.json.tmp && \
    mv package.json.tmp package.json

# Install backend dependencies (without shared)
RUN npm install --legacy-peer-deps

# Link the shared package locally
RUN mkdir -p node_modules/@groceryone && \
    cp -r /app/packages/shared node_modules/@groceryone/shared

# Copy backend source
COPY backend/ ./

# Build backend
RUN npm run build

# -------- Stage 2: Production --------
FROM node:20-alpine AS production

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy shared package
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist ./node_modules/@groceryone/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json ./node_modules/@groceryone/shared/

# Copy built backend
COPY --from=builder --chown=nestjs:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/backend/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/backend/package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Switch to non-root user
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
