# syntax=docker/dockerfile:1
FROM node:18-alpine AS deps
RUN apk add --no-cache git openssh

WORKDIR /app
ENV NODE_ENV development
COPY .yarn .yarn
COPY ["package.json", ".yarnrc.yml", "yarn.lock", "./"]
# Building linux/arm64 images with QEMU is 🐌
RUN yarn install --frozen-lockfile --network-timeout 1000000

FROM node:18-alpine AS build
WORKDIR /app
ENV NODE_ENV production
#COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:18-alpine AS runner
WORKDIR /app
ARG HCC_IMAGE_TAG

ENV NODE_ENV production
ENV PORT 3000
ENV HCC_IMAGE_TAG=$HCC_IMAGE_TAG

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