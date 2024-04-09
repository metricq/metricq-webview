import { MetricTimestamp } from './MetricTimestamp.js'
import MetricQHistory from '@metricq/history'
import Vue from 'vue'

export class MetricHandler {
  constructor (paramRenderer, paramStartTime, paramStopTime, store, metricqBackendConfig) {
    this.store = store
    this.renderer = paramRenderer
    this.startTime = new MetricTimestamp(paramStartTime, 'start')
    this.stopTime = new MetricTimestamp(paramStopTime, 'end')
    this.metricQHistory = new MetricQHistory(metricqBackendConfig.backend, metricqBackendConfig.user, metricqBackendConfig.password)

    this.WIGGLEROOM_PERCENTAGE = 0.05
    this.TIME_MARGIN_FACTOR = 1.00 / 3
  }

  doRequest (maxDataPoints) {
    if (maxDataPoints === 0) return
    const timeMargin = (this.stopTime.getUnix() - this.startTime.getUnix()) * this.TIME_MARGIN_FACTOR
    const metrics = []
    const errorProneMetrics = []
    for (const curMetric of this.store.getters['metrics/getAll']()) {
      if (curMetric.name.length > 0) {
        if (curMetric.errorprone) {
          errorProneMetrics.push(curMetric.name)
        } else {
          metrics.push(curMetric.name)
        }
      }
    }

    const queryObj = this.metricQHistory.query(this.startTime.getUnix() - timeMargin,
      this.stopTime.getUnix() + timeMargin,
      Math.round(maxDataPoints + (maxDataPoints * this.TIME_MARGIN_FACTOR * 2)))
    const defaultAggregates = ['min', 'max', 'avg', 'count']
    for (let i = 0; i < metrics.length; ++i) {
      queryObj.target(metrics[i], defaultAggregates)
    }
    const startTime = window.performance.now()
    if (queryObj.targets.length > 0) {
      // TODO: register some callback
      // execute query
      // TODO: pass parameter nonErrorProneMetrics
      queryObj.run().then((dataset) => {
        this.handleResponse(metrics, dataset, startTime)
      }).catch(() => {
        console.log('Request failed: ' + metrics.join(','))
        metrics.forEach((curVal) => {
          console.log('Marking as faulty: ' + curVal)
          this.receivedError(0, curVal)
        })
        this.doRequest(maxDataPoints)
      })
    }
    for (let i = 0; i < errorProneMetrics.length; ++i) {
      const queryObj = this.metricQHistory.query(this.startTime.getUnix() - timeMargin,
        this.stopTime.getUnix() + timeMargin,
        maxDataPoints)
      queryObj.target(errorProneMetrics[i], defaultAggregates)
      queryObj.run().then((dataset) => {
        this.handleResponse([errorProneMetrics[i]], dataset, startTime)
      })
    }
  }

  handleResponse (requestedMetrics, myData, startTime) {
    this.store.commit('setQueryTime', window.performance.now() - startTime)
    const listOfFaultyMetrics = []
    let pointCountAgg = null
    let pointCountRaw = 0

    for (const metric of requestedMetrics) {
      const matchingAggregatesObj = {}
      let matchingAggregatesCount = 0

      for (const curMetricName in myData) {
        const splitted = curMetricName.split('/')
        if (splitted[0] === metric) {
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
              this.store.dispatch('metrics/updateDataPoints', { metricKey: splitted[0], pointsAgg: null, pointsRaw: pointsRaw })
            }
            pointCountRaw += pointsRaw
          }
        }
      }

      if (!this.checkIfMetricIsOk(metric, matchingAggregatesCount, matchingAggregatesObj)) {
        listOfFaultyMetrics.push(metric)
        console.log('Metric not ok:' + metric)
        this.receivedError(0, metric)
      }
    }

    this.store.commit('setAggregatePoints', pointCountAgg)
    this.store.commit('setRawPoints', pointCountRaw)

    if (listOfFaultyMetrics.length > 0) {
      Vue.toasted.error('Fehler beim Abfragen von: ' + listOfFaultyMetrics.join(', '), this.store.state.toastConfiguration)
    }

    this.renderer.renderMetrics(myData, startTime)
  }

  checkIfMetricIsOk (metricName, aggregateCount, aggregateObj) {
    if (!metricName || aggregateCount < 1 || (!aggregateObj.count && !aggregateObj.raw)) {
      return false
    }

    // we want (raw xor (min and max))
    return aggregateObj.raw !== (aggregateObj.min && aggregateObj.max)
  }

  searchMetricsPromise (inputStr, metadata = false) {
    return this.metricQHistory.search(inputStr, metadata)
  }

  // TODO: move this function to DataCache, maybe?
  getAllMinMax () {
    if (this.renderer.graticule.yRangeOverride.type === 'manual') {
      return [this.renderer.graticule.yRangeOverride.min, this.renderer.graticule.yRangeOverride.max]
    }
    const result = [Infinity, -Infinity]
    const timeFrame = this.renderer.graticule.curTimeRange
    for (const curMetric of this.store.getters['metrics/getAll']()) {
      if (!curMetric.draw) continue

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
          if (curMinMax[0] < result[0]) {
            result[0] = curMinMax[0]
          }
          if (curMinMax[1] > result[1]) {
            result[1] = curMinMax[1]
          }
        }
      }
    }
    // add a little wiggle room, so that markers won't be cut off
    const delta = result[1] - result[0]
    result[0] -= delta * this.WIGGLEROOM_PERCENTAGE
    result[1] += delta * this.WIGGLEROOM_PERCENTAGE
    return result
  }

  setTimeRange (newStartTime, newStopTime) {
    if (undefined === newStartTime || newStartTime instanceof MetricTimestamp) {
      newStartTime = this.startTime.getUnix()
    }
    if (undefined === newStopTime || newStopTime instanceof MetricTimestamp) {
      newStopTime = this.stopTime.getUnix()
    }

    if (isNaN(newStartTime) || isNaN(newStopTime)) {
      throw new Error('uh oh time is NaN')
    }
    if (newStartTime >= newStopTime) {
      throw new Error(`startTime(${newStartTime}) is not smaller than stopTime(${newStopTime})`)
    }

    if (newStopTime - newStartTime < this.renderer.graticule.MIN_ZOOM_TIME) {
      return false
    }
    if (newStopTime - newStartTime > this.renderer.graticule.MAX_ZOOM_TIME) {
      return false
    }

    this.startTime.updateTime(newStartTime)
    this.stopTime.updateTime(newStopTime)

    this.renderer.updateMetricUrl()
    this.renderer.graticule.setTimeRange(this.startTime.getUnix(), this.stopTime.getUnix())
    return true
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

  receivedError (_errorCode, metric) {
    // mark a metric so it is being excluded in bulk-requests
    if (this.store.getters['metrics/get'](metric)) {
      this.store.dispatch('metrics/setError', { metricKey: metric })
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
