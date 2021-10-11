import { MetricHandler } from './MetricHandler.js'
import { Graticule } from './graticule.js'
import { markerSymbols } from './metric.js'
import { registerCallbacks } from './interact.js'
import JSURL from 'jsurl'

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
        getInstance: function (htmlEle) {
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
    this.countTraces = 0
    this.hasPlot = false
    this.graticule = undefined
    this.margins = {
      canvas: {
        top: 10,
        right: 35,
        bottom: 40,
        left: 105
      },
      labels: {
        left: 3,
        bottom: 10
      },
      gears: {
        y: {
          left: 2,
          top: 6
        }
      }
    }
    this.setFootMargin()
    this.lastThrottledReloadTime = 0
    this.RELOAD_THROTTLING_DELAY = 150
    this.reloadThrottleTimeout = undefined

    if (paramMetricNamesArr.length > 0) {
      this.handler.doRequest(400)
    }
    window.addEventListener('resize', (function (selfReference) { return function (evt) { selfReference.windowResize(evt) } }(this)))
    const resizeObserver = new ResizeObserver(entries => { for (const entry of entries) { this.setLegendLayout() } })
    resizeObserver.observe(document.getElementById('webview_container'))
  }

  reinitialize (metricsArr, startTime, stopTime) {
    this.handler.initializeMetrics(metricsArr)
    this.handler.startTime.updateTime(startTime)
    this.handler.stopTime.updateTime(stopTime)
    this.handler.doRequest(400)
  }

  renderMetrics (datapointsJSON) {
    let allTraces = []
    for (const curMetric of this.store.getters['metrics/getAll']()) {
      if (curMetric.traces) {
        allTraces = allTraces.concat(curMetric.traces)
      }
    }
    // console.log("Render " + Math.round((globalEnd - globalStart)/1000) + " seconds delta");

    if (!this.hasPlot) {
      const canvasSize = [parseInt(this.ele.offsetWidth), document.body.scrollHeight - this.margins.row_foot]
      const myCanvas = document.createElement('canvas')
      myCanvas.setAttribute('width', canvasSize[0])
      myCanvas.setAttribute('height', canvasSize[1])
      this.ele = this.ele.appendChild(myCanvas)
      const myContext = myCanvas.getContext('2d')
      // Params: (ctx, offsetDimension, paramPixelsLeft, paramPixelsBottom, paramClearSize)
      this.graticule = new Graticule(this.handler.metricQHistory,
        myCanvas, myContext, [this.margins.canvas.left,
          this.margins.canvas.top,
          canvasSize[0] - (this.margins.canvas.right + this.margins.canvas.left),
          canvasSize[1] - (this.margins.canvas.top + this.margins.canvas.bottom)],
        this.margins.labels.left, this.margins.labels.bottom,
        [canvasSize[0], canvasSize[1]])
      this.hasPlot = true
      // TODO: neue Funktion handler.refreshTimeRange?
      this.handler.setTimeRange(this.handler.startTime, this.handler.stopTime)
      // parameters two and three "true" (doDraw, doResize) are ignored here :/
      this.graticule.data.processMetricQDatapoints(datapointsJSON, true, true)
      // URL import problem here: the response's start and end time are taken here :/
      this.graticule.automaticallyDetermineRanges(false, true)
      this.graticule.draw(false)
      registerCallbacks(myCanvas)

      /* TODO: externalize gear stuff */
      let gearEle = document.getElementById('gear_xaxis')
      if (gearEle) {
        gearEle.parentNode.removeChild(gearEle)
        gearEle = document.getElementById('gear_yaxis')
        gearEle.parentNode.removeChild(gearEle)
      }
      const BODY = document.getElementsByTagName('body')[0]
      /* TODO: abstract gear creation into separate class */
      const gearImages = [undefined, undefined]
      const gearSrc = ['img/icons/gear.svg',
        'img/icons/arrow-up-down.svg']
      for (let i = 0; i < 2; ++i) {
        gearImages[i] = document.createElement('img')
        const img = new Image()
        img.src = gearSrc[i]
        gearImages[i].src = img.src
        if (gearSrc[i].indexOf('gear') > -1) {
          gearImages[i].setAttribute('class', 'gear_axis')
        }
        gearImages[i].setAttribute('width', '28')
        gearImages[i].setAttribute('height', '28')
      }
      // TODO: THIS IS NOT MULTI-INSTANCE-SAFE
      // TODO: RENAME THESE ids SO THAT THEY GET NEW INDIVIDUAL ids EACH AND EVERY TIME
      const gearId = 'gear_yaxis'

      let gearWrapper = document.createElement('div')
      gearWrapper.setAttribute('id', gearId)
      gearWrapper.appendChild(gearImages[0])
      gearWrapper.appendChild(document.createElement('br'))
      gearWrapper.appendChild(gearImages[1])
      gearWrapper = BODY.appendChild(gearWrapper)

      this.positionYAxisGear(this.ele, gearWrapper)
      gearWrapper.addEventListener('click', () => {
        this.store.commit('togglePopup', 'yaxis')
      })
    } else {
      // Parameters: JSON, doDraw, doResize
      this.graticule.data.processMetricQDatapoints(datapointsJSON, true, false)
      this.graticule.automaticallyDetermineRanges(false, true)
      this.graticule.draw(false)
    }
  }

  positionYAxisGear (rowBodyEle, gearEle) {
    if (!rowBodyEle || !gearEle) {
      return
    }
    gearEle.style.position = 'absolute'
    const posGear = this.getTopLeft(rowBodyEle)
    posGear[0] += this.margins.gears.y.left
    posGear[1] += this.margins.gears.y.top
    gearEle.style.left = posGear[0] + 'px'
    gearEle.style.top = posGear[1] + 'px'
  }

  getTopLeft (ele) {
    const topLeft = [0, 0]
    const eleRect = ele.getBoundingClientRect()
    topLeft[0] = eleRect.left + window.scrollX
    topLeft[1] = eleRect.top + window.scrollY
    return topLeft
  }

  updateMetricUrl () {
    let encodedStr = ''
    // old style:
    // if (false) {
    //   const jsurlObj = {
    //     cntr: [],
    //     start: this.handler.startTime,
    //     stop: this.handler.stopTime
    //   }
    //   for (const metricBase in this.handler.allMetrics) {
    //     jsurlObj.cntr.push(this.handler.allMetrics[metricBase].name)
    //   }
    //   encodedStr = encodeURIComponent(window.JSURL.stringify(jsurlObj))
    // } else {
    encodedStr = '.' + this.handler.startTime.getValue() + '*' + this.handler.stopTime.getValue()
    for (const metricKey of this.store.getters['metrics/getAllKeys']()) {
      encodedStr += '*' + metricKey
    }
    encodedStr = encodeURIComponent(encodedStr)
    // }
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

  deleteMetric (metricBase) {
    if (this.graticule) this.graticule.data.deleteMetric(metricBase)
    this.store.dispatch('metrics/delete', { metricKey: metricBase })
    // TODO: also clear this metric from MetricCache
    if (this.graticule) this.graticule.draw(false)
    this.setPlotRanges(false, true)
  }

  deleteTraces (tracesArr) {
    // TODO: REFACTOR
    // Plotly.deleteTraces(this.ele, tracesArr);
    this.countTraces -= tracesArr.length
  }

  changeMetricName (metricReference, newName, oldName) {
    /* reject metric names that already exist */
    if (this.store.getter['metrics/get'](newName)) {
      return false
    }
    const oldMetric = this.store.getter['metrics/get'](oldName)
    this.store.dispatch('metrics/create', { metric: { ...oldMetric, name: newName, description: undefined } })
    this.deleteMetric(oldName)
    if (this.graticule) {
      let newCache = this.graticule.data.getMetricCache(newName)
      if (!newCache) {
        newCache = this.graticule.data.getMetricCache(newName)
        // TODO: call this.graticule.data.initializeCacheWithColor()
        this.graticule.data.initializeCacheWithColor(newName, metricReference.color)
        // WHAT SHALL WE DO WITH THE LEGEND'S COLOR?
        // WHAT SHALL WE DO WITH A DRUNKEN SAILOR IN THE MORNING?
      }
    }
    this.reload()
    return true
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

  windowResize (evt) {
    if (this.graticule) {
      this.setLegendLayout()
    }
  }

  setFootMargin () {
    const layout = this.store.state.configuration.legendDisplay
    const heightHeader = document.getElementById('row_head').offsetHeight
    if (layout === 'bottom') {
      this.margins.row_foot = heightHeader + 140
    } else if (layout === 'right') {
      this.margins.row_foot = heightHeader + 50
    }
  }

  setLegendLayout () {
    this.setFootMargin()
    this.setLegendListWidth()
    if (this.graticule) this.graticule.canvasResize(this.margins.canvas, this.margins.row_foot)
  }

  setLegendListWidth () {
    if (this.store.state.configuration.legendDisplay === 'right') {
      if (this.graticule) this.graticule.canvasReset()
      let maxWidth = 0
      const minWidth = '250px'
      const maxWidthPercent = 0.5
      const legendItems = document.getElementsByClassName('legend_item')
      document.getElementById('legend_list').style.whiteSpace = 'nowrap'
      document.getElementById('legend_container').style.width = minWidth
      for (let i = 0; i < legendItems.length; i++) {
        if (legendItems[i].scrollWidth > maxWidth) {
          maxWidth = legendItems[i].scrollWidth
        }
      }
      if (maxWidth > window.innerWidth * maxWidthPercent) {
        document.getElementById('legend_list').style.whiteSpace = 'normal'
        maxWidth = window.innerWidth * maxWidthPercent
      }
      document.getElementById('legend_container').style.width = maxWidth + 100 + 'px'
    } else {
      document.getElementById('legend_list').style.whiteSpace = 'normal'
      document.getElementById('legend_container').style.width = '100%'
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
  } // else Zweig wird anscheinend nie benötigt
  /* else {
    console.log('2')
    newManager = new MetricQWebView(document.querySelector('.row_body'), metricNamesArr, timeStart, timeStop)
    newManager.postRender = function () {
    }
  } */
}
