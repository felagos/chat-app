FROM oven/bun:latest

WORKDIR /app

# Install OpenSSL for Prisma and curl for the healthcheck
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

COPY package.json bunfig.toml ./

RUN bun install

COPY src ./src
COPY tsconfig.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN bunx prisma generate

EXPOSE 3001

CMD ["bun", "run", "src/server.ts"]
