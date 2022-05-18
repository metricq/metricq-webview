import { MetricHandler } from './MetricHandler.js'
import { Graticule } from './graticule.js'
import { registerCallbacks } from './interact.js'
import JSURL from 'jsurl'
import Vue from 'vue'
import * as Error from '@/errors'

export function createGlobalMetricQWebview (paramParentEle, paramMetricNamesArr, paramStartTime, paramStopTime, store) {
  const webview = new MetricQWebView(paramParentEle, paramMetricNamesArr, paramStartTime, paramStopTime, store)
  window.MetricQWebView.instances.push(webview)
}

class MetricQWebView {
  constructor (paramParentEle, paramMetricNamesArr, paramStartTime, paramStopTime, store) {
    this.store = store
    this.id = 'metricqwebview_' + (new Date()).getTime()
    if (!window.MetricQWebView) {
      window.MetricQWebView = {
        instances: [],
        getInstance (htmlEle) {
          for (let i = 0; i < window.MetricQWebView.instances.length; ++i) {
            if (window.MetricQWebView.instances[i].ele.isSameNode(htmlEle)) {
              return window.MetricQWebView.instances[i]
            }
          }
          return undefined
        }
      }
    }

    this.ele = paramParentEle
    this.handler = new MetricHandler(this, paramMetricNamesArr, paramStartTime, paramStopTime, this.store)
    this.hasPlot = false
    this.graticule = undefined
    this.margins = {
      canvas: {
        top: 10,
        right: 35,
        bottom: 40,
        left: 105
      }
    }
    this.lastThrottledReloadTime = 0
    this.RELOAD_THROTTLING_DELAY = 150
    this.reloadThrottleTimeout = undefined

    if (paramMetricNamesArr.length > 0) {
      this.handler.doRequest(400)
    }
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (this.graticule) {
          this.graticule.canvasResize(this.margins.canvas)
        }
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
    this.store.commit('setRenderTime', window.performance.now() - startTime)
  }

  updateMetricUrl () {
    let encodedStr = '.' + this.handler.startTime.getValue() + '*' + this.handler.stopTime.getValue()
    for (const metricKey of this.store.getters['metrics/getAllKeys']()) {
      encodedStr += '*' + metricKey
    }
    encodedStr = encodeURIComponent(encodedStr)
    window.location.href =
      parseLocationHref()[0] +
      '#' +
      encodedStr
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
    const unitsAssociation = {
      second: 1000,
      'second(s)': 1000,
      minute: 60000,
      'minute(s)': 60000,
      hour: 3600000,
      'hour(s)': 3600000,
      day: 86400000,
      'day(s)': 86400000,
      week: 86400000 * 7,
      'week(s)': 86400000 * 7,
      month: 86400000 * 30,
      'month(s)': 86400000 * 30,
      year: 86400000 * 365,
      'year(s)': 86400000 * 365
    }
    // TODO: use these units:

    //  this.units = ['second(s)', 'minute(s)', 'hour(s)', 'day(s)', 'week(s)', 'month(s)', 'year(s)', 'data points'];
    const unitMultiplier = unitsAssociation[jsUrlObj.unit]
    timeEnd = (new Date()).getTime()
    let timeToSubtract = 2 * 3600 * 1000
    if (undefined === unitMultiplier) {
      console.warn(`Invalid unit "${jsUrlObj.unit}" in URL`)
    } else {
      timeToSubtract = jsUrlObj.value * unitMultiplier
    }
    timeStart = timeEnd - timeToSubtract
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
      initializeMetrics(metricsObj.cntr, timeRanges[0], timeRanges[1])
      return true
    } else if (firstChar === '.') {
      const splitted = jsurlStr.split('*')
      if (splitted.length > 1) {
        initializeMetrics(splitted.slice(2), splitted[0].substring(1), splitted[1])
        return true
      }
    }
  }
  return false
}

/* TODO: generalize this for cases where is no "legendApp" */
export function initializeMetrics (metricNamesArr, timeStart, timeStop) {
  let newManager
  if (window.MetricQWebView) {
    newManager = window.MetricQWebView.instances[0]
    newManager.reinitialize(metricNamesArr, timeStart, timeStop)
  }
}
