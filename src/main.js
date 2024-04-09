import Vue from 'vue'

import { createGlobalMetricQWebview, importMetricUrl } from './MetricQWebView.js'
import store from './store/'

import moment from 'moment'

import './app.js'
import { getMetricQBackendConfig } from '@/configuration'

async function startup () {
  const metricqBackendConfig = await getMetricQBackendConfig()
  createGlobalMetricQWebview(document.getElementById('webview_container'), moment().subtract(2, 'hours').valueOf(), moment().valueOf(), store, metricqBackendConfig)

  let imported = false

  try {
    imported = await importMetricUrl()
  } catch (exc) {
    Vue.toasted.error('Ungültige URL: Metriken konnten nicht hinzugefügt werden.', store.state.toastConfiguration)
    console.log('Could not import metrics.')
    console.log(exc)
  }

  if (!imported) {
    await Vue.nextTick()
    store.commit('togglePopup', 'newmetric')
  }

  // as the CSS loading is pretty lazy (read slow), we hide main_app until it is loaded.
  document.getElementById('main_app').style.display = 'flex'
  document.getElementById('loading_app').remove()
}

startup()
