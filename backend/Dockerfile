FROM node:20-slim

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src

# Ensure the runtime data dir exists (volume will mount over it in Fly)
RUN mkdir -p /data

EXPOSE 4000
CMD ["node", "src/server.js"]

