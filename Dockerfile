# syntax=docker/dockerfile:1
FROM node:18-slim AS deps
RUN apt update
RUN apt install git libseccomp2 -y
RUN apt clean
WORKDIR /app
ENV NODE_ENV development
COPY ["package.json", "yarn.lock", "./"]
# Something strange building linux/arm64 images and yarn timeout
# https://github.com/docker/build-push-action/issues/471
RUN yarn install --frozen-lockfile --network-timeout 1000000

FROM node:18-slim AS build
WORKDIR /app
ENV NODE_ENV production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:18-slim AS runner
WORKDIR /app
ENV NODE_ENV production
ENV PORT 3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/next.config.js ./
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]