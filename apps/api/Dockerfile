FROM rust:1-bookworm AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/apps/api/target/release/api /usr/local/bin/api
ENV PORT=8080
EXPOSE 8080
CMD ["api"]
