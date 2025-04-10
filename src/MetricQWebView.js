import { MetricHandler } from './MetricHandler.js'
import { Graticule } from './graticule.js'
import { registerCallbacks } from './interact.js'
import JSURL from 'jsurl'
import Vue from 'vue'
import * as Error from '@/errors'

export function createGlobalMetricQWebview (paramParentEle, paramMetricNamesArr, paramStartTime, paramStopTime, store, metricqBackendConfig) {
  window.MetricQWebView = new MetricQWebView(paramParentEle, paramMetricNamesArr, paramStartTime, paramStopTime, store, metricqBackendConfig)
  store.commit('setLegacyLink', metricqBackendConfig.legacyCharts)
  store.commit('setIsWebviewLoaded', true)
}

class MetricQWebView {
  constructor (paramParentEle, paramMetricNamesArr, paramStartTime, paramStopTime, store, metricqBackendConfig) {
    this.store = store
    this.ele = paramParentEle
    this.handler = new MetricHandler(this, paramMetricNamesArr, paramStartTime, paramStopTime, this.store, metricqBackendConfig)
    this.hasPlot = false
    this.graticule = undefined
    this.margins = {
      canvas: {
        top: 10,
        right: 5,
        bottom: 45,
        left: 95
      }
    }
    this.lastThrottledReloadTime = 0
    this.RELOAD_THROTTLING_DELAY = 150
    this.reloadThrottleTimeout = undefined

    if (paramMetricNamesArr.length > 0) {
      this.handler.doRequest(400)
    }
    const resizeObserver = new ResizeObserver(() => {
      if (this.graticule) {
        this.graticule.canvasResize(this.margins.canvas)
      }
    })
    resizeObserver.observe(document.getElementById('webview_container'))
    resizeObserver.observe(document.body)
  }

  reinitialize (metricsArr, startTime, stopTime) {
    this.handler.initializeMetrics(metricsArr)
    this.handler.startTime.updateTime(startTime)
    this.handler.stopTime.updateTime(stopTime)
  }

  renderMetrics (datapointsJSON, startTime) {
    if (!this.hasPlot) {
      const myCanvas = document.createElement('canvas')
      this.ele = this.ele.appendChild(myCanvas)
      const myContext = myCanvas.getContext('2d')
      // Params: (ctx, offsetDimension, paramPixelsLeft, paramPixelsBottom, paramClearSize)
      this.graticule = new Graticule(this.handler.metricQHistory,
        myCanvas, myContext)
      this.hasPlot = true
      // TODO: neue Funktion handler.refreshTimeRange?
      this.handler.setTimeRange(this.handler.startTime, this.handler.stopTime)
      this.graticule.data.processMetricQDatapoints(datapointsJSON)
      // URL import problem here: the response's start and end time are taken here :/
      this.graticule.automaticallyDetermineRanges(false, true)
      this.graticule.draw(false)
      registerCallbacks(myCanvas)
    } else {
      this.graticule.data.processMetricQDatapoints(datapointsJSON)
      this.graticule.automaticallyDetermineRanges(false, true)
      this.graticule.draw(false)
    }
    this.store.commit('setTotalTime', window.performance.now() - startTime)
  }

  updateMetricUrl () {
    let encodedStr = '.' + this.handler.startTime.getValue() + '*' + this.handler.stopTime.getValue()
    for (const metric of this.store.getters['metrics/getAll']()) {
      if (metric.factor !== 1 && metric.factor !== undefined) {
        encodedStr += '*(' + metric.key + '~' + metric.factor + ')'
      } else {
        encodedStr += '*' + metric.key
      }
    }
    encodedStr = encodeURIComponent(encodedStr)
    history.pushState(null, '', parseLocationHref()[0] + '#' + encodedStr)
  }

  setPlotRanges (updateXAxis, updateYAxis) {
    if (!updateXAxis && !updateYAxis) {
      return
    }
    // TODO: code me
    const allMinMax = this.handler.getAllMinMax()
    this.graticule.setValueRange(allMinMax[0], allMinMax[1])

    this.graticule.draw(false)
  }

  reload () {
    this.handler.reload()
  }

  throttledReload () {
    clearTimeout(this.reloadThrottleTimeout)
    this.reloadThrottleTimeout = setTimeout(() => {
      this.reload()
    }, this.RELOAD_THROTTLING_DELAY)
  }

  async addMetric (metricBase, description = undefined, oldMetric = undefined) {
    try {
      if (metricBase instanceof Array) {
        // assuming we import a scaled metric from ye olde times
        const [metric, factor] = metricBase
        await this.store.dispatch('metrics/create', { metric: { ...oldMetric, name: metric, description: description, traces: [], factor: factor } })
      } else if (metricBase.startsWith('(') && metricBase.endsWith(')')) {
        const [metric, factorStr] = metricBase.substring(1, metricBase.length - 1).split('~')
        const factor = Number.parseFloat(factorStr)
        await this.store.dispatch('metrics/create', { metric: { ...oldMetric, name: metric, description: description, traces: [], factor: factor } })
      } else {
        await this.store.dispatch('metrics/create', { metric: { ...oldMetric, name: metricBase, description: description, traces: [] } })
      }
      return true
    } catch (error) {
      if (error instanceof Error.DuplicateMetricError) {
        Vue.toasted.error(`Metrik ${error.metricName} ist bereits vorhanden!`, this.store.state.toastConfiguration)
      } else if (error instanceof Error.InvalidMetricError) {
        Vue.toasted.error(`Metrik ${error.metricName} existiert nicht!`, this.store.state.toastConfiguration)
      }
      return false
    }
  }

  deleteMetric (metricBase) {
    if (this.graticule) this.graticule.data.deleteMetric(metricBase)
    this.store.dispatch('metrics/delete', { metricKey: metricBase })
    // TODO: also clear this metric from MetricCache
    if (this.graticule) this.graticule.draw(false)
    this.setPlotRanges(false, true)
  }

  toggleDraw (metricBase) {
    this.store.dispatch('metrics/toggleDraw', { metricKey: metricBase })
    if (this.graticule) this.graticule.draw(false)
    this.setPlotRanges(false, true)
  }

  async changeMetricName (oldMetric, newName) {
    if (await this.addMetric(newName, undefined, oldMetric)) {
      this.deleteMetric(oldMetric.key)
      if (this.graticule) {
        this.graticule.data.initializeCacheWithColor(newName, oldMetric.color)
      }
    }
  }
}

function parseLocationHref () {
  const hashPos = window.location.href.indexOf('#')
  let baseUrl = ''
  let jsurlStr = ''
  if (hashPos === -1) {
    baseUrl = window.location.href
  } else {
    baseUrl = window.location.href.substring(0, hashPos)
    jsurlStr = decodeURIComponent(window.location.href.substring(hashPos + 1))
  }
  return [baseUrl, jsurlStr]
}

function determineTimeRangeOfJsUrl (jsUrlObj) {
  let timeStart, timeEnd
  if (jsUrlObj.start && jsUrlObj.stop) {
    timeStart = parseInt(jsUrlObj.start)
    timeEnd = parseInt(jsUrlObj.stop)
  } else if (jsUrlObj.value && jsUrlObj.unit) {
    // including the units from old tool settings.js  (line 62)
    const unitConversion = {
      second: 's',
      'second(s)': 's',
      minute: 'm',
      'minute(s)': 'm',
      hour: 'h',
      'hour(s)': 'h',
      day: 'd',
      'day(s)': 'd',
      week: 'w',
      'week(s)': 'w',
      month: 'M',
      'month(s)': 'M',
      year: 'y',
      'year(s)': 'y'
    }

    const unit = unitConversion[jsUrlObj.unit]

    return [`now-${jsUrlObj.value}${unit}`, 'now']
  } else {
    console.info('No time specification given in URL')
  }
  return [timeStart, timeEnd]
}

export function importMetricUrl () {
  const jsurlStr = parseLocationHref()[1]
  if (jsurlStr.length > 1) {
    const firstChar = jsurlStr.charAt(0)
    const firstTwoChars = firstChar + jsurlStr.charAt(1)
    if (firstTwoChars === '/~' ||
      firstChar === '~') {
      let metricsObj
      try {
        if (firstTwoChars === '/~') {
          metricsObj = JSURL.parse(jsurlStr.substring(1))
        } else {
          metricsObj = JSURL.parse(jsurlStr)
        }
      } catch (exc) {
        console.log('Could not interpret URL')
        console.log(exc)
        return false
      }
      const timeRanges = determineTimeRangeOfJsUrl(metricsObj)
      window.MetricQWebView.reinitialize(metricsObj.cntr, timeRanges[0], timeRanges[1])
      return true
    } else if (firstChar === '.') {
      const splitted = jsurlStr.split('*')
      if (splitted.length > 1) {
        window.MetricQWebView.reinitialize(splitted.slice(2), splitted[0].substring(1), splitted[1])
        return true
      }
    }
  }
  return false
}
