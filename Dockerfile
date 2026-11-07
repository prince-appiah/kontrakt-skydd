FROM node:24-slim AS build
ENV CI=true
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter=api...
RUN pnpm --filter=@clauseguard/shared build && pnpm --filter=api build
RUN pnpm --filter=api deploy --legacy --prod /out

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./package.json
COPY --from=build /repo/apps/api/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "dist/main"]
