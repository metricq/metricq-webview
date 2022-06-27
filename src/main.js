import Vue from 'vue'

import { createGlobalMetricQWebview, importMetricUrl } from './MetricQWebView.js'
import store from './store/'

import './app.js'

createGlobalMetricQWebview(document.getElementById('webview_container'), [], (new Date()).getTime() - 7200 * 1000, (new Date()).getTime(), store)

// At Startup:
if (window.location.href.indexOf('#') > -1) {
  try {
    importMetricUrl()
  } catch (exc) {
    Vue.toasted.error('Ungültige URL: Metriken konnten nicht hinzugefügt werden.', store.state.toastConfiguration)
    console.log('Could not import metrics.')
    console.log(exc)
  }
} else {
  Vue.nextTick(function () { store.commit('togglePopup', 'newmetric') })
}

// as the CSS loading is pretty lazy (read slow), we hide main_app until it is loaded.
document.getElementById('main_app').style.display = 'flex'
document.getElementById('loading_app').remove()
