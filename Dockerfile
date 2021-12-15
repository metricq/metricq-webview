FROM node:lts as build-stage
WORKDIR /app
COPY ./ .
RUN YARN_CHECKSUM_BEHAVIOR=ignore yarn install

ARG METRICQ_BACKEND=http://metricq-grafana/
ARG METRICQ_BACKEND_AUTH=user:pass

ENV VUE_APP_METRICQ_BACKEND=${METRICQ_BACKEND}
ENV VUE_APP_METRICQ_BACKEND_AUTH=${METRICQ_BACKEND_AUTH}

RUN yarn build

FROM nginx:mainline-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html/webview

