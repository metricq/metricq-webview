import { ConfigurationPopup } from './ui/configuration-popup.js'
import { ExportPopup } from './ui/export-popup.js'
import { MetricLegend } from './ui/metric-legend.js'
import { MetricPopup } from './ui/metric-popup.js'
import { PresetPopup } from './ui/preset-popup.js'
import { XaxisPopup } from './ui/xaxis-popup.js'
import { YaxisPopup } from './ui/yaxis-popup.js'
import { Store } from './store.js'

const globalPopup = {
  export: false,
  yaxis: false,
  xaxis: false,
  presetSelection: false
}

export { globalPopup }

export const mainApp = new Vue({
  el: '#main_app',
  components: {
    ConfigurationPopup,
    ExportPopup,
    MetricLegend,
    MetricPopup,
    PresetPopup,
    XaxisPopup,
    YaxisPopup
  },
  data: {
    globalPopup,
    state: Store.state,
    configuration: Store.state.configuration,
    metricsList: Store.state.allMetrics
  },
  computed: {
  },
  methods: {
    togglePopup: function () {
      this.configuration.popup = !this.configuration.popup
    }
  }
})
