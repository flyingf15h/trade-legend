FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# the public URL gets baked into the build for the form-post origin check
ARG ORIGIN
ENV ORIGIN=$ORIGIN
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/build build
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/drizzle drizzle
COPY package.json .
ENV NODE_ENV=production PORT=3000 DATABASE_URL=/data/crumb.db OTP_MODE=demo
# keep the SQLite file on a mounted volume so it survives redeploys
VOLUME /data
EXPOSE 3000
CMD ["node", "build"]
