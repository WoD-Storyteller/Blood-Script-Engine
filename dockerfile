# =========================
# Build stage
# =========================
FROM node:20-slim AS builder

WORKDIR /app

# Install deps first (better cache)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build NestJS
RUN npm run build


# =========================
# Runtime stage
# =========================
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install tini for proper signal handling
RUN apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

# Copy only what we need
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Cloud Run requires listening on $PORT
EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]