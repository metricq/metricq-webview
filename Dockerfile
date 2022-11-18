FROM node:lts as build-stage

RUN yarn config set logFilters --json '{ code: "YN0013", level: "discard" }'

WORKDIR /app
COPY .yarn/releases .yarn/releases/
COPY yarn.lock package.json .yarnrc.yml ./
RUN YARN_CHECKSUM_BEHAVIOR=ignore yarn install
COPY src src/
COPY public public/
COPY lib lib/
COPY .eslintrc .env babel.config.js vue.config.js ./

ARG METRICQ_BACKEND=http://metricq-grafana/
ARG METRICQ_BACKEND_AUTH=user:pass

ENV VUE_APP_METRICQ_BACKEND=${METRICQ_BACKEND}
ENV VUE_APP_METRICQ_BACKEND_AUTH=${METRICQ_BACKEND_AUTH}

RUN NODE_OPTIONS=--openssl-legacy-provider yarn build

FROM nginx:mainline-alpine as production-stage

ENV METRICQ_BACKEND=
ENV METRICQ_BACKEND_USER=
ENV METRICQ_BACKEND_PASS=

COPY ./docker/50-webview-backend.sh /docker-entrypoint.d/
COPY --from=build-stage /app/dist /usr/share/nginx/html/webview
