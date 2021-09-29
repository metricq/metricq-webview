FROM node:latest as build-stage
WORKDIR /app
COPY ./ .
RUN yarn install

ARG METRICQ_BACKEND=http://metricq-grafana/
ARG METRICQ_BACKEND_AUTH=user:pass

RUN echo "'VUE_APP_METRICQ_BACKEND=$METRICQ_BACKEND\n\
    VUE_APP_METRICQ_BACKEND_AUTH=$METRICQ_BACKEND_AUTH'" > .env.development.local


RUN yarn build

FROM nginx:mainline-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html/webview

