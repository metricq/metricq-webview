import { MetricLegend } from './metric-legend.js'

const legendApp = new Vue({
  el: '#legend_list',
  components: {
    MetricLegend
  },
  computed: {
    metricsList: {
      cache: false,
      get: function () {
        if (window.MetricQWebView) {
          return window.MetricQWebView.instances[0].handler.allMetrics
        } else {
          return {}
        }
      },
      set: function (newValue) {
        if (window.MetricQWebView) {
          window.MetricQWebView.instances[0].handler.allMetrics = newValue
        }
      }
    }
  }
})

export { legendApp }
