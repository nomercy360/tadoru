FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
RUN bun install --frozen-lockfile

# Copy source
COPY packages/core/ packages/core/
COPY packages/api/ packages/api/
COPY tsconfig.json ./

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["bun", "run", "packages/api/src/index.ts"]
