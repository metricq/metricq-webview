const uiOptions = {
  horizontalScrolling: false,
  smoothScrollingExtraData: true,
  minimumXPixels: 0.5,
  sortTooltip: false,
  errorArrowInterval: 2000
}

const uiInteractArr = [
  ['drag', ['17'], 'uiInteractPan'],
  ['drag', ['!16', '!17'], 'uiInteractZoomArea'],
  ['drop', ['!16', '!17'], 'uiInteractZoomIn'],
  ['move', [], 'uiInteractLegend'],
  ['wheel', [], 'uiInteractZoomWheel']
]

function uiInteractPan (metricQInstance, evtObj) {
  if (mouseDown.previousPos[0] !== mouseDown.currentPos[0] ||
    mouseDown.previousPos[1] !== mouseDown.currentPos[1]) {
    const timeToMoveBy = (mouseDown.currentPos[0] - mouseDown.previousPos[0]) * -1 * metricQInstance.graticule.curTimePerPixel
    metricQInstance.handler.setTimeRange(metricQInstance.handler.startTime + timeToMoveBy,
      metricQInstance.handler.stopTime + timeToMoveBy)
    metricQInstance.throttledReload()
    metricQInstance.graticule.draw(false)
  }
}

function uiInteractZoomArea (metricQInstance, evtObj) {
  if (mouseDown.previousPos[0] !== mouseDown.currentPos[0] ||
    mouseDown.previousPos[1] !== mouseDown.currentPos[1]) {
    metricQInstance.graticule.draw(false)
    const myCtx = metricQInstance.graticule.ctx
    myCtx.fillStyle = 'rgba(0,0,0,0.2)'
    let minXPos = mouseDown.currentPos[0]
    if (mouseDown.startPos[0] < minXPos) {
      minXPos = mouseDown.startPos[0]
    }
    let maxXPos = mouseDown.currentPos[0]
    if (mouseDown.startPos[0] > maxXPos) {
      maxXPos = mouseDown.startPos[0]
    }
    myCtx.fillRect(minXPos, metricQInstance.graticule.graticuleDimensions[1], maxXPos - minXPos, metricQInstance.graticule.graticuleDimensions[3])
    const timeValueStart = metricQInstance.graticule.getTimeValueAtPoint([minXPos, mouseDown.relativeStartPos[1]])
    const timeValueEnd = metricQInstance.graticule.getTimeValueAtPoint([maxXPos, mouseDown.relativeStartPos[1]])

    if (timeValueStart && timeValueEnd) {
      const timeDelta = timeValueEnd[0] - timeValueStart[0]
      const centerPos = [
        Math.floor(minXPos + (maxXPos - minXPos) / 2),
        Math.floor(metricQInstance.graticule.graticuleDimensions[1] + (metricQInstance.graticule.graticuleDimensions[3] - metricQInstance.graticule.graticuleDimensions[1]) / 2)
      ]
      let deltaString = ''
      if (timeDelta > 86400000) {
        deltaString = (timeDelta / 86400000).toFixed(2) + ' days'
      } else if (timeDelta > 3600000) {
        deltaString = (timeDelta / 3600000).toFixed(2) + ' hours'
      } else if (timeDelta > 60000) {
        deltaString = (timeDelta / 60000).toFixed(1) + ' minutes'
      } else if (timeDelta > 1000) {
        deltaString = (timeDelta / 1000).toFixed(1) + ' seconds'
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
  const relativeStart = mouseDown.relativeStartPos
  const relativeEnd = calculateActualMousePos(evtObj)
  if (Math.abs(relativeStart[0] - relativeEnd[0]) > 1) {
    let posEnd = metricQInstance.graticule.getTimeValueAtPoint(relativeStart)
    let posStart = metricQInstance.graticule.getTimeValueAtPoint(relativeEnd)
    if (!posEnd || !posStart) {
      return
    }
    if (posEnd[0] < posStart[0]) {
      const swap = posEnd
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
  if (evtObj.deltaX && uiOptions.horizontalScrolling) { // horizontal scrolling
    const deltaRange = metricQInstance.handler.stopTime - metricQInstance.handler.startTime// metricQInstance.graticule.curTimeRange[1] - metricQInstance.graticule.curTimeRange[0];
    // TODO: set start and stopTime of the handler
    if (evtObj.deltaX < 0) {
      if (!metricQInstance.handler.setTimeRange(metricQInstance.graticule.curTimeRange[0] - deltaRange * 0.2, metricQInstance.graticule.curTimeRange[1] - deltaRange * 0.2)) {
        showUserHint('Zoom-Limit erreicht.')
      }
    } else if (evtObj.deltaX > 0) {
      if (!metricQInstance.handler.setTimeRange(metricQInstance.graticule.curTimeRange[0] + deltaRange * 0.2, metricQInstance.graticule.curTimeRange[1] + deltaRange * 0.2)) {
        showUserHint('Zoom-Limit erreicht.')
      }
    }
    metricQInstance.throttledReload()
    metricQInstance.graticule.draw(false)
  } else { // vertical scrolling
    let scrollDirection = evtObj.deltaY
    if (scrollDirection < 0) {
      scrollDirection = -0.2
    }
    if (scrollDirection > 0) {
      scrollDirection = 0.2
    }
    scrollDirection *= metricQInstance.configuration.zoomSpeed / 10
    const curPos = calculateActualMousePos(evtObj)
    const curTimeValue = metricQInstance.graticule.getTimeValueAtPoint(curPos)
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
  const curPosOnCanvas = calculateActualMousePos(evtObj)
  const curPoint = metricQInstance.graticule.getTimeValueAtPoint(curPosOnCanvas)
  if (!curPoint) {
    return
  }
  metricQInstance.graticule.draw(false)
  const myCtx = metricQInstance.graticule.ctx
  myCtx.fillStyle = 'rgba(0,0,0,0.8)'
  myCtx.fillRect(curPosOnCanvas[0] - 1, metricQInstance.graticule.graticuleDimensions[1], 2, metricQInstance.graticule.graticuleDimensions[3])
  myCtx.font = '14px ' + metricQInstance.graticule.DEFAULT_FONT // actually it's sans-serif
  const metricsArray = []
  let maxTextWidth = 0
  const allValuesAtTime = metricQInstance.graticule.data.getAllValuesAtTime(curPoint[0])
  for (let i = 0; i < allValuesAtTime.length; ++i) {
    const newEntry = [
      allValuesAtTime[i][1],
      allValuesAtTime[i][3],
      allValuesAtTime[i][2]
    ]
    const curTextLine = (Number(newEntry[0])).toFixed(3) + ' ' + allValuesAtTime[i][3] + '/' + allValuesAtTime[i][4]
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
  let posDate = new Date(curPoint[0])
  let smallestDelta
  for (let i = 0; i < allValuesAtTime.length; ++i) {
    const curDelta = Math.abs(curPoint[0] - allValuesAtTime[i][0])
    if (undefined === smallestDelta ||
      curDelta < smallestDelta) {
      smallestDelta = curDelta
      posDate = new Date(allValuesAtTime[i][0])
    }
  }
  const timeString = posDate.toLocaleString()
  myCtx.fillText(timeString, curPosOnCanvas[0] + 10, 40 - 20)
  for (let i = 0; i < metricsArray.length; ++i) {
    myCtx.fillStyle = metricsArray[i][2].styleOptions.color
    myCtx.globalAlpha = 0.4
    myCtx.fillRect(curPosOnCanvas[0] + 10, 40 + i * 20 - 15, maxTextWidth, 20)
    myCtx.fillStyle = '#000000'
    myCtx.globalAlpha = 1
    myCtx.fillText(metricsArray[i][3], curPosOnCanvas[0] + 10, 40 + i * 20)
  }
}

function uiInteractCheck (eventType, pertainingElement, evtObj) {
  for (let i = 0; i < uiInteractArr.length; ++i) {
    if (eventType === uiInteractArr[i][0]) {
      let matchingSoFar = true
      for (let j = 0; j < uiInteractArr[i][1].length; ++j) {
        if ((uiInteractArr[i][1][j] + '').length > 0) {
          const allowedKey = uiInteractArr[i][1][j].charAt(0) !== '!'
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
  anchoringObject.addEventListener('mouseout', (function (myElement) {
    return function (evtObj) {
      if (myElement) {
        window.MetricQWebView.getInstance(myElement).graticule.draw(false)
      }
    }
  }(anchoringObject)))
  anchoringObject.addEventListener('wheel', (function (myElement) {
    return function (evtObj) {
      uiInteractCheck('wheel', myElement, evtObj)
    }
  }(anchoringObject)))
}

function calculateActualMousePos (evtObj) {
  const curPos = [evtObj.x - evtObj.target.offsetLeft,
    evtObj.y - evtObj.target.offsetTop]
  const scrollOffset = calculateScrollOffset(evtObj.target)
  curPos[0] += scrollOffset[0]
  curPos[1] += scrollOffset[1]
  return curPos
}

const mouseDown = {
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
  dragCallbacks: [],
  dropCallbacks: [],
  moveCallbacks: [],
  calcRelativePos: function (evtObj) {
    const curPos = [
      evtObj.x,
      evtObj.y
    ]
    if (mouseDown.startTarget) {
      curPos[0] -= mouseDown.startTarget.offsetLeft
      curPos[1] -= mouseDown.startTarget.offsetTop

      const scrollOffset = calculateScrollOffset(mouseDown.startTarget)
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
    const curPos = mouseDown.calcRelativePos(evtObj)
    mouseDown.startPos = [curPos[0], curPos[1]]
    mouseDown.currentPos = [curPos[0], curPos[1]]
    mouseDown.previousPos = [curPos[0], curPos[1]]
    mouseDown.relativeStartPos = calculateActualMousePos(evtObj)
    mouseDown.isDown = true
  },
  moving: function (evtObj) {
    if (mouseDown.isDown === true) {
      mouseDown.previousPos = mouseDown.currentPos
      mouseDown.currentPos = mouseDown.calcRelativePos(evtObj)
      for (let i = 0; i < mouseDown.dragCallbacks.length; ++i) {
        mouseDown.dragCallbacks[i](evtObj)
      }
    } else {
      for (let i = 0; i < mouseDown.moveCallbacks.length; ++i) {
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
    for (let i = 0; i < mouseDown.dropCallbacks.length; ++i) {
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
const keyDown = {
  keys: [],
  keyDown: function (evtObj) {
    keyDown.keys.push(evtObj.keyCode)
  },
  keyUp: function (evtObj) {
    for (let i = 0; i < keyDown.keys.length; ++i) {
      if (evtObj.keyCode === keyDown.keys[i]) {
        keyDown.keys.splice(i, 1)
        --i
      }
    }
  },
  is: function (keyCode) {
    for (let i = 0; i < keyDown.keys.length; ++i) {
      if (keyDown.keys[i] === keyCode) {
        return true
      }
    }
    return false
  }
}

let userHintWindow

function showUserHint (messageText, showDuration) {
  if (undefined === showDuration) {
    showDuration = 2000 + messageText.length * 50
  }
  if (userHintWindow && userHintWindow.parentNode) {
    userHintWindow.parentNode.removeChild(userHintWindow)
    userHintWindow = undefined
  }
  let windowWidth = 10 + Math.min(messageText.length, 80) * 7
  if (windowWidth > window.innerWidth) {
    windowWidth = window.innerWidth
  }
  const windowHeight = Math.ceil(messageText.length / 80) * 27

  let windowEle = document.createElement('div')
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
  setTimeout((function (hintEle) {
    return function () {
      if (hintEle) {
        hintEle.animate([{ opacity: 1 }, { opacity: 0.01 }],
          {
            duration: 1200,
            iterations: 1
          })
      }
    }
  }(windowEle)), showDuration - 1200)
  setTimeout((function (hintEle) { return function () { if (hintEle && hintEle.parentNode) { hintEle.parentNode.removeChild(hintEle) } } }(windowEle)), showDuration)
}

/* figure out scroll offset */
function calculateScrollOffset (curLevelElement) {
  let scrollOffset = [0, 0]
  if (curLevelElement.parentNode && curLevelElement.tagName !== 'HTML') {
    scrollOffset = calculateScrollOffset(curLevelElement.parentNode)
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
  const timeRange = window.MetricQWebView.instances[0].graticule.curTimeRange
  const delta = timeRange[1] - timeRange[0]
  const timeMargin = Math.round((delta * evt.scale - delta) / 2)
  timeRange[0] -= timeMargin
  timeRange[1] += timeMargin
  window.MetricQWebView.instances[0].handler.setTimeRange(timeRange[0], timeRange[1])
  window.MetricQWebView.instances[0].throttledReload()
  window.MetricQWebView.instances[0].graticule.draw(false)
})
window.addEventListener('contextmenu', (event) => {
  if (event.target && event.target.tagName === 'CANVAS') {
    event.preventDefault()
  }
})
