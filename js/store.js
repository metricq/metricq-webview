import { Configuration } from './configuration.js'

export class StoreClass {
  constructor () {
    this.state = {
      configuration: new Configuration(5, 10),
      allMetrics: {},
      selectedPreset: [],
      popups: {
        export: false,
        yaxis: false,
        xaxis: false,
        presetSelection: false,
        configuration: false
      }
    }
  }

  resetAllMetrics () {
    console.log('Reset allMetrics')
    const allMetrics = this.state.allMetrics
    Object.keys(allMetrics).forEach(function (key) { if (!key.startsWith('_')) { delete allMetrics[key] } })
  }

  setMetric (metricKey, metric) {
    Vue.set(this.state.allMetrics, metricKey, metric)
  }

  deleteMetric (metricKey) {
    Vue.delete(this.state.allMetrics, metricKey)
  }

  setMetricPopup (metricKey, popup) {
    const metric = this.state.allMetrics[metricKey]
    if (metric) {
      Vue.set(metric, 'popup', popup)
    }
  }

  getMetricBase (metricName) {
    for (const metricBase in this.state.allMetrics) {
      if (this.state.allMetrics[metricBase].name === metricName) {
        return metricBase
      }
    }
    return undefined
  }

  setSelectedPreset (newPreset) {
    Store.state.selectedPreset = [].concat(newPreset)
  }

  togglePopup (name) {
    Vue.set(this.state.popups, name, !(this.state.popups[name]))
  }
}

export const Store = new StoreClass()
