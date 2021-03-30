import './../lib/vue.js'

import './../lib/jsurl.js'
import './../lib/key.js'
import 'https://api.metricq.zih.tu-dresden.de/metricq-history-v2.js'

import { createGlobalMetricQWebview, importMetricUrl } from './MetricQWebView.js'
import { globalPopup, mainApp } from './app.js'
import { Store } from './store.js'

createGlobalMetricQWebview(document.querySelector('.row_body'), [], (new Date()).getTime() - 7200 * 1000, (new Date()).getTime(), Store)

// At Startup:
if (window.location.href.indexOf('#') > -1) {
  try {
    importMetricUrl()
  } catch (exc) {
    console.log('Could not import metrics.')
    console.log(exc)
  }
} else {
  Vue.nextTick(function () { globalPopup.presetSelection = true })
}

function initNonVueButtons () {
  document.getElementById('button_export').addEventListener('click', function (evt) {
    globalPopup.export = !globalPopup.export
  })
  document.getElementById('button_configuration').addEventListener('click', function (evt) {
    mainApp.togglePopup()
  })
}

document.addEventListener('DOMContentLoaded', initNonVueButtons)
