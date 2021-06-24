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
      globalMinMax: true,
      indeterminate: true
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
    metricsArray.forEach(metric => {
      const metricDrawArray = this.getMetricDrawState(metric)
      console.log(metricDrawArray)
      if (!metricDrawArray.drawAvg) {
        document.getElementById('checkbox_min_max').indeterminate = true
      }
      stateArray.push(metricDrawArray.drawMin)
      stateArray.push(metricDrawArray.drawMax)
    })
    if (stateArray.includes(true) && stateArray.includes(false)) {
      document.getElementById('checkbox_min_max').indeterminate = true
    } else {
      console.log(stateArray[0])
      Vue.set(this.state, 'globalMinMax', stateArray[0])
      // document.getElementById('checkbox_min_max').checked = stateArray[0]
      console.log(this.state.globalMinMax)
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
    Vue.set(this.state, 'globalMinMax', newState)
    for (const metricBase in this.state.allMetrics) {
      Vue.set(this.state.allMetrics[metricBase], 'drawMin', this.state.globalMinMax)
      Vue.set(this.state.allMetrics[metricBase], 'drawAvg', true)
      Vue.set(this.state.allMetrics[metricBase], 'drawMax', this.state.globalMinMax)
    }
    window.MetricQWebView.instances[0].graticule.draw(false)
  }
}

export const Store = new StoreClass()
