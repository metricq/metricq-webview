import Vue from 'vue'

import ConfigurationPopup from './ui/configuration-popup.vue'
import ExportPopup from './ui/export-popup.vue'
import LinkPopup from './ui/link-popup.vue'
import MetricLegend from './ui/metric-legend.vue'
import NewMetricLegend from './ui/new-metric-legend.vue'
import ClearMetricsButton from './ui/clear-metrics-button.vue'
import MetricPopup from './ui/metric-popup.vue'
import NewMetricPopup from './ui/new-metric-popup.vue'
import YaxisPopup from './ui/yaxis-popup.vue'
import TimeButton from './ui/time-button.vue'
import GraticuleContainer from './ui/graticule-container.vue'
import store from './store/'
import { mapMutations, mapState } from 'vuex'
import distinctColors from 'distinct-colors'
import AnalyzePopup from './ui/analyze-popup.vue'

import { importPlugins } from './plugins'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// because we do ugly evil hacky things, we need to load our css after bootstrap :(
import '../public/css/style.css'

importPlugins()

Vue.config.productionTip = false

export const mainApp = new Vue({
  el: '#main_app',
  components: {
    ConfigurationPopup,
    ExportPopup,
    LinkPopup,
    MetricLegend,
    NewMetricLegend,
    ClearMetricsButton,
    MetricPopup,
    NewMetricPopup,
    YaxisPopup,
    TimeButton,
    GraticuleContainer,
    AnalyzePopup
  },
  data: { },
  computed: {
    ...mapState([
      'timestamp',
      'globalMinMax',
      'popups',
      'configuration'
    ]),
    ...mapState({
      metricsList (state) {
        return Object.values(state.metrics.metrics)
      }
    })
  },
  watch: {
    'configuration.legendDisplay' () {
      // TODO: check moving to store
      if (window.MetricQWebView.instances[0].graticule) window.MetricQWebView.instances[0].graticule.canvasReset()
    },
    metricsList () {
      window.MetricQWebView.instances[0].updateMetricUrl()
      setTimeout(() => { window.MetricQWebView.instances[0].reload() }, 0)
    }
  },
  methods: {
    colorPaletteClicked () {
      const palette = distinctColors({ count: this.metricsList.length, lightMin: 25, lightMax: 75 }).values()
      this.metricsList.forEach((metric) => {
        const color = palette.next().value.css()
        this.$store.dispatch('metrics/updateColor', { metricKey: metric.key, color: color })
      })
    },
    exportButtonClicked () {
      this.togglePopup('export')
    },
    configurationButtonClicked () {
      this.togglePopup('configuration')
    },
    linkButtonClicked () {
      this.togglePopup('link')
    },
    analyzeButtonClicked () {
      this.togglePopup('analyze')
    },
    toggleMinMaxButton (evt) {
      this.$store.dispatch('metrics/updateDrawStateGlobally', evt.target.checked)
    },
    ...mapMutations([
      'togglePopup'
    ])
  },
  store
})
