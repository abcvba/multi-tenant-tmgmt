FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL - required by Prisma's query engine on Alpine (musl libc)
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Same OpenSSL requirement for the production container
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 5001

ENTRYPOINT ["./entrypoint.sh"]
