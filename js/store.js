import { Configuration } from './configuration.js'

export class StoreClass {
  constructor () {
    this.state = {
      configuration: new Configuration(5, 10),
      allMetrics: {},
      popups: {
        export: false,
        yaxis: false,
        configuration: false,
        link: false,
        newmetric: false
      },
      timestamp: {
        start: 0,
        end: 0
      },
      drawMinMaxGlobal: true
    }
  }

  resetAllMetrics () {
    console.log('Reset allMetrics')
    const allMetrics = this.state.allMetrics
    Object.keys(allMetrics).forEach(function (key) { if (!key.startsWith('_')) { delete allMetrics[key] } })
  }

  setMetric (metricKey, metric) {
    Vue.set(this.state.allMetrics, metricKey, metric)
    document.getElementById('button_clear_all').style.display = 'inline'
  }

  deleteMetric (metricKey) {
    Vue.delete(this.state.allMetrics, metricKey)
    if (this.getAllMetrics().length === 0) {
      document.getElementById('button_clear_all').style.display = 'none'
    }
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

  getMetricMinMax (metricName) {
    for (const metricBase in this.state.allMetrics) {
      if (this.state.allMetrics[metricBase].name === metricName) {
        return this.state.allMetrics[metricBase].drawMinMax
      }
    }
  }

  getAllMetrics () {
    const metricArray = []
    const allMetrics = this.state.allMetrics
    Object.keys(allMetrics).forEach(function (key) { metricArray.push(key) })
    return metricArray
  }

  togglePopup (name) {
    Vue.set(this.state.popups, name, !this.state.popups[name])
  }

  setStartTime (time) {
    Vue.set(this.state.timestamp, 'start', time)
  }

  setEndTime (time) {
    Vue.set(this.state.timestamp, 'end', time)
  }

  setDrawMinMaxGlobal () {
    Vue.set(this.state, 'drawMinMaxGlobal', !this.state.drawMinMaxGlobal)
    for (const metricBase in this.state.allMetrics) {
      Vue.set(this.state.allMetrics[metricBase], 'drawMinMax', this.state.drawMinMaxGlobal)
    }
    window.MetricQWebView.instances[0].graticule.draw(false)
  }

  getDrawMinMaxGlobal () {
    return this.state.drawMinMaxGlobal
  }
}

export const Store = new StoreClass()
