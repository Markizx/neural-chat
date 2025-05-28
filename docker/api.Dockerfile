FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/api/package*.json ./packages/api/

# Install dependencies
RUN npm ci --legacy-peer-deps
RUN npm run bootstrap

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

# Build
RUN npm run build --workspace=@neuralchat/shared
RUN npm run build --workspace=@neuralchat/api

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY lerna.json ./
COPY packages/api/package*.json ./packages/api/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci --legacy-peer-deps --production
RUN npm run bootstrap -- --production

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist

WORKDIR /app/packages/api

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000

CMD ["node", "dist/index.js"]