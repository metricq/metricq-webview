/* eslint-env jquery */

import './../lib/vue.js'

import './../lib/jsurl.js'
import './../lib/key.js'
import 'https://api.metricq.zih.tu-dresden.de/metricq-history-v2.js'

import { createGlobalMetricQWebview, importMetricUrl } from './MetricQWebView.js'
import { showUserHint } from './interact.js'
import { Store } from './store.js'

import './app.js'

createGlobalMetricQWebview(document.getElementById('webview_container'), [], (new Date()).getTime() - 7200 * 1000, (new Date()).getTime(), Store)

// At Startup:
if (window.location.href.indexOf('#') > -1) {
  try {
    importMetricUrl()
  } catch (exc) {
    showUserHint('Could not import metrics.')
    console.log('Could not import metrics.')
    console.log(exc)
  }
} else {
  Vue.nextTick(function () { Store.togglePopup('newmetric') })
}
