import Vue from 'vue'

import ConfigurationPopup from './ui/configuration-popup.vue'
import ExportPopup from './ui/export-popup.vue'
import LinkPopup from './ui/link-popup.vue'
import MetricLegend from './ui/metric-legend.vue'
import NewMetricLegend from './ui/new-metric-legend.vue'
import MetricPopup from './ui/metric-popup.vue'
import NewMetricPopup from './ui/new-metric-popup.vue'
import YaxisPopup from './ui/yaxis-popup.vue'
import TimeButton from './ui/time-button.vue'
import store from './store/'
import { Store } from './store.js'
import { mapMutations, mapState } from 'vuex'

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
    metricsList: Store.state.allMetrics
  },
  computed: {
    ...mapState([
      'timestamp',
      'globalMinMax',
      'popups',
      'configuration'
    ])
  },
  watch: {
    'configuration.legendDisplay': function () {
      // TODO: check moving to store
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
      this.togglePopup('export')
    },
    configurationButtonClicked () {
      this.togglePopup('configuration')
    },
    linkButtonClicked () {
      this.togglePopup('link')
    },
    clearAllButtonClicked () {
      const globalMinMax = this.globalMinMax
      Store.getAllMetrics().forEach(metricName => window.MetricQWebView.instances[0].deleteMetric(Store.getMetricBase(metricName)))
      this.$store.commit('setGlobalMinMax', globalMinMax)
    },
    toggleMinMaxButton (evt) {
      Store.setDrawMinMaxGlobal(evt.target.checked)
    },
    ...mapMutations([
      'togglePopup'
    ])
  },
  store
})
