FROM node:24-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
  chromium \
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
  --no-install-recommends \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Set env var so puppeteer-core can find system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create app dir
WORKDIR /app

# Install deps
COPY package*.json ./

RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Start app
CMD ["npm", "run", "start"]
