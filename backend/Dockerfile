FROM oven/bun:latest

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY bunfig.toml* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Generate Prisma
RUN bun run prisma:generate

EXPOSE 3000

# Run TypeScript directly with bun
CMD ["bun", "run", "src/server.ts"]