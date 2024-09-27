import moment from 'moment'
import store from './store/'

export class DataCache {
  constructor (paramMetricQHistoryReference) {
    this.metricQHistory = paramMetricQHistoryReference
    this.metrics = []
  }

  processMetricQDatapoints (datapointsJSON) {
    const distinctMetrics = {}
    const indexesOfCountData = []
    for (const targetName in datapointsJSON) {
      const metric = datapointsJSON[targetName]
      const metricParts = targetName.split('/')
      if (metricParts[1] === 'count') {
        indexesOfCountData.push(targetName)
      } else {
        this.newSeries(metricParts[0], metricParts[1]).parseDatapoints(metric.data)
      }
      if (metricParts[1] === 'raw') {
        this.getMetricCache(metricParts[0]).clearNonRawAggregates()
      } else if (metricParts[1] === 'avg') {
        this.getMetricCache(metricParts[0]).clearRawAggregate()
      }
      if (undefined === distinctMetrics[metricParts[0]]) {
        distinctMetrics[metricParts[0]] = this.getMetricCache(metricParts[0])
      }
    }

    for (const curMetricBase in distinctMetrics) {
      distinctMetrics[curMetricBase].generateBand()
    }
    for (let i = 0; i < indexesOfCountData.length; ++i) {
      const metricParts = indexesOfCountData[i].split('/')
      distinctMetrics[metricParts[0]].parseCountDatapoints(datapointsJSON[indexesOfCountData[i]].data)
    }
  }

  newSeries (metricName, metricAggregate) {
    const relatedMetric = this.assureMetricExists(metricName)
    if (relatedMetric.series[metricAggregate]) {
      relatedMetric.series[metricAggregate].clear()
      return relatedMetric.series[metricAggregate]
    } else {
      const newSeries = new Series(metricAggregate, relatedMetric.color)
      relatedMetric.series[metricAggregate] = newSeries
      return newSeries
    }
  }

  newBand (metricName) {
    const foundMetric = this.getMetricCache(metricName)
    if (foundMetric) {
      foundMetric.generateBand()
      return foundMetric.band
    } else {
      return undefined
    }
  }

  assureMetricExists (metricName) {
    const foundMetric = this.getMetricCache(metricName)
    if (foundMetric) {
      return foundMetric
    } else {
      const newMetric = new MetricCache(this.metricQHistory, metricName)
      this.metrics.push(newMetric)
      return newMetric
    }
  }

  getMetricCache (metricName) {
    for (let i = 0; i < this.metrics.length; ++i) {
      if (metricName === this.metrics[i].name) {
        return this.metrics[i]
      }
    }
    return undefined
  }

  getTimeRange () {
    let min
    let max
    for (let i = 0; i < this.metrics.length; ++i) {
      for (const curAggregate in this.metrics[i].series) {
        if (this.metrics[i].series[curAggregate]) {
          const curTimeRange = this.metrics[i].series[curAggregate].getTimeRange()
          if (undefined === min) {
            min = curTimeRange[0]
            max = curTimeRange[1]
          } else {
            if (min > curTimeRange[0]) {
              min = curTimeRange[0]
            }
            if (max < curTimeRange[1]) {
              max = curTimeRange[1]
            }
          }
        }
      }
    }
    return [min, max]
  }

  getValueRange (doGetAllTime, timeRangeStart, timeRangeEnd) {
    let min
    let max
    for (let i = 0; i < this.metrics.length; ++i) {
      if (!store.getters['metrics/getMetricDrawState'](this.metrics[i].name).draw) continue

      if (doGetAllTime && this.metrics[i].allTime) {
        if (undefined === min || min > this.metrics[i].allTime.min) {
          min = this.metrics[i].allTime.min
        }
        if (undefined === max || max < this.metrics[i].allTime.max) {
          max = this.metrics[i].allTime.max
        }
        continue
      } else {
        for (const curAggregate in this.metrics[i].series) {
          if (this.metrics[i].series[curAggregate]) {
            const curValueRange = this.metrics[i].series[curAggregate].getValueRange(timeRangeStart, timeRangeEnd)
            if (undefined !== curValueRange) {
              if (undefined === min) {
                min = curValueRange[0]
                max = curValueRange[1]
              } else {
                if (min > curValueRange[0]) {
                  min = curValueRange[0]
                }
                if (max < curValueRange[1]) {
                  max = curValueRange[1]
                }
              }
            }
          }
        }
      }
    }
    return [min, max]
  }

  hasSeriesToPlot () {
    for (let i = 0; i < this.metrics.length; ++i) {
      for (const curAggregate in this.metrics[i].series) {
        if (this.metrics[i].series[curAggregate] && this.metrics[i].series[curAggregate].points.length > 0) {
          return true
        }
      }
    }
    return false
  }

  hasBandToPlot () {
    for (let i = 0; i < this.metrics.length; ++i) {
      if (this.metrics[i].band && this.metrics[i].band.points.length > 0) {
        return true
      }
    }
    return false
  }

  getAllValuesAtTime (timeAt) {
    const valueArr = []
    for (let i = 0; i < this.metrics.length; ++i) {
      for (const curAggregate in this.metrics[i].series) {
        if (this.metrics[i].series[curAggregate] &&
            this.metrics[i].series[curAggregate].points.length > 0 &&
            store.getters['metrics/getMetricDrawState'](this.metrics[i].name).draw) {
          const result = this.metrics[i].series[curAggregate].getValueAtTimeAndIndex(timeAt)
          if (result) {
            valueArr.push([
              result[0],
              result[1],
              this.metrics[i].series[curAggregate],
              this.metrics[i].name,
              curAggregate
            ])
          }
        }
      }
    }
    return valueArr
  }

  deleteMetric (metricName) {
    for (let i = 0; i < this.metrics.length; ++i) {
      if (metricName === this.metrics[i].name) {
        this.metrics.splice(i, 1)
        return true
      }
    }
    return false
  }

  distinctUnits () {
    const units = []
    for (let i = 0; i < this.metrics.length; ++i) {
      if (this.metrics[i].metadata &&
          this.metrics[i].metadata.unit &&
          store.getters['metrics/getMetricDrawState'](this.metrics[i].name).draw) {
        if (!units.includes(this.metrics[i].metadata.unit)) {
          units.push(this.metrics[i].metadata.unit)
        }
      }
    }
    return units
  }

  initializeCacheWithColor (metricName, newColor) {
    const newCache = this.assureMetricExists(metricName)
    Object.keys(newCache.series).forEach((aggregate) => { this.newSeries(metricName, aggregate) })
    if (!newCache.band) {
      this.newBand(metricName)
    }
    const toUpdate = [newCache.band]
    Object.keys(newCache.series).forEach((aggregate) => { toUpdate.push(newCache.series[aggregate]) })

    toUpdate.forEach((val) => {
      val.styleOptions.color = newColor
    })

    return newCache
  }
}

class MetricCache {
  constructor (paramMetricQReference, paramMetricName) {
    this.name = paramMetricName
    this.color = store.getters['metrics/getColor'](this.name)
    this.series = {
      min: undefined,
      max: undefined,
      avg: undefined,
      raw: undefined
    }
    this.band = new Band(this.color)
    this.allTime = {}
    this.metadata = undefined
    this.metricQHistory = paramMetricQReference
    this.fetchAllTimeMinMax()
    this.fetchMetadata()
  }

  clearNonRawAggregates () {
    this.series.min = undefined
    this.series.max = undefined
    this.series.avg = undefined
    this.band.clear()
  }

  clearRawAggregate () {
    this.series.raw = undefined
  }

  generateBand () {
    if (!this.series.min || !this.series.max) {
      return undefined
    }

    if (this.series.min.length !== this.series.max.length) {
      throw new Error('Serienlängen nicht identisch!')
    }

    if (this.series.min.points.length >= 2) {
      this.band.populate(this.series.min, this.series.max)
    }

    return this.band
  }

  parseCountDatapoints (countDatapoints) {
    for (const curAggregate in this.series) {
      const curSeries = this.series[curAggregate]
      if (curSeries && curSeries.points.length > 0) {
        if (curSeries.points.length === countDatapoints.length) {
          for (let j = 0; j < curSeries.points.length && j < countDatapoints.length; ++j) {
            curSeries.points[j].count = countDatapoints[j].value
          }
        }
      }
    }
  }

  async fetchMetadata () {
    this.metadata = await this.metricQHistory.metadata(this.name)
  }

  fetchAllTimeMinMax () {
    this.metricQHistory.analyze(moment(0), moment()).target(this.name).run().then((data) => {
      this.allTime.min = Object.values(data)[0].minimum
      this.allTime.max = Object.values(data)[0].maximum
    })
  }

  getAllMinMax (startTime, stopTime) {
    let allMin
    let allMax
    for (const curAggregate in this.series) {
      if (this.series[curAggregate]) {
        const curMinMax = this.series[curAggregate].getValueRange(startTime, stopTime)
        if (curMinMax) {
          if (undefined === allMin || curMinMax[0] < allMin) {
            allMin = curMinMax[0]
          }
          if (undefined === allMax || curMinMax[1] > allMax) {
            allMax = curMinMax[1]
          }
        }
      }
    }
    return [allMin, allMax]
  }

  updateColor (color) {
    this.color = color
    this.band.setColor(color)
    for (const serie of Object.values(this.series)) {
      if (serie) {
        serie.setColor(color)
      }
    }
  }
}

class Band {
  constructor (color) {
    this.points = []
    this.styleOptions = {
      skip: false,
      connect: 'next',
      color: color,
      alpha: 0.3
    }
    this.switchOverIndex = 0
  }

  addPoint (newPoint) {
    this.points.push(newPoint)
    return newPoint
  }

  getTimeRange () {
    if (this.points.length === 0) {
      return [0, 0]
    } else {
      return [this.points[0].time, this.points[this.points.length - 1].time]
    }
  }

  getValueRange () {
    if (this.points.length === 0) {
      return [0, 0]
    }
    let min = this.points[0].value
    let max = this.points[0].value
    for (let i = 1; i < this.points.length; ++i) {
      if (this.points[i].value < min) {
        min = this.points[i].value
      } else if (this.points[i].value > max) {
        max = this.points[i].value
      }
    }
    return [min, max]
  }

  clear () {
    delete this.points
    this.points = []
  }

  setColor (color) {
    this.styleOptions.color = color
  }

  populate (minSeries, maxSeries) {
    this.clear()

    const seriesLength = minSeries.points.length

    for (let i = 0; i < seriesLength; ++i) {
      this.addPoint(minSeries.points[i].clone())
    }

    const lastMinPoint = minSeries.points[seriesLength - 1].clone()

    const interval = lastMinPoint.time - minSeries.points[seriesLength - 2].time
    lastMinPoint.time += interval

    this.addPoint(lastMinPoint)
    this.switchOverIndex = this.points.length

    const lastMaxPoint = maxSeries.points[seriesLength - 1].clone()
    lastMaxPoint.time += interval

    this.addPoint(lastMaxPoint)

    for (let i = seriesLength - 1; i >= 0; --i) {
      this.addPoint(maxSeries.points[i].clone())
    }
  }
}

class Series {
  constructor (aggregate, color) {
    this.points = []
    this.aggregate = aggregate
    this.styleOptions = { ...matchStylingOptions(aggregate), color }
    this.allTime = undefined
  }

  clear () {
    delete this.points
    this.points = []
  }

  getValueAtTimeAndIndex (timeAt) {
    if (typeof timeAt !== 'number' || this.points.length === 0) {
      return undefined
    }
    let middleIndex
    let bottomIndex = 0
    let headIndex = this.points.length - 1
    while ((headIndex - bottomIndex) > 10) {
      middleIndex = bottomIndex + Math.floor((headIndex - bottomIndex) / 2)
      if (this.points[middleIndex].time < timeAt) {
        bottomIndex = middleIndex
      } else {
        headIndex = middleIndex
      }
    }
    let i = bottomIndex
    let closestIndex = bottomIndex
    let closestDelta = 99999999999999
    for (; i <= headIndex; ++i) {
      const curDelta = Math.abs(this.points[i].time - timeAt)
      if (curDelta < closestDelta) {
        closestDelta = curDelta
        closestIndex = i
      }
    }
    const closestPointIndex = closestIndex
    if (this.points[closestPointIndex].time !== timeAt &&
        this.styleOptions &&
        this.styleOptions.connect &&
        this.styleOptions.connect !== 'none') {
      let betterIndex = closestPointIndex
      if (this.styleOptions.connect === 'next') {
        if (this.points[betterIndex].time > timeAt) {
          --betterIndex
        }
      } else if (this.styleOptions.connect === 'last') {
        if (this.points[betterIndex].time < timeAt) {
          ++betterIndex
        }
      } else if (this.styleOptions.connect === 'direct') { // linear-interpolation
        let firstPoint, secondPoint
        if ((timeAt < this.points[betterIndex].time && betterIndex < 0) || (betterIndex + 1) >= this.points.length) {
          firstPoint = this.points[betterIndex - 1]
          secondPoint = this.points[betterIndex]
        } else {
          firstPoint = this.points[betterIndex]
          secondPoint = this.points[betterIndex + 1]
        }
        const timeDelta = secondPoint.time - firstPoint.time
        const valueDelta = secondPoint.value - firstPoint.value
        return [timeAt, firstPoint.value + valueDelta * ((timeAt - firstPoint.time) / timeDelta), betterIndex]
      }
      if (betterIndex < 0) {
        betterIndex = 0
        return undefined
      } else if (betterIndex >= this.points.length) {
        betterIndex = this.points.length - 1
        return undefined
      }
      return [this.points[betterIndex].time, this.points[betterIndex].value, betterIndex]
    } else {
      return [this.points[closestPointIndex].time, this.points[closestPointIndex].value, closestPointIndex]
    }
  }

  addPoint (newPoint, isBigger) {
    if (isBigger || this.points.length === 0) {
      this.points.push(newPoint)
      return newPoint
    } else {
      let middleIndex
      let bottom = 0
      let head = this.points.length - 1
      // binary search, where to insert the new point
      while ((head - bottom) > 10) {
        middleIndex = bottom + Math.floor((head - bottom) / 2)
        if (this.points[middleIndex].time < newPoint.time) {
          bottom = middleIndex
        } else {
          head = middleIndex
        }
      }
      // for the remaining 10 elements binary search is too time intensive
      let i
      for (i = bottom; i <= head; ++i) {
        if (this.points[i].time > newPoint.time) {
          this.points.splice(i, 0, [newPoint])
          break
        }
      }
      // if we could not insert the newPoint somewhere in between, put it at the end
      if (i === (head + 1)) {
        this.points.push(newPoint)
      }
    }
    return newPoint
  }

  parseDatapoints (metricDatapoints) {
    for (let i = 0; i < metricDatapoints.length; ++i) {
      const ms = metricDatapoints[i].time.unix() * 1000 + metricDatapoints[i].time.millisecond()
      this.addPoint(new Point(ms, metricDatapoints[i].value), true)
    }
  }

  getTimeRange () {
    if (this.points.length === 0) {
      return [0, 0]
    } else {
      return [this.points[0].time, this.points[this.points.length - 1].time]
    }
  }

  getValueRange (timeRangeStart, timeRangeEnd) {
    if (this.points.length === 0) {
      return undefined
    }
    let min = this.points[0].value
    let max = this.points[0].value
    if (undefined !== timeRangeStart && undefined !== timeRangeEnd) {
      let i = 0
      for (i = 0; i < this.points.length; ++i) {
        if (this.points[i].time >= timeRangeStart) {
          break
        }
      }
      if (i < this.points.length) {
        min = this.points[i].value
        max = this.points[i].value
      }
      for (; (i < this.points.length && this.points[i].time < timeRangeEnd); ++i) {
        if (this.points[i].value < min) {
          min = this.points[i].value
        } else if (this.points[i].value > max) {
          max = this.points[i].value
        }
      }
    } else {
      for (let i = 1; i < this.points.length; ++i) {
        if (this.points[i].value < min) {
          min = this.points[i].value
        } else if (this.points[i].value > max) {
          max = this.points[i].value
        }
      }
    }
    return [min, max]
  }

  setColor (color) {
    this.styleOptions.color = color
  }
}

class Point {
  constructor (paramTime, paramValue) {
    this.time = paramTime
    this.value = paramValue
    this.count = undefined
  }

  clone () {
    return new Point(this.time, this.value)
  }
}

const stylingOptions = {
  avg: {
    skip: false,
    width: 8,
    lineWidth: 2,
    dots: false,
    alpha: 0.8
  },
  min: {
    skip: true,
    width: 2,
    lineWidth: 2,
    dots: false,
    alpha: 1
  },
  max: {
    skip: true,
    width: 2,
    lineWidth: 2,
    dots: false,
    alpha: 1
  },
  raw: {
    skip: false,
    connect: 'none',
    width: 8,
    dots: true
  }
}

function matchStylingOptions (styleType) {
  if (typeof styleType !== 'string') {
    return undefined
  }
  return { ...stylingOptions[styleType] }
}
