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
  Vue.nextTick(function () { Store.togglePopup('presetSelection') })
}

function initNonVueButtons () {
  document.getElementById('button_export').addEventListener('click', function (evt) {
    Store.togglePopup('export')
  })
  document.getElementById('button_configuration').addEventListener('click', function (evt) {
    Store.togglePopup('configuration')
  })
  $(function () {
    const daterange = $('#date_range')

    const start = moment(window.MetricQWebView.instances[0].handler.startTime.getUnix())
    const end = moment(window.MetricQWebView.instances[0].handler.stopTime.getUnix())

    function cb (start, end) {
      $('#date_range span').html(start.format('DD/MM/YYYY HH:mm') + ' - ' + end.format('DD/MM/YYYY HH:mm'))
    }

    cb(start, end)
    daterange.daterangepicker({
      opens: 'left',
      timePicker: true,
      timePicker24Hour: true,
      showCustomRangeLabel: false,
      alwaysShowCalendars: true,
      locale: {
        format: 'DD/MM/YYYY HH:mm',
        firstDay: 1
      },
      startDate: start,
      endDate: end,
      ranges: window.MetricQWebView.instances[0].handler.labelMap
    }, function (start, end, label) {
      console.log(label)
      // TODO: vue nutzen
      cb(start, end)
      if (label) {
        window.MetricQWebView.instances[0].handler.setrelativeTimes(label)
      } else {
        window.MetricQWebView.instances[0].handler.setTimeRange(start.unix() * 1000, end.unix() * 1000)
      }
      window.MetricQWebView.instances[0].reload()
    })
  })
}

document.addEventListener('DOMContentLoaded', initNonVueButtons)
