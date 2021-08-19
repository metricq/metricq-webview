import Vue from 'vue'

import { ConfigurationPopup } from './ui/configuration-popup.js'
import { ExportPopup } from './ui/export-popup.js'
import { LinkPopup } from './ui/link-popup.js'
import { MetricLegend } from './ui/metric-legend.js'
import { NewMetricLegend } from './ui/new-metric-legend.js'
import { MetricPopup } from './ui/metric-popup.js'
import { NewMetricPopup } from './ui/new-metric-popup.js'
import { YaxisPopup } from './ui/yaxis-popup.js'
import { TimeButton } from './ui/time-button.js'
import { Store } from './store.js'

Vue.component('VueMultiSelect', window.VueMultiselect.default)

Vue.config.productionTip = false

export const mainApp = new Vue({
  el: '#main_app',
  components: {
    ConfigurationPopup,
    ExportPopup,
    LinkPopup,
    MetricLegend,
    NewMetricLegend,
    MetricPopup,
    NewMetricPopup,
    YaxisPopup,
    TimeButton
  },
  data: {
    state: Store.state,
    popups: Store.state.popups,
    configuration: Store.state.configuration,
    metricsList: Store.state.allMetrics,
    timestamp: Store.state.timestamp,
    globalminmax: Store.state.globalMinMax
  },
  computed: {},
  watch: {
    'configuration.legendDisplay': function () {
      if (window.MetricQWebView.instances[0].graticule) window.MetricQWebView.instances[0].graticule.canvasReset()
    },
    metricsList: function () {
      setTimeout(function () { window.MetricQWebView.instances[0].setLegendLayout() }, 0)
      if (Store.getAllMetrics().length === 0) {
        document.getElementById('button_clear_all').style.display = 'none'
      } else {
        document.getElementById('button_clear_all').style.display = 'inline'
      }
    }
  },
  methods: {
    exportButtonClicked () {
      Store.togglePopup('export')
    },
    configurationButtonClicked () {
      Store.togglePopup('configuration')
    },
    linkButtonClicked () {
      Store.togglePopup('link')
    },
    clearAllButtonClicked () {
      const globalMinMax = Store.state.globalMinMax
      Store.getAllMetrics().forEach(metricName => window.MetricQWebView.instances[0].deleteMetric(Store.getMetricBase(metricName)))
      Store.setGlobalMinMax(globalMinMax)
    },
    toggleMinMaxButton (evt) {
      Store.setDrawMinMaxGlobal(evt.target.checked)
    }
  }
})
