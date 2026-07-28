FROM node:20-alpine
WORKDIR /app

# Install deps first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Non-root user for security
RUN addgroup -S dashboard && adduser -S dashboard -G dashboard
USER dashboard

EXPOSE 3001
CMD ["node", "index.js"]
