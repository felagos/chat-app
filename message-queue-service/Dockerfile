FROM oven/bun:latest

WORKDIR /app

COPY package.json bunfig.toml ./

RUN bun install --production

COPY src ./src
COPY tsconfig.json ./

EXPOSE 3001

CMD ["bun", "run", "src/server.ts"]
