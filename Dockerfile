FROM node:20-alpine as development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install glob rimraf

RUN npm install --only=development

COPY . .
COPY .env ./.env

RUN npm run build

CMD [ "npm", "run", "start:dev" ]

FROM node:20-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN mkdir -p /usr/src-prod/app

WORKDIR /usr/src-prod/app

COPY package*.json ./
RUN npm install --only=production && npm list

# Install pm2 globally
RUN npm install -g pm2

COPY . .

COPY .env ./.env

RUN pwd
RUN ls -la
RUN cat ./.env

RUN npm run build

CMD ["pm2-runtime", "app.json"]