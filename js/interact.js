var uiOptions = {
  horizontalScrolling: false,
  smoothScrollingExtraData: true,
  minimumXPixels: 0.5,
  sortTooltip: false,
  errorArrowInterval: 2000
}

var uiInteractArr = [
  ['drag', ['17'], 'uiInteractPan'],
  ['drag', ['!16', '!17'], 'uiInteractZoomArea'],
  ['drop', ['!16', '!17'], 'uiInteractZoomIn'],
  ['move', [], 'uiInteractLegend'],
  ['wheel', [], 'uiInteractZoomWheel']
]

function uiInteractPan (metricQInstance, evtObj) {
  if (mouseDown.previousPos[0] !== mouseDown.currentPos[0]
    || mouseDown.previousPos[1] !== mouseDown.currentPos[1]) {
    var timeToMoveBy = (mouseDown.currentPos[0] - mouseDown.previousPos[0]) * -1 * metricQInstance.graticule.curTimePerPixel
    metricQInstance.handler.setTimeRange(metricQInstance.handler.startTime + timeToMoveBy,
      metricQInstance.handler.stopTime + timeToMoveBy)
    metricQInstance.throttledReload()
    metricQInstance.graticule.draw(false)
  }
}

function uiInteractZoomArea (metricQInstance, evtObj) {
  if (mouseDown.previousPos[0] !== mouseDown.currentPos[0]
    || mouseDown.previousPos[1] !== mouseDown.currentPos[1]) {
    metricQInstance.graticule.draw(false)
    var myCtx = metricQInstance.graticule.ctx
    myCtx.fillStyle = 'rgba(0,0,0,0.2)'
    var minXPos = mouseDown.currentPos[0]
    if (mouseDown.startPos[0] < minXPos) {
      minXPos = mouseDown.startPos[0]
    }
    var maxXPos = mouseDown.currentPos[0]
    if (mouseDown.startPos[0] > maxXPos) {
      maxXPos = mouseDown.startPos[0]
    }
    myCtx.fillRect(minXPos, metricQInstance.graticule.graticuleDimensions[1], maxXPos - minXPos, metricQInstance.graticule.graticuleDimensions[3])
    var timeValueStart = metricQInstance.graticule.getTimeValueAtPoint([minXPos, mouseDown.relativeStartPos[1]])
    var timeValueEnd = metricQInstance.graticule.getTimeValueAtPoint([maxXPos, mouseDown.relativeStartPos[1]])

    if (timeValueStart && timeValueEnd) {
      var timeDelta = timeValueEnd[0] - timeValueStart[0]
      var centerPos = [
        Math.floor(minXPos + (maxXPos - minXPos) / 2),
        Math.floor(metricQInstance.graticule.graticuleDimensions[1] + (metricQInstance.graticule.graticuleDimensions[3] - metricQInstance.graticule.graticuleDimensions[1]) / 2)
      ]
      var deltaString = ''
      if (86400000 < timeDelta) {
        deltaString = (new Number(timeDelta / 86400000)).toFixed(2) + ' days'
      } else if (3600000 < timeDelta) {
        deltaString = (new Number(timeDelta / 3600000)).toFixed(2) + ' hours'
      } else if (60000 < timeDelta) {
        deltaString = (new Number(timeDelta / 60000)).toFixed(1) + ' minutes'
      } else if (1000 < timeDelta) {
        deltaString = (new Number(timeDelta / 1000)).toFixed(1) + ' seconds'
      } else {
        deltaString = Math.floor(timeDelta) + ' milliseconds'
      }
      centerPos[0] -= Math.round(myCtx.measureText(deltaString).width / 2)
      myCtx.fillStyle = '#000000'
      myCtx.fillText(deltaString, centerPos[0], centerPos[1])
    }
  }
}

function uiInteractZoomIn (metricQInstance, evtObj) {
  evtObj.preventDefault()
  var relativeStart = mouseDown.relativeStartPos
  var relativeEnd = calculateActualMousePos(evtObj)
  if (1 < Math.abs(relativeStart[0] - relativeEnd[0])) {
    var posEnd = metricQInstance.graticule.getTimeValueAtPoint(relativeStart)
    var posStart = metricQInstance.graticule.getTimeValueAtPoint(relativeEnd)
    if (!posEnd || !posStart) {
      return
    }
    if (posEnd[0] < posStart[0]) {
      var swap = posEnd
      posEnd = posStart
      posStart = swap
    }
    if (!metricQInstance.handler.setTimeRange(Math.round(posStart[0]), Math.round(posEnd[0]))) {
      showUserHint('Zoom-Limit erreicht.')
    }
    metricQInstance.graticule.automaticallyDetermineRanges(false, true)
    metricQInstance.reload() // no need to throttle reload here
    metricQInstance.graticule.draw(false)
  }
}

function uiInteractZoomWheel (metricQInstance, evtObj) {
  if (!evtObj.target || !metricQInstance) {
    return
  }
  evtObj.preventDefault()
  if (evtObj.deltaX && uiOptions.horizontalScrolling) // horizontal scrolling
  {
    var deltaRange = metricQInstance.handler.stopTime - metricQInstance.handler.startTime//metricQInstance.graticule.curTimeRange[1] - metricQInstance.graticule.curTimeRange[0];
    //TODO: set start and stopTime of the handler
    if (0 > evtObj.deltaX) {
      if (!metricQInstance.handler.setTimeRange(metricQInstance.graticule.curTimeRange[0] - deltaRange * 0.2, metricQInstance.graticule.curTimeRange[1] - deltaRange * 0.2)) {
        showUserHint('Zoom-Limit erreicht.')
      }
    } else if (0 < evtObj.deltaX) {
      if (!metricQInstance.handler.setTimeRange(metricQInstance.graticule.curTimeRange[0] + deltaRange * 0.2, metricQInstance.graticule.curTimeRange[1] + deltaRange * 0.2)) {
        showUserHint('Zoom-Limit erreicht.')
      }
    }
    myMetricQInstance.throttledReload()
    metricQInstance.graticule.draw(false)
  } else // vertical scrolling
  {
    var scrollDirection = evtObj.deltaY
    if (0 > scrollDirection) {
      scrollDirection = -0.2
    }
    if (0 < scrollDirection) {
      scrollDirection = 0.2
    }
    scrollDirection *= metricQInstance.configuration.zoomSpeed / 10
    var curPos = calculateActualMousePos(evtObj)
    var curTimeValue = metricQInstance.graticule.getTimeValueAtPoint(curPos)
    if (curTimeValue) {
      if (!metricQInstance.handler.zoomTimeAtPoint(curTimeValue, scrollDirection)) {
        showUserHint('Konnte nicht weiter zoomen, Limit erreicht')
      }
      metricQInstance.graticule.automaticallyDetermineRanges(false, true)
      metricQInstance.throttledReload()
      metricQInstance.graticule.draw(false)
    }
  }
}

function uiInteractLegend (metricQInstance, evtObj) {
  var curPosOnCanvas = calculateActualMousePos(evtObj)
  var curPoint = metricQInstance.graticule.getTimeValueAtPoint(curPosOnCanvas)
  if (!curPoint) {
    return
  }
  metricQInstance.graticule.draw(false)
  var myCtx = metricQInstance.graticule.ctx
  myCtx.fillStyle = 'rgba(0,0,0,0.8)'
  myCtx.fillRect(curPosOnCanvas[0] - 1, metricQInstance.graticule.graticuleDimensions[1], 2, metricQInstance.graticule.graticuleDimensions[3])
  myCtx.font = '14px ' + metricQInstance.graticule.DEFAULT_FONT //actually it's sans-serif
  var metricsArray = new Array()
  var maxTextWidth = 0
  var allValuesAtTime = metricQInstance.graticule.data.getAllValuesAtTime(curPoint[0])
  for (var i = 0; i < allValuesAtTime.length; ++i) {
    var newEntry = [
      allValuesAtTime[i][1],
      allValuesAtTime[i][3],
      allValuesAtTime[i][2]
    ]
    var curTextLine = (new Number(newEntry[0])).toFixed(3) + ' ' + allValuesAtTime[i][3] + '/' + allValuesAtTime[i][4]
    newEntry.push(curTextLine)
    newEntry.push(myCtx.measureText(curTextLine).width)
    if (newEntry[4] > maxTextWidth) {
      maxTextWidth = newEntry[4]
    }
    metricsArray.push(newEntry)
  }
  if (uiOptions.sortTooltip) {
    metricsArray.sort(function (a, b) { return b[0] - a[0] })
  }
  var posDate = new Date(curPoint[0])
  var smallestDelta = undefined
  for (var i = 0; i < allValuesAtTime.length; ++i) {
    var curDelta = Math.abs(curPoint[0] - allValuesAtTime[i][0])
    if (undefined === smallestDelta
      || curDelta < smallestDelta) {
      smallestDelta = curDelta
      posDate = new Date(allValuesAtTime[i][0])
    }
  }
  var timeString = posDate.toLocaleString()
  myCtx.fillText(timeString, curPosOnCanvas[0] + 10, 40 - 20)
  for (var i = 0; i < metricsArray.length; ++i) {
    myCtx.fillStyle = metricsArray[i][2].styleOptions.color
    myCtx.globalAlpha = 0.4
    myCtx.fillRect(curPosOnCanvas[0] + 10, 40 + i * 20 - 15, maxTextWidth, 20)
    myCtx.fillStyle = '#000000'
    myCtx.globalAlpha = 1
    myCtx.fillText(metricsArray[i][3], curPosOnCanvas[0] + 10, 40 + i * 20)
  }
}

function uiInteractCheck (eventType, pertainingElement, evtObj) {
  for (var i = 0; i < uiInteractArr.length; ++i) {
    if (eventType == uiInteractArr[i][0]) {
      var matchingSoFar = true
      for (var j = 0; j < uiInteractArr[i][1].length; ++j) {
        if (0 < (uiInteractArr[i][1][j] + '').length) {
          var allowedKey = '!' != uiInteractArr[i][1][j].charAt(0)
          if (!allowedKey && keyDown.is(parseInt(uiInteractArr[i][1][j].substring(1)))) {
            matchingSoFar = false
          }
          if (allowedKey && !keyDown.is(parseInt(uiInteractArr[i][1][j]))) {
            matchingSoFar = false
          }
        }
      }
      if (matchingSoFar) {
        window[uiInteractArr[i][2]](window.MetricQWebView.getInstance(pertainingElement), evtObj)
      }
    }
  }
}

function registerCallbacks (anchoringObject) {
  mouseDown.registerDragCallback(function (myElement) {
    return function (evtObj) {
      if (myElement && mouseDown.startTarget && mouseDown.startTarget.isSameNode(myElement)) {
        evtObj.preventDefault()
        uiInteractCheck('drag', myElement, evtObj)
      }
    }
  }(anchoringObject))
  mouseDown.registerDropCallback(function (myElement) {
    return function (evtObj) {
      if (myElement && mouseDown.startTarget && mouseDown.startTarget.isSameNode(myElement)) {
        uiInteractCheck('drop', myElement, evtObj)
      }
    }
  }(anchoringObject))
  mouseDown.registerMoveCallback(function (myElement) {
    return function (evtObj) {
      if (myElement && myElement.isSameNode(evtObj.target)) {
        uiInteractCheck('move', myElement, evtObj)
      }
    }
  }(anchoringObject))
  anchoringObject.addEventListener('mouseout', function (myElement) {
    return function (evtObj) {
      if (myElement) {
        window.MetricQWebView.getInstance(myElement).graticule.draw(false)
      }
    }
  }(anchoringObject))
  anchoringObject.addEventListener('wheel', function (myElement) {
    return function (evtObj) {
      uiInteractCheck('wheel', myElement, evtObj)
    }
  }(anchoringObject))
}

function calculateActualMousePos (evtObj) {
  var curPos = [evtObj.x - evtObj.target.offsetLeft,
    evtObj.y - evtObj.target.offsetTop]
  var scrollOffset = calculateScrollOffset(evtObj.target)
  curPos[0] += scrollOffset[0]
  curPos[1] += scrollOffset[1]
  return curPos
}

var mouseDown = {
  startPos: undefined,
  relativeStartPos: undefined,
  currentPos: undefined,
  previousPos: undefined,
  endPos: undefined,
  duration: 0,
  isDown: false,
  startTime: 0,
  endTime: 0,
  startTarget: undefined,
  endTarget: undefined,
  dragCallbacks: new Array(),
  dropCallbacks: new Array(),
  moveCallbacks: new Array(),
  calcRelativePos: function (evtObj) {
    var curPos = [
      evtObj.x,
      evtObj.y
    ]
    if (mouseDown.startTarget) {
      curPos[0] -= mouseDown.startTarget.offsetLeft
      curPos[1] -= mouseDown.startTarget.offsetTop

      var scrollOffset = calculateScrollOffset(mouseDown.startTarget)
      curPos[0] += scrollOffset[0]
      curPos[1] += scrollOffset[1]
    }
    return curPos
  },
  startClick: function (evtObj) {
    mouseDown.startTarget = evtObj.target
    mouseDown.endTarget = undefined
    mouseDown.endTime = 0
    mouseDown.duration = 0
    mouseDown.startTime = evtObj.timestamp
    var curPos = mouseDown.calcRelativePos(evtObj)
    mouseDown.startPos = [curPos[0], curPos[1]]
    mouseDown.currentPos = [curPos[0], curPos[1]]
    mouseDown.previousPos = [curPos[0], curPos[1]]
    mouseDown.relativeStartPos = calculateActualMousePos(evtObj)
    mouseDown.isDown = true
  },
  moving: function (evtObj) {
    if (true === mouseDown.isDown) {
      mouseDown.previousPos = mouseDown.currentPos
      mouseDown.currentPos = mouseDown.calcRelativePos(evtObj)
      for (var i = 0; i < mouseDown.dragCallbacks.length; ++i) {
        mouseDown.dragCallbacks[i](evtObj)
      }
    } else {
      for (var i = 0; i < mouseDown.moveCallbacks.length; ++i) {
        mouseDown.moveCallbacks[i](evtObj)
      }
    }
  },
  endClick: function (evtObj) {
    mouseDown.endPos = mouseDown.calcRelativePos(evtObj)
    mouseDown.endTime = evtObj.timestamp
    mouseDown.duration = mouseDown.endTime - mouseDown.startTime
    mouseDown.endTarget = evtObj.target
    mouseDown.isDown = false
    for (var i = 0; i < mouseDown.dropCallbacks.length; ++i) {
      mouseDown.dropCallbacks[i](evtObj)
    }
  },
  registerDragCallback: function (callbackFunc) {
    mouseDown.dragCallbacks.push(callbackFunc)
  },
  registerDropCallback: function (callbackFunc) {
    mouseDown.dropCallbacks.push(callbackFunc)
  },
  registerMoveCallback: function (callbackFunc) {
    mouseDown.moveCallbacks.push(callbackFunc)
  }
}
var keyDown = {
  keys: new Array(),
  keyDown: function (evtObj) {
    keyDown.keys.push(evtObj.keyCode)
  },
  keyUp: function (evtObj) {
    for (var i = 0; i < keyDown.keys.length; ++i) {
      if (evtObj.keyCode == keyDown.keys[i]) {
        keyDown.keys.splice(i, 1)
        --i
      }
    }
  },
  is: function (keyCode) {
    for (var i = 0; i < keyDown.keys.length; ++i) {
      if (keyDown.keys[i] == keyCode) {
        return true
      }
    }
    return false
  }
}

var userHintWindow = undefined

function showUserHint (messageText, showDuration) {
  if (undefined === showDuration) {
    showDuration = 2000 + messageText.length * 50
  }
  if (userHintWindow && userHintWindow.parentNode) {
    userHintWindow.parentNode.removeChild(userHintWindow)
    userHintWindow = undefined
  }
  var windowWidth = 10 + Math.min(messageText.length, 80) * 7
  if (windowWidth > window.innerWidth) {
    windowWidth = window.innerWidth
  }
  var windowHeight = Math.ceil(messageText.length / 80) * 27

  var windowEle = document.createElement('div')
  windowEle.style.position = 'fixed'
  windowEle.style.left = Math.floor(window.innerWidth / 2 - windowWidth / 2)
  windowEle.style.top = Math.floor(window.innerHeight / 2 - windowHeight / 2)
  windowEle.style.fontSize = '10pt'
  windowEle.style.border = '1px solid #000000'
  windowEle.style.borderRadius = '18px'
  windowEle.style.padding = '3px 6px 3px 6px'
  windowEle.style.width = windowWidth
  windowEle.style.height = windowHeight
  windowEle.style.backgroundColor = '#fdfddb'
  windowEle.appendChild(document.createTextNode(messageText))
  userHintWindow = windowEle = document.getElementsByTagName('body')[0].appendChild(windowEle)
  setTimeout(function (hintEle) {
    return function () {
      if (hintEle) {
        hintEle.animate([{ opacity: 1 }, { opacity: 0.01 }],
          {
            duration: 1200,
            iterations: 1
          })
      }
    }
  }(windowEle), showDuration - 1200)
  setTimeout(function (hintEle) { return function () { if (hintEle && hintEle.parentNode) { hintEle.parentNode.removeChild(hintEle) } } }(windowEle), showDuration)
}

/* figure out scroll offset */
function calculateScrollOffset (curLevelElement) {
  var scrollOffset = [0, 0]
  if (curLevelElement.parentNode && 'HTML' !== curLevelElement.tagName) {
    var scrollOffset = calculateScrollOffset(curLevelElement.parentNode)
  }
  scrollOffset[0] += curLevelElement.scrollLeft
  scrollOffset[1] += curLevelElement.scrollTop
  return scrollOffset
}

document.addEventListener('mousedown', mouseDown.startClick)
document.addEventListener('mousemove', mouseDown.moving)
document.addEventListener('mouseup', mouseDown.endClick)
document.addEventListener('keydown', keyDown.keyDown)
document.addEventListener('keyup', keyDown.keyUp)

// code for Mac Safari
window.addEventListener('gesturechange', function (evt) {
// console.log(evt);
  evt.preventDefault()
  var timeRange = window.MetricQWebView.instances[0].graticule.curTimeRange
  var delta = timeRange[1] - timeRange[0]
  timeMargin = Math.round((delta * evt.scale - delta) / 2)
  timeRange[0] -= timeMargin
  timeRange[1] += timeMargin
  window.MetricQWebView.instances[0].handler.setTimeRange(timeRange[0], timeRange[1])
  window.MetricQWebView.instances[0].throttledReload()
  window.MetricQWebView.instances[0].graticule.draw(false)
})
window.addEventListener('contextmenu', (event) => {
  if (event.target && 'CANVAS' == event.target.tagName) {
    event.preventDefault()
  }
})