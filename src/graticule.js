import { DataCache } from './data-handling.js'
import store from './store/'

export class Graticule {
  constructor (paramMetricQHistoryReference, paramEle, ctx) {
    this.ele = paramEle
    this.ctx = ctx
    this.canvasSize = [0, 0]
    this.graticuleDimensions = [0, 0, 0, 0]
    this.curTimeRange = undefined
    this.curValueRange = undefined
    this.curTimePerPixel = undefined
    this.curValuesPerPixel = undefined
    this.pixelsLeft = 0
    this.pixelsBottom = 0
    this.clearSize = [0, 0]
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
  }

  figureOutTimeSteps (maxStepsAllowed) {
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

  figureOutLogarithmicSteps (rangeStart, rangeEnd, maxStepsAllowed) {
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

  formatAxisNumber (value) {
    if (Math.abs(value) >= 10000) {
      return Number.parseFloat(value).toExponential(3)
    }
    return value
  }

  drawGrid (timeRange, valueRange, timePerPixel, valuesPerPixel, ctx, graticuleDimensions = this.graticuleDimensions) {
    /* draw lines */
    ctx.fillStyle = 'rgba(192,192,192,0.5)'

    // vertical grid
    let minDistanceBetweenGridLines = 110
    let maxStepsCount = Math.floor(this.graticuleDimensions[2] / minDistanceBetweenGridLines)
    const xAxisSteps = this.figureOutTimeSteps(maxStepsCount)
    const xPositions = []
    for (let i = 0; i < xAxisSteps.length; ++i) {
      const x = Math.round(graticuleDimensions[0] + ((xAxisSteps[i].timestamp - timeRange[0]) / timePerPixel))
      if (x >= graticuleDimensions[0] &&
        x <= (graticuleDimensions[0] + graticuleDimensions[2])) {
        xPositions.push(x)
        ctx.fillRect(x, graticuleDimensions[1], 2, graticuleDimensions[3])
      } else {
        xPositions.push(undefined)
        console.log('Grid algorithm is broken, invalid x-axis grid line at ' + xAxisSteps[i].label.join(','))
      }
    }

    // horizontal grid
    minDistanceBetweenGridLines = 30
    maxStepsCount = Math.floor(graticuleDimensions[3] / minDistanceBetweenGridLines)
    const yAxisSteps = this.figureOutLogarithmicSteps(valueRange[0], valueRange[1], maxStepsCount)
    const yPositions = []
    for (let i = 0; i < yAxisSteps.length; ++i) {
      const y = Math.round(graticuleDimensions[3] - ((yAxisSteps[i][0] - valueRange[0]) / valuesPerPixel) + graticuleDimensions[1])
      if (y >= graticuleDimensions[1] &&
        y <= (graticuleDimensions[1] + graticuleDimensions[3])) {
        yPositions.push(y)
        if (y >= graticuleDimensions[1]) {
          ctx.fillRect(graticuleDimensions[0], y, graticuleDimensions[2], 2)
        }
      } // else: grid line out of bounds
    }
    if(0 == yPositions.length)
    {
      console.warn("Could not determine any grid lines for the y-axis (i.e. value axis), perhaps some of the parameters that lead to that were wrong? - Parameters: timeRange, valueRange, timePerPixel, valuesPerPixel, graticuleDimensions, minDistanceBetweenGridLines, maxStepsCount", timeRange, valueRange, timePerPixel, valuesPerPixel, graticuleDimensions, minDistanceBetweenGridLines, maxStepsCount)
    }
    /* draw text */
    ctx.fillStyle = 'rgba(0,0,0,1)'
    const fontSize = 14
    ctx.font = fontSize + 'px ' + this.DEFAULT_FONT
    // x-axis ticks (time/date)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'hanging'
    for (let i = 0; i < xAxisSteps.length; ++i) {
      // supports vertically stacked elements, e.g. time, date
      for (let j = 0; j < xAxisSteps[i].label.length; ++j) {
        // unfortunately measuring line height is complicated, so we use fontSize instead
        ctx.fillText(xAxisSteps[i].label[j], xPositions[i], graticuleDimensions[1] + graticuleDimensions[3] + this.pixelsBottom + fontSize * j)
      }
    }
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i < yAxisSteps.length; ++i) {
      if (yPositions[i] >= graticuleDimensions[1]) {
        ctx.fillText(this.formatAxisNumber(yAxisSteps[i][1]), graticuleDimensions[0] - this.pixelsLeft, yPositions[i])
      }
    }
    ctx.textAlign = 'middle'
    ctx.textBaseline = 'alphabetic'
    const curUnits = this.data.distinctUnits()
    if (curUnits && curUnits.length > 0) {
      let unitString = ''
      curUnits.forEach((val, index, arr) => { unitString += (unitString.length > 0 ? ' / ' : '') + val })
      ctx.save()
      ctx.rotate(Math.PI / 2 * 3)
      ctx.fillText(unitString, (Math.round(graticuleDimensions[3] / 2) + graticuleDimensions[1]) * -1, fontSize)
      ctx.restore()
    }
  }

  getTimeValueAtPoint (positionArr) {
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

  moveTimeAndValueRanges (moveTimeBy, moveValueBy) {
    this.curTimeRange[0] += moveTimeBy
    this.curTimeRange[1] += moveTimeBy
    this.curValueRange[0] += moveValueBy
    this.curValueRange[1] += moveValueBy
    this.lastRangeChangeTime = (new Date()).getTime()
  }

  setTimeRange (paramStartTime, paramStopTime) {
    this.curTimeRange = [paramStartTime, paramStopTime]
    this.curTimePerPixel = (this.curTimeRange[1] - this.curTimeRange[0]) / this.graticuleDimensions[2]
    this.lastRangeChangeTime = (new Date()).getTime()
    return true
  }

  setValueRange (paramRangeStart = undefined, paramRangeEnd = undefined) {
    if (undefined !== paramRangeStart) this.curValueRange[0] = paramRangeStart
    if (undefined !== paramRangeEnd) this.curValueRange[1] = paramRangeEnd
    this.curValuesPerPixel = (this.curValueRange[1] - this.curValueRange[0]) / this.graticuleDimensions[3]
    this.lastRangeChangeTime = (new Date()).getTime()
  }

  setTimeRangeExport (timeSpace = this.graticuleDimensions[2]) {
    return (this.curTimeRange[1] - this.curTimeRange[0]) / timeSpace
  }

  setValueRangeExport (valueSpace = this.graticuleDimensions[3]) {
    return (this.curValueRange[1] - this.curValueRange[0]) / valueSpace
  }

  setYRangeOverride (paramTypeStr, paramValueStart, paramValueEnd) {
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

  automaticallyDetermineRanges (determineTimeRange, determineValueRange) {
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
  draw (adjustRanges, ctx = this.ctx, exportValues = undefined) {
    // timers.drawing = {
    //   start: (new Date()).getTime(),
    //   end: 0
    // }
    let curTimePerPixel, curValuesPerPixel, clearSize, graticuleDimensions
    if (adjustRanges === true) {
      throw new Error('Tried to automatically determine time ranges. That makes handler out of sync, disallowed!')
      // this.automaticallyDetermineRanges(true, true)
    } else if (undefined === this.curTimeRange) {
      console.log('Cowardly refusing to do draw() when I am not allowed to determine Time and Value Ranges')
    }
    if (exportValues === undefined) {
      curTimePerPixel = this.curTimePerPixel
      curValuesPerPixel = this.curValuesPerPixel
      clearSize = [this.clearSize[0], this.clearSize[1]]
      graticuleDimensions = [this.graticuleDimensions[0], this.graticuleDimensions[1],
        this.graticuleDimensions[2], this.graticuleDimensions[3]]
    } else {
      clearSize = [exportValues[0], exportValues[1]]
      graticuleDimensions = [exportValues[2], exportValues[3], exportValues[4], exportValues[5]]
      curTimePerPixel = this.setTimeRangeExport(exportValues[4])
      curValuesPerPixel = this.setValueRangeExport(exportValues[5])
    }
    ctx.clearRect(0, 0, clearSize[0], clearSize[1])
    this.drawGrid(this.curTimeRange, this.curValueRange, curTimePerPixel, curValuesPerPixel, ctx, graticuleDimensions)
    ctx.save()
    ctx.beginPath()
    ctx.rect(graticuleDimensions[0], graticuleDimensions[1],
      graticuleDimensions[2], graticuleDimensions[3])
    ctx.clip()
    if (!this.data.hasSeriesToPlot() && !this.data.hasBandToPlot()) {
      console.log('No series to plot')
    } else {
      this.drawBands(this.curTimeRange, this.curValueRange, curTimePerPixel, curValuesPerPixel, ctx, graticuleDimensions)
      this.drawSeries(this.curTimeRange, this.curValueRange, curTimePerPixel, curValuesPerPixel, ctx, graticuleDimensions)
      ctx.restore()
    }
    // timers.drawing.end = (new Date()).getTime()
    // TODO: Make timings accessible
    // showTimers();
  }

  parseStyleOptions (styleOptions, ctx) {
    if (styleOptions !== undefined) {
      if (styleOptions.width !== undefined) {
        styleOptions.pointWidth = parseFloat(styleOptions.width)
      }
      if (styleOptions.dots !== false) {
        styleOptions.drawDots = {
          func: (ctx, width, height) => {
            ctx.fillRect(0, 0, width, height)
          }
        }
        if ((typeof styleOptions.dots) === 'string') {
          const dotMarker = styleOptions.dots.charAt(0)
          switch (dotMarker) {
            case '.': { // point marker
              let referencedLineWidth = styleOptions.pointWidth
              if (styleOptions.lineWidth !== undefined) {
                referencedLineWidth = parseFloat(styleOptions.lineWidth)
              }
              styleOptions.drawDots.func = (ctx, width, height) => {
                ctx.beginPath()
                ctx.arc(width / 2,
                  height / 2,
                  referencedLineWidth / 2,
                  0,
                  Math.PI * 2,
                  true)
                ctx.fill()
              }
              break
            }
            case 'o': // circle marker
              styleOptions.drawDots.func = (ctx, width, height) => {
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
            case 'v': // triangle down marker
            case '1': // fall-through
              styleOptions.drawDots.func = (ctx, width, height) => {
                ctx.beginPath()
                ctx.moveTo(0, 0)
                ctx.lineTo(width / 2, height)
                ctx.lineTo(width, 0)
                ctx.closePath()
                ctx.fill()
              }
              break
            case '^': // triangle up marker
            case '2': // fall-through
              styleOptions.drawDots.func = (ctx, width, height) => {
                ctx.beginPath()
                ctx.moveTo(0, height)
                ctx.lineTo(width, height)
                ctx.lineTo(width / 2, 0)
                ctx.closePath()
                ctx.fill()
              }
              break
            case '<': // triangle left marker
            case '3': // fall-through
              styleOptions.drawDots.func = (ctx, width, height) => {
                ctx.beginPath()
                ctx.moveTo(0, height / 2)
                ctx.lineTo(width, height)
                ctx.lineTo(width, 0)
                ctx.closePath()
                ctx.fill()
              }
              break
            case '>': // triangle right marker
            case '4': // fall-through
              styleOptions.drawDots.func = (ctx, width, height) => {
                ctx.beginPath()
                ctx.moveTo(0, 0)
                ctx.lineTo(width, height / 2)
                ctx.lineTo(0, height)
                ctx.closePath()
                ctx.fill()
              }
              break
            case 's': // square marker
              // Don't need to do anything here
              // it is already defined as default
              break
            case 'p': // pentagon marker
              styleOptions.drawDots.func = (ctx, width, height) => {
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
            case '*': // star marker
              styleOptions.drawDots.func = (ctx, width, height) => {
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
            case 'h': // hexagon marker
              styleOptions.drawDots.func = (ctx, width, height) => {
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
            case '+': // plus marker
              styleOptions.drawDots.func = (ctx, width, height) => {
                ctx.moveTo(width / 2, 0)
                ctx.lineTo(width / 2, height)
                ctx.stroke()
                ctx.moveTo(0, height / 2)
                ctx.lineTo(width, height / 2)
                ctx.stroke()
              }
              break
            case 'x': // x marker
              styleOptions.drawDots.func = (ctx, width, height) => {
                ctx.moveTo(width * 1 / 7, height * 1 / 7)
                ctx.lineTo(width * 6 / 7, height * 6 / 7)
                ctx.stroke()
                ctx.moveTo(width * 1 / 7, height * 6 / 7)
                ctx.lineTo(width * 6 / 7, height * 1 / 7)
                ctx.stroke()
              }
              break
            case 'd': // diamond marker
              styleOptions.drawDots.func = (ctx, width, height) => {
                ctx.beginPath()
                ctx.moveTo(0, height / 2)
                ctx.lineTo(width / 2, 0)
                ctx.lineTo(width, height / 2)
                ctx.lineTo(width / 2, height)
                ctx.closePath()
                ctx.fill()
              }
              break
            case '|': // vline marker
              styleOptions.drawDots.func = (ctx, width, height) => {
                ctx.moveTo(width / 2, 0)
                ctx.lineTo(width / 2, height)
                ctx.stroke()
              }
              break
            case '_': // hline marker
            case '-':
              styleOptions.drawDots.func = (ctx, width, height) => {
                ctx.moveTo(0, height / 2)
                ctx.lineTo(width, height / 2)
                ctx.stroke()
              }
              break
          }
        }
      }

      // second parse Options to be applied to ctx immediatly
      if (styleOptions.color !== undefined) {
        ctx.fillStyle = styleOptions.color
        ctx.strokeStyle = styleOptions.color
      }
      if (styleOptions.alpha !== undefined) {
        ctx.globalAlpha = parseFloat(styleOptions.alpha)
      }
      if (styleOptions.lineWidth !== undefined) {
        ctx.lineWidth = parseFloat(styleOptions.lineWidth)
      }
    }
    return styleOptions
  }

  drawBands (timeRange, valueRange, timePerPixel, valuesPerPixel, ctx, graticuleDimensions) {
    for (let i = 0; i < this.data.metrics.length; ++i) {
      if (store.getters['metrics/getMetricDrawState'](this.data.metrics[i].name).drawMin && store.getters['metrics/getMetricDrawState'](this.data.metrics[i].name).drawMax) {
        const curBand = this.data.metrics[i].band
        if (curBand) {
          const styleOptions = this.parseStyleOptions(curBand.styleOptions, ctx)
          if (styleOptions.skip || curBand.points.length === 0) {
            this.resetCtx(ctx)
            continue
          }

          const switchOverIndex = curBand.switchOverIndex
          for (let j = 0, x, y, previousX, previousY; j < curBand.points.length; ++j) {
            x = graticuleDimensions[0] + Math.round((curBand.points[j].time - timeRange[0]) / timePerPixel)
            y = graticuleDimensions[1] + (graticuleDimensions[3] - Math.round((curBand.points[j].value - valueRange[0]) / valuesPerPixel))
            if (j === 0) {
              ctx.beginPath()
              ctx.moveTo(x, y)
            } else {
              // connect direct
              if (styleOptions.connect === 'direct') {
                ctx.lineTo(x, y)
              } else {
                if (j < switchOverIndex) {
                  // connect last
                  if (styleOptions.connect === 'last') {
                    ctx.lineTo(previousX, y)
                    ctx.lineTo(x, y)
                    // connect next
                  } else if (styleOptions.connect === 'next') {
                    ctx.lineTo(x, previousY)
                    ctx.lineTo(x, y)
                  }
                } else if (j === switchOverIndex) {
                  ctx.lineTo(x, y)
                } else {
                  // connect last
                  if (styleOptions.connect === 'last') {
                    ctx.lineTo(x, previousY)
                    ctx.lineTo(x, y)
                    // connext next
                  } else if (styleOptions.connect === 'next') {
                    ctx.lineTo(previousX, y)
                    ctx.lineTo(x, y)
                  }
                }
              }
            }
            previousX = x
            previousY = y
          }
          ctx.closePath()
          ctx.fill()
          this.resetCtx(ctx)
        }
      }
    }
  }

  drawSeries (timeRange, valueRange, timePerPixel, valuesPerPixel, ctx, graticuleDimensions) {
    for (let i = 0; i < this.data.metrics.length; ++i) {
      if (this.data.metrics[i].series.raw === undefined) {
        const metricDrawState = store.getters['metrics/getMetricDrawState'](this.data.metrics[i].name)
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
          const styleOptions = this.parseStyleOptions(curSeries.styleOptions, ctx)
          if (styleOptions.skip || curSeries.points.length === 0) {
            this.resetCtx(ctx)
            continue
          }
          const offsiteCanvas = this.generateOffsiteDot(styleOptions)

          for (let j = 0, x, y, previousX, previousY; j < curSeries.points.length; ++j) {
            x = graticuleDimensions[0] + Math.round((curSeries.points[j].time - timeRange[0]) / timePerPixel)
            y = graticuleDimensions[1] + (graticuleDimensions[3] - Math.round((curSeries.points[j].value - valueRange[0]) / valuesPerPixel))
            if (styleOptions.connect !== 'none') {
              if (j === 0) {
                ctx.beginPath()
                ctx.moveTo(x, y)
              } else {
                // connect direct
                if (styleOptions.connect === 'direct') {
                  ctx.lineTo(x, y)
                  // connect last
                } else if (styleOptions.connect === 'last') {
                  ctx.lineTo(previousX, y)
                  ctx.lineTo(x, y)
                  // connect next
                } else if (styleOptions.connect === 'next') {
                  ctx.lineTo(x, previousY)
                  ctx.lineTo(x, y)
                  if (j === curSeries.points.length - 1) {
                    ctx.lineTo(x + x - previousX, y)
                  }
                }
              }
            }
            if (curSeries.points[j].count === 1 || (styleOptions.drawDots && curSeries.points[j].count !== 0)) {
              // this.ctx.fillRect(x - styleOptions.halfPointWidth, y - styleOptions.halfPointWidth, styleOptions.pointWidth, styleOptions.pointWidth);
              ctx.drawImage(offsiteCanvas.ele, x + offsiteCanvas.offsetX, y + offsiteCanvas.offsetY)
            }
            previousX = x
            previousY = y
          }
          if (styleOptions.connect !== 'none') {
            ctx.stroke()
          }
          // reset ctx style options
          this.resetCtx(ctx)
        }
      }
    }
  }

  generateOffsiteDot (styleOptions) {
    const BODY = document.getElementsByTagName('body')[0]
    const canvas = document.createElement('canvas')
    const ctxDimensions = [styleOptions.pointWidth,
      styleOptions.pointWidth]
    canvas.width = ctxDimensions[0]
    canvas.height = ctxDimensions[1]
    canvas.style.display = 'none'
    // are they only ever appended? O_O
    //   they clobber up over time...
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

  resetCtx (ctx) {
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }

  figureOutTimeRange () {
    return this.data.getTimeRange()
  }

  figureOutValueRange (allTimeValueRanges) {
    const dataValueRange = this.data.getValueRange(allTimeValueRanges, this.curTimeRange[0], this.curTimeRange[1])
    if (undefined !== valueRange[0]) {
      let deltaRange = Math.abs(valueRange[1] - valueRange[0])
      const WIGGLE = window.MetricQWebView.instances[0].handler.WIGGLEROOM_PERCENTAGE
      const displayValueRange = [dataValueRange[0], dataValueRange[1]]
      if(0 < deltaRange)
      {
        // Here we assume the same wiggle room upwards as well as downwards,
        //   maybe we would want to change that in the future, to like
        //   8 % upwards and 4 % downwards, as that tends to look more
        //   beautiful for data sets which do not have much variation
        //   (in @Quimoniz's personal opinion)
        //   currently (2022-11-22) WIGGLEROOM_PERCENTAGE has the value 0.05
        displayValueRange[0] -= deltaRange * WIGGLE
        displayValueRange[1] += deltaRange * WIGGLE
        if(deltaRange < Math.pow(10, -317))
        {
          console.warn("Warning: The range of values of the data set, is very very small (< 10^-317). Graphs probably won't be drawn correctly as we are very close to the minimum possible value 10^323 (minimum floating point value), our arithmetic is expected to break at this point.")
        }
      } else // ok, what's going on? - there is zero difference between min and max here! 
      {
        // as per @tilsche's suggestion ( https://github.com/metricq/metricq-webview/issues/174#issuecomment-1318516418 )
        //   special treatment for when min == max
        // here the if-condition is just explicitly spelled out (the check for '0 < deltaRange',
        //     already implies that they both are equal)
        if(displayValueRange[0] == displayValueRange[1])
        {
          if(0 != displayValueRange[0])
          {
            const wiggleAbsolute = Math.abs(displayValueRange[0]) * WIGGLE
            displayValueRange[0] -= wiggleAbsolute
            displayValueRange[1] += wiggleAbsolute
          } else { // our range is completely broken, it's from '0' to '0'
                   //   so at this point just set it to be from -1 to +1
            displayValueRange[0] = -1
            displayValueRange[1] =  1
          }
        }  
      }
      
      // special case, if our 'wiggle room' makes the
      //   coordinate system go beneath Zero value,
      //   where there is no-below-zero data, we shall
      //   move the min and max to start with Zero
      if(displayValueRange[0] < 0 && dataValueRange[0] >= 0) {
        const deltaForMovement = displayValueRange[0] * -1
        displayValueRange[0] += deltaForMovement
        displayValueRange[1] += deltaForMovement
      }
      return displayValueRange
    } else {
      console.error("Graticule/Coordinate System: Automatically determining value ranges (y-axis) failed: my data handler told me an 'undefined' minimum value!")
      return dataValueRange
    }
  }

  canvasResize (canvasMargins) {
    this.canvasReset()
    const newSize = [document.getElementById('webview_container').offsetWidth, document.getElementById('wrapper_body').clientHeight]
    this.clearSize = newSize
    this.ctx.canvas.width = newSize[0]
    this.ctx.canvas.height = newSize[1] - canvasMargins.top
    this.graticuleDimensions = [canvasMargins.left, canvasMargins.top, newSize[0] - canvasMargins.left - canvasMargins.right, newSize[1] - canvasMargins.top - canvasMargins.bottom]
    // Note: this assumes we have only one MetricQWebView instance running,
    //       i.e. will cause issues, as soon as we have two instances or more
    this.setTimeRange(window.MetricQWebView.instances[0].handler.startTime.getUnix(), window.MetricQWebView.instances[0].handler.stopTime.getUnix())
    this.setValueRange()
    this.draw(false)
  }

  canvasReset () {
    // is needed so that metriclegend can take the necessary space and canvas takes the rest
    this.ctx.canvas.width = 0
    this.ctx.canvas.height = 0
  }
}
