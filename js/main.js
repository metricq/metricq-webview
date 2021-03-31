import './../lib/vue.js'

import './../lib/jsurl.js'
import './../lib/key.js'
import 'https://api.metricq.zih.tu-dresden.de/metricq-history-v2.js'

import { createGlobalMetricQWebview, importMetricUrl } from './MetricQWebView.js'
import { Store } from './store.js'

import './app.js'

createGlobalMetricQWebview(document.getElementById('webview_container'), [], (new Date()).getTime() - 7200 * 1000, (new Date()).getTime(), Store)

// At Startup:
if (window.location.href.indexOf('#') > -1) {
  try {
    importMetricUrl()
  } catch (exc) {
    console.log('Could not import metrics.')
    console.log(exc)
  }
} else {
  Vue.nextTick(function () { Store.togglePopup('presetSelection') })
}

function initNonVueButtons () {
  document.getElementById('button_export').addEventListener('click', function (evt) {
    Store.togglePopup('export')
  })
  document.getElementById('button_configuration').addEventListener('click', function (evt) {
    Store.togglePopup('configuration')
  })
}

document.addEventListener('DOMContentLoaded', initNonVueButtons)
