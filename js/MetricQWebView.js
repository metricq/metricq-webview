import { MetricHandler } from './MetricHandler.js'
import { Configuration } from './configuration.js'
import { Graticule } from './graticule.js'
import { markerSymbols, Metric } from './metric.js'
import { registerCallbacks } from './interact.js'
import { mainApp, globalPopup } from './app.js'

export function createGlobalMetricQWebview (paramParentEle, paramMetricNamesArr, paramStartTime, paramStopTime) {
  const webview = new MetricQWebView(paramParentEle, paramMetricNamesArr, paramStartTime, paramStopTime)
  window.MetricQWebView.instances.push(webview)
}

class MetricQWebView {
  constructor (paramParentEle, paramMetricNamesArr, paramStartTime, paramStopTime) {
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
    this.handler = new MetricHandler(this, paramMetricNamesArr, paramStartTime, paramStopTime)
    this.postRender = undefined
    this.countTraces = 0
    this.hasPlot = false
    this.graticule = undefined
    this.configuration = new Configuration(5, 10) // constructor(resolutionParam, zoomSpeedParam)
    this.margins = {
      canvas: {
        top: 10,
        right: 35,
        bottom: 40,
        left: 55
      },
      labels: {
        left: 3,
        bottom: 10
      },
      gears: {
        x: {
          left: -3,
          top: -1
        },
        y: {
          left: 2,
          top: 6
        }
      }
    }
    this.lastThrottledReloadTime = 0
    this.RELOAD_THROTTLING_DELAY = 150
    this.reloadThrottleTimeout = undefined

    if (paramMetricNamesArr.length > 0) {
      this.handler.doRequest(400)
    }
    window.addEventListener('resize', (function (selfReference) { return function (evt) { selfReference.windowResize(evt) } }(this)))
  }

  reinitialize (metricsArr, startTime, stopTime) {
    this.handler.initializeMetrics(metricsArr)
    this.handler.startTime = startTime
    this.handler.stopTime = stopTime
    this.handler.doRequest(400)
  }

  renderMetrics (datapointsJSON) {
    let allTraces = []

    for (const metricBase in this.handler.allMetrics) {
      const curMetric = this.handler.allMetrics[metricBase]
      if (curMetric.traces) {
        allTraces = allTraces.concat(curMetric.traces)
      }
    }

    this.updateMetricUrl()
    // console.log("Render " + Math.round((globalEnd - globalStart)/1000) + " seconds delta");

    if (!this.hasPlot) {
      const canvasSize = [parseInt(this.ele.offsetWidth), document.body.scrollHeight - 250]
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
      const gearImages = [undefined, undefined, undefined, undefined]
      const gearSrc = ['img/icons/gear.svg',
        'img/icons/arrow-left-right.svg',
        'img/icons/gear.svg',
        'img/icons/arrow-up-down.svg']
      for (let i = 0; i < 4; ++i) {
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
      const gearWrapper = [undefined, undefined]
      // TODO: THIS IS NOT MULTI-INSTANCE-SAFE
      // TODO: RENAME THESE ids SO THAT THEY GET NEW INDIVIDUAL ids EACH AND EVERY TIME
      const gearIds = ['gear_xaxis', 'gear_yaxis']
      for (let i = 0; i < 2; ++i) {
        gearWrapper[i] = document.createElement('div')
        gearWrapper[i].setAttribute('id', gearIds[i])
        gearWrapper[i].appendChild(gearImages[i * 2])
        gearWrapper[i].appendChild(document.createElement('br'))
        gearWrapper[i].appendChild(gearImages[i * 2 + 1])
        gearWrapper[i] = BODY.appendChild(gearWrapper[i])
      }
      this.positionXAxisGear(this.ele, gearWrapper[0])
      gearWrapper[0].addEventListener('click', function () {
        globalPopup.xaxis = !globalPopup.xaxis
      })
      this.positionYAxisGear(this.ele, gearWrapper[1])
      gearWrapper[1].addEventListener('click', function () {
        globalPopup.yaxis = !globalPopup.yaxis
      })
    } else {
      // Parameters: JSON, doDraw, doResize
      this.graticule.data.processMetricQDatapoints(datapointsJSON, true, false)
      this.graticule.draw(false)
    }

    if (this.postRender) {
      this.postRender()
    }
  }

  positionXAxisGear (rowBodyEle, gearEle) {
    if (!rowBodyEle || !gearEle) {
      return
    }
    gearEle.style.position = 'absolute'
    const posGear = this.getTopLeft(rowBodyEle)
    posGear[0] += parseInt(rowBodyEle.offsetWidth) - parseInt(gearEle.offsetWidth)
    posGear[1] += parseInt(rowBodyEle.offsetHeight) - parseInt(gearEle.offsetHeight)
    posGear[0] += this.margins.gears.x.left
    posGear[1] += this.margins.gears.x.top
    gearEle.style.left = posGear[0] + 'px'
    gearEle.style.top = posGear[1] + 'px'
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
    encodedStr = '.' + this.handler.startTime + '*' + this.handler.stopTime
    for (const metricBase in this.handler.allMetrics) {
      encodedStr += '*' + this.handler.allMetrics[metricBase].name
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
    // TODO: implement feature to throttle requests
    // (i.e. 150 ms without new call to this function)
    const now = (new Date()).getTime()
    if (this.reloadThrottleTimeout &&
      (now - this.lastThrottledReloadTime) >= this.RELOAD_THROTTLING_DELAY) {
      this.reload()
    } else {
      if (this.reloadThrottleTimeout) {
        clearTimeout(this.reloadThrottleTimeout)
      }
      this.reloadThrottleTimeout = setTimeout((function (selfReference) {
        return function () {
          selfReference.throttledReload()
          selfReference.reloadThrottleTimeout = undefined
        }
      }(this)), this.RELOAD_THROTTLING_DELAY + 5)
    }
    this.lastThrottledReloadTime = now
  }

  getMetric (metricName) {
    for (const metricBase in this.handler.allMetrics) {
      if (this.handler.allMetrics[metricBase].name === metricName) {
        return this.handler.allMetrics[metricBase]
      }
    }
    return undefined
  }

  newEmptyMetric () {
    if (!this.handler.allMetrics.empty) {
      this.handler.allMetrics.empty = new Metric(this, '', undefined, markerSymbols[0], [])
    }
  }

  deleteMetric (metricBase) {
    if (this.graticule) this.graticule.data.deleteMetric(metricBase)
    delete this.handler.allMetrics[metricBase]
    // TODO: also clear this metric from MetricCache
    if (this.graticule) this.graticule.draw(false)
  }

  deleteTraces (tracesArr) {
    // TODO: REFACTOR
    // Plotly.deleteTraces(this.ele, tracesArr);
    this.countTraces -= tracesArr.length
  }

  changeMetricName (metricReference, newName, oldName) {
    /* reject metric names that already exist */
    if (this.handler.allMetrics[newName]) {
      return false
    }
    metricReference.updateName(newName)
    if (oldName === '') {
      this.handler.allMetrics.empty = new Metric(this, '', undefined, markerSymbols[0], [])
      this.handler.allMetrics[newName] = metricReference
    } else {
      this.deleteMetric(oldName)
      this.handler.allMetrics[newName] = metricReference
    }
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
    // TODO: heed width and height parameters!
    // this.configuration.exportWidth;

    let filenameStr = 'MetricQ-WebView.'
    let filetypeStr = 'image/'
    filenameStr += this.configuration.exportFormat
    filetypeStr += this.configuration.exportFormat
    const canvasImageData = this.graticule.ele.toDataURL(filetypeStr)
    let linkEle = document.createElement('a')
    linkEle.setAttribute('href', canvasImageData)
    linkEle.setAttribute('download', filenameStr)
    // linkEle.setAttribute("onclick", "this.parentNode.removeChild(this);");
    linkEle.appendChild(document.createTextNode('Export'))
    linkEle = document.body.appendChild(linkEle)

    linkEle.click()
    document.body.removeChild(linkEle)
  }

  windowResize (evt) {
    if (this.graticule) {
      this.positionXAxisGear(this.ele, document.getElementById('gear_xaxis'))
      this.graticule.windowResize(evt)
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
          metricsObj = window.JSURL.parse(jsurlStr.substring(1))
        } else {
          metricsObj = window.JSURL.parse(jsurlStr)
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
        initializeMetrics(splitted.slice(2), parseInt(splitted[0].substring(1)), parseInt(splitted[1]))
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
    newManager.postRender = function () {
      mainApp.$forceUpdate()
    }
  } else {
    newManager = new MetricQWebView(document.querySelector('.row_body'), metricNamesArr, timeStart, timeStop)
    newManager.postRender = function () {
      mainApp.$forceUpdate()
    }
  }
}
