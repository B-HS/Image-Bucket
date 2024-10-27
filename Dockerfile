FROM oven/bun:1 AS base
WORKDIR /usr/src/app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

COPY server.ts .
COPY .env .env

ENV NODE_ENV=production
EXPOSE 10001

ENTRYPOINT ["bun", "run", "server.ts"]