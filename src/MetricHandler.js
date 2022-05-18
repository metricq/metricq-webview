import { MetricTimestamp } from './MetricTimestamp.js'
import MetricQHistory from '@metricq/history'
import Vue from 'vue'

const METRICQ_BACKEND = process.env.VUE_APP_METRICQ_BACKEND
const [METRICQ_BACKEND_USER, METRICQ_BACKEND_PASSWORD] = process.env.VUE_APP_METRICQ_BACKEND_AUTH === undefined ? [undefined, undefined] : process.env.VUE_APP_METRICQ_BACKEND_AUTH.split(':')

export { METRICQ_BACKEND, METRICQ_BACKEND_USER, METRICQ_BACKEND_PASSWORD }

export class MetricHandler {
  constructor (paramRenderer, paramMetricsArr, paramStartTime, paramStopTime, store) {
    this.store = store
    this.renderer = paramRenderer
    this.startTime = new MetricTimestamp(paramStartTime, 'start')
    this.stopTime = new MetricTimestamp(paramStopTime, 'end')
    this.metricQHistory = new MetricQHistory(METRICQ_BACKEND, METRICQ_BACKEND_USER, METRICQ_BACKEND_PASSWORD)

    this.WIGGLEROOM_PERCENTAGE = 0.05
    this.TIME_MARGIN_FACTOR = 1.00 / 3

    this.initializeMetrics(paramMetricsArr)
  }

  initializeMetrics (initialMetricNames) {
    this.store.commit('metrics/resetAll')
    for (let i = 0; i < initialMetricNames.length; ++i) {
      const curMetricName = initialMetricNames[i]
      window.MetricQWebView.instances[0].addMetric(curMetricName)
    }
  }

  doRequest (maxDataPoints) {
    const timeMargin = (this.stopTime.getUnix() - this.startTime.getUnix()) * this.TIME_MARGIN_FACTOR
    const nonErrorProneMetrics = []
    const remainingMetrics = []
    for (const curMetric of this.store.getters['metrics/getAll']()) {
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
    const startTime = window.performance.now()
    if (queryObj.targets.length > 0) {
      // TODO: register some callback
      // execute query
      // TODO: pass parameter nonErrorProneMetrics
      queryObj.run().then((dataset) => {
        this.handleResponse(nonErrorProneMetrics, dataset, startTime)
      }).catch(() => {
        console.log('Request failed: ' + nonErrorProneMetrics.join(','))
        nonErrorProneMetrics.forEach((curVal) => {
          console.log('Marking as faulty: ' + curVal)
          this.receivedError(0, curVal)
        })
        this.doRequest(maxDataPoints)
      })
    }
    for (let i = 0; i < remainingMetrics.length; ++i) {
      const queryObj = this.metricQHistory.query(this.startTime.getUnix() - timeMargin,
        this.stopTime.getUnix() + timeMargin,
        maxDataPoints)
      queryObj.target(remainingMetrics[i], defaultAggregates)
      queryObj.run().then((dataset) => {
        this.handleResponse([remainingMetrics[i]], dataset, startTime)
      })
    }
  }

  handleResponse (requestedMetrics, myData, startTime) {
    this.store.commit('setQueryTime', window.performance.now() - startTime)
    const listOfFaultyMetrics = []
    let pointCountAgg = 0
    let pointCountRaw = 0
    for (let i = 0; i < requestedMetrics.length; ++i) {
      const metricName = requestedMetrics[i]
      const matchingAggregatesObj = {}
      let matchingAggregatesCount = 0
      for (const curMetricName in myData) {
        const splitted = curMetricName.split('/')
        if (splitted[0] === requestedMetrics[i]) {
          matchingAggregatesObj[splitted[1]] = true
          matchingAggregatesCount += 1
          if (splitted[1] === 'count' || splitted[1] === 'raw') {
            let pointsRaw = 0
            if (splitted[1] === 'count') {
              for (const entry in myData[curMetricName].data) {
                pointsRaw += myData[curMetricName].data[entry].value
              }
              this.store.dispatch('metrics/updateDataPoints', { metricKey: splitted[0], pointsAgg: myData[curMetricName].data.length, pointsRaw: pointsRaw })
              pointCountAgg += myData[curMetricName].data.length
            } else {
              pointsRaw = myData[curMetricName].data.length
              this.store.dispatch('metrics/updateDataPoints', { metricKey: splitted[0], pointsAgg: 0, pointsRaw: pointsRaw })
            }
            pointCountRaw += pointsRaw
          }
        }
      }
      if (!this.checkIfMetricIsOk(metricName, matchingAggregatesCount, matchingAggregatesObj)) {
        listOfFaultyMetrics.push(metricName)
        console.log('Metric not ok:' + metricName)
        this.receivedError(0, metricName)
      }
    }
    this.store.commit('setAggregatePoints', pointCountAgg)
    this.store.commit('setRawPoints', pointCountRaw)
    if (listOfFaultyMetrics.length > 0) {
      Vue.toasted.error('Fehler mit Metriken: ' + listOfFaultyMetrics.join(', '), this.store.state.toastConfiguration)
    }
    this.renderer.renderMetrics(myData, startTime)
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

  searchMetricsPromise (inputStr, metadata = false) {
    return this.metricQHistory.search(inputStr, metadata)
  }

  // TODO: move this function to DataCache, maybe?
  getAllMinMax () {
    const referenceAttribute = 'minmax'
    if (this.renderer.graticule.yRangeOverride.type === 'manual') {
      return [this.renderer.graticule.yRangeOverride.min, this.renderer.graticule.yRangeOverride.max]
    }
    let allMinMax = [undefined, undefined]
    const timeFrame = this.renderer.graticule.curTimeRange
    for (const curMetric of this.store.getters['metrics/getAll']()) {
      const curCache = this.renderer.graticule.data.getMetricCache(curMetric.key)
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
    window.MetricQWebView.instances[0].graticule.setTimeRange(this.startTime.getUnix(), this.stopTime.getUnix())
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
    if (this.store.getters['metrics/get'](metricBase)) {
      this.store.dispatch('metrics/setError', { metricKey: metricBase })
    }
  }

  reload () {
    const rowBodyEle = document.querySelector('.row_body')
    const maxDataPoints = Math.round(rowBodyEle.offsetWidth / this.store.state.configuration.resolution)
    this.doRequest(maxDataPoints)
  }

  setRelativeTimes (start, end) {
    this.startTime.updateTime(start)
    this.stopTime.updateTime(end)
    this.setTimeRange(this.startTime, this.stopTime)
  }
}
