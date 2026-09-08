FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY src ./src
COPY eslint.config.mjs ./

RUN npm run lint


FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=build /app/src ./src

EXPOSE 3000

USER node

CMD ["npm", "start"]
