FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN npm ci

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace", "@x10think/web", "--", "--host", "0.0.0.0"]
