# ---- Stage 1: build ----
FROM ghcr.io/pnpm/pnpm:12 AS builder
RUN pnpm runtime set node 24 -g
WORKDIR /app

# Copy only the dependency manifests first so Docker can cache the install step
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
    pnpm install --store-dir /var/cache/pnpm --frozen-lockfile

# Now copy the source code and build the app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- Stage 2: run ----
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Standalone output does not include public/ or .next/static, so copy them manually
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Run as the unprivileged "node" user, not root
USER node
EXPOSE 3000
CMD ["node", "server.js"]