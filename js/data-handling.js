import { crc32 } from '../lib/pseudo-crc32.js'
import { hslToRgb } from '../lib/color-conversion.js'
import { METRICQ_BACKEND } from './MetricHandler.js'

export function DataCache (paramMetricQHistoryReference) {
  this.metricQHistory = paramMetricQHistoryReference
  this.metrics = []
  this.processMetricQDatapoints = function (datapointsJSON, doDraw, doResize) {
    // console.log(datapointsJSON);
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
  this.newSeries = function (metricName, metricAggregate) {
    const relatedMetric = this.assureMetricExists(metricName)
    if (relatedMetric.series[metricAggregate]) {
      relatedMetric.series[metricAggregate].clear()
      return relatedMetric.series[metricAggregate]
    } else {
      const newSeries = new Series(metricAggregate, defaultSeriesStyling(metricName, metricAggregate))
      relatedMetric.series[metricAggregate] = newSeries
      return newSeries
    }
  }
  this.newBand = function (metricName) {
    const foundMetric = this.getMetricCache(metricName)
    if (foundMetric) {
      foundMetric.generateBand()
      return foundMetric.band
    } else {
      return undefined
    }
  }
  this.assureMetricExists = function (metricName) {
    const foundMetric = this.getMetricCache(metricName)
    if (foundMetric) {
      return foundMetric
    } else {
      const newMetric = new MetricCache(this.metricQHistory, metricName)
      this.metrics.push(newMetric)
      return newMetric
    }
  }
  this.getMetricCache = function (metricName) {
    for (let i = 0; i < this.metrics.length; ++i) {
      if (metricName === this.metrics[i].name) {
        return this.metrics[i]
      }
    }
    return undefined
  }
  this.getTimeRange = function () {
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
  this.getValueRange = function (doGetAllTime, timeRangeStart, timeRangeEnd) {
    let min
    let max
    for (let i = 0; i < this.metrics.length; ++i) {
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
  this.hasSeriesToPlot = function () {
    for (let i = 0; i < this.metrics.length; ++i) {
      for (const curAggregate in this.metrics[i].series) {
        if (this.metrics[i].series[curAggregate] && this.metrics[i].series[curAggregate].points.length > 0) {
          return true
        }
      }
    }
    return false
  }
  this.hasBandToPlot = function () {
    for (let i = 0; i < this.metrics.length; ++i) {
      if (this.metrics[i].band && this.metrics[i].band.points.length > 0) {
        return true
      }
    }
    return false
  }
  this.updateStyling = function () {
    for (let i = 0; i < this.metrics.length; ++i) {
      for (const curAggregate in this.metrics[i].series) {
        if (this.metrics[i].series[curAggregate]) {
          this.metrics[i].series[curAggregate].styleOptions = defaultSeriesStyling(this.metrics[i].name, curAggregate)
        }
      }
      this.metrics[i].band.styleOptions = defaultBandStyling(this.metrics[i].name)
    }
  }
  this.getAllValuesAtTime = function (timeAt) {
    const valueArr = []
    for (let i = 0; i < this.metrics.length; ++i) {
      for (const curAggregate in this.metrics[i].series) {
        if (this.metrics[i].series[curAggregate] && this.metrics[i].series[curAggregate].points.length > 0) {
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
  this.deleteMetric = function (metricName) {
    for (let i = 0; i < this.metrics.length; ++i) {
      if (metricName === this.metrics[i].name) {
        this.metrics.splice(i, 1)
        return true
      }
    }
    return false
  }
  this.distinctUnits = function () {
    const units = []
    for (let i = 0; i < this.metrics.length; ++i) {
      if (this.metrics[i].meta && this.metrics[i].meta.unit) {
        if (!units.includes(this.metrics[i].meta.unit)) {
          units.push(this.metrics[i].meta.unit)
        }
      }
    }
    return units
  }

  this.initializeCacheWithColor = function (metricName, newColor) {
    const newCache = this.assureMetricExists(metricName)
    Object.keys(newCache.series).forEach(aggregate => { this.newSeries(metricName, aggregate) })
    if (!newCache.band) {
      this.newBand(metricName)
    }
    const toUpdate = [newCache.band]
    Object.keys(newCache.series).forEach(aggregate => { toUpdate.push(newCache.series[aggregate]) })

    toUpdate.forEach(val => {
      val.styleOptions.color = newColor
    })

    return newCache
  }
}

function MetricCache (paramMetricQReference, paramMetricName) {
  this.name = paramMetricName
  this.series = {
    min: undefined,
    max: undefined,
    avg: undefined,
    raw: undefined
  }
  this.band = undefined
  this.allTime = undefined
  this.meta = undefined
  this.metricQHistory = paramMetricQReference
  this.resetData = function () {
    delete this.series
    delete this.bands
    this.series = []
    this.bands = []
  }
  this.clearNonRawAggregates = function () {
    for (const curAggregate in this.series) {
      if (curAggregate !== 'raw' && this.series[curAggregate]) {
        this.series[curAggregate].clear()
      }
    }
    if (this.band) {
      this.band.clear()
    }
  }
  this.clearRawAggregate = function () {
    if (this.series.raw) {
      this.series.raw.clear()
    }
  }
  this.generateBand = function () {
    if (this.band) {
      this.band.clear()
    } else {
      this.band = new Band(defaultBandStyling(this.name))
    }
    if (this.series.min && this.series.max) {
      const minSeries = this.series.min
      for (let i = 0; i < minSeries.points.length; ++i) {
        this.band.addPoint(minSeries.points[i].clone())
      }
      this.band.setSwitchOverIndex()
      const maxSeries = this.series.max
      for (let i = maxSeries.points.length - 1; i >= 0; --i) {
        this.band.addPoint(maxSeries.points[i].clone())
      }
      return this.band
    } else {
      return undefined
    }
  }
  this.clearSeries = function (seriesSpecifier) {
    const curSeries = this.getSeries(seriesSpecifier)
    if (curSeries) {
      curSeries.clear()
      return curSeries
    }
    return undefined
  }
  this.parseCountDatapoints = function (countDatapoints) {
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
  this.processAllTimeQuery = function (selfReference, jsonResponse) {
    let allTimeMin
    let allTimeMax
    for (let i = 0; i < jsonResponse.length; ++i) {
      const metricParts = jsonResponse[i].target.split('/')
      if (metricParts[1] === 'min') {
        for (let j = 0; j < jsonResponse[i].datapoints.length; ++j) {
          if (undefined === allTimeMin || allTimeMin > jsonResponse[i].datapoints[j][0]) {
            allTimeMin = jsonResponse[i].datapoints[j][0]
          }
        }
      } else if (metricParts[1] === 'max') {
        for (let j = 0; j < jsonResponse[i].datapoints.length; ++j) {
          if (undefined === allTimeMax || allTimeMax < jsonResponse[i].datapoints[j][0]) {
            allTimeMax = jsonResponse[i].datapoints[j][0]
          }
        }
      }
    }
    if (undefined !== allTimeMin || undefined !== allTimeMax) {
      selfReference.allTime = {
        min: allTimeMin,
        max: allTimeMax
      }
    }
  }
  this.fetchMetadata = function () {
    this.metricQHistory.metadata(this.name).then((metadataObj) => { this.meta = metadataObj })
  }
  // TODO: use Mario's metricq-js-API
  this.fetchAllTimeMinMax = function () {
    const reqJson = {
      range: {
        from: (new Date('2010-01-01')).toISOString(),
        to: (new Date()).toISOString()
      },
      maxDataPoints: 1,
      targets: [
        {
          metric: this.name,
          functions: ['min', 'max']
        }
      ]
    }
    const reqAjax = new XMLHttpRequest()
    reqAjax.open('POST', METRICQ_BACKEND + '/query', true)
    reqAjax.processingFunction = (function (ref) { return function (json) { ref.processAllTimeQuery(ref, json) } }(this))
    reqAjax.addEventListener('load', function (evtObj) {
      let parsedJson
      try {
        parsedJson = JSON.parse(evtObj.target.responseText)
      } catch (exc) {
      }
      if (parsedJson) {
        evtObj.target.processingFunction(parsedJson)
      }
    })
    reqAjax.send(JSON.stringify(reqJson))
  }
  this.getAllMinMax = function (startTime, stopTime) {
    let allMin; let allMax
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
  this.fetchAllTimeMinMax()
  this.fetchMetadata()
}

function Band (paramStyleOptions) {
  this.points = []
  this.styleOptions = paramStyleOptions
  this.switchOverIndex = 0
  this.addPoint = function (newPoint) {
    this.points.push(newPoint)
    return newPoint
  }
  this.setSwitchOverIndex = function () {
    this.switchOverIndex = this.points.length
  }
  this.getTimeRange = function () {
    if (this.points.length === 0) {
      return [0, 0]
    } else {
      return [this.points[0].time, this.points[this.points.length - 1].time]
    }
  }
  this.getValueRange = function () {
    if (this.points.length === 0) {
      return [0, 0]
    }
    let min = this.points[0].value; let max = this.points[0].value
    for (let i = 1; i < this.points.length; ++i) {
      if (this.points[i].value < min) {
        min = this.points[i].value
      } else if (this.points[i].value > max) {
        max = this.points[i].value
      }
    }
    return [min, max]
  }
  this.clear = function () {
    delete this.points
    this.points = []
  }
}

function Series (paramAggregate, paramStyleOptions) {
  this.points = []
  this.aggregate = paramAggregate
  this.styleOptions = paramStyleOptions
  this.allTime = undefined
  this.clear = function () {
    delete this.points
    this.points = []
  }
  this.getValueAtTimeAndIndex = function (timeAt) {
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
      this.styleOptions && this.styleOptions.connect && this.styleOptions.connect !== 'none') {
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
  this.addPoint = function (newPoint, isBigger) {
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
  this.parseDatapoints = function (metricDatapoints) {
    for (let i = 0; i < metricDatapoints.length; ++i) {
      const ms = metricDatapoints[i].time.unix() * 1000 + metricDatapoints[i].time.millisecond()
      this.addPoint(new Point(ms, metricDatapoints[i].value), true)
    }
  }
  this.getTimeRange = function () {
    if (this.points.length === 0) {
      return [0, 0]
    } else {
      return [this.points[0].time, this.points[this.points.length - 1].time]
    }
  }
  this.getValueRange = function (timeRangeStart, timeRangeEnd) {
    if (this.points.length === 0) {
      return undefined
    }
    let min = this.points[0].value; let max = this.points[0].value
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
}

function Point (paramTime, paramValue) {
  this.time = paramTime
  this.value = paramValue
  this.count = undefined
  this.clone = function () {
    return new Point(this.time, this.value)
  }
}

const timers = {}

const stylingOptions = {
  list: [
    {
      nameRegex: 'series:[^/]+/avg',
      title: 'AVG Series',
      skip: false,
      color: 'default',
      connect: 'next',
      width: 8,
      lineWidth: 2,
      lineDash: [5, 4],
      dots: false,
      alpha: 0.8
    },
    {
      nameRegex: 'series:[^/]+/min',
      title: 'Min Series',
      skip: true,
      color: 'default',
      connect: 'next',
      width: 2,
      lineWidth: 2,
      dots: false,
      alpha: 1
    },
    {
      nameRegex: 'series:[^/]+/max',
      title: 'Max Series',
      skip: true,
      color: 'default',
      connect: 'next',
      width: 2,
      lineWidth: 2,
      dots: false,
      alpha: 1
    },
    {
      nameRegex: 'series:[^/]+/(raw)',
      title: 'Raw Series',
      skip: false,
      color: 'default',
      connect: 'none',
      width: 8,
      dots: true
    },
    {
      nameRegex: 'band:.*',
      title: 'All Bands',
      connect: 'next',
      color: 'default',
      alpha: 0.3
    }
  ]
}

function defaultBandStyling (metricBaseName) {
  const options = matchStylingOptions('band:' + metricBaseName)
  if (options.color === 'default') {
    options.color = determineColorForMetric(metricBaseName)
  }
  return options
}

function defaultSeriesStyling (metricBaseName, aggregateName) {
  const options = matchStylingOptions('series:' + metricBaseName + '/' + aggregateName)
  if (options.color === 'default') {
    options.color = determineColorForMetric(metricBaseName)
  }
  return options
}

function matchStylingOptions (fullMetricName) {
  if (typeof fullMetricName !== 'string') {
    return undefined
  }
  for (let i = 0; i < stylingOptions.list.length; ++i) {
    if (stylingOptions.list[i].nameMatch === fullMetricName ||
      fullMetricName.match(new RegExp(stylingOptions.list[i].nameRegex))) {
      // clone the options
      return JSON.parse(JSON.stringify(stylingOptions.list[i]))
    }
  }
  return undefined
}

function determineColorForMetric (metricBaseName) {
  const rgb = hslToRgb((crc32(metricBaseName) >> 24 & 255) / 255.00, 1, 0.46)
  return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'
}
