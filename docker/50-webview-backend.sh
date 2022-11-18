#!/bin/sh

set -e

if [ ! -z ${METRICQ_BACKEND} ]; then
    echo "{ \"backend\": \"${METRICQ_BACKEND}\", \"user\": \"${METRICQ_BACKEND_USER}\", \"password\": \"${METRICQ_BACKEND_PASS}\" }" > /usr/share/nginx/html/webview/configuration.json
fi

exit 0
