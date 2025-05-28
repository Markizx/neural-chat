FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/ui-kit/package*.json ./packages/ui-kit/
COPY packages/web/package*.json ./packages/web/

# Install dependencies
RUN npm ci --legacy-peer-deps
RUN npm run bootstrap

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/ui-kit ./packages/ui-kit
COPY packages/web ./packages/web

# Build
RUN npm run build --workspace=@neuralchat/shared
RUN npm run build --workspace=@neuralchat/ui-kit
RUN npm run build --workspace=@neuralchat/web

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/packages/web/build /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]