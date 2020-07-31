
var uiInteractArr = [
  ["drag", ["17"], "uiInteractPan"],
  ["drag", ["!16", "!17"], "uiInteractZoomArea"],
  ["drop", ["!16", "!17"], "uiInteractZoomIn"],
  ["move", [], "uiInteractLegend"],
  ["wheel", [], "uiInteractZoomWheel"]
];


function uiInteractPan()
{
  if(mouseDown.previousPos[0] !== mouseDown.currentPos[0]
  || mouseDown.previousPos[1] !== mouseDown.currentPos[1])
  {
    mainGraticule.moveTimeAndValueRanges( (mouseDown.currentPos[0] - mouseDown.previousPos[0]) * -1 * mainGraticule.curTimePerPixel, 0);
    setTimeout(function (lastUpdateTime) { return function() { updateAllSeriesesBands(lastUpdateTime); }; }(mainGraticule.lastRangeChangeTime), 150);
    mainGraticule.draw(false);
  }
}
function uiInteractZoomArea()
{
  if(mouseDown.previousPos[0] !== mouseDown.currentPos[0]
  || mouseDown.previousPos[1] !== mouseDown.currentPos[1])
  {
    mainGraticule.draw(false);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    var minXPos = mouseDown.currentPos[0];
    if(mouseDown.startPos[0] < minXPos)
    {
      minXPos = mouseDown.startPos[0];
    }
    var maxXPos = mouseDown.currentPos[0];
    if(mouseDown.startPos[0] > maxXPos)
    {
      maxXPos = mouseDown.startPos[0];
    }
    ctx.fillRect(minXPos, mainGraticule.graticuleDimensions[1], maxXPos - minXPos, mainGraticule.graticuleDimensions[3]);
    var timeValueStart = mainGraticule.getTimeValueAtPoint( [minXPos, mouseDown.relativeStartPos[1]]);
    var timeValueEnd = mainGraticule.getTimeValueAtPoint([maxXPos, mouseDown.relativeStartPos[1]]);
  
    if(timeValueStart && timeValueEnd)
    {
      var timeDelta = timeValueEnd[0] - timeValueStart[0];
      var centerPos = [
        Math.floor(minXPos + (maxXPos - minXPos) / 2),
        Math.floor(mainGraticule.graticuleDimensions[1] + (mainGraticule.graticuleDimensions[3] - mainGraticule.graticuleDimensions[1]) / 2)
      ];
      var deltaString = "";
      if(86400000 < timeDelta)
      {
        deltaString = (new Number(timeDelta / 86400000)).toFixed(2) + " days";
      } else if(3600000 < timeDelta)
      {
        deltaString = (new Number(timeDelta / 3600000)).toFixed(2) + " hours";
      } else if(60000 < timeDelta)
      {
        deltaString = (new Number(timeDelta / 60000)).toFixed(1) + " minutes";
      } else if(1000 < timeDelta)
      {
        deltaString = (new Number(timeDelta / 1000)).toFixed(1) + " seconds";
      } else
      {
        deltaString = Math.floor(timeDelta) + " milliseconds";
      }
      centerPos[0] -= Math.round(ctx.measureText(deltaString).width / 2);
      ctx.fillStyle = "#000000";
      ctx.fillText(deltaString , centerPos[0], centerPos[1]);
    }
  }
}
function uiInteractZoomIn(evtObj)
{
  evtObj.preventDefault();
  var relativeStart = mouseDown.relativeStartPos;
  var relativeEnd = calculateActualMousePos(evtObj);
  if(1 < Math.abs(relativeStart[0] - relativeEnd[0]))
  {
    var posEnd   = mainGraticule.getTimeValueAtPoint( relativeStart );
    var posStart = mainGraticule.getTimeValueAtPoint( relativeEnd );
    if(!posEnd || !posStart)
    {
      return;
    }
    if(posEnd[0] < posStart[0])
    {
      var swap = posEnd;
      posEnd = posStart;
      posStart = swap;
    }
    if(!mainGraticule.setTimeRange([posStart[0], posEnd[0]]))
    {
      showUserHint("Zoom-Limit erreicht.");
    }
    mainGraticule.automaticallyDetermineRanges(false, true, metricParams.allTimeReference);
    setTimeout(function (lastUpdateTime) { return function() { updateAllSeriesesBands(lastUpdateTime); }; }(mainGraticule.lastRangeChangeTime), 200);
    mainGraticule.draw(false);
  }
}
function uiInteractZoomWheel(evtObj)
{
  if(! evtObj.target || !mainGraticule)
  {
    return;
  }
  evtObj.preventDefault();
  if(evtObj.deltaX && uiOptions.horizontalScrolling) // horizontal scrolling
  {
    var deltaRange = mainGraticule.curTimeRange[1] - mainGraticule.curTimeRange[0];
    if(0 > evtObj.deltaX)
    {
      if(!mainGraticule.setTimeRange([mainGraticule.curTimeRange[0] - deltaRange * 0.2, mainGraticule.curTimeRange[1] - deltaRange * 0.2]))
      {
        showUserHint("Zoom-Limit erreicht.");
      }
    } else if(0 < evtObj.deltaX)
    {
      if(!mainGraticule.setTimeRange([mainGraticule.curTimeRange[0] + deltaRange * 0.2, mainGraticule.curTimeRange[1] + deltaRange * 0.2]))
      {
        showUserHint("Zoom-Limit erreicht.");
      }
    }
    setTimeout(function (lastUpdateTime) { return function() { updateAllSeriesesBands(lastUpdateTime); }; }(mainGraticule.lastRangeChangeTime), 200);
    mainGraticule.draw(false);
  } else // vertical scrolling
  {
    var scrollDirection = evtObj.deltaY;
    if(0 > scrollDirection)
    {
      scrollDirection = - 0.2;
    }
    if(0 < scrollDirection)
    {
      scrollDirection = 0.2;
    }
    var curPos = calculateActualMousePos(evtObj);
    var curTimeValue = mainGraticule.getTimeValueAtPoint(curPos);
    if(curTimeValue)
    {
      if(!mainGraticule.zoomTimeAndValueAtPoint(curTimeValue, scrollDirection, true, false))
      {
        showUserHint("Konnte nicht weiter zoomen, Limit erreicht");
      }
      mainGraticule.automaticallyDetermineRanges(false, true, metricParams.allTimeReference);
      setTimeout(function (lastUpdateTime) { return function() { updateAllSeriesesBands(lastUpdateTime); }; }(mainGraticule.lastRangeChangeTime), 150);
      mainGraticule.draw(false);
    }
  }
}
function uiInteractLegend(evtObj)
{
  var curPosOnCanvas = calculateActualMousePos(evtObj);
  var curPoint = mainGraticule.getTimeValueAtPoint(curPosOnCanvas);
  if(!curPoint)
  {
    return;
  }
  mainGraticule.draw(false);
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(curPosOnCanvas[0] - 1, mainGraticule.graticuleDimensions[1], 2, mainGraticule.graticuleDimensions[3]);
  ctx.font = "14px Sans";
  var metricsArray = new Array();
  var maxTextWidth = 0;
  var allValuesAtTime = mainGraticule.data.getAllValuesAtTime(curPoint[0]);
  for(var i = 0; i < allValuesAtTime.length; ++i)
  {
    var newEntry = [
        allValuesAtTime[i][0],
        allValuesAtTime[i][1]
      ];
    var curTextLine = (new Number(newEntry[0])).toFixed(3) + " " + allValuesAtTime[i][1] + "/" + allValuesAtTime[i][2];
    newEntry.push(curTextLine);
    newEntry.push(ctx.measureText(curTextLine).width);
    if(newEntry[3] > maxTextWidth)
    {
      maxTextWidth = newEntry[3];
    }
    metricsArray.push(newEntry);
  }
  if(uiOptions.sortTooltip)
  {
    metricsArray.sort(function (a,b) { return b[0] - a[0]; } );
  }
  var posDate = new Date(curPoint[0]);
  var timeString = posDate.toLocaleString();
  ctx.fillText(timeString, curPosOnCanvas[0] + 10, 40 - 20);
  for(var i = 0; i < metricsArray.length; ++i)
  {
    ctx.fillStyle = determineColorForMetric(metricsArray[i][1]);
    ctx.globalAlpha = 0.4;
    ctx.fillRect(curPosOnCanvas[0] + 10, 40 + i * 20 - 15, maxTextWidth, 20);
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 1;
    ctx.fillText(metricsArray[i][2], curPosOnCanvas[0] + 10, 40 + i * 20);
  }
}
function uiInteractCheck(eventType, evtObj)
{
  for(var i = 0; i < uiInteractArr.length; ++i)
  {
    if(eventType == uiInteractArr[i][0])
    {
      var matchingSoFar = true;
      for(var j = 0; j < uiInteractArr[i][1].length; ++j)
      {
        var allowedKey = "!" != uiInteractArr[i][1][j].charAt(0);
        if(!allowedKey && keyDown.is(parseInt(uiInteractArr[i][1][j].substring(1))))
        {
          matchingSoFar = false;
        }
        if(allowedKey && !keyDown.is(parseInt(uiInteractArr[i][1][j])))
        {
          matchingSoFar = false;
        }
      }
      if(matchingSoFar)
      {
        window[uiInteractArr[i][2]](evtObj);
      }
    }
  }
}
function registerCallbacks()
{
  mouseDown.registerDragCallback(function(evtObj) {
    if(mainGraticule && mouseDown.startTarget && "CANVAS" === mouseDown.startTarget.tagName)
    {
      evtObj.preventDefault();
      uiInteractCheck("drag", evtObj);
    }
  });
  mouseDown.registerDropCallback(function(evtObj) {
    if(mainGraticule && mouseDown.startTarget && "CANVAS" === mouseDown.startTarget.tagName)
    {
      uiInteractCheck("drop", evtObj);
    }
  });
  mouseDown.registerMoveCallback(function(evtObj) {
    if(mainGraticule && "CANVAS" === evtObj.target.tagName)
    {
      uiInteractCheck("move", evtObj);
    }
  });
  document.getElementsByTagName("canvas")[0].addEventListener("mouseout", function(evtObj) {
    if(mainGraticule)
    {
      mainGraticule.draw(false);
    }
  });
  document.getElementsByTagName("canvas")[0].addEventListener("wheel", function(evtObj) {
    uiInteractCheck("wheel", evtObj);
  });
}
function calculateActualMousePos(evtObj)
{
  var curPos = [evtObj.x - evtObj.target.offsetLeft,
                evtObj.y - evtObj.target.offsetTop];
  var scrollOffset = calculateScrollOffset(evtObj.target);
  curPos[0] += scrollOffset[0];
  curPos[1] += scrollOffset[1];
  return curPos;
}