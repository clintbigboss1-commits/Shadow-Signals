FROM node:20-slim

WORKDIR /app

# Install production deps from lockfile (layer cached unless lockfile changes)
# maxsockets=3 works around npm hangs on constrained builders; the 300s timeout
# turns a silent builder stall into a fast, visible failure
COPY package.json package-lock.json ./
RUN npm config set maxsockets 3 && \
    timeout 300 npm ci --omit=dev --no-audit --no-fund --loglevel=info --fetch-retries=5 --fetch-retry-mintimeout=2000 --fetch-retry-maxtimeout=60000

# Copy server source (includes db/schema.sql, routes, services, middleware)
COPY server/ ./server/

EXPOSE 3001

CMD ["node", "server/index.js"]
