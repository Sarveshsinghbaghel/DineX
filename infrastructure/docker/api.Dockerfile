FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN npm ci

EXPOSE 4000

CMD ["npm", "run", "dev", "--workspace", "@x10think/api", "--", "--host", "0.0.0.0"]
