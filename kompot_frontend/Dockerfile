FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup -S kompot && adduser -S kompot -G kompot
COPY --from=build /app/public ./public
COPY --from=build --chown=kompot:kompot /app/.next/standalone ./
COPY --from=build --chown=kompot:kompot /app/.next/static ./.next/static
USER kompot
EXPOSE 3000
CMD ["node", "server.js"]
