import { Configuration } from './configuration.js'
import Vue from 'vue'

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
      globalMinMax: true
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
    this.checkMetricDrawState()
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

  getMetricDrawState (metricName) {
    for (const metricBase in this.state.allMetrics) {
      const metricArray = []
      if (this.state.allMetrics[metricBase].name === metricName) {
        metricArray.drawMin = this.state.allMetrics[metricBase].drawMin
        metricArray.drawAvg = this.state.allMetrics[metricBase].drawAvg
        metricArray.drawMax = this.state.allMetrics[metricBase].drawMax
        return metricArray
      }
    }
  }

  checkMetricDrawState () {
    const stateArray = []
    const metricsArray = this.getAllMetrics()
    document.getElementById('checkbox_min_max').indeterminate = false
    if (metricsArray.length > 0) {
      metricsArray.forEach(metric => {
        const metricDrawArray = this.getMetricDrawState(metric)
        stateArray.push(metricDrawArray.drawMin)
        stateArray.push(metricDrawArray.drawMax)
      })
      if (stateArray.includes(true) && stateArray.includes(false)) {
        Vue.set(this.state, 'globalMinMax', false)
        document.getElementById('checkbox_min_max').indeterminate = true
      } else {
        Vue.set(this.state, 'globalMinMax', stateArray[0])
      }
    } else {
      document.getElementById('checkbox_min_max').indeterminate = false
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

  setDrawMinMaxGlobal (newState) {
    for (const metricBase in this.state.allMetrics) {
      Vue.set(this.state.allMetrics[metricBase], 'drawMin', newState)
      Vue.set(this.state.allMetrics[metricBase], 'drawMax', newState)
      if (newState === false) {
        Vue.set(this.state.allMetrics[metricBase], 'drawAvg', true)
      }
    }
    window.MetricQWebView.instances[0].graticule.draw(false)
  }

  setGlobalMinMax (newState) {
    Vue.set(this.state, 'globalMinMax', newState)
  }
}

export const Store = new StoreClass()
