const popupApp = new Vue({
  el: '#wrapper_popup_legend',
  methods: {},
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
  },
  // not called by $forceUpdate :(
  updated () {
  }
})

export { popupApp }
