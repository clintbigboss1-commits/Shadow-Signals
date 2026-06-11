FROM node:20-alpine

WORKDIR /app

# Install production deps from lockfile (layer cached unless lockfile changes)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --loglevel=info --fetch-retries=5 --fetch-retry-mintimeout=2000 --fetch-retry-maxtimeout=60000

# Copy server source (includes db/schema.sql, routes, services, middleware)
COPY server/ ./server/

EXPOSE 3001

CMD ["node", "server/index.js"]
