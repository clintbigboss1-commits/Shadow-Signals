FROM node:20-alpine

WORKDIR /app

# Install production deps from lockfile (layer cached unless lockfile changes)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy server source (includes db/schema.sql, routes, services, middleware)
COPY server/ ./server/

EXPOSE 3001

CMD ["node", "server/index.js"]
