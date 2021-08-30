import { Configuration } from './configuration.js'
import Vue from 'vue'
import newstore from './store/'

export class StoreClass {
  constructor () {
    this.state = {
      allMetrics: {}
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

  setMetricDrawState (metricKey, state, value) {
    const metric = this.state.allMetrics[metricKey]
    if (metric) {
      Vue.set(metric, state, value)
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
        newstore.commit('setGlobalMinMax', false)
        document.getElementById('checkbox_min_max').indeterminate = true
      } else {
        newstore.commit('setGlobalMinMax', stateArray[0])
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

  setDrawMinMaxGlobal (newState) {
    for (const metricBase in this.state.allMetrics) {
      Vue.set(this.state.allMetrics[metricBase], 'drawMin', newState)
      Vue.set(this.state.allMetrics[metricBase], 'drawMax', newState)
      if (newState === false) {
        Vue.set(this.state.allMetrics[metricBase], 'drawAvg', true)
      }
    }
    window.MetricQWebView.instances[0].graticule.draw(false)
    newstore.commit('setGlobalMinMax', newState)
  }
}

export const Store = new StoreClass()
