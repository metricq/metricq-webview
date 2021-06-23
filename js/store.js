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
        metricArray.push(this.state.allMetrics[metricBase].drawMin)
        metricArray.push(this.state.allMetrics[metricBase].drawAvg)
        metricArray.push(this.state.allMetrics[metricBase].drawMax)
        return metricArray
      }
    }
  }

  checkMetricDrawState () {
    var assume = true
    const metricsArray = this.getAllMetrics()
    document.getElementById('checkbox_min_max').indeterminate = false
    metricsArray.forEach(metric => {
      const metricDrawArray = this.getMetricDrawState(metric)
      metricDrawArray.forEach(element => {
        if (element !== assume) {
          if (assume === true) {
            assume = false
          } else {
            document.getElementById('checkbox_min_max').indeterminate = true
          }
        }
      })
    })
    document.getElementById('checkbox_min_max').checked = assume
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
      Vue.set(this.state.allMetrics[metricBase], 'drawAvg', true)
      Vue.set(this.state.allMetrics[metricBase], 'drawMax', newState)
    }
    window.MetricQWebView.instances[0].graticule.draw(false)
  }

}

export const Store = new StoreClass()
