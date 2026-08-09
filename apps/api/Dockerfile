FROM rust:1-bookworm AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY apps/api apps/api
ENV CARGO_TARGET_DIR=/app/target
RUN cargo build --release --manifest-path apps/api/Cargo.toml

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/api /usr/local/bin/api
ENV PORT=8080
EXPOSE 8080
CMD ["api"]
