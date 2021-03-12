var legendApp = new Vue({
  'el': '#legend_list',
  'computed': {
    'metricsList': {
      cache: false,
      'get': function () {
        if (window['MetricQWebView']) {
          return window.MetricQWebView.instances[0].handler.allMetrics
        } else {
          return new Object()
        }
      },
      'set': function (newValue) {
        if (window['MetricQWebView']) {
          return window.MetricQWebView.instances[0].handler.allMetrics = newValue
        }
      }
    }
  }
})
