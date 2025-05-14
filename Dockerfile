# 使用 Node.js 18 作為基礎映像
FROM node:18-alpine AS base

# 安裝 pnpm
RUN npm install -g pnpm

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安裝依賴
FROM base AS deps
RUN pnpm install --frozen-lockfile

# 構建應用
FROM deps AS builder
COPY . .
# 創建 .env.production 文件，可以在構建時設置環境變量
RUN touch .env.production
RUN pnpm build

# 生產環境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# 複製必要的文件
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 暴露端口 (Cloud Run 會自動設置 PORT 環境變量)
EXPOSE 8080

# 啟動命令
CMD ["pnpm", "start"]
