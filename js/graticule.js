import { DataCache } from './data-handling.js'
import { Store } from './store.js'

export function Graticule (paramMetricQHistoryReference, paramEle, ctx, offsetDimension, paramPixelsLeft, paramPixelsBottom, paramClearSize) {
  this.ele = paramEle
  this.ctx = ctx
  this.canvasSize = [paramEle.offsetWidth, paramEle.offsetHeight]
  this.graticuleDimensions = offsetDimension
  this.curTimeRange = undefined
  this.curValueRange = undefined
  this.curTimePerPixel = undefined
  this.curValuesPerPixel = undefined
  this.pixelsLeft = paramPixelsLeft
  this.pixelsBottom = paramPixelsBottom
  this.clearSize = paramClearSize
  this.lastRangeChangeTime = 0
  this.yRangeOverride = {
    type: 'local',
    min: 0,
    max: 0
  }
  this.data = new DataCache(paramMetricQHistoryReference)
  // TODO: take these non-changing parameters
  //      as parameters to initialisation
  this.MAX_ZOOM_TIME = 20 * 365 * 24 * 3600 * 1000
  this.MIN_ZOOM_TIME = 10
  this.DEFAULT_FONT = 'sans-serif'
  this.resetData = function () {
    delete this.data
    this.data = new DataCache()
  }
  this.figureOutTimeSteps = function (maxStepsAllowed) {
    const startTime = new Date(this.curTimeRange[0])
    const deltaTime = this.curTimeRange[1] - this.curTimeRange[0]
    const timeStretches = [
      86400000 * 365, // year
      86400000 * 30, // month
      86400000, // day
      3600000, // hour
      60000, // minute
      1000, // second
      1 // millisecond
    ]
    let i
    for (i = 0; i < 7; ++i) {
      if ((deltaTime / timeStretches[i]) < (maxStepsAllowed * 0.7)) {
        continue
      } else {
        break
      }
    }
    if (i === 7) {
      i = 6
    }
    let curRangeMultiplier = (deltaTime / timeStretches[i]) / maxStepsAllowed
    const mostBeautifulMultipliers = [
      [1, 5, 10, 25, 50, 75, 100], // year
      [1, 2, 3, 4, 6, 12], // month
      [1, 2, 7, 14, 21, 28], // day
      [1, 2, 3, 4, 6, 8, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 64, 60, 72, 84, 96], // hour
      [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 105, 120, 150, 180, 210, 240, 270, 300], // minute
      [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 105, 120, 150, 180, 210, 240, 270, 300], // second
      [1, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 750, 800, 900, 1000] // millisecond
    ]
    let indexClosest = 0
    let deltaClosest = 99999999999
    for (let j = 0; j < mostBeautifulMultipliers[i].length; ++j) {
      const curDelta = Math.abs(mostBeautifulMultipliers[i][j] - curRangeMultiplier)
      if (curDelta < deltaClosest) {
        indexClosest = j
        deltaClosest = curDelta
      }
    }
    const moreBeautifulMultiplier = mostBeautifulMultipliers[i][indexClosest]
    if ((curRangeMultiplier * 0.50) <= moreBeautifulMultiplier &&
      (curRangeMultiplier * 1.50) >= moreBeautifulMultiplier) {
      curRangeMultiplier = moreBeautifulMultiplier
    } else {
      curRangeMultiplier = Math.floor(curRangeMultiplier)
    }
    if (curRangeMultiplier < 1) {
      curRangeMultiplier = 1
    }
    let stepSize = timeStretches[i] * curRangeMultiplier
    let stepStart
    const fields =
      [
        1970,
        1,
        1,
        0,
        0,
        0,
        0
      ]
    switch (i) {
      case 0:
        fields[0] = startTime.getFullYear()
        break
      case 1:
        fields[0] = startTime.getFullYear()
        fields[1] = (startTime.getMonth() + 1) - ((startTime.getMonth() + 1) % curRangeMultiplier)
        if (fields[1] < 1) {
          fields[1] = 1
        }
        break
      case 2:
        fields[0] = startTime.getFullYear()
        fields[1] = startTime.getMonth() + 1
        fields[2] = startTime.getDate() - startTime.getDate() % curRangeMultiplier
        if (fields[2] < 1) {
          fields[2] = 1
        }
        break
      case 3:
        fields[0] = startTime.getFullYear()
        fields[1] = startTime.getMonth() + 1
        fields[2] = startTime.getDate()
        fields[3] = startTime.getHours() - startTime.getHours() % curRangeMultiplier
        break
      case 4:
        fields[0] = startTime.getFullYear()
        fields[1] = startTime.getMonth() + 1
        fields[2] = startTime.getDate()
        fields[3] = startTime.getHours()
        fields[4] = startTime.getMinutes() - startTime.getMinutes() % curRangeMultiplier
        break
      case 5:
        fields[0] = startTime.getFullYear()
        fields[1] = startTime.getMonth() + 1
        fields[2] = startTime.getDate()
        fields[3] = startTime.getHours()
        fields[4] = startTime.getMinutes()
        fields[5] = startTime.getSeconds() - startTime.getSeconds() % curRangeMultiplier
        break
      case 6:
        fields[0] = startTime.getFullYear()
        fields[1] = startTime.getMonth() + 1
        fields[2] = startTime.getDate()
        fields[3] = startTime.getHours()
        fields[4] = startTime.getMinutes()
        fields[5] = startTime.getSeconds()
        fields[6] = startTime.getMilliseconds() - startTime.getMilliseconds() % curRangeMultiplier
        break
    }
    stepStart = new Date(fields[0] + '-' + (fields[1] < 10 ? '0' : '') + fields[1] + '-' + (fields[2] < 10 ? '0' : '') + fields[2] + ' ' + (fields[3] < 10 ? '0' : '') + fields[3] + ':' + (fields[4] < 10 ? '0' : '') + fields[4] + ':' + (fields[5] < 10 ? '0' : '') + fields[5] + '.' + (fields[6] < 100 ? '00' : (fields[6] < 10 ? '0' : '')) + fields[6])
    if (i !== 1) {
      while (stepStart.getTime() < this.curTimeRange[0]) {
        stepStart = new Date(stepStart.getTime() + stepSize)
      }
    }
    const outArr = []
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    let previousCurDate
    for (let j = stepStart.getTime(); j < this.curTimeRange[1]; j += stepSize) {
      if (j < this.curTimeRange[0]) continue
      const curDate = new Date(j)
      const stepItem = {
        timestamp: j,
        label: []
      }
      switch (i) {
        case 0: // years
          stepItem.label.push('' + curDate.getFullYear())
          break
        case 1: // months
          if (curDate.getMonth() === 0 || !previousCurDate || previousCurDate.getFullYear() !== curDate.getFullYear()) {
            stepItem.label.push(monthNames[curDate.getMonth()])
            stepItem.label.push('' + curDate.getFullYear())
          } else {
            stepItem.label.push(monthNames[curDate.getMonth()])
          }
          stepSize = 0
          j = (new Date((curDate.getFullYear() + Math.floor((curDate.getMonth() + moreBeautifulMultiplier) / 12)) + '-' + ((curDate.getMonth() + moreBeautifulMultiplier) % 12 + 1) + '-01')).getTime()
          break
        case 2: // days
          if (curDate.getDate() === 1 || !previousCurDate || previousCurDate.getMonth() !== curDate.getMonth()) {
            stepItem.label.push('' + curDate.getDate())
            stepItem.label.push(monthNames[curDate.getMonth()])
          } else {
            stepItem.label.push('' + curDate.getDate())
          }
          break
        case 3: // hours
          if (curDate.getHours() === 0 || !previousCurDate || previousCurDate.getDate() !== curDate.getDate()) {
            stepItem.label.push((curDate.getHours() < 10 ? '0' : '') + curDate.getHours() + ':' + (curDate.getMinutes() < 10 ? '0' : '') + curDate.getMinutes())
            stepItem.label.push(curDate.getDate() + ' ' + monthNames[curDate.getMonth()])
          } else {
            stepItem.label.push((curDate.getHours() < 10 ? '0' : '') + curDate.getHours() + ':' + (curDate.getMinutes() < 10 ? '0' : '') + curDate.getMinutes())
          }
          break
        case 4: // minutes
          stepItem.label.push((curDate.getHours() < 10 ? '0' : '') + curDate.getHours() + ':' + (curDate.getMinutes() < 10 ? '0' : '') + curDate.getMinutes())
          break
        case 5: // seconds
          stepItem.label.push((curDate.getHours() < 10 ? '0' : '') + curDate.getHours() + ':' + (curDate.getMinutes() < 10 ? '0' : '') + curDate.getMinutes() + ':' + (curDate.getSeconds() < 10 ? '0' : '') + curDate.getSeconds())
          break
        case 6: { // milliseconds
          let msString = '' + curDate.getMilliseconds()
          for (let k = msString.length; k < 3; ++k) {
            msString = '0' + msString
          }
          if (curDate.getMilliseconds() === 0 || !previousCurDate) {
            stepItem.label.push((curDate.getSeconds() < 10 ? '0' : '') + curDate.getSeconds() + '.' + msString)
            stepItem.label.push((curDate.getHours() < 10 ? '0' : '') + curDate.getHours() + ':' + (curDate.getMinutes() < 10 ? '0' : '') + curDate.getMinutes() + ':' + (curDate.getSeconds() < 10 ? '0' : '') + curDate.getSeconds())
          } else {
            stepItem.label.push((curDate.getSeconds() < 10 ? '0' : '') + curDate.getSeconds() + '.' + msString)
          }
        }
      }
      outArr.push(stepItem)
      previousCurDate = curDate
    }
    return outArr
  }
  this.figureOutLogarithmicSteps = function (rangeStart, rangeEnd, maxStepsAllowed) {
    const deltaRange = rangeEnd - rangeStart
    // due to floating point errors we have to increment deltaRange slightly
    // so as to arrive at the correct logarithmic value
    let powerTen = Math.floor(Math.log(deltaRange * 1.0000000001) / Math.log(10))
    let stepSize = Math.pow(10, powerTen)
    if ((deltaRange / stepSize) > maxStepsAllowed) {
      if ((deltaRange / (stepSize * 2)) < maxStepsAllowed) {
        stepSize *= 2
      } else if ((deltaRange / (stepSize * 10)) < maxStepsAllowed) {
        stepSize *= 10
        powerTen += 1
      }
    } else if ((deltaRange / stepSize * 5) < maxStepsAllowed) {
      if ((deltaRange / (stepSize / 10)) < maxStepsAllowed) {
        stepSize /= 10
        powerTen -= 1
      }
      if ((deltaRange / (stepSize / 2)) < maxStepsAllowed) {
        stepSize /= 2
        powerTen -= 1
      }
    }
    const firstStep = rangeStart - (rangeStart % stepSize)
    const stepsArr = []
    for (let i = 0, curVal = 0; firstStep + (i * stepSize) <= rangeEnd; i++) {
      curVal = firstStep + (i * stepSize)
      if (powerTen < 0) {
        stepsArr.push([curVal, '' + curVal.toFixed(powerTen * -1)])
      } else {
        stepsArr.push([curVal, '' + curVal])
      }
    }
    return stepsArr
  }

  this.formatAxisNumber = function (value) {
    if (Math.abs(value) >= 10000) {
      return Number.parseFloat(value).toExponential(3)
    }
    return value
  }

  this.drawGrid = function (timeRange, valueRange, timePerPixel, valuesPerPixel) {
    /* draw lines */
    this.ctx.fillStyle = 'rgba(192,192,192,0.5)'

    // vertical grid
    let minDistanceBetweenGridLines = 110
    let maxStepsCount = Math.floor(this.graticuleDimensions[2] / minDistanceBetweenGridLines)
    const xAxisSteps = this.figureOutTimeSteps(maxStepsCount)
    const xPositions = []
    for (let i = 0; i < xAxisSteps.length; ++i) {
      const x = Math.round(this.graticuleDimensions[0] + ((xAxisSteps[i].timestamp - timeRange[0]) / timePerPixel))
      if (x >= this.graticuleDimensions[0] &&
        x <= (this.graticuleDimensions[0] + this.graticuleDimensions[2])) {
        xPositions.push(x)
        this.ctx.fillRect(x, this.graticuleDimensions[1], 2, this.graticuleDimensions[3])
      } else {
        xPositions.push(undefined)
        console.log('Grid algorithm is broken, invalid x-axis grid line at ' + xAxisSteps[i].label.join(','))
      }
    }

    // horizontal grid
    minDistanceBetweenGridLines = 30
    maxStepsCount = Math.floor(this.graticuleDimensions[3] / minDistanceBetweenGridLines)
    const yAxisSteps = this.figureOutLogarithmicSteps(valueRange[0], valueRange[1], maxStepsCount)
    const yPositions = []
    for (let i = 0; i < yAxisSteps.length; ++i) {
      const y = Math.round(this.graticuleDimensions[3] - ((yAxisSteps[i][0] - valueRange[0]) / valuesPerPixel) + this.graticuleDimensions[1])
      if (y >= this.graticuleDimensions[1] &&
        y <= (this.graticuleDimensions[1] + this.graticuleDimensions[3])) {
        yPositions.push(y)
        if (y >= this.graticuleDimensions[1]) {
          this.ctx.fillRect(this.graticuleDimensions[0], y, this.graticuleDimensions[2], 2)
        }
      } else {
        yPositions.push(undefined)
        console.log('Grid algorithm is broken, invalid y-axis grid line at ' + yAxisSteps[i][0])
      }
    }
    /* draw text */
    this.ctx.fillStyle = 'rgba(0,0,0,1)'
    const fontSize = 14
    this.ctx.font = fontSize + 'px ' + this.DEFAULT_FONT
    // x-axis ticks (time/date)
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'hanging'
    for (let i = 0; i < xAxisSteps.length; ++i) {
      // supports vertically stacked elements, e.g. time, date
      for (let j = 0; j < xAxisSteps[i].label.length; ++j) {
        // unfortunately measuring line height is complicated, so we use fontSize instead
        this.ctx.fillText(xAxisSteps[i].label[j], xPositions[i], this.graticuleDimensions[1] + this.graticuleDimensions[3] + this.pixelsBottom + fontSize * j)
      }
    }
    this.ctx.textAlign = 'right'
    this.ctx.textBaseline = 'middle'
    for (let i = 0; i < yAxisSteps.length; ++i) {
      if (yPositions[i] >= this.graticuleDimensions[1]) {
        this.ctx.fillText(this.formatAxisNumber(yAxisSteps[i][1]), this.graticuleDimensions[0] - this.pixelsLeft, yPositions[i])
      }
    }
    this.ctx.textAlign = 'middle'
    this.ctx.textBaseline = 'alphabetic'
    const curUnits = this.data.distinctUnits()
    if (curUnits && curUnits.length > 0) {
      let unitString = ''
      curUnits.forEach((val, index, arr) => { unitString += (unitString.length > 0 ? ' / ' : '') + val })
      this.ctx.save()
      this.ctx.rotate(Math.PI / 2 * 3)
      this.ctx.fillText(unitString, (Math.round(this.graticuleDimensions[3] / 2) + this.graticuleDimensions[1]) * -1, fontSize)
      this.ctx.restore()
    }
  }
  this.getTimeValueAtPoint = function (positionArr) {
    const relationalPos = [positionArr[0] - this.graticuleDimensions[0],
      positionArr[1] - this.graticuleDimensions[1]]
    if (undefined !== this.curTimeRange &&
      undefined !== this.curValueRange &&
      relationalPos[0] >= 0 &&
      relationalPos[0] <= this.graticuleDimensions[2] &&
      relationalPos[1] >= 0 &&
      relationalPos[1] <= this.graticuleDimensions[3]) {
      return [Math.round((relationalPos[0] * this.curTimePerPixel) + this.curTimeRange[0]),
        ((this.graticuleDimensions[3] - relationalPos[1]) * this.curValuesPerPixel) + this.curValueRange[0]
      ]
    } else {
      return undefined
    }
  }
  this.moveTimeAndValueRanges = function (moveTimeBy, moveValueBy) {
    this.curTimeRange[0] += moveTimeBy
    this.curTimeRange[1] += moveTimeBy
    this.curValueRange[0] += moveValueBy
    this.curValueRange[1] += moveValueBy
    this.lastRangeChangeTime = (new Date()).getTime()
  }
  this.setTimeRange = function (paramStartTime, paramStopTime) {
    this.curTimeRange = [paramStartTime, paramStopTime]
    this.curTimePerPixel = (this.curTimeRange[1] - this.curTimeRange[0]) / this.graticuleDimensions[2]
    this.lastRangeChangeTime = (new Date()).getTime()
    return true
  }
  this.setValueRange = function (paramRangeStart = undefined, paramRangeEnd = undefined) {
    if (undefined !== paramRangeStart) this.curValueRange[0] = paramRangeStart
    if (undefined !== paramRangeEnd) this.curValueRange[1] = paramRangeEnd
    this.curValuesPerPixel = (this.curValueRange[1] - this.curValueRange[0]) / this.graticuleDimensions[3]
    this.lastRangeChangeTime = (new Date()).getTime()
  }
  this.setYRangeOverride = function (paramTypeStr, paramValueStart, paramValueEnd) {
    if (paramTypeStr !== 'local' &&
      paramTypeStr !== 'global' &&
      paramTypeStr !== 'manual' &&
      undefined !== paramTypeStr) {
      throw new Error(`yRange Override must be either local, global or manual "${paramTypeStr}" is invalid.`)
    }
    if (undefined !== paramTypeStr) this.yRangeOverride.type = paramTypeStr
    if (undefined !== paramValueStart) this.yRangeOverride.min = paramValueStart
    if (undefined !== paramValueEnd) this.yRangeOverride.max = paramValueEnd
    if (paramTypeStr === 'manual') {
      this.curValueRange[0] = paramValueStart
      this.curValueRange[1] = paramValueEnd
    }
  }
  // is never called, why not remove this??
  this.zoomTimeAndValueAtPoint = function (pointAt, zoomDirection, zoomTime, zoomValue) {
    const zoomFactor = 1 + zoomDirection
    const newTimeDelta = (this.curTimeRange[1] - this.curTimeRange[0]) * zoomFactor
    const newValueDelta = (this.curValueRange[1] - this.curValueRange[0]) * zoomFactor
    let couldZoom = false
    if (zoomTime && newTimeDelta > this.MIN_ZOOM_TIME) {
      const relationalPositionOfPoint = (pointAt[0] - this.curTimeRange[0]) / (this.curTimeRange[1] - this.curTimeRange[0])
      // TODO: fix this, setTimeRange no longer checks validity
      if (this.setTimeRange(pointAt[0] - (newTimeDelta * relationalPositionOfPoint),
        pointAt[0] + (newTimeDelta * (1 - relationalPositionOfPoint)))) {
        couldZoom = true
      }
    }
    if (zoomValue) {
      const relationalPositionOfPoint = (pointAt[1] - this.curValueRange[0]) / (this.curValueRange[1] - this.curValueRange[0])
      this.curValueRange = [pointAt[1] - (newValueDelta * relationalPositionOfPoint),
        pointAt[1] + (newValueDelta * (1 - relationalPositionOfPoint))]
      this.curValuesPerPixel = (this.curValueRange[1] - this.curValueRange[0]) / this.graticuleDimensions[3]
    }
    this.lastRangeChangeTime = (new Date()).getTime()
    return couldZoom
  }
  this.automaticallyDetermineRanges = function (determineTimeRange, determineValueRange) {
    // uh oh, this case is troublesome, when we wrap
    //   the time in a handler, like we do
    if (determineTimeRange) {
      const times = this.figureOutTimeRange()
      this.setTimeRange(times[0], times[1])
    }
    if (determineValueRange && this.yRangeOverride.type === 'local') {
      this.curValueRange = this.figureOutValueRange(this.yRangeOverride.type === 'global')
      this.curValuesPerPixel = (this.curValueRange[1] - this.curValueRange[0]) / this.graticuleDimensions[3]
    }
    if (determineTimeRange || determineValueRange) {
      this.lastRangeChangeTime = (new Date()).getTime()
    }
  }
  // since automaticallyDetermineRanges is not suitable anymore,
  //  parameter 'adjustRanges' should never be true!
  this.draw = function (adjustRanges) {
    // timers.drawing = {
    //   start: (new Date()).getTime(),
    //   end: 0
    // }
    if (adjustRanges === true) {
      throw new Error('Tried to automatically determine time ranges. That makes handler out of sync, disallowed!')
      // this.automaticallyDetermineRanges(true, true)
    } else if (undefined === this.curTimeRange) {
      console.log('Cowardly refusing to do draw() when I am not allowed to determine Time and Value Ranges')
    }
    this.ctx.clearRect(0, 0, this.clearSize[0], this.clearSize[1])
    this.drawGrid(this.curTimeRange, this.curValueRange, this.curTimePerPixel, this.curValuesPerPixel)
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.rect(this.graticuleDimensions[0], this.graticuleDimensions[1],
      this.graticuleDimensions[2], this.graticuleDimensions[3])
    this.ctx.clip()
    if (!this.data.hasSeriesToPlot() && !this.data.hasBandToPlot()) {
      console.log('No series to plot')
    } else {
      this.drawBands(this.curTimeRange, this.curValueRange, this.curTimePerPixel, this.curValuesPerPixel)
      this.drawSeries(this.curTimeRange, this.curValueRange, this.curTimePerPixel, this.curValuesPerPixel)
      this.ctx.restore()
    }
    // timers.drawing.end = (new Date()).getTime()
    // TODO: Make timings accessible
    // showTimers();
  }
  this.parseStyleOptions = function (styleOptions) {
    const parsedObj = {
      skip: false,
      connect: 3,
      color: '#000000',
      pointWidth: 2,
      halfPointWidth: 1,
      drawDots: false,
      lineDash: [],
      oddLineWidthAddition: 0
    }
    if (styleOptions) {
      const styleKeys = Object.keys(styleOptions)
      // first parse Options for parsedObj
      parsedObj.skip = !!styleOptions.skip
      /* connect is responsible for the way the
       * data points will be connected
       * 1 = direct
       * 2 = last
       * 3 = next
       */
      switch (styleOptions.connect) { // Thomas: Magische Zahlen sind nicht schön
        //         prinzipiell sind magische Zahlen nicht schön
        // Inkonsistenz: Einmal Strings, einmal Zahlen
        case 'next':
          parsedObj.connect = 3
          break
        case 'last':
          parsedObj.connect = 2
          break
        case 'direct':
          parsedObj.connect = 1
          break
        case 'none':
        default:
          parsedObj.connect = 0
          break
      }
      if (styleKeys.includes('width')) {
        parsedObj.pointWidth = parseFloat(styleOptions.width)
        parsedObj.halfPointWidth = Math.floor(styleOptions.width / 2.00)
      }
      if (styleKeys.includes('dots')) {
        parsedObj.drawDots = {
          func: function (ctx, width, height) {
            ctx.fillRect(0, 0, width, height)
          }
        }
        if ((typeof styleOptions.dots) === 'string') {
          const dotMarker = styleOptions.dots.charAt(0)
          switch (dotMarker) {
            case '.': { /* point marker */
              let referencedLineWidth = parsedObj.pointWidth
              if (styleKeys.includes('lineWidth')) {
                referencedLineWidth = parseFloat(styleOptions.lineWidth)
              }
              parsedObj.drawDots.func = (function (lineWidth) {
                return function (ctx, width, height) {
                  ctx.beginPath()
                  ctx.arc(width / 2,
                    height / 2,
                    lineWidth / 2,
                    0,
                    Math.PI * 2,
                    true)
                  ctx.fill()
                }
              }(referencedLineWidth))
              break
            }
            case 'o': /* circle marker */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.beginPath()
                ctx.arc(width / 2,
                  height / 2,
                  Math.min(width, height) / 2,
                  0,
                  Math.PI * 2,
                  true)
                ctx.stroke()
              }
              break
            case 'v': /* triangle down marker */
            case '1': /* fall-through */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.beginPath()
                ctx.moveTo(0, 0)
                ctx.lineTo(width / 2, height)
                ctx.lineTo(width, 0)
                ctx.closePath()
                ctx.fill()
              }
              break
            case '^': /* triangle up marker */
            case '2': /* fall-through */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.beginPath()
                ctx.moveTo(0, height)
                ctx.lineTo(width, height)
                ctx.lineTo(width / 2, 0)
                ctx.closePath()
                ctx.fill()
              }
              break
            case '<': /* triangle left marker */
            case '3': /* fall-through */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.beginPath()
                ctx.moveTo(0, height / 2)
                ctx.lineTo(width, height)
                ctx.lineTo(width, 0)
                ctx.closePath()
                ctx.fill()
              }
              break
            case '>': /* triangle right marker */
            case '4': /* fall-through */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.beginPath()
                ctx.moveTo(0, 0)
                ctx.lineTo(width, height / 2)
                ctx.lineTo(0, height)
                ctx.closePath()
                ctx.fill()
              }
              break
            case 's': /* square marker */
              // Don't need to do anything here
              // it is already defined as default
              break
            case 'p': /* pentagon marker */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.beginPath()
                ctx.moveTo(width / 2, 0)
                ctx.lineTo(width, height * 2 / 5)
                ctx.lineTo(width * 3 / 4, height)
                ctx.lineTo(width * 1 / 4, height)
                ctx.lineTo(0, height * 2 / 5)
                ctx.closePath()
                ctx.fill()
              }
              break
            case '*': /* star marker */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.moveTo(width / 2, 0)
                ctx.lineTo(width / 2, height)
                ctx.stroke()
                ctx.moveTo(0, height / 2)
                ctx.lineTo(width, height / 2)
                ctx.stroke()
                ctx.moveTo(width * 1 / 7, height * 1 / 7)
                ctx.lineTo(width * 6 / 7, height * 6 / 7)
                ctx.stroke()
                ctx.moveTo(width * 1 / 7, height * 6 / 7)
                ctx.lineTo(width * 6 / 7, height * 1 / 7)
                ctx.stroke()
              }
              break
            case 'h': /* hexagon marker */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.beginPath()
                ctx.moveTo(0, height / 2)
                ctx.lineTo(width * 1 / 4, 0)
                ctx.lineTo(width * 3 / 4, 0)
                ctx.lineTo(width, height / 2)
                ctx.lineTo(width * 3 / 4, height)
                ctx.lineTo(width * 1 / 4, height)
                ctx.closePath()
                ctx.fill()
              }
              break
            case '+': /* plus marker */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.moveTo(width / 2, 0)
                ctx.lineTo(width / 2, height)
                ctx.stroke()
                ctx.moveTo(0, height / 2)
                ctx.lineTo(width, height / 2)
                ctx.stroke()
              }
              break
            case 'x': /* x marker */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.moveTo(width * 1 / 7, height * 1 / 7)
                ctx.lineTo(width * 6 / 7, height * 6 / 7)
                ctx.stroke()
                ctx.moveTo(width * 1 / 7, height * 6 / 7)
                ctx.lineTo(width * 6 / 7, height * 1 / 7)
                ctx.stroke()
              }
              break
            case 'd': /* diamond marker */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.beginPath()
                ctx.moveTo(0, height / 2)
                ctx.lineTo(width / 2, 0)
                ctx.lineTo(width, height / 2)
                ctx.lineTo(width / 2, height)
                ctx.closePath()
                ctx.fill()
              }
              break
            case '|': /* vline marker */
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.moveTo(width / 2, 0)
                ctx.lineTo(width / 2, height)
                ctx.stroke()
              }
              break
            case '_': /* hline marker */
            case '-':
              parsedObj.drawDots.func = function (ctx, width, height) {
                ctx.moveTo(0, height / 2)
                ctx.lineTo(width, height / 2)
                ctx.stroke()
              }
              break
          }
        } else if (!styleOptions.dots) {
          parsedObj.drawDots = false
        }
      }

      // second parse Options to be applied to ctx immediatly
      if (styleOptions.color) {
        this.ctx.fillStyle = styleOptions.color
        this.ctx.strokeStyle = styleOptions.color
        parsedObj.color = styleOptions.color
      }
      if (styleOptions.fillPattern) {
        const img = new Image()
        img.src = styleOptions.fillPattern
        this.ctx.fillStyle = this.ctx.createPattern(img, 'repeat')
      }
      if (styleOptions.gradient) {
        this.parseGradient(styleOptions.gradient)
      }
      if (styleKeys.includes('alpha')) {
        this.ctx.globalAlpha = parseFloat(styleOptions.alpha)
      }
      if (styleKeys.includes('lineWidth')) {
        this.ctx.lineWidth = parseFloat(styleOptions.lineWidth)
        parsedObj.oddLineWidthAddition = ((styleOptions.lineWidth % 2) === 1) ? 0.5 : 0
      }
      /* if (styleKeys.includes('lineDash')) {
        this.ctx.setLineDash(styleOptions.lineDash)
      } */
    }

    return parsedObj
  }
  this.parseGradient = function (gradientStr) {
    if (gradientStr.match(/^\s*linear-gradient/)) {
      let innerPart = gradientStr.replace(/^\s*linear-gradient\s*\(/, '')
      innerPart = innerPart.replace(/\s*\)\s*$/, '')
      const gradientData = this.parseInnerGradientStr(innerPart)
      if (!gradientData) {
        console.log('Could not parse gradient.')
        return
      }
      const centerPos = [this.graticuleDimensions[0] + this.graticuleDimensions[2] / 2,
        this.graticuleDimensions[1] + this.graticuleDimensions[3] / 2]
      const startPos = [centerPos[0] + Math.cos((270 - gradientData.direction) * Math.PI * 2 / 360) * this.graticuleDimensions[2] / 2,
        centerPos[1] + Math.sin((270 - gradientData.direction) * Math.PI * 2 / 360) * this.graticuleDimensions[3] / 2]
      const endPos = [centerPos[0] + Math.cos((gradientData.direction * -1 + 90) * Math.PI * 2 / 360) * this.graticuleDimensions[2] / 2,
        centerPos[1] + Math.sin((gradientData.direction * -1 + 90) * Math.PI * 2 / 360) * this.graticuleDimensions[3] / 2]
      const deltaPos = [endPos[0] - startPos[0],
        endPos[1] - startPos[1]]
      const distance = Math.sqrt(Math.pow(deltaPos[0], 2) + Math.pow(deltaPos[1], 2))
      const myGradient = this.ctx.createLinearGradient(startPos[0], startPos[1], endPos[0], endPos[1])
      let lastRelativePosition = 0
      let relativePosition
      for (let i = 0; i < gradientData.colorStops.length; ++i) {
        if (gradientData.colorStops[i][2] === 'none') {
          let remainingNonePositions = 0
          let j = i
          for (; j < gradientData.colorStops.length; ++j) {
            if (gradientData.colorStops[j][2] === 'none') {
              remainingNonePositions++
            } else {
              break
            }
          }
          let nextRelativePosition = lastRelativePosition
          if (j >= gradientData.colorStops.length) {
            nextRelativePosition = 1
          } else {
            nextRelativePosition = this.calculateGradientRelativePosition(gradientData.colorStops[j][2], gradientData.colorStops[j][1], distance)
          }
          relativePosition = lastRelativePosition + ((nextRelativePosition - lastRelativePosition) / (remainingNonePositions + 1))
        } else {
          relativePosition = this.calculateGradientRelativePosition(gradientData.colorStops[i][2], gradientData.colorStops[i][1], distance)
        }
        myGradient.addColorStop(relativePosition, gradientData.colorStops[i][0])
        lastRelativePosition = relativePosition
      }
      this.ctx.fillStyle = myGradient
      this.ctx.strokeStyle = myGradient
    } else if (gradientStr.match(/^\s*radial-gradient/)) {
      // TODO: code me
    }
    return false
  }
  this.calculateGradientRelativePosition = function (stopType, stopData, distance) {
    if (stopType === 'percent') {
      return stopData / 100
    } else if (stopType === 'pixel') {
      if (stopData > distance) {
        return 1
      } else {
        return stopData / distance
      }
    }
    return undefined
  }
  this.parseInnerGradientStr = function (innerPart) {
    const tokenizedArr = this.tokenizeHeedingParantheses(innerPart)
    let directionAngle
    if (tokenizedArr.length > 1) {
      if (tokenizedArr[0].match(/^\s*to [a-z ]+/)) {
        const possibleStrings = [
          ['to bottom right', 135],
          ['to bottom left', 225],
          ['to top right', 45],
          ['to top left', 315],
          ['to left', 270],
          ['to right', 90],
          ['to bottom', 180],
          ['to top', 0]
        ]
        for (let i = 0; i < possibleStrings.length; ++i) {
          if (tokenizedArr[0].indexOf(possibleStrings[i][0]) > -1) {
            directionAngle = possibleStrings[i][1]
            break
          }
        }
      }
      if (tokenizedArr[0].match(/-?[0-9]+(\.[0-9]+)?\s*deg\s*$/)) {
        directionAngle = parseFloat(tokenizedArr[0].match(/(-?[0-9]+(\.[0-9]+)?)\s*deg\s*$/)[1])
      }
      if (undefined === directionAngle) {
        directionAngle = 180 // default Angle
      }
      const gradientData = {
        direction: directionAngle,
        colorStops: []
      }
      for (let i = 1; i < tokenizedArr.length; ++i) {
        const curElement = ['white', 0, 'none']
        let remainder = tokenizedArr[i]
        if (remainder.match(/%\s*$/)) {
          curElement[2] = 'percent'
        } else if (remainder.match(/px\s*$/)) {
          curElement[2] = 'pixel'
        }
        remainder = remainder.replace(/(px|%)\s*$/, '')
        if (remainder.match(/\d+(\.\d+)?\s*$/)) {
          if (!remainder.match(/[#a-fA-F]\d+(\.\d+)?\s*$/)) {
            curElement[1] = parseFloat(remainder.match(/\d+(\.\d+)?\s*$/)[0])
            remainder = remainder.replace(/\d+(\.\d+)?\s*$/, '')
          }
        }
        curElement[0] = remainder.replace(/\s*$/, '').replace(/^\s*/, '')

        gradientData.colorStops.push(curElement)
      }
      return gradientData
    } else {
      return undefined
    }
  }
  this.tokenizeHeedingParantheses = function (originStr) {
    const tokenArr = []
    let curToken = ''
    let inParantheses = 0
    for (let i = 0; i < originStr.length; ++i) {
      const c = originStr.charAt(i)
      if (inParantheses > 0) {
        if (c === ')') {
          inParantheses--
        } else if (c === '(') {
          inParantheses++
        }
        curToken += c
      } else if (c === ',') {
        tokenArr.push(curToken)
        curToken = ''
      } else {
        if (c === '(') {
          inParantheses = 1
        }
        curToken += c
      }
    }
    if (curToken.length > 0) {
      tokenArr.push(curToken)
    }
    return tokenArr
  }
  this.drawBands = function (timeRange, valueRange, timePerPixel, valuesPerPixel) {
    for (let i = 0; i < this.data.metrics.length; ++i) {
      if (Store.getMetricDrawState(this.data.metrics[i].name).drawMin && Store.getMetricDrawState(this.data.metrics[i].name).drawMax) {
        const curBand = this.data.metrics[i].band
        if (curBand) {
          const styleOptions = this.parseStyleOptions(curBand.styleOptions)
          if (styleOptions.skip || curBand.points.length === 0) {
            this.resetCtx()
            continue
          }

          const switchOverIndex = curBand.switchOverIndex
          for (let j = 0, x, y, previousX, previousY; j < curBand.points.length; ++j) {
            x = this.graticuleDimensions[0] + Math.round((curBand.points[j].time - timeRange[0]) / timePerPixel)
            y = this.graticuleDimensions[1] + (this.graticuleDimensions[3] - Math.round((curBand.points[j].value - valueRange[0]) / valuesPerPixel))
            if (j === 0) {
              this.ctx.beginPath()
              this.ctx.moveTo(x, y)
            } else {
              // connect direct
              if (styleOptions.connect === 1) {
                this.ctx.lineTo(x, y)
              } else {
                if (j < switchOverIndex) {
                  // connect last
                  if (styleOptions.connect === 2) {
                    this.ctx.lineTo(previousX, y)
                    this.ctx.lineTo(x, y)
                    // connect next
                  } else if (styleOptions.connect === 3) {
                    this.ctx.lineTo(x, previousY)
                    this.ctx.lineTo(x, y)
                  }
                } else if (j === switchOverIndex) {
                  this.ctx.lineTo(x, y)
                } else {
                  // connect last
                  if (styleOptions.connect === 2) {
                    this.ctx.lineTo(x, previousY)
                    this.ctx.lineTo(x, y)
                    // connext next
                  } else if (styleOptions.connect === 3) {
                    this.ctx.lineTo(previousX, y)
                    this.ctx.lineTo(x, y)
                  }
                }
              }
            }
            previousX = x
            previousY = y
          }
          this.ctx.closePath()
          this.ctx.fill()
          this.resetCtx()
        }
      }
    }
  }
  this.drawSeries = function (timeRange, valueRange, timePerPixel, valuesPerPixel) {
    for (let i = 0; i < this.data.metrics.length; ++i) {
      if (this.data.metrics[i].series.raw === undefined) {
        const metricDrawState = Store.getMetricDrawState(this.data.metrics[i].name)
        this.data.metrics[i].series.avg.styleOptions.skip = !metricDrawState.drawAvg
        if (!metricDrawState.drawMin || !metricDrawState.drawMax) {
          this.data.metrics[i].series.min.styleOptions.skip = !metricDrawState.drawMin
          this.data.metrics[i].series.max.styleOptions.skip = !metricDrawState.drawMax
        } else {
          this.data.metrics[i].series.min.styleOptions.skip = true
          this.data.metrics[i].series.max.styleOptions.skip = true
        }
      }
      for (const curAggregate in this.data.metrics[i].series) {
        const curSeries = this.data.metrics[i].series[curAggregate]
        if (curSeries) {
          const styleOptions = this.parseStyleOptions(curSeries.styleOptions)
          if (styleOptions.skip || curSeries.points.length === 0) {
            this.resetCtx()
            continue
          }
          const offsiteCanvas = this.generateOffsiteDot(styleOptions)

          for (let j = 0, x, y, previousX, previousY; j < curSeries.points.length; ++j) {
            x = this.graticuleDimensions[0] + Math.round((curSeries.points[j].time - timeRange[0]) / timePerPixel) + styleOptions.oddLineWidthAddition
            y = this.graticuleDimensions[1] + (this.graticuleDimensions[3] - Math.round((curSeries.points[j].value - valueRange[0]) / valuesPerPixel)) + styleOptions.oddLineWidthAddition
            if (styleOptions.connect > 0) {
              if (j === 0) {
                this.ctx.beginPath()
                this.ctx.moveTo(x, y)
              } else {
                // connect direct
                if (styleOptions.connect === 1) {
                  this.ctx.lineTo(x, y)
                  // connect last
                } else if (styleOptions.connect === 2) {
                  this.ctx.lineTo(previousX, y)
                  this.ctx.lineTo(x, y)
                  // connect next
                } else if (styleOptions.connect === 3) {
                  this.ctx.lineTo(x, previousY)
                  this.ctx.lineTo(x, y)
                }
              }
            }
            if (curSeries.points[j].count === 1 || (styleOptions.drawDots && curSeries.points[j].count !== 0)) {
              // this.ctx.fillRect(x - styleOptions.halfPointWidth, y - styleOptions.halfPointWidth, styleOptions.pointWidth, styleOptions.pointWidth);
              this.ctx.drawImage(offsiteCanvas.ele, x + offsiteCanvas.offsetX, y + offsiteCanvas.offsetY)
            }
            previousX = x
            previousY = y
          }
          if (styleOptions.connect > 0) {
            this.ctx.stroke()
            this.ctx.closePath()
          }
          // reset ctx style options
          this.resetCtx()
          offsiteCanvas.ele.parentNode.removeChild(offsiteCanvas.ele)
        }
      }
    }
  }
  this.generateOffsiteDot = function (styleOptions) {
    const BODY = document.getElementsByTagName('body')[0]
    const canvas = document.createElement('canvas')
    const ctxDimensions = [styleOptions.pointWidth,
      styleOptions.pointWidth]
    canvas.width = ctxDimensions[0]
    canvas.height = ctxDimensions[1]
    canvas.style.display = 'none'
    BODY.appendChild(canvas)
    const canvasCtx = canvas.getContext('2d')
    if (styleOptions.drawDots) {
      canvasCtx.lineWidth = 1
      canvasCtx.fillStyle = styleOptions.color
      canvasCtx.strokeStyle = styleOptions.color
      styleOptions.drawDots.func(canvasCtx, ctxDimensions[0], ctxDimensions[1])
    }
    return {
      ele: canvas,
      ctx: canvasCtx,
      width: ctxDimensions[0],
      height: ctxDimensions[1],
      offsetX: (ctxDimensions[0] / 2) * -1,
      offsetY: (ctxDimensions[1] / 2) * -1
    }
  }
  this.resetCtx = function () {
    this.ctx.setLineDash([])
    this.ctx.globalAlpha = 1
  }
  this.figureOutTimeRange = function () {
    return this.data.getTimeRange()
  }
  this.figureOutValueRange = function (allTimeValueRanges) {
    const valueRange = this.data.getValueRange(allTimeValueRanges, this.curTimeRange[0], this.curTimeRange[1])
    if (undefined !== valueRange[0]) {
      // add wiggle room
      valueRange[0] -= (valueRange[1] - valueRange[0]) * 0.08
      valueRange[1] += (valueRange[1] - valueRange[0]) * 0.04
    }
    return valueRange
  }

  this.canvasResize = function (canvasMargins, footMargin) {
    const newSize = [document.getElementById('webview_container').offsetWidth, document.body.scrollHeight - footMargin]
    this.clearSize = newSize
    this.ctx.canvas.width = newSize[0]
    this.ctx.canvas.height = newSize[1]
    this.graticuleDimensions = [canvasMargins.left, canvasMargins.top, newSize[0] - canvasMargins.left - canvasMargins.right, newSize[1] - canvasMargins.top - canvasMargins.bottom]
    this.setTimeRange(window.MetricQWebView.instances[0].handler.startTime.getUnix(), window.MetricQWebView.instances[0].handler.stopTime.getUnix())
    this.setValueRange()
    this.draw(false)
  }

  this.canvasReset = function () {
    // is needed so that metriclegend can take the necessary space and canvas takes the rest
    this.ctx.canvas.width = 0
  }
}

function dateToHHMMStr (curDate) {
  return (curDate.getHours() < 10 ? '0' : '') + curDate.getHours() + ':' + (curDate.getMinutes() < 10 ? '0' : '') + curDate.getMinutes()
}

function dateToHHMMSSStr (curDate) {
  return (curDate.getHours() < 10 ? '0' : '') + curDate.getHours() + ':' + (curDate.getMinutes() < 10 ? '0' : '') + curDate.getMinutes() + ':' + (curDate.getSeconds() < 10 ? '0' : '') + curDate.getSeconds()
}
