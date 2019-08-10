FROM node:12-alpine

ENV APP_ROOT /web

RUN apk update && apk add ffmpeg

RUN mkdir ${APP_ROOT}
WORKDIR ${APP_ROOT}
ADD package*.json "${APP_ROOT}/"

RUN npm ci

ADD . ${APP_ROOT}

RUN npm run build
