# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Bake API/WS URLs into the Vite build
ARG VITE_API_URL=http://localhost/api
ARG VITE_WS_URL=http://localhost
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build the application
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
