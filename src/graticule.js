import { DataCache } from './data-handling.js'
import store from './store/'

export class Graticule {
  constructor (paramMetricQHistoryReference, paramEle, ctx) {
    this.ele = paramEle
    this.ctx = ctx
    this.dimensions = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
    this.curTimeRange = undefined
    this.curValueRange = undefined
    this.curTimePerPixel = undefined
    this.curValuesPerPixel = undefined
    this.labelOffsets = {
      x_axis: {
        x: 0,
        y: 3
      },
      y_axis: {
        x: 0,
        y: 0
      }

    }
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
    //      as parameters to initialization
    this.MAX_ZOOM_TIME = 20 * 365 * 24 * 3600 * 1000
    this.MIN_ZOOM_TIME = 10
    this.DEFAULT_FONT = 'sans-serif'
    this.BG_COLOR = '#FFFFFF'
  }

  // Lots of magic to automatically determine 'beautiful' gridlines
  //   which are hopefully somewhat sensible for the time axis
  figureOutTimeSteps (maxStepsAllowed) {
    const startTime = new Date(this.curTimeRange[0])
    // assume that the time elapsed in our displayed data is always sensible
    //   in particular, that it never is zero
    const deltaTime = this.curTimeRange[1] - this.curTimeRange[0]
    // first off: need to ascertain the basic time units
    const timeStretches = [
      86400000 * 365, // year
      86400000 * 30, // month
      86400000, // day
      3600000, // hour
      60000, // minute
      1000, // second
      1 // millisecond
    ]
    // now figure out the most appropriate time unit (which we defined above)
    //   we assume that the maximum number of y axis stops/grid lines
    //   (i.e. argument maxStepsAllowed), must always be at least 70 % reached
    //   Note: please do not worry about those 70 % here, below we have code
    //         that considers 'maxStepsAllowed' again, trying to make sure,
    //         that we stay below it
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
    // determine a theoretical perfect stepping, which fulfills
    //   'maxStepsAllowed' perfectly,
    //   we use it as perfect reference to which we want to come
    //   close to with the next for-loop
    let curRangeMultiplier = (deltaTime / timeStretches[i]) / maxStepsAllowed
    // computers don't naturally know what is 'beautiful',
    //   so here we define what is beautiful (e.g. time stretches
    //   of 5 or 15 minutes, as can be seen below)
    const mostBeautifulMultipliers = [
      [1, 5, 10, 25, 50, 75, 100], // year
      [1, 2, 3, 4, 6, 12], // month
      [1, 2, 7, 14, 21, 28], // day
      [1, 2, 3, 4, 6, 8, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 64, 60, 72, 84, 96], // hour
      [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 105, 120, 150, 180, 210, 240, 270, 300], // minute
      [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 105, 120, 150, 180, 210, 240, 270, 300], // second
      [1, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 750, 800, 900, 1000] // millisecond
    ]
    // just iterate over all 'beautiful' numbers, corresponding to the
    //   current time unit which we figured out with the
    //   previous for-loop (variable 'i')
    let indexClosest = 0
    let deltaClosest = 99999999999
    for (let j = 0; j < mostBeautifulMultipliers[i].length; ++j) {
      const curDelta = Math.abs(mostBeautifulMultipliers[i][j] - curRangeMultiplier)
      if (curDelta < deltaClosest) {
        indexClosest = j
        deltaClosest = curDelta
      }
    }
    // so, now with that, we got a beautiful time unit figured out:
    const moreBeautifulMultiplier = mostBeautifulMultipliers[i][indexClosest]

    // but... what if the most beautiful time unit/the most beautiful multiplier
    //    is actually -50 % or + 50 % away from the mathematical most
    //    perfect unit (with respect to maxStepsAllowed)
    //    in that case (the 'else' case, we discard the beautiful multiplier
    //    which we figured out above, and just go by the mathematically
    //    perfect multiplier, which I believe is a sensible fallback in case of
    //    corner cases)
    if ((curRangeMultiplier * 0.50) <= moreBeautifulMultiplier &&
      (curRangeMultiplier * 1.50) >= moreBeautifulMultiplier) {
      curRangeMultiplier = moreBeautifulMultiplier
    } else {
      curRangeMultiplier = Math.floor(curRangeMultiplier)
    }
    // what if we are below the smallest possible multiplier (=1)?
    //   we set our minimum to be one.
    // note that this multiplier is being multiplied by our current time
    //   unit, which we stored in variable 'i'
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
    // based on our reference time unit (variable 'i') make all smaller
    //   time units be the default, by not setting them, and leaving them
    //   at the default date values of 1970-01-01T00:00:00.000
    switch (i) {
      case 0:
        fields[0] = startTime.getFullYear()
        break
      case 1:
        fields[0] = startTime.getFullYear()
        // getMonth() will return a number 0 - 11, which I find rather
        //   unintuitive. We have to increment it by one each time we query it.
        fields[1] = (startTime.getMonth() + 1) - ((startTime.getMonth() + 1) % curRangeMultiplier)
        if (fields[1] < 1) {
          fields[1] = 1
        }
        break
      case 2:
        fields[0] = startTime.getFullYear()
        fields[1] = startTime.getMonth() + 1
        // when our multiplier denotes some number > 1, then by using the modulo
        //   operator we can make sure that if we were having e.g. a multiplier of '5'
        //   we can _start_ at multiples of 5, by subtracting the remainder
        //   as we do below
        //   otherwise, if we had a multiplier of 5 we
        //   would create steps like 2, 7, 12, 17, 22, 27  which I don't find beautiful
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
    // make sure that we don't start our steps before our minimum time
    if (i === 0) {
      while (stepStart.getTime() < this.curTimeRange[0]) {
        let timeIncrement = stepSize
        if (this.isLeapYear(stepStart.getFullYear())) timeIncrement += 86400 * 1000
        stepStart = new Date(stepStart.getTime() + timeIncrement)
      }
    }
    // now finally, we got everything figured out
    //   - we got the time of our first gridline step('stepStart')
    //   - we got the size of each single step
    // we produce an array like:
    //  [
    //    {
    //      "timestamp": 1501711220000,
    //      "label": ["00:00:20"]
    //    }, {
    //      "timestamp": 1501711260000,
    //      "label": ["00:01:00"]
    //    }, {
    //      "timestamp": 1501711300000,
    //      "label": ["00:01:40"]
    //    }, {
    //      "timestamp": 1501711340000,
    //      "label": ["00:02:20"]
    //    }
    //  ]
    // Note: in case of the Day, Month or Year changing while our step size
    //       is Month, Day or Hour, then we add another element to the 'label'
    //       array, denoting the changing respective bigger unit
    //       (change is detected from left to right, so such a change is denoted
    //       at the beginning of each new day/bigger time unit)
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
          if (this.isLeapYear(curDate.getFullYear())) j += 86400 * 1000
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

  isLeapYear (paramYear) {
    paramYear = parseInt(paramYear)

    if ((paramYear % 400) === 0 ||
       ((paramYear % 4) === 0 &&
        (paramYear % 100) !== 0)) {
      return true
    }
    return false
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

  drawGrid (timeRange, valueRange, timePerPixel, valuesPerPixel, ctx, dimensions) {
    /* draw lines */
    ctx.fillStyle = 'rgba(192,192,192,0.5)'

    // vertical grid
    let minDistanceBetweenGridLines = 110
    let maxStepsCount = Math.floor(this.dimensions.width / minDistanceBetweenGridLines)
    const xAxisSteps = this.figureOutTimeSteps(maxStepsCount)
    const xPositions = []
    for (let i = 0; i < xAxisSteps.length; ++i) {
      const x = Math.round(dimensions.x + ((xAxisSteps[i].timestamp - timeRange[0]) / timePerPixel))
      if (x >= dimensions.x &&
        x <= (dimensions.x + dimensions.width)) {
        xPositions.push(x)
        ctx.fillRect(x, dimensions.y, 2, dimensions.height)
      } else {
        xPositions.push(undefined)
        console.log('Grid algorithm is broken, invalid x-axis grid line at ' + xAxisSteps[i].label.join(','))
      }
    }

    // horizontal grid
    minDistanceBetweenGridLines = 30
    maxStepsCount = Math.floor(dimensions.height / minDistanceBetweenGridLines)
    const yAxisSteps = this.figureOutLogarithmicSteps(valueRange[0], valueRange[1], maxStepsCount)
    const yPositions = []
    for (let i = 0; i < yAxisSteps.length; ++i) {
      const y = Math.round(dimensions.height - ((yAxisSteps[i][0] - valueRange[0]) / valuesPerPixel) + dimensions.y)
      if (y >= dimensions.y && y <= (dimensions.y + dimensions.height)) {
        yPositions.push(y)
        if (y >= dimensions.y) {
          ctx.fillRect(dimensions.x, y, dimensions.width, 2)
        }
      } else {
        yPositions.push(undefined)
        console.log('Grid algorithm is broken, invalid y-axis grid line at ' + yAxisSteps[i][0])
      }
    }
    /* draw text */
    ctx.fillStyle = 'rgba(0,0,0,1)'
    const fontSize = 14
    ctx.font = fontSize + 'px ' + this.DEFAULT_FONT
    // x-axis labels/ticks (time/date)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'hanging'
    for (let i = 0; i < xAxisSteps.length; ++i) {
      // supports vertically stacked elements, e.g. time, date
      for (let j = 0; j < xAxisSteps[i].label.length; ++j) {
        // unfortunately measuring line height is complicated, so we use fontSize instead
        // add some slight y offset here
        ctx.fillText(xAxisSteps[i].label[j], xPositions[i] + this.labelOffsets.x_axis.x, dimensions.y + dimensions.height + this.pixelsBottom + fontSize * j + this.labelOffsets.x_axis.y)
      }
    }
    // y-axis labels/ticks (values)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i < yAxisSteps.length; ++i) {
      if (yPositions[i] >= dimensions.y) {
        ctx.fillText(this.formatAxisNumber(yAxisSteps[i][1]), dimensions.x - this.pixelsLeft + this.labelOffsets.y_axis.x, yPositions[i] + this.labelOffsets.y_axis.y)
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
      ctx.fillText(unitString, (Math.round(dimensions.height / 2) + dimensions.y) * -1, fontSize)
      ctx.restore()
    }
  }

  getTimeValueAtPoint (positionArr) {
    const relationalPos = [positionArr[0] - this.dimensions.x, positionArr[1] - this.dimensions.y]
    if (undefined !== this.curTimeRange &&
      undefined !== this.curValueRange &&
      relationalPos[0] >= 0 &&
      relationalPos[0] <= this.dimensions.width &&
      relationalPos[1] >= 0 &&
      relationalPos[1] <= this.dimensions.height) {
      return [Math.round((relationalPos[0] * this.curTimePerPixel) + this.curTimeRange[0]),
        ((this.dimensions.height - relationalPos[1]) * this.curValuesPerPixel) + this.curValueRange[0]
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
    this.curTimePerPixel = (this.curTimeRange[1] - this.curTimeRange[0]) / this.dimensions.width
    this.lastRangeChangeTime = (new Date()).getTime()
    return true
  }

  setValueRange (paramRangeStart = undefined, paramRangeEnd = undefined) {
    if (undefined !== paramRangeStart) this.curValueRange[0] = paramRangeStart
    if (undefined !== paramRangeEnd) this.curValueRange[1] = paramRangeEnd
    this.curValuesPerPixel = (this.curValueRange[1] - this.curValueRange[0]) / this.dimensions.height
    this.lastRangeChangeTime = (new Date()).getTime()
  }

  setTimeRangeExport (timeSpace = this.dimensions.width) {
    return (this.curTimeRange[1] - this.curTimeRange[0]) / timeSpace
  }

  setValueRangeExport (valueSpace = this.dimensions.height) {
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
      this.curValuesPerPixel = (this.curValueRange[1] - this.curValueRange[0]) / this.dimensions.height
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
      graticuleDimensions = this.dimensions
    } else {
      clearSize = [exportValues[0], exportValues[1]]
      graticuleDimensions = {
        x: exportValues[2],
        y: exportValues[3],
        width: exportValues[4],
        height: exportValues[5]
      }
      curTimePerPixel = this.setTimeRangeExport(exportValues[4])
      curValuesPerPixel = this.setValueRangeExport(exportValues[5])
    }
    ctx.fillStyle = this.BG_COLOR
    ctx.fillRect(0, 0, clearSize[0], clearSize[1])
    this.drawGrid(this.curTimeRange, this.curValueRange, curTimePerPixel, curValuesPerPixel, ctx, graticuleDimensions)
    ctx.save()
    ctx.beginPath()
    ctx.rect(graticuleDimensions.x, graticuleDimensions.y,
      graticuleDimensions.width, graticuleDimensions.height)
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
      if (!store.getters['metrics/getMetricDrawState'](this.data.metrics[i].name).draw) continue

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
            x = graticuleDimensions.x + Math.round((curBand.points[j].time - timeRange[0]) / timePerPixel)
            y = graticuleDimensions.y + (graticuleDimensions.height - Math.round((curBand.points[j].value - valueRange[0]) / valuesPerPixel))
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
      if (!store.getters['metrics/getMetricDrawState'](this.data.metrics[i].name).draw) continue

      if (this.data.metrics[i].series.avg !== undefined) {
        this.data.metrics[i].series.avg.styleOptions.connect = 'next'
      }

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
        if (!metricDrawState.drawMin && !metricDrawState.drawMax) {
          this.data.metrics[i].series.avg.styleOptions.connect = 'direct'
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
            x = graticuleDimensions.x + Math.round((curSeries.points[j].time - timeRange[0]) / timePerPixel)
            y = graticuleDimensions.y + (graticuleDimensions.height - Math.round((curSeries.points[j].value - valueRange[0]) / valuesPerPixel))
            if (styleOptions.connect === 'next') {
              if (j === 0) {
                ctx.beginPath()
                ctx.moveTo(x, y)
              } else {
                // if the current value is null, y is garbage
                if (curSeries.points[j].value === null) {
                  if (previousY !== null) {
                    // if the previous Y is a sane value, we need to draw to last bits
                    ctx.lineTo(x, previousY)
                  }
                  // if it's not a sane value, well, then we got a big gap at our hands here \o/

                  // we set previousY to null, so we can check on that in the next "aggregate"
                  previousY = null

                  // and we advance X
                  previousX = x

                  // we use continue here, so our carefully set previousX/Y don't get overwritten down there
                  continue
                } else {
                  // if the current value is not none, we can draw things, but...

                  if (previousY === null) {
                    // if the previous aggregate was null, we want to draw a gap
                    //
                    ctx.moveTo(x, y)
                  } else {
                    // first, we draw the horizontal part with the Y value of the previous
                    // aggregate. We need to do that in this step, as we don't have the "nextX"
                    // in the previous step.
                    ctx.lineTo(x, previousY)

                    // now, we draw the vertical line between the previous and the current Y value
                    ctx.lineTo(x, y)

                    // and in the next iteration, we start with drawing the horizontal part again
                  }

                  // this part apparently is for drawing the last horizontal bit.
                  // And to be frank, it looks pretty sketchy to me, but I ain't here to fix that.
                  if (j === curSeries.points.length - 1) {
                    ctx.lineTo(x + x - previousX, y)
                  }
                }
              }
            } else if (styleOptions.connect === 'direct') {
              // drawing direct means, we connect the middle points of two
              // intervals. For good measure, put a square dot in place as well.
              // I think it makes sense to move the points, as these represent
              // averages over the time interval and not a sample.
              if (j === 0) {
                ctx.beginPath()
                ctx.moveTo(x, y)
              } else {
                // we need to handle gaps. For that matter, we need to look back
                // twice.
                if (curSeries.points[j - 1].value === null) {
                  if (curSeries.points[j].value !== null) {
                    // if the last one was a gap, but this ain't, we remember
                    // the current one and move a bit.
                    ctx.moveTo(x, y)
                    previousY = y
                    previousX = x
                  }
                  continue
                } else if (j === 1 || curSeries.points[j - 2].value === null) {
                  // if the current one is a gap, we are doomed and I'm not
                  // sure how to handle that. ¯\_(ツ)_/¯
                  ctx.moveTo(0.5 * (x + previousX), previousY)
                }

                // simply line to the middle point between the current value
                // and the previous one
                ctx.lineTo(0.5 * (x + previousX), previousY)

                // and draw a little rectangle there to denote the point.
                ctx.fillRect(0.5 * (x + previousX) - styleOptions.pointWidth / 4, previousY - styleOptions.pointWidth / 4, styleOptions.pointWidth / 2, styleOptions.pointWidth / 2)

                if (j === curSeries.points.length - 1) {
                  // fill in the last one, we technically don't know enough, so
                  // this might be placed wrong. It's fine.
                  ctx.lineTo(x + 0.5 * (x - previousX), y)
                  ctx.fillRect(x + 0.5 * (x - previousX) - styleOptions.pointWidth / 4, y - styleOptions.pointWidth / 4, styleOptions.pointWidth / 2, styleOptions.pointWidth / 2)
                }
              }
            } else {
              // just leaving it here for future me.
              // Surprisingly, the default drawing mode in webview is 'next'.
              // The other modes got removed while fixing the null-values. And that is how it's done:
              // Note: Lars is sad, that the drawing modes got reduced to only 'next'.
              //       But, he is happy that direct style is back on the menu now.
              console.assert(styleOptions.connect === 'none', "Somehow you managed to switch the draw mode to something else than 'next' or 'connect'. I can't do that anymore.")
            }
            if (curSeries.points[j].count === 1 || (styleOptions.drawDots && curSeries.points[j].count !== 0)) {
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

  /* Generate a non-used canvas, onto which we draw the geometrical figure
   *   (i.e. the marker/symbol) specificied with parameter 'styleOptions',
   *   which then we can use to paste it to wherever we need that kind
   *   of symbol as a marker
   */
  generateOffsiteDot (styleOptions) {
    const canvas = document.createElement('canvas')
    const ctxDimensions = [styleOptions.pointWidth,
      styleOptions.pointWidth]
    canvas.width = ctxDimensions[0]
    canvas.height = ctxDimensions[1]
    canvas.style.display = 'none'
    // Note: we do not need to clobber the HTML's DOM with the canvas
    //       which has the advantage, that the garbage collector will
    //       (hopefully) delete this offsite canvas after the drawing
    //       operations  have  completed  (as opposed  to the offsite
    //       canvas elements littering the BODY endlessly)
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
    if (undefined !== dataValueRange[0]) {
      const deltaRange = Math.abs(dataValueRange[1] - dataValueRange[0])
      const WIGGLE = window.MetricQWebView.handler.WIGGLEROOM_PERCENTAGE
      const displayValueRange = [dataValueRange[0], dataValueRange[1]]
      let brokenRange = false
      if (deltaRange > 0) {
        // Here we assume the same wiggle room upwards as well as downwards,
        //   maybe we would want to change that in the future, to like
        //   8 % upwards and 4 % downwards, as that tends to look more
        //   beautiful for data sets which do not have much variation
        //   (in @Quimoniz's personal opinion)
        //   currently (2022-11-22) WIGGLEROOM_PERCENTAGE has the value 0.05
        displayValueRange[0] -= deltaRange * WIGGLE
        displayValueRange[1] += deltaRange * WIGGLE
        if (deltaRange < Math.pow(10, -317)) {
          console.warn("Warning: The range of values of the data set, is very very small (< 10^-317). Graphs probably won't be drawn correctly as we are very close to the minimum possible value 10^323 (minimum floating point value), our arithmetic is expected to break at this point.")
        }
      } else { // ok, what's going on? - there is zero difference between min and max here!
        // as per @tilsche's suggestion ( https://github.com/metricq/metricq-webview/issues/174#issuecomment-1318516418 )
        //   special treatment for when min == max
        // here the if-condition is just explicitly spelled out (the check for '0 < deltaRange',
        //     already implies that they both are equal)
        if (displayValueRange[0] === displayValueRange[1]) {
          if (displayValueRange[0] !== 0) {
            const wiggleAbsolute = Math.abs(displayValueRange[0]) * WIGGLE
            displayValueRange[0] -= wiggleAbsolute
            displayValueRange[1] += wiggleAbsolute
          } else { // our range is completely broken, it's from '0' to '0'
            //   so at this point just set it to be from -1 to +1
            brokenRange = true
            displayValueRange[0] = -1
            displayValueRange[1] = 1
          }
        }
      }

      // Through this brokenRange check we can resolve @mbielert's suggestion in
      //   https://github.com/metricq/metricq-webview/pull/188#issuecomment-1324989786
      if (!brokenRange) {
        // special case, if our 'wiggle room' makes the
        //   coordinate system go beneath Zero value,
        //   where there is no-below-zero data, we shall
        //   move the min and max to start with Zero
        if (displayValueRange[0] < 0 && dataValueRange[0] >= 0) {
          const deltaForMovement = displayValueRange[0] * -1
          displayValueRange[0] += deltaForMovement
          displayValueRange[1] += deltaForMovement
        }
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
    this.dimensions = {
      x: canvasMargins.left,
      y: canvasMargins.top,
      width: newSize[0] - canvasMargins.left - canvasMargins.right,
      height: newSize[1] - canvasMargins.top - canvasMargins.bottom
    }
    this.setTimeRange(window.MetricQWebView.handler.startTime.getUnix(), window.MetricQWebView.handler.stopTime.getUnix())
    this.setValueRange()
    this.draw(false)
  }

  canvasReset () {
    // is needed so that metriclegend can take the necessary space and canvas takes the rest
    this.ctx.canvas.width = 0
    this.ctx.canvas.height = 0
  }
}
