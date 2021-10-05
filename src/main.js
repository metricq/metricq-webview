import Vue from 'vue'

import { createGlobalMetricQWebview, importMetricUrl } from './MetricQWebView.js'
import { showUserHint } from './interact.js'
import store from './store/'

import './app.js'

createGlobalMetricQWebview(document.getElementById('webview_container'), [], (new Date()).getTime() - 7200 * 1000, (new Date()).getTime(), store)

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
  Vue.nextTick(function () { store.commit('togglePopup', 'newmetric') })
}
