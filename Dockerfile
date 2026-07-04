FROM node:20-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm start"]
