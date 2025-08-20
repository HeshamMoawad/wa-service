# Stage 1: Build the application
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first to leverage Docker cache
COPY package*.json ./

# Install dependencies (including devDependencies for building)
RUN npm ci

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install production dependencies only
COPY --from=builder /usr/src/app/package*.json ./

RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /usr/src/app/dist ./dist

ENV MONGODB_HOST=mongodb
ENV MONGODB_PORT=27017
ENV MONGODB_USER=root
ENV MONGODB_PASSWORD=password

ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:prod"]


# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "curl -f http://localhost:3000/health || exit 1" ]