# Stage 1: Build dependencies
FROM node:18-slim AS builder

WORKDIR /app

# Copy files
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Stage 2: Runtime image
FROM node:18-slim

# Install Chromium dependencies only (no dev tools)
RUN apt-get update && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  wget \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Set environment variable so puppeteer knows where Chromium is
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set working directory
WORKDIR /app

# Copy from builder stage
COPY --from=builder /app .

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "whatsapp-api.js"]
