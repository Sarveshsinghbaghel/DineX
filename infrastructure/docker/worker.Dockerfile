FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker

RUN npm ci

CMD ["npm", "run", "dev", "--workspace", "@x10think/worker"]
