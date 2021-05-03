import { Metric, markerSymbols } from './metric.js'
import { MetricTimestamp } from './MetricTimestamp.js'
import { showUserHint } from './interact.js'

const METRICQ_BACKEND = 'https://grafana.metricq.zih.tu-dresden.de/metricq'

export { METRICQ_BACKEND }

export class MetricHandler {
  constructor (paramRenderer, paramMetricsArr, paramStartTime, paramStopTime, store) {
    this.store = store
    this.renderer = paramRenderer
    this.startTime = new MetricTimestamp('start')
    this.stopTime = new MetricTimestamp('end')
    this.metricQHistory = new MetricQHistory(METRICQ_BACKEND)

    this.WIGGLEROOM_PERCENTAGE = 0.05
    this.TIME_MARGIN_FACTOR = 1.00 / 3

    this.initializeMetrics(paramMetricsArr)

    this.labelMap = {
      'Last 5 minutes': ['now-5m', 'now'],
      'Last 15 minutes': ['now-15m', 'now'],
      'Last 30 minutes': ['now-30m', 'now'],
      'Last 1 hour': ['now-1h', 'now'],
      'Last 3 hours': ['now-3h', 'now'],
      'Last 6 hours': ['now-6h', 'now'],
      'Last 12 hours': ['now-12h', 'now'],
      'Last 24 hours': ['now-24h', 'now'],
      'Last 2 days': ['now-2d', 'now'],
      'Last 7 days': ['now-7d', 'now'],
      'Last 30 days': ['now-30d', 'now'],
      'Last 90 days': ['now-90d', 'now'],
      'Last 6 months': ['now-6M', 'now'],
      'Last 1 year': ['now-1y', 'now'],
      Today: ['startday', 'now'],
      Yesterday: ['startday-1d', 'startday'],
      'This week': ['startweek', 'now'],
      'Last week': ['startweek-7d', 'startweek'],
      'This month': ['startmonth', 'now'],
      'Last month': ['startmonth-1M', 'now']
    }
  }

  initializeMetrics (initialMetricNames) {
    this.store.resetAllMetrics()
    for (let i = 0; i < initialMetricNames.length; ++i) {
      const curMetricName = initialMetricNames[i]
      if (curMetricName.length > 0) {
        this.store.setMetric(curMetricName, new Metric(this.renderer, curMetricName, undefined, markerSymbols[(i * 4) % markerSymbols.length], []))
      }
    }
    this.store.setMetric('empty', new Metric(this.renderer, '', undefined, markerSymbols[markerSymbols.length - 1], []))
  }

  doRequest (maxDataPoints) {
    const timeMargin = (this.stopTime.getUnix() - this.startTime.getUnix()) * this.TIME_MARGIN_FACTOR
    const nonErrorProneMetrics = []
    const remainingMetrics = []
    for (const metricBase in this.store.state.allMetrics) {
      const curMetric = this.store.state.allMetrics[metricBase]
      if (curMetric.name.length > 0) {
        if (curMetric.errorprone) {
          remainingMetrics.push(curMetric.name)
        } else {
          nonErrorProneMetrics.push(curMetric.name)
        }
      }
    }

    const queryObj = this.metricQHistory.query(this.startTime.getUnix() - timeMargin,
      this.stopTime.getUnix() + timeMargin,
      Math.round(maxDataPoints + (maxDataPoints * this.TIME_MARGIN_FACTOR * 2)))
    const defaultAggregates = ['min', 'max', 'avg', 'count']
    for (let i = 0; i < nonErrorProneMetrics.length; ++i) {
      queryObj.target(nonErrorProneMetrics[i], defaultAggregates)
    }
    if (queryObj.targets.length > 0) {
      // TODO: register some callback

      // execute query
      // TODO: pass parameter nonErrorProneMetrics
      const myPromise = queryObj.run().then((function (selfReference, requestedMetrics) {
        return function (dataset) {
          selfReference.handleResponse(selfReference, requestedMetrics, dataset)
        }
      }(this, nonErrorProneMetrics)), (function (selfReference, requestedMetrics, paramDataPoints) {
        return function (errorObject) {
          console.log('Request failed: ' + requestedMetrics.join(','))
          requestedMetrics.forEach((curVal) => {
            console.log('Marking as faulty: ' + curVal)
            selfReference.receivedError(0, curVal)
          })
          selfReference.doRequest(paramDataPoints)
        }
      }(this, nonErrorProneMetrics, maxDataPoints)))
      // queryObj.run().then((dataset) => { this.handleResponse(dataset); });
    }
    for (let i = 0; i < remainingMetrics.length; ++i) {
      const queryObj = this.metricQHistory.query(this.startTime.getUnix() - timeMargin,
        this.stopTime.getUnix() + timeMargin,
        maxDataPoints)
      queryObj.target(remainingMetrics[i], defaultAggregates)

      queryObj.run().then(function (selfReference, requestedMetrics) { return function (dataset) { selfReference.handleResponse(selfReference, requestedMetrics, dataset) } }(this, [remainingMetrics[i]]))
    }
  }

  handleResponse (selfReference, requestedMetrics, myData) {
    const listOfFaultyMetrics = []
    for (let i = 0; i < requestedMetrics.length; ++i) {
      const metricName = requestedMetrics[i]
      const matchingAggregatesObj = {}
      let matchingAggregatesCount = 0
      for (const curMetricName in myData) {
        const splitted = curMetricName.split('/')
        if (splitted[0] === requestedMetrics[i]) {
          matchingAggregatesObj[splitted[1]] = true
          matchingAggregatesCount += 1
        }
      }
      if (!selfReference.checkIfMetricIsOk(metricName, matchingAggregatesCount, matchingAggregatesObj)) {
        listOfFaultyMetrics.push(metricName)
        console.log('Metric not ok:' + metricName)
        selfReference.receivedError(0, metricName)
      }
    }
    if (listOfFaultyMetrics > 0) {
      showUserHint('Error with metrics: ' + listOfFaultyMetrics.join(', '))
    }
    selfReference.renderer.renderMetrics(myData)
  }

  checkIfMetricIsOk (metricName, aggregateCount, aggregateObj) {
    if (!metricName ||
      aggregateCount < 1 ||
      (!aggregateObj.count && !aggregateObj.raw)) {
      return false
    }
    if (!((aggregateObj.raw && !aggregateObj.min && !aggregateObj.max) ||
      (!aggregateObj.raw && aggregateObj.min && aggregateObj.max))) {
      return false
    }
    return true
  }

  searchMetricsPromise (inputStr) {
    return this.metricQHistory.search(inputStr)
  }

  // TODO: 'drop'/remove this function
  handleMetricResponse (selfReference, metricArr, evt) {
    if (evt.target.readyState === 4) {
      if (evt.target.status >= 200 &&
        evt.target.status < 300) {
        let parsedObj
        try {
          parsedObj = JSON.parse(evt.target.responseText)
          // selfReference.parseResponse(parsedObj, metricArr);
          // console.log("old Data format:");
          // console.log(parsedObj);
          console.log('Dropping data...')
          // selfReference.renderer.renderMetrics(parsedObj);
        } catch (exc) {
          console.log('Couldn\'t parse')
          console.log(exc)
        }
      } else {
        console.log(evt.target)
        selfReference.receivedError(evt.target.status, metricArr)
      }
    }
  }

  // TODO: move this function to DataCache, maybe?
  getAllMinMax () {
    const referenceAttribute = 'minmax'
    if (this.renderer.graticule.yRangeOverride.type === 'manual') {
      return [this.renderer.graticule.yRangeOverride.min, this.renderer.graticule.yRangeOverride.max]
    }
    let allMinMax = [undefined, undefined]
    const timeFrame = this.renderer.graticule.curTimeRange
    for (const metricBase in this.store.state.allMetrics) {
      const curMetric = this.store.state.allMetrics[metricBase]
      const curCache = this.renderer.graticule.data.getMetricCache(metricBase)
      if (curCache) {
        let curMinMax
        if (this.renderer.graticule.yRangeOverride.type === 'global') {
          curMinMax = [curCache.allTime.min, curCache.allTime.max]
        }
        if (this.renderer.graticule.yRangeOverride.type === 'local') {
          curMinMax = curCache.getAllMinMax(timeFrame[0], timeFrame[1])
        }
        if (curMinMax) {
          if (undefined === allMinMax[0]) {
            allMinMax = curMinMax
          } else {
            if (curMinMax[0] < allMinMax[0]) {
              allMinMax[0] = curMinMax[0]
            }
            if (curMinMax[1] > allMinMax[1]) {
              allMinMax[1] = curMinMax[1]
            }
          }
        }
      }
    }
    // add a little wiggle room, so that markers won't be cut off
    const delta = allMinMax[1] - allMinMax[0]
    allMinMax[0] -= delta * this.WIGGLEROOM_PERCENTAGE
    allMinMax[1] += delta * this.WIGGLEROOM_PERCENTAGE
    return allMinMax
  }

  parseTrace (metricBase, metricAggregate, datapointsArr) {
    const curTrace = {
      x: [],
      y: [],
      name: metricBase + '/' + metricAggregate,
      type: 'scatter',
      hoverinfo: 'skip'
    }
    switch (metricAggregate) {
      case 'min':
      case 'max': /* fall-through */
      case 'avg': /* fall-through */
      case 'raw': /* fall-through */
        for (let j = 0; j < datapointsArr.length; ++j) {
          curTrace.x.push(datapointsArr[j][1])
          curTrace.y.push(datapointsArr[j][0])
        }
        return curTrace
    }
    return undefined
  }

  processTracesArr (tracesAll) {
    // parse multiple metrics/traces
    let i = 0
    for (const curMetric in tracesAll) {
      const curTraces = tracesAll[curMetric]
      if (curTraces.min && curTraces.max) {
        const storeTraces = [curTraces.min, curTraces.max]
        storeTraces[1].fill = 'tonexty'
        if (curTraces.avg) {
          storeTraces.push(curTraces.avg)
        }
        storeTraces.forEach(function (paramValue, paramIndex, paramArray) {
          paramValue.mode = 'lines'
          paramValue.line = {
            width: 0,
            color: undefined,
            shape: 'vh'
          } // connect "next"
          // "shape": "hv" // connect "last"
          // "shape": "linear" // connect "direct"
        })
        if (curTraces.avg) {
          storeTraces[2].line.dash = 'dash'
          storeTraces[2].line.width = 2
        }
        // add traces to metricList, create an object of metric class in before
        this.loadedMetric(curMetric, storeTraces, i)
      } else if (curTraces.raw) {
        const rawTrace = [curTraces.raw]
        rawTrace[0].mode = 'markers'
        rawTrace[0].marker = {
          size: 10,
          color: undefined,
          symbol: undefined
        }
        this.loadedMetric(curMetric, rawTrace, i)
      }
      ++i
    }
    if (i > 0) {
      this.renderer.renderMetrics()
    }
  }

  parseResponse (parsedJson, paramMetricsArr) {
    // TODO: track metrics thate were requested but got no response,
    //        mark these as errorpone=true
    const tracesAll = {}
    let metricBase
    let metricAggregate
    for (let i = 0; i < parsedJson.length; ++i) {
      const fullMetric = parsedJson[i].target
      if (fullMetric.indexOf('/') > -1 &&
        parsedJson[i].datapoints &&
        parsedJson[i].datapoints[0]) {
        metricBase = fullMetric.substring(0, fullMetric.indexOf('/'))
        metricAggregate = fullMetric.substring(fullMetric.indexOf('/') + 1)

        const parsedTrace = this.parseTrace(metricBase, metricAggregate, parsedJson[i].datapoints)
        if (parsedTrace) {
          if (!tracesAll[metricBase]) {
            tracesAll[metricBase] = {}
          }
          tracesAll[metricBase][metricAggregate] = parsedTrace
        }
      }
    }
    this.processTracesArr(tracesAll)
  }

  loadedMetric (metricBase, metricTraces, metricIndex) {
    const myMetric = this.store.state.allMetrics[metricBase]
    if (!myMetric) {
      this.store.setMetric(metricBase, new Metric(this.renderer, metricBase, undefined, markerSymbols[metricIndex * 4], metricTraces))
    } else {
      myMetric.setTraces(metricTraces)
    }
  }

  setTimeRange (paramStartTime, paramStopTime) {
    // TODO: check for zoom area if it is too narrow (i.e. less than 1000 ms)
    // TODO: sync the aforementioned minimum time window
    if (undefined === paramStartTime || paramStartTime instanceof MetricTimestamp) {
      paramStartTime = this.startTime.getUnix()
    } else {
      this.startTime.updateTime(paramStartTime)
    }
    if (undefined === paramStopTime || paramStopTime instanceof MetricTimestamp) {
      paramStopTime = this.stopTime.getUnix()
    } else {
      this.stopTime.updateTime(paramStopTime)
    }

    if (isNaN(paramStartTime) || isNaN(paramStopTime)) {
      throw new Error('uh oh time is NaN')
    }
    if (paramStartTime >= paramStopTime) {
      throw new Error(`startTime(${paramStartTime}) is not smaller than stopTime(${paramStopTime})`)
    }

    let timeSuitable = true
    if ((paramStopTime - paramStartTime) < this.renderer.graticule.MIN_ZOOM_TIME) {
      const oldDelta = paramStopTime - paramStartTime
      const newDelta = this.renderer.graticule.MIN_ZOOM_TIME
      paramStartTime -= Math.round((newDelta - oldDelta) / 2.00)
      paramStopTime += Math.round((newDelta - oldDelta) / 2.00)
      timeSuitable = false
    }
    if ((paramStopTime - paramStartTime) > this.renderer.graticule.MAX_ZOOM_TIME) {
      const oldDelta = paramStopTime - paramStartTime
      const newDelta = this.renderer.graticule.MAX_ZOOM_TIME
      paramStartTime += Math.round((oldDelta - newDelta) / 2.00)
      paramStopTime -= Math.round((oldDelta - newDelta) / 2.00)
      timeSuitable = false
    }

    this.renderer.updateMetricUrl()

    // maybe move this line to MetricQWebView.setPlotRanges()? NAW
    this.renderer.graticule.setTimeRange(this.startTime.getUnix(), this.stopTime.getUnix())
    return timeSuitable
    // this.lastRangeChangeTime = (new Date()).getTime();
    // TODO: return false when intended zoom area is smaller than e.g. 1000 ms
    // TODO: define a CONSTANT that is MINIMUM_ZOOM_AREA

    // TODO: call url export here?
    // return true;
  }

  zoomTimeAtPoint (pointAt, zoomDirection) {
    const zoomFactor = 1 + zoomDirection
    const newTimeDelta = (this.stopTime.getUnix() - this.startTime.getUnix()) * zoomFactor
    let couldZoom = false
    if (newTimeDelta > this.renderer.graticule.MIN_ZOOM_TIME) {
      const relationalPositionOfPoint = (pointAt[0] - this.startTime.getUnix()) / (this.stopTime.getUnix() - this.startTime.getUnix())
      if (this.setTimeRange(pointAt[0] - (newTimeDelta * relationalPositionOfPoint),
        pointAt[0] + (newTimeDelta * (1 - relationalPositionOfPoint)))) {
        couldZoom = true
      }
    }
    return couldZoom
  }

  receivedError (errorCode, metricBase) {
    // mark a metric so it is being excluded in bulk-requests
    if (this.store.state.allMetrics[metricBase]) {
      this.store.state.allMetrics[metricBase].error()
    }
  }

  reload () {
    const rowBodyEle = document.querySelector('.row_body')
    const maxDataPoints = Math.round(rowBodyEle.offsetWidth / this.renderer.configuration.resolution)
    this.doRequest(maxDataPoints)
  }

  setrelativeTimes (paramLabel) {
    this.startTime.updateTime(this.labelMap[paramLabel][0])
    this.stopTime.updateTime(this.labelMap[paramLabel][1])
    this.setTimeRange(this.startTime, this.stopTime)
  }
}
