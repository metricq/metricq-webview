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
    indeterminate: Store.state.indeterminate
  },
  computed: {},
  /* watch: {
    globalminmax: function (val) {
      Store.setDrawMinMaxGlobal(val)
      console.log(val)
    }
  }, */
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
      Store.getAllMetrics().forEach(metricName => window.MetricQWebView.instances[0].deleteMetric(Store.getMetricBase(metricName)))
    },
    toggleMinMaxButton (evt) {
      Store.setDrawMinMaxGlobal(evt.target.checked)
    }
  }
})
