import { ConfigurationPopup } from './ui/configuration-popup.js'
import { ExportPopup } from './ui/export-popup.js'
import { MetricLegend } from './ui/metric-legend.js'
import { MetricPopup } from './ui/metric-popup.js'
import { PresetPopup } from './ui/preset-popup.js'
import { XaxisPopup } from './ui/xaxis-popup.js'
import { YaxisPopup } from './ui/yaxis-popup.js'
import { TimeButton } from './ui/time-button.js'
import { Store } from './store.js'

export const mainApp = new Vue({
  el: '#main_app',
  components: {
    ConfigurationPopup,
    ExportPopup,
    MetricLegend,
    MetricPopup,
    PresetPopup,
    XaxisPopup,
    YaxisPopup,
    TimeButton
  },
  data: {
    state: Store.state,
    popups: Store.state.popups,
    configuration: Store.state.configuration,
    metricsList: Store.state.allMetrics,
    timestamp: Store.state.timestamp
  },
  computed: {},
  methods: {}
})

