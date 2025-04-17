# === Stage 1: Build Stage (caching dependencies) ===
FROM node:18-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# === Stage 2: Final Minimal Image ===
FROM node:18-slim

WORKDIR /app

# Copy only node_modules dari builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY . .

# Expose port API
EXPOSE 3000

# Jalankan aplikasi
CMD [ "node", "whatsapp-api.js" ]
