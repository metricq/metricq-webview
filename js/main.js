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
    $('input[name="daterange"]').daterangepicker({
      opens: 'left',
      'timePicker': true,
      'timePicker24Hour': true,
      'showCustomRangeLabel': false,
      'locale': {
        'format': 'DD/MM/YYYY HH:mm',
        'firstDay': 1
      },
      ranges: {
        'Last 5 minutes': [,],
        'Last 15 minutes': [,],
        'Last 30 minutes': [,],
        'Last 1 hour': [,],
        'Last 3 hours': [,],
        'Last 6 hours': [,],
        'Last 12 hours': [,],
        'Last 24 hours': [,],
        'Last 2 days': [,],
        'Last 7 days': [,],
        'Last 30 days': [,],
        'Last 90 days': [,],
        'Last 6 months': [,],
        'Last 1 year': [,],
        'Today': [,],
        'Yesterday': [,],
        'This week': [,],
        'This month': [,],
        'Last month': [,]
      },
      'alwaysShowCalendars': true,
      'startDate': moment(window.MetricQWebView.instances[0].handler.startTime),
      'endDate': moment(window.MetricQWebView.instances[0].handler.stopTime)
    }, function (start, end, label) {
      if (Math.abs(moment().unix() - end.unix()) < 60 * 2) {
        window.MetricQWebView.instances[0].relative = true
        window.MetricQWebView.instances[0].handler.setTimeRange(start.unix() * 1000, end.unix() * 1000)
      } else {
        window.MetricQWebView.instances[0].relative = false
        window.MetricQWebView.instances[0].handler.setTimeRange(start.unix() * 1000, end.unix() * 1000)
      }
      window.MetricQWebView.instances[0].reload()
    })
    $('input[name="daterange"]').on('show.daterangepicker', function (ev, picker) {
      picker.ranges = {
        'last 3 hours': [moment().subtract(3, 'hours'), moment()],
        'Today': [moment().startOf('day'), moment()],
        'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().startOf('day')],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment()],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
        'Last 5 minutes': [moment().subtract(5, 'minutes'), moment()],
        'Last 15 minutes': [moment().subtract(15, 'minutes'), moment()],
        'Last 30 minutes': [moment().subtract(30, 'minutes'), moment()],
        'Last 1 hour': [moment().subtract(1, 'hours'), moment()],
        'Last 3 hours': [moment().subtract(3, 'hours'), moment()],
        'Last 6 hours': [moment().subtract(6, 'hours'), moment()],
        'Last 12 hours': [moment().subtract(12, 'hours'), moment()],
        'Last 24 hours': [moment().subtract(24, 'hours'), moment()],
        'Last 2 days': [moment().subtract(2, 'days'), moment()],
        'Last 7 days': [moment().subtract(7, 'days'), moment()],
        'Last 30 days': [moment().subtract(30, 'days'), moment()],
        'Last 90 days': [moment().subtract(90, 'days'), moment()],
        'Last 6 months': [moment().subtract(6, 'months'), moment()],
        'Last 1 year': [moment().subtract(1, 'years'), moment()],
        'Today': [moment().startOf('day'), moment()],
        'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().startOf('day')],
        'This week': [moment().startOf('week'), moment()],
        'This month': [moment().startOf('month'), moment()],
        'Last month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      }
    })
  })
}

document.addEventListener('DOMContentLoaded', initNonVueButtons)
