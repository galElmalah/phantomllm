# Stage 1: Build TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY src/server/ src/server/
COPY src/types/ src/types/
COPY tsconfig.server.json ./

RUN npx tsc --project tsconfig.server.json

# Stage 2: Production runtime
FROM node:22-alpine

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY docker/package.json ./
RUN npm install --omit=dev --ignore-scripts

COPY --from=builder /app/dist/server-build/ ./dist/

USER app

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

HEALTHCHECK --interval=3s --timeout=2s --start-period=2s --retries=3 \
  CMD wget --spider --quiet http://localhost:${PORT}/_admin/health || exit 1

CMD ["node", "--enable-source-maps", "dist/server/main.js"]
