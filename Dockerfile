# syntax=docker/dockerfile:1

# --- Stage 1: Build frontend ---
FROM node:24-alpine AS frontend-build
ARG HCC_IMAGE_TAG
ENV VITE_HCC_IMAGE_TAG=$HCC_IMAGE_TAG
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock frontend/.yarnrc.yml* ./
RUN corepack enable && yarn install --immutable --network-timeout 1000000
COPY frontend/ .
RUN yarn build

# --- Stage 2: Build backend dependencies (cached) ---
FROM rust:1-alpine AS backend-deps
RUN apk add --no-cache musl-dev curl
WORKDIR /app
COPY backend/Cargo.toml backend/Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# --- Stage 3: Build backend ---
FROM backend-deps AS backend-build
COPY backend/src ./src
RUN touch src/main.rs && cargo build --release

# --- Stage 4: Runtime ---
FROM scratch AS runner
WORKDIR /app
LABEL org.opencontainers.image.description="HCC for raspi"
LABEL org.opencontainers.image.source="https://github.com/eetu/hcc"

COPY --from=backend-build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=backend-build /app/target/release/hcc-backend ./hcc-backend
COPY --from=frontend-build /app/dist ./dist

USER 1000

EXPOSE 3000

CMD ["./hcc-backend"]
