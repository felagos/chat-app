FROM oven/bun:latest as base

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bunfig.toml* ./

# Install dependencies (only production)
RUN bun install --production

# Copy source code
COPY . .

# Generate Prisma
RUN bun run prisma:generate

EXPOSE 3000

CMD ["bun", "run", "start"]
