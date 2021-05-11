import { ConfigurationPopup } from './ui/configuration-popup.js'
import { ExportPopup } from './ui/export-popup.js'
import { MetricLegend } from './ui/metric-legend.js'
import { NewMetricLegend } from './ui/new-metric-legend.js'
import { MetricPopup } from './ui/metric-popup.js'
import { NewMetricPopup } from './ui/new-metric-popup.js'
import { XaxisPopup } from './ui/xaxis-popup.js'
import { YaxisPopup } from './ui/yaxis-popup.js'
import { Store } from './store.js'

Vue.component('VueMultiSelect', window.VueMultiselect.default)

export const mainApp = new Vue({
  el: '#main_app',
  components: {
    ConfigurationPopup,
    ExportPopup,
    MetricLegend,
    NewMetricLegend,
    MetricPopup,
    NewMetricPopup,
    XaxisPopup,
    YaxisPopup
  },
  data: {
    state: Store.state,
    popups: Store.state.popups,
    configuration: Store.state.configuration,
    metricsList: Store.state.allMetrics
  },
  computed: {},
  methods: {}
})
