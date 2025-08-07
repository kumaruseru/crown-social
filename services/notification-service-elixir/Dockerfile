# Elixir Notification Service Dockerfile
FROM elixir:1.15-alpine AS build

# Install build dependencies
RUN apk add --no-cache build-base npm git python3

# Create app directory
WORKDIR /app

# Install hex + rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Set build ENV
ENV MIX_ENV=prod

# Install mix dependencies
COPY mix.exs mix.lock ./
RUN mix deps.get --only=prod
RUN mkdir config

# Copy compile-time config files before we compile dependencies
# to ensure any relevant config change will trigger the dependencies
# to be re-compiled.
COPY config/config.exs config/prod.exs config/
RUN mix deps.compile

# Copy priv dir for releases
COPY priv priv

# Copy lib dir
COPY lib lib

# Compile the release
RUN mix compile

# Build assets
COPY assets/package.json assets/package-lock.json ./assets/
RUN npm --prefix ./assets ci --progress=false --no-audit --loglevel=error

COPY assets assets
RUN npm run --prefix ./assets deploy
RUN mix phx.digest

# Build the release
COPY rel rel
RUN mix release

# Start a new build stage so that the final image will only contain
# the compiled release and other runtime necessities
FROM alpine:3.18

# Install runtime dependencies
RUN apk add --no-cache openssl ncurses-libs libstdc++

# Create app user
RUN addgroup -S crown && adduser -S crown -G crown

# Create app directory and set ownership
RUN mkdir -p /app && chown -R crown:crown /app

USER crown
WORKDIR /app

# Copy the release from the build stage
COPY --from=build --chown=crown:crown /app/_build/prod/rel/crown_notification_service ./

EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1

CMD ["./bin/crown_notification_service", "start"]
