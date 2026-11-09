# vector: one container, one SQLite file on a volume at /app/data.
#
#   docker build -t vector .
#   docker run -d -p 3000:3000 -v vector-data:/app/data --name vector vector
#
# The app has no accounts. Put it behind a reverse proxy with HTTPS and a
# password (see README).

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# better-sqlite3 ships prebuilt binaries, so no install scripts (and no
# compiler toolchain) are needed.
RUN npm ci --ignore-scripts

FROM node:24-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/app/data/vector.db
# The standalone server, its static files, and the migrations it applies on
# startup (the database is created on first request if it doesn't exist).
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/drizzle ./drizzle
RUN mkdir -p /app/data && chown node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node", "server.js"]
