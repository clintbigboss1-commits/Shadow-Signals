FROM node:20-slim

WORKDIR /app

# Install production deps from lockfile (layer cached unless lockfile changes)
# - Use a private clean cache dir (--cache /tmp/npm-cache): Railway builders
#   inject a shared npm cache (fresh layers showed "cache hit"), and npm ci
#   hangs deterministically right after the packument phase with it.
# - Force IPv4 DNS in case the builder's IPv6 path to the registry blackholes.
# - timeout 420 turns a silent stall into a fast, visible failure.
ENV NODE_OPTIONS=--dns-result-order=ipv4first
COPY package.json package-lock.json ./
RUN timeout 420 npm ci --omit=dev --no-audit --no-fund --loglevel=verbose \
    --cache /tmp/npm-cache --prefer-online \
    --fetch-retries=5 --fetch-retry-mintimeout=2000 --fetch-retry-maxtimeout=60000 \
    && rm -rf /tmp/npm-cache

# Copy server source (includes db/schema.sql, routes, services, middleware)
COPY server/ ./server/

EXPOSE 3001

CMD ["node", "server/index.js"]
