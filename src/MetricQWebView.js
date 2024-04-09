import { MetricHandler } from './MetricHandler.js'
import { Graticule } from './graticule.js'
import { registerCallbacks } from './interact.js'
import JSURL from 'jsurl'
import Vue from 'vue'
import * as Error from '@/errors'

export function createGlobalMetricQWebview (parent, startTime, stopTime, store, metricqBackendConfig) {
  window.MetricQWebView = new MetricQWebView(parent, startTime, stopTime, store, metricqBackendConfig)
  store.commit('setLegacyLink', metricqBackendConfig.legacyCharts)
  store.commit('setIsWebviewLoaded', true)
}

class MetricQWebView {
  constructor (parent, startTime, stopTime, store, metricqBackendConfig) {
    this.store = store
    this.ele = parent
    this.handler = new MetricHandler(this, startTime, stopTime, store, metricqBackendConfig)

    this.margins = {
      canvas: {
        top: 10,
        right: 5,
        bottom: 40,
        left: 105
      }
    }

    this.lastThrottledReloadTime = 0
    this.RELOAD_THROTTLING_DELAY = 150
    this.reloadThrottleTimeout = undefined

    const resizeObserver = new ResizeObserver(() => {
      if (this.graticule) {
        this.graticule.canvasResize(this.margins.canvas)
      }
    })
    resizeObserver.observe(document.getElementById('webview_container'))
    resizeObserver.observe(document.body)
    resizeObserver.observe(document.getElementById('legend_container'))

    const myCanvas = document.createElement('canvas')
    this.ele.appendChild(myCanvas)
    const myContext = myCanvas.getContext('2d')
    this.graticule = new Graticule(this.handler.metricQHistory,
      myCanvas, myContext)
    registerCallbacks(myCanvas)
  }

  reinitialize (metricsArr, startTime, stopTime) {
    this.handler.initializeMetrics(metricsArr)
    this.handler.startTime.updateTime(startTime)
    this.handler.stopTime.updateTime(stopTime)
  }

  renderMetrics (datapointsJSON, startTime) {
    this.graticule.data.processMetricQDatapoints(datapointsJSON)
    this.graticule.automaticallyDetermineRanges(false, true)
    this.graticule.draw(false)
    this.store.commit('setTotalTime', window.performance.now() - startTime)
  }

  updateMetricUrl () {
    let encodedStr = '.' + this.handler.startTime.getValue() + '*' + this.handler.stopTime.getValue()
    for (const metricKey of this.store.getters['metrics/getAllKeys']()) {
      encodedStr += '*' + metricKey
    }
    window.location.href = parseLocationHref()[0] + '#' + encodeURIComponent(encodedStr)
  }

  setPlotRanges (updateXAxis, updateYAxis) {
    if (!updateXAxis && !updateYAxis) {
      return
    }
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
      await this.store.dispatch('metrics/create', { metric: { ...oldMetric, name: metricBase, description: description, traces: [] } })
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
      this.deleteMetric(oldMetric.name)
      if (this.graticule) {
        this.graticule.data.initializeCacheWithColor(newName, oldMetric.color)
      }
    }
  }

  doExport () {
    let filenameStr = 'MetricQ-WebView.'
    let filetypeStr = 'image/'
    filenameStr += this.store.state.configuration.exportFormat
    filetypeStr += this.store.state.configuration.exportFormat
    const exportCanvas = document.createElement('canvas')
    const exportCanvasContext = exportCanvas.getContext('2d')
    const canvasSize = [this.store.state.configuration.exportWidth, this.store.state.configuration.exportHeight]

    exportCanvas.setAttribute('width', canvasSize[0])
    exportCanvas.setAttribute('height', canvasSize[1])
    const size = [canvasSize[0], canvasSize[1], this.margins.canvas.left,
      this.margins.canvas.top,
      canvasSize[0] - (this.margins.canvas.right + this.margins.canvas.left),
      canvasSize[1] - (this.margins.canvas.top + this.margins.canvas.bottom)]
    this.graticule.draw(false, exportCanvasContext, size)
    const exportCanvasImageData = exportCanvas.toDataURL(filetypeStr)

    let linkEle = document.createElement('a')
    linkEle.setAttribute('href', exportCanvasImageData)
    linkEle.setAttribute('download', filenameStr)
    linkEle.appendChild(document.createTextNode('Export'))
    linkEle = document.body.appendChild(linkEle)
    linkEle.click()
    document.body.removeChild(linkEle)
  }
}

function parseLocationHref () {
  const urlComponents = window.location.href.split('#', 2)

  if (urlComponents.length === 1) {
    return [urlComponents[0], '']
  }

  return [urlComponents[0], decodeURIComponent(urlComponents[1])]
}

function determineTimeRangeOfJsUrl (request) {
  let timeStart, timeEnd
  if (request.start && request.stop) {
    timeStart = parseInt(request.start)
    timeEnd = parseInt(request.stop)
  } else if (request.value && request.unit) {
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

    const unit = unitConversion[request.unit]

    return [`now-${request.value}${unit}`, 'now']
  } else {
    console.info('No time specification given in URL')
  }
  return [timeStart, timeEnd]
}

export function importMetricUrl () {
  const fragment = parseLocationHref()[1]

  if (fragment.length === 0) return false

  if (fragment.startsWith('/~') || fragment.startsWith('~')) {
    let request
    try {
      if (fragment.startsWith('/~')) {
        request = JSURL.parse(fragment.substring(1))
      } else {
        request = JSURL.parse(fragment)
      }
    } catch (exc) {
      console.log('Could not interpret URL')
      console.log(exc)
      return false
    }
    const timeRange = determineTimeRangeOfJsUrl(request)
    window.MetricQWebView.reinitialize(request.cntr, timeRange[0], timeRange[1])
    return true
  } else if (fragment.startsWith('.')) {
    const splitted = fragment.split('*')
    if (splitted.length > 1) {
      window.MetricQWebView.reinitialize(splitted.slice(2), splitted[0].substring(1), splitted[1])
      return true
    }
  }

  return false
}
