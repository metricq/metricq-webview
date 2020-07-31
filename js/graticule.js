function Graticule(ctx, offsetDimension, paramPixelsLeft, paramPixelsBottom, paramClearSize)
{
  this.ctx = ctx;
  this.graticuleDimensions = offsetDimension;
  this.curTimeRange = undefined;
  this.curValueRange = undefined;
  this.curTimePerPixel = undefined;
  this.curValuesPerPixel = undefined;
  this.pixelsLeft = paramPixelsLeft;
  this.pixelsBottom = paramPixelsBottom;
  this.clearSize = paramClearSize;
  this.lastRangeChangeTime = 0;
  this.data = new DataCache();
  this.resetData = function()
  {
    delete this.data;
    this.data = new DataCache();
  }
  this.figureOutTimeSteps = function(maxStepsAllowed)
  {
    var startTime = new Date(this.curTimeRange[0]);
    var deltaTime = this.curTimeRange[1] - this.curTimeRange[0];
    var timeStretches = [
      86400000 * 365, // year
      86400000 * 30, // month
      86400000, // day
      3600000, // hour
      60000, // minute
      1000, // second
      1 // millisecond
    ];
    var i;
    for(i = 0; i < 7; ++i)
    {
      if((deltaTime / timeStretches[i]) < (maxStepsAllowed * 0.7))
      {
        continue
      } else
      {
        break;
      }
    }
    if(7 == i)
    {
      i = 6;
    }
    var curRangeMultiplier = (deltaTime / timeStretches[i]) / maxStepsAllowed;
    var mostBeautifulMultipliers = [
      [1, 5, 10, 25, 50, 75, 100], // year
      [1, 2, 3, 4, 6, 12], // month
      [1, 2, 7, 14, 21, 28], // day
      [1, 2, 3, 4, 6, 8, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 64, 60, 72, 84, 96], // hour
      [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 105, 120, 150, 180, 210, 240, 270, 300], // minute
      [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 105, 120, 150, 180, 210, 240, 270, 300], // second
      [1, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 750, 800, 900, 1000] // millisecond
    ];
    var j = 0;
    var indexClosest = 0;
    var deltaClosest = 99999999999;
    for(; j < mostBeautifulMultipliers[i].length; ++j)
    {
      var curDelta = Math.abs(mostBeautifulMultipliers[i][j] - curRangeMultiplier);
      if(curDelta < deltaClosest)
      {
        indexClosest = j;
        deltaClosest = curDelta;
      }
    }
    var moreBeautifulMultiplier = mostBeautifulMultipliers[i][indexClosest];
    if((curRangeMultiplier * 0.50) <= moreBeautifulMultiplier
    && (curRangeMultiplier * 1.50) >= moreBeautifulMultiplier)
    {
      curRangeMultiplier = moreBeautifulMultiplier;
    } else
    {
      curRangeMultiplier = Math.floor(curRangeMultiplier);
    }
    if(1 > curRangeMultiplier)
    {
      curRangeMultiplier = 1;
    }
    var stepSize = timeStretches[i] * curRangeMultiplier;
    var stepStart = undefined;
    var fields = 
    [
      1970,
      1,
      1,
      0,
      0,
      0,
      0
    ]
    switch(i)
    {
      case 0:
        fields[0] = startTime.getFullYear();
        break;
      case 1:
        fields[0] = startTime.getFullYear();
        fields[1] = (startTime.getMonth() + 1) - ((startTime.getMonth() + 1) % curRangeMultiplier);
        if(1 > fields[1])
        {
          fields[1] = 1;
        }
        break;
      case 2:
        fields[0] = startTime.getFullYear();
        fields[1] = startTime.getMonth() + 1;
        fields[2] = startTime.getDate() - startTime.getDate() % curRangeMultiplier;
        if(1 > fields[2])
        {
          fields[2] = 1;
        }
        break;
      case 3:
        fields[0] = startTime.getFullYear();
        fields[1] = startTime.getMonth() + 1;
        fields[2] = startTime.getDate();
        fields[3] = startTime.getHours() - startTime.getHours() % curRangeMultiplier;
        break;
      case 4:
        fields[0] = startTime.getFullYear();
        fields[1] = startTime.getMonth() + 1;
        fields[2] = startTime.getDate();
        fields[3] = startTime.getHours();
        fields[4] = startTime.getMinutes() - startTime.getMinutes() % curRangeMultiplier;
        break;
      case 5:
        fields[0] = startTime.getFullYear();
        fields[1] = startTime.getMonth() + 1;
        fields[2] = startTime.getDate();
        fields[3] = startTime.getHours();
        fields[4] = startTime.getMinutes();
        fields[5] = startTime.getSeconds() - startTime.getSeconds() % curRangeMultiplier;
        break;
      case 6:
        fields[0] = startTime.getFullYear();
        fields[1] = startTime.getMonth() + 1;
        fields[2] = startTime.getDate();
        fields[3] = startTime.getHours();
        fields[4] = startTime.getMinutes();
        fields[5] = startTime.getSeconds();
        fields[6] = startTime.getMilliseconds() - startTime.getMilliseconds() % curRangeMultiplier;
        break;
    }
    stepStart = new Date(fields[0] + "-" + (fields[1] < 10 ? "0" : "") + fields[1] + "-" + (fields[2] < 10 ? "0" : "") + fields[2] + " " + (fields[3] < 10 ? "0" : "") + fields[3] + ":" + (fields[4] < 10 ? "0" : "") + fields[4] + ":" + (fields[5] < 10 ? "0" : "") + fields[5] + "." + (fields[6] < 100 ? "00" : (fields[6] < 10 ? "0" : "")) + fields[6]);
    if(1 != i)
    {
      while(stepStart.getTime() < this.curTimeRange[0])
      {
        stepStart = new Date(stepStart.getTime() + stepSize);
      }
    }
    var outArr = new Array();
    var monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
    var previousCurDate = undefined;
    for(var j = stepStart.getTime(); j < this.curTimeRange[1]; j += stepSize)
    {
      var curDate = new Date(j);
      switch(i)
      {
        case 0:
          outArr.push([ j, "" + curDate.getFullYear()]);
          break;
        case 1:
          if(0 == curDate.getMonth() || !previousCurDate || previousCurDate.getFullYear() != curDate.getFullYear())
          {
            outArr.push([ j, monthNames[curDate.getMonth()] + " " + curDate.getFullYear()]);
          } else
          {
            outArr.push([ j, monthNames[curDate.getMonth()]]);
          }
          stepSize = 0;
          j = (new Date((curDate.getFullYear() + Math.floor((curDate.getMonth() + moreBeautifulMultiplier) / 12)) + "-" + ((curDate.getMonth() + moreBeautifulMultiplier) % 12 + 1) + "-01")).getTime();
          break;
        case 2:
          if(1 == curDate.getDate() || !previousCurDate || previousCurDate.getMonth() != curDate.getMonth())
          {
            outArr.push([j, monthNames[curDate.getMonth()] + " " + curDate.getDate()]);
          } else
          {
            outArr.push([j, "" + curDate.getDate()]);
          }
          break;
        case 3:
          if(0 == curDate.getHours() || !previousCurDate || previousCurDate.getDate() != curDate.getDate())
          {
            outArr.push([j, curDate.getDate() + " " + monthNames[curDate.getMonth()] + " " + (curDate.getHours() < 10 ? "0" : "") + curDate.getHours() + ":00"]);
          } else
          {
            outArr.push([j, (curDate.getHours() < 10 ? "0" : "") + curDate.getHours() + ":00"]);
          }
          break;
        case 4:
          outArr.push([j, (curDate.getHours() < 10 ? "0" : "") + curDate.getHours() + ":" + (curDate.getMinutes() < 10 ? "0" : "") + curDate.getMinutes()]);
          break;
        case 5:
          outArr.push([j, (curDate.getHours() < 10 ? "0" : "") + curDate.getHours() + ":" + (curDate.getMinutes() < 10 ? "0" : "") + curDate.getMinutes() + ":" + (curDate.getSeconds() < 10 ? "0" : "") + curDate.getSeconds()]);
          break;
        case 6:
          var msString = "" + curDate.getMilliseconds();
          for(var k = msString.length; k < 3; ++k)
          {
            msString = "0" + msString;
          }
          if(0 == curDate.getMilliseconds() || !previousCurDate)
          {
            outArr.push([j, (curDate.getHours() < 10 ? "0" : "") + curDate.getHours() + ":" + (curDate.getMinutes() < 10 ? "0" : "") + curDate.getMinutes() + ":" + (curDate.getSeconds() < 10 ? "0" : "") + curDate.getSeconds() + "." + msString]);
          } else
          {
            outArr.push([j, (curDate.getSeconds() < 10 ? "0" : "") + curDate.getSeconds() + "." + msString]);
          }
      }
      previousCurDate = curDate;
    }
    return outArr;
  };
  this.figureOutLogarithmicSteps = function(rangeStart, rangeEnd, maxStepsAllowed)
  {
    var deltaRange = rangeEnd - rangeStart;
    // due to floating point errors we have to increment deltaRange slightly
    // so as to arrive at the correct logarithmic value
    var powerTen = Math.floor(Math.log(deltaRange * 1.0000000001)/Math.log(10));
    var stepSize = Math.pow(10, powerTen);
    if((deltaRange / stepSize) > maxStepsAllowed)
    {
      if((deltaRange / (stepSize * 2)) < maxStepsAllowed)
      {
        stepSize *= 2;
      } else if((deltaRange / (stepSize * 10)) < maxStepsAllowed)
      {
        stepSize *= 10;
        powerTen += 1;
      }
    } else if((deltaRange / stepSize * 5) < maxStepsAllowed)
    {
      if((deltaRange / (stepSize / 10)) < maxStepsAllowed)
      {
        stepSize /= 10;
        powerTen -= 1;
      }
      if((deltaRange / (stepSize / 2)) < maxStepsAllowed)
      {
        stepSize /= 2;
        powerTen -= 1;
      }
    }
    var firstStep = rangeStart - (rangeStart % stepSize);
    var stepsArr = new Array();
    for(var i = 0, curVal = 0; firstStep + (i * stepSize) < rangeEnd; i++)
    {
      curVal = firstStep + (i * stepSize);
      if(0 > powerTen)
      {
        stepsArr.push([curVal, "" + curVal.toFixed(powerTen * -1)]);
      } else
      {
        stepsArr.push([curVal, "" + curVal]);
      }
    }
    return stepsArr;
  };
  
  this.drawGrid = function(timeRange, valueRange, timePerPixel, valuesPerPixel)
  {
    /* draw lines */
    this.ctx.fillStyle = "rgba(192,192,192,0.5)";
    var minDistanceBetweenGridLines = 110;
    var maxStepsCount = Math.floor(this.graticuleDimensions[2] / minDistanceBetweenGridLines);
    var xAxisSteps = this.figureOutTimeSteps(maxStepsCount);
    var xPositions = new Array();
    for(var i = 0; i < xAxisSteps.length; ++i)
    {
      var x = Math.round(this.graticuleDimensions[0] + ((xAxisSteps[i][0] - timeRange[0]) / timePerPixel));
      xPositions.push(x);
      this.ctx.fillRect( x, this.graticuleDimensions[1], 2, this.graticuleDimensions[3]);
    }

    minDistanceBetweenGridLines = 30;
    maxStepsCount = Math.floor(this.graticuleDimensions[3] / minDistanceBetweenGridLines);
    var yAxisSteps = this.figureOutLogarithmicSteps(valueRange[0], valueRange[1], maxStepsCount);
    var yPositions = new Array();
    for(var i = 0; i < yAxisSteps.length; ++i)
    {
      var y = Math.round(this.graticuleDimensions[3] - ((yAxisSteps[i][0] - valueRange[0]) / valuesPerPixel) + this.graticuleDimensions[1]);
      yPositions.push(y);
      if(y >= this.graticuleDimensions[1])
      {
        this.ctx.fillRect( this.graticuleDimensions[0], y, this.graticuleDimensions[2], 2);
      }
    }
    /* draw text */
    this.ctx.fillStyle = "rgba(0,0,0,1)";
    this.ctx.font = "14px Sans";
    for(var i = 0; i < xAxisSteps.length; ++i)
    {
      var textWidth = this.ctx.measureText(xAxisSteps[i][1]).width;
      this.ctx.fillText(xAxisSteps[i][1], xPositions[i] - Math.floor(textWidth / 2), this.graticuleDimensions[1] + this.graticuleDimensions[3] + this.pixelsBottom /2);
    }
    for(var i = 0; i < yAxisSteps.length; ++i)
    {
      if(yPositions[i] >= this.graticuleDimensions[1])
      {
        this.ctx.fillText(yAxisSteps[i][1], this.graticuleDimensions[0] - this.pixelsLeft, yPositions[i] + 4);
      }
    }
  };
  this.getTimeValueAtPoint = function(positionArr)
  {
    var relationalPos = [ positionArr[0] - this.graticuleDimensions[0],
                          positionArr[1] - this.graticuleDimensions[1]];
    if( undefined !== this.curTimeRange
    &&  undefined !== this.curValueRange
    && relationalPos[0] >= 0
    && relationalPos[0] <= this.graticuleDimensions[2]
    && relationalPos[1] >= 0
    && relationalPos[1] <= this.graticuleDimensions[3])
    {
      return [ Math.round((relationalPos[0] * this.curTimePerPixel) + this.curTimeRange[0]),
               ((this.graticuleDimensions[3] - relationalPos[1]) * this.curValuesPerPixel) + this.curValueRange[0]
             ];
    } else
    {
      return undefined;
    }
  };
  this.moveTimeAndValueRanges = function(moveTimeBy, moveValueBy)
  {
    this.curTimeRange[0] += moveTimeBy;
    this.curTimeRange[1] += moveTimeBy;
    this.curValueRange[0] += moveValueBy;
    this.curValueRange[1] += moveValueBy;
    this.lastRangeChangeTime = (new Date()).getTime();
  };
  this.setTimeRange = function (newTimeRange)
  {
    var tooNarrow = false;
    if((newTimeRange[1] - newTimeRange[0]) < 1000)
    {
      var oldDelta = newTimeRange[1] - newTimeRange[0];
      var newDelta = 1000;
      newTimeRange[0] -= Math.round((newDelta - oldDelta) / 2.00);
      newTimeRange[1] += Math.round((newDelta - oldDelta) / 2.00);
      tooNarrow = true;
    }
    this.curTimeRange = [newTimeRange[0], newTimeRange[1]];
    this.curTimePerPixel = (this.curTimeRange[1] - this.curTimeRange[0]) / this.graticuleDimensions[2];
    this.lastRangeChangeTime = (new Date()).getTime();
    return !tooNarrow;
  };
  this.zoomTimeAndValueAtPoint = function(pointAt, zoomDirection, zoomTime, zoomValue)
  {
    var zoomFactor = 1 + zoomDirection;
    var newTimeDelta  = (this.curTimeRange[1] - this.curTimeRange[0]  ) * zoomFactor;
    var newValueDelta = (this.curValueRange[1] - this.curValueRange[0]) * zoomFactor;
    var couldZoom = false;
    if(zoomTime && newTimeDelta > 50)
    {
      var relationalPositionOfPoint = (pointAt[0] - this.curTimeRange[0]) / (this.curTimeRange[1] - this.curTimeRange[0]);
      if(this.setTimeRange([ pointAt[0] - (newTimeDelta * relationalPositionOfPoint),
                             pointAt[0] + (newTimeDelta * (1 - relationalPositionOfPoint))]))
      {
        couldZoom = true;
      }
    }
    if(zoomValue)
    {
      var relationalPositionOfPoint = (pointAt[1] - this.curValueRange[0]) / (this.curValueRange[1] - this.curValueRange[0]);
      this.curValueRange  = [ pointAt[1] - (newValueDelta * relationalPositionOfPoint),
                             pointAt[1] + (newValueDelta * (1 - relationalPositionOfPoint))];
      this.curValuesPerPixel = (this.curValueRange[1] - this.curValueRange[0]) / this.graticuleDimensions[3];
    }
    this.lastRangeChangeTime = (new Date()).getTime();
    return couldZoom;
  };
  this.automaticallyDetermineRanges = function(determineTimeRange, determineValueRange, allTimeValueRanges)
  {
    if(determineTimeRange)
    {
      this.setTimeRange(this.figureOutTimeRange());
    }
    if(determineValueRange)
    {
      this.curValueRange = this.figureOutValueRange(allTimeValueRanges);
      this.curValuesPerPixel = (this.curValueRange[1] - this.curValueRange[0]) / this.graticuleDimensions[3];
    }
    if(determineTimeRange || determineValueRange)
    {
      this.lastRangeChangeTime = (new Date()).getTime();
    }
  };
  this.draw = function(adjustRanges)
  {
    timers.drawing = {
      start: (new Date()).getTime(),
      end: 0
    };
    if(true === adjustRanges)
    {
      this.automaticallyDetermineRanges(true, true);
    } else if(undefined === this.curTimeRange)
    {
      console.log("Cowardly refusing to do draw() when I am not allowed to determine Time and Value Ranges");
    }
    this.ctx.clearRect(0, 0, this.clearSize[0], this.clearSize[1]);
    this.drawGrid(this.curTimeRange, this.curValueRange, this.curTimePerPixel, this.curValuesPerPixel);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(this.graticuleDimensions[0], this.graticuleDimensions[1],
                  this.graticuleDimensions[2], this.graticuleDimensions[3]);
    this.ctx.clip();
    if(!this.data.hasSeriesToPlot() && !this.data.hasBandToPlot())
    {
      console.log("No series to plot");
    } else
    {
      this.drawBands(this.curTimeRange, this.curValueRange, this.curTimePerPixel, this.curValuesPerPixel);
      this.drawSeries(this.curTimeRange, this.curValueRange, this.curTimePerPixel, this.curValuesPerPixel);
      this.ctx.restore();
    }
    timers.drawing.end = (new Date()).getTime();
    //TODO: Make timings accessible
    //showTimers();
  }
  this.parseStyleOptions = function(styleOptions)
  {
    var parsedObj = {
      "skip": false,
      "connect": 3,
      "color": "#000000",
      "pointWidth": 2,
      "halfPointWidth": 1,
      "drawDots": false,
      "lineDash": [],
      "oddLineWidthAddition": 0
    };
    if(styleOptions)
    {
      var styleKeys = Object.keys(styleOptions);
      // first parse Options for parsedObj
      parsedObj.skip = !! styleOptions.skip;
      /* connect is responsible for the way the
       * data points will be connected
       * 1 = direct
       * 2 = last
       * 3 = next
       */
      switch(styleOptions.connect)
      {
        case "next":
          parsedObj.connect = 3;
          break;
        case "last":
          parsedObj.connect = 2;
          break;
        case "direct":
          parsedObj.connect = 1;
          break;
        case "none":
        default:
          parsedObj.connect = 0;
          break;
      }
      if(styleKeys.includes("width"))
      {
        parsedObj.pointWidth = parseFloat(styleOptions.width);
        parsedObj.halfPointWidth = Math.floor(styleOptions.width / 2.00);
      }
      if(styleKeys.includes("dots"))
      {
        parsedObj.drawDots = {
          func: function (ctx, width, height)
          {
            ctx.fillRect(0, 0, width, height);
          }
        };
        if("string" == (typeof styleOptions.dots))
        {
          var dotMarker = styleOptions.dots.charAt(0);
          switch(dotMarker)
          {
            case ".": /* point marker */
              var referencedLineWidth = parsedObj.pointWidth;
              if(styleKeys.includes("lineWidth"))
              {
                referencedLineWidth = parseFloat(styleOptions.lineWidth);
              }
              parsedObj.drawDots.func = function (lineWidth) {
                return function(ctx, width, height)
                {
                  ctx.beginPath();
                  ctx.arc(width / 2,
                          height / 2,
                          lineWidth / 2,
                          0,
                          Math.PI * 2,
                          true);
                  ctx.fill();
                }
              }(referencedLineWidth);
              break;
            case "o": /* circle marker */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.beginPath();
                ctx.arc(width / 2,
                        height / 2,
                        Math.min(width, height) / 2,
                        0,
                        Math.PI * 2,
                        true);
                ctx.stroke();
              };
              break;
            case "v": /* triangle down marker */
            case "1": /* fall-through */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width / 2, height);
                ctx.lineTo(width, 0);
                ctx.closePath();
                ctx.fill();
              }
              break;
            case "^": /* triangle up marker */
            case "2": /* fall-through */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.beginPath();
                ctx.moveTo(0, height);
                ctx.lineTo(width, height);
                ctx.lineTo(width / 2, 0);
                ctx.closePath();
                ctx.fill();
              }
              break;
            case "<": /* triangle left marker */
            case "3": /* fall-through */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.beginPath();
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height);
                ctx.lineTo(width, 0);
                ctx.closePath();
                ctx.fill();
              }
              break;
            case ">": /* triangle right marker */
            case "4": /* fall-through */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width, height / 2);
                ctx.lineTo(0, height);
                ctx.closePath();
                ctx.fill();
              }
              break;
            case "s": /* square marker */
              // Don't need to do anything here
              // it is already defined as default
              break;
            case "p": /* pentagon marker */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.beginPath();
                ctx.moveTo(width / 2, 0);
                ctx.lineTo(width, height * 2 / 5);
                ctx.lineTo(width * 3 / 4, height);
                ctx.lineTo(width * 1 / 4, height);
                ctx.lineTo(0, height * 2 / 5);
                ctx.closePath();
                ctx.fill();
              }
              break;
            case "*": /* star marker */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.moveTo(width / 2, 0);
                ctx.lineTo(width / 2, height);
                ctx.stroke();
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height / 2);
                ctx.stroke();
                ctx.moveTo(width * 1 / 7, height * 1 / 7);
                ctx.lineTo(width * 6 / 7, height * 6 / 7);
                ctx.stroke();
                ctx.moveTo(width * 1 / 7, height * 6 / 7);
                ctx.lineTo(width * 6 / 7, height * 1 / 7);
                ctx.stroke();
              }
              break;
            case "h": /* hexagon marker */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.beginPath();
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width * 1 / 4, 0);
                ctx.lineTo(width * 3 / 4, 0);
                ctx.lineTo(width, height / 2);
                ctx.lineTo(width * 3 / 4, height);
                ctx.lineTo(width * 1 / 4, height);
                ctx.closePath();
                ctx.fill();
              }
              break;
            case "+": /* plus marker */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.moveTo(width / 2, 0);
                ctx.lineTo(width / 2, height);
                ctx.stroke();
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height / 2);
                ctx.stroke();
              }
              break;
            case "x": /* x marker */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.moveTo(width * 1 / 7, height * 1 / 7);
                ctx.lineTo(width * 6 / 7, height * 6 / 7);
                ctx.stroke();
                ctx.moveTo(width * 1 / 7, height * 6 / 7);
                ctx.lineTo(width * 6 / 7, height * 1 / 7);
                ctx.stroke();
              }
              break;
            case "d": /* diamond marker */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.beginPath();
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width / 2, 0);
                ctx.lineTo(width, height / 2);
                ctx.lineTo(width / 2, height);
                ctx.closePath();
                ctx.fill();
              }
              break;
            case "|": /* vline marker */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.moveTo(width / 2, 0);
                ctx.lineTo(width / 2, height);
                ctx.stroke();
              }
              break;
            case "_": /* hline marker */
              parsedObj.drawDots.func = function(ctx, width, height)
              {
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height / 2);
                ctx.stroke();
              }
              break;
          }
        } else if(!styleOptions.dots) {
          parsedObj.drawDots = false;
        }
      }

      // second parse Options to be applied to ctx immediatly
      if(styleOptions.color)
      {
        this.ctx.fillStyle = styleOptions.color;
        this.ctx.strokeStyle = styleOptions.color;
        parsedObj.color = styleOptions.color;
      }
      if(styleOptions.fillPattern)
      {
        var img = new Image();
        img.src = styleOptions.fillPattern;
        this.ctx.fillStyle = this.ctx.createPattern(img, "repeat");
      }
      if(styleOptions.gradient)
      {
        this.parseGradient(styleOptions.gradient);
      }
      if(styleKeys.includes("alpha"))
      {
        this.ctx.globalAlpha = parseFloat(styleOptions.alpha);
      }
      if(styleKeys.includes("lineWidth"))
      {
        this.ctx.lineWidth = parseFloat(styleOptions.lineWidth);
        parsedObj.oddLineWidthAddition = (1 == (styleOptions.lineWidth % 2)) ? 0.5 : 0;
      }
      if(styleKeys.includes("lineDash"))
      {
        this.ctx.setLineDash(styleOptions.lineDash);
      }
    }

    return parsedObj;
  }
  this.parseGradient = function(gradientStr)
  {
    if(gradientStr.match(/^\s*linear-gradient/))
    {
      var innerPart = gradientStr.replace(/^\s*linear-gradient\s*\(/, "");
      innerPart = innerPart.replace(/\s*\)\s*$/, "");
      var gradientData = this.parseInnerGradientStr(innerPart);
      if(!gradientData)
      {
        console.log("Could not parse gradient.");
        return;
      }
      var centerPos = [ this.graticuleDimensions[0] + this.graticuleDimensions[2] / 2,
                        this.graticuleDimensions[1] + this.graticuleDimensions[3] / 2];
      var startPos = [centerPos[0] + Math.cos((270 - gradientData.direction) * Math.PI * 2 / 360) * this.graticuleDimensions[2] / 2,
                      centerPos[1] + Math.sin((270 - gradientData.direction) * Math.PI * 2 / 360) * this.graticuleDimensions[3] / 2];
      var endPos = [centerPos[0] + Math.cos((gradientData.direction * -1 + 90) * Math.PI * 2 / 360) * this.graticuleDimensions[2] / 2,
                      centerPos[1] + Math.sin((gradientData.direction * -1 + 90) * Math.PI * 2 / 360) * this.graticuleDimensions[3] / 2];
      var deltaPos = [endPos[0] - startPos[0],
                      endPos[1] - startPos[1]];
      var distance = Math.sqrt(Math.pow(deltaPos[0], 2) + Math.pow(deltaPos[1], 2));
      var myGradient = this.ctx.createLinearGradient(startPos[0], startPos[1], endPos[0], endPos[1]);
      var lastRelativePosition = 0;
      var relativePosition;
      for(var i = 0; i < gradientData.colorStops.length; ++i)
      {
        if("none" == gradientData.colorStops[i][2])
        {
          var remainingNonePositions = 0;
          var j = i;
          for(; j < gradientData.colorStops.length; ++j)
          {
            if("none" == gradientData.colorStops[j][2])
            {
              remainingNonePositions++;
            } else
            {
              break;
            }
          }
          var nextRelativePosition = lastRelativePosition;
          if(j >= gradientData.colorStops.length)
          {
            nextRelativePosition = 1;
          } else
          {
            nextRelativePosition = this.calculateGradientRelativePosition(gradientData.colorStops[j][2], gradientData.colorStops[j][1], distance);
          }
          relativePosition = lastRelativePosition + ((nextRelativePosition - lastRelativePosition) / (remainingNonePositions + 1));
        } else
        {
          relativePosition = this.calculateGradientRelativePosition(gradientData.colorStops[i][2], gradientData.colorStops[i][1], distance);
        }
        myGradient.addColorStop(relativePosition, gradientData.colorStops[i][0]);
        lastRelativePosition = relativePosition;
      }
      this.ctx.fillStyle = myGradient;
      this.ctx.strokeStyle = myGradient;
    } else if(gradientStr.match(/^\s*radial-gradient/))
    {
      // TODO: code me
    }
    return false;
  };
  this.calculateGradientRelativePosition = function(stopType, stopData, distance)
  {
    if("percent" == stopType)
    {
      return stopData / 100;
    } else if("pixel" == stopType)
    {
      if(stopData > distance)
      {
        return 1;
      } else
      {
        return stopData / distance;
      }
    }
    return undefined;
  };
  this.parseInnerGradientStr = function(innerPart)
  {
    var tokenizedArr = this.tokenizeHeedingParantheses(innerPart);
    var directionAngle = undefined;
    if(1 < tokenizedArr.length)
    {
      if(tokenizedArr[0].match(/^\s*to [a-z ]+/))
      {
        var possibleStrings = [
          ["to bottom right", 135],
          ["to bottom left", 225],
          ["to top right", 45],
          ["to top left", 315],
          ["to left", 270],
          ["to right", 90],
          ["to bottom", 180],
          ["to top", 0]
        ];
        for(var i = 0; i < possibleStrings.length; ++i)
        {
          if(-1 < tokenizedArr[0].indexOf(possibleStrings[i][0]))
          {
            directionAngle = possibleStrings[i][1];
            break;
          }
        }
      }
      if(tokenizedArr[0].match(/-?[0-9]+(\.[0-9]+)?\s*deg\s*$/))
      {
        directionAngle = parseFloat(tokenizedArr[0].match(/(-?[0-9]+(\.[0-9]+)?)\s*deg\s*$/)[1]);
      }
      if(undefined === directionAngle)
      {
        directionAngle = 180; // default Angle
      }
      var gradientData = {
        "direction": directionAngle,
        "colorStops": new Array()
      };
      for(var i = 1; i < tokenizedArr.length; ++i)
      {
        var curElement = ["white", 0, "none"];
        var remainder = tokenizedArr[i];
        if(remainder.match(/%\s*$/))
        {
          curElement[2] = "percent";
        } else if(remainder.match(/px\s*$/))
        {
          curElement[2] = "pixel";
        }
        remainder = remainder.replace(/(px|%)\s*$/, "");
        if(remainder.match(/\d+(\.\d+)?\s*$/))
        {
          if(!remainder.match(/[#a-fA-F]\d+(\.\d+)?\s*$/))
          {
            curElement[1] = parseFloat(remainder.match(/\d+(\.\d+)?\s*$/)[0]);
            remainder = remainder.replace(/\d+(\.\d+)?\s*$/, "");
          }
        }
        curElement[0] = remainder.replace(/\s*$/, "").replace(/^\s*/, "");

        gradientData.colorStops.push(curElement);
      }
      return gradientData;
    } else
    {
      return undefined;
    }
  };
  this.tokenizeHeedingParantheses = function(originStr)
  {
    var tokenArr = new Array();
    var curToken = "";
    var inParantheses = 0;
    for(var i = 0; i < originStr.length; ++i)
    {
      var c = originStr.charAt(i);
      if(0 < inParantheses)
      {
        if(")" == c)
        {
          inParantheses--;
        } else if("(" == c)
        {
          inParantheses++;
        }
        curToken += c;
      } else if("," == c)
      {
        tokenArr.push(curToken);
        curToken = "";
      } else {
        if("(" == c)
        {
          inParantheses = 1;
        }
        curToken += c;
      }
    }
    if(0 < curToken.length)
    {
      tokenArr.push(curToken);
    }
    return tokenArr;
  };
  this.drawBands = function(timeRange, valueRange, timePerPixel, valuesPerPixel)
  {
    for(var i = 0; i < this.data.metrics.length; ++i)
    {
      var curBand = this.data.metrics[i].band;
      if(curBand)
      {
        var styleOptions = this.parseStyleOptions(curBand.styleOptions);
        if(styleOptions.skip || 0 == curBand.points.length)
        {
          this.resetCtx();
          continue;
        }
       
        var switchOverIndex = curBand.switchOverIndex;
        for(var j = 0,x,y,previousX,previousY; j < curBand.points.length; ++j)
        {
          x = this.graticuleDimensions[0] + Math.round((curBand.points[j].time - timeRange[0]) / timePerPixel);
          y = this.graticuleDimensions[1] + (this.graticuleDimensions[3] - Math.round((curBand.points[j].value - valueRange[0]) / valuesPerPixel));
          if(0 == j)
          {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
          } else
          {
            // connect direct
            if(1 == styleOptions.connect)
            {
              this.ctx.lineTo(x,y);
            } else
            {
              if(j < switchOverIndex)
              {
                // connect last
                if(2 == styleOptions.connect)
                {
                  this.ctx.lineTo(previousX, y);
                  this.ctx.lineTo(x, y);
                // connect next
                } else if(3 == styleOptions.connect)
                {
                  this.ctx.lineTo(x, previousY);
                  this.ctx.lineTo(x, y);
                }
              } else if(j == switchOverIndex)
              {
                 this.ctx.lineTo(x, y);
              } else
              {
                // connect last
                if(2 == styleOptions.connect)
                {
                  this.ctx.lineTo(x, previousY);
                  this.ctx.lineTo(x, y);
                // connext next
                } else if(3 == styleOptions.connect)
                {
                  this.ctx.lineTo(previousX, y);
                  this.ctx.lineTo(x, y);
                }
              }
            }
          }
          previousX = x;
          previousY = y;
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.resetCtx();
      }
    }
  }
  this.drawSeries = function(timeRange, valueRange, timePerPixel, valuesPerPixel)
  {
    for(var i = 0; i < this.data.metrics.length; ++i)
    {
      for(var curAggregate in this.data.metrics[i].series)
      {
        var curSeries = this.data.metrics[i].series[curAggregate];
        if(curSeries)
        {
          var styleOptions = this.parseStyleOptions(curSeries.styleOptions);
          if(styleOptions.skip || 0 == curSeries.points.length)
          {
            this.resetCtx();
            continue;
          }
          var offsiteCanvas = this.generateOffsiteDot(styleOptions);
          
          for(var j = 0,x,y,previousX,previousY; j < curSeries.points.length; ++j)
          {
            x = this.graticuleDimensions[0] + Math.round((curSeries.points[j].time - timeRange[0]) / timePerPixel) + styleOptions.oddLineWidthAddition;
            y = this.graticuleDimensions[1] + (this.graticuleDimensions[3] - Math.round((curSeries.points[j].value - valueRange[0]) / valuesPerPixel)) + styleOptions.oddLineWidthAddition;
            if(0 < styleOptions.connect)
            {
              if(0 == j)
              {
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
              } else
              {
                // connect direct
                if(1 == styleOptions.connect)
                {
                  this.ctx.lineTo(x, y);
                // connect last
                } else if(2 == styleOptions.connect)
                {
                  this.ctx.lineTo(previousX,y);
                  this.ctx.lineTo(x, y);
                // connect next
                } else if(3 == styleOptions.connect)
                {
                  this.ctx.lineTo(x, previousY);
                  this.ctx.lineTo(x, y);
                }
              }
            }
            if(1 == curSeries.points[j].count || (styleOptions.drawDots && 0 != curSeries.points[j].count))
            {
              //this.ctx.fillRect(x - styleOptions.halfPointWidth, y - styleOptions.halfPointWidth, styleOptions.pointWidth, styleOptions.pointWidth);
              this.ctx.drawImage(offsiteCanvas.ele, x + offsiteCanvas.offsetX, y + offsiteCanvas.offsetY);
            }
            previousX = x;
            previousY = y;
          }
          if(0 < styleOptions.connect)
          {
            this.ctx.stroke();
            this.ctx.closePath();
          }
          // reset ctx style options
          this.resetCtx();
          offsiteCanvas.ele.parentNode.removeChild(offsiteCanvas.ele);
        }
      }
    }
  };
  this.generateOffsiteDot = function(styleOptions)
  {
    var BODY = document.getElementsByTagName("body")[0];
    var canvas = document.createElement("canvas");
    var ctxDimensions = [styleOptions.pointWidth,
                         styleOptions.pointWidth];
    canvas.width = ctxDimensions[0];
    canvas.height = ctxDimensions[1];
    canvas.style.display = "none";
    BODY.appendChild(canvas);
    var canvasCtx = canvas.getContext("2d");
    if(styleOptions.drawDots)
    {
      canvasCtx.lineWidth = 1;
      canvasCtx.fillStyle = styleOptions.color;
      canvasCtx.strokeStyle = styleOptions.color;
      styleOptions.drawDots.func(canvasCtx, ctxDimensions[0], ctxDimensions[1]);
    }
    return {
      "ele": canvas,
      "ctx": canvasCtx,
      "width": ctxDimensions[0],
      "height": ctxDimensions[1],
      "offsetX": (ctxDimensions[0] / 2) * -1,
      "offsetY": (ctxDimensions[1] / 2) * -1
    };
  };
  this.resetCtx = function()
  {
    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1;
  };
  this.figureOutTimeRange = function ()
  {
    return this.data.getTimeRange();
  };
  this.figureOutValueRange = function (allTimeValueRanges)
  {
    var valueRange = this.data.getValueRange(allTimeValueRanges, this.curTimeRange[0], this.curTimeRange[1]);
    if(undefined !== valueRange[0])
    {
      // add wiggle room
      valueRange[0] -= (valueRange[1] - valueRange[0]) * 0.08;
      valueRange[1] += (valueRange[1] - valueRange[0]) * 0.04;
    }
    return valueRange;
  };
}
function dateToHHMMStr(curDate)
{
  return (curDate.getHours() < 10 ? "0" : "") + curDate.getHours() + ":" + (curDate.getMinutes() < 10 ? "0" : "") + curDate.getMinutes();
}
function dateToHHMMSSStr(curDate)
{
  return (curDate.getHours() < 10 ? "0" : "") + curDate.getHours() + ":" + (curDate.getMinutes() < 10 ? "0" : "") + curDate.getMinutes() + ":" + (curDate.getSeconds() < 10 ? "0" : "") + curDate.getSeconds();
}
