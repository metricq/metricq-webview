import store from './store/'
import Vue from 'vue'

const uiOptions = {
  horizontalScrolling: false,
  smoothScrollingExtraData: true,
  minimumXPixels: 0.5,
  sortTooltip: true,
  errorArrowInterval: 2000
}

const uiInteractArr = [
  ['drag', ['17'], 'uiInteractPan'],
  ['drag', ['!16', '!17'], 'uiInteractZoomArea'],
  ['drop', ['!16', '!17'], 'uiInteractZoomIn'],
  ['move', [], 'uiInteractLegend'],
  ['wheel', [], 'uiInteractZoomWheel']
]

function uiInteractPan (evtObj) {
  if (mouseDown.previousPos[0] !== mouseDown.currentPos[0] ||
    mouseDown.previousPos[1] !== mouseDown.currentPos[1]) {
    const timeToMoveBy = (mouseDown.currentPos[0] - mouseDown.previousPos[0]) * -1 * window.MetricQWebView.graticule.curTimePerPixel
    // TODO: handler.shifttimerange
    window.MetricQWebView.handler.setTimeRange(window.MetricQWebView.handler.startTime.getUnix() + timeToMoveBy,
      window.MetricQWebView.handler.stopTime.getUnix() + timeToMoveBy)
    window.MetricQWebView.throttledReload()
    window.MetricQWebView.graticule.draw(false)
  }
}

function uiInteractZoomArea (evtObj) {
  if (mouseDown.previousPos[0] !== mouseDown.currentPos[0] ||
    mouseDown.previousPos[1] !== mouseDown.currentPos[1]) {
    window.MetricQWebView.graticule.draw(false)
    const myCtx = window.MetricQWebView.graticule.ctx
    myCtx.fillStyle = 'rgba(0,0,0,0.2)'
    let minXPos = mouseDown.currentPos[0]
    if (mouseDown.startPos[0] < minXPos) {
      minXPos = mouseDown.startPos[0]
    }
    let maxXPos = mouseDown.currentPos[0]
    if (mouseDown.startPos[0] > maxXPos) {
      maxXPos = mouseDown.startPos[0]
    }
    myCtx.fillRect(minXPos, window.MetricQWebView.graticule.dimensions.y, maxXPos - minXPos, window.MetricQWebView.graticule.dimensions.height)
    const timeValueStart = window.MetricQWebView.graticule.getTimeValueAtPoint([minXPos, mouseDown.relativeStartPos[1]])
    const timeValueEnd = window.MetricQWebView.graticule.getTimeValueAtPoint([maxXPos, mouseDown.relativeStartPos[1]])

    if (timeValueStart && timeValueEnd) {
      const timeDelta = timeValueEnd[0] - timeValueStart[0]
      const centerPos = [
        Math.floor(minXPos + (maxXPos - minXPos) / 2),
        Math.floor(window.MetricQWebView.graticule.dimensions.y + (window.MetricQWebView.graticule.dimensions.height - window.MetricQWebView.graticule.dimensions.y) / 2)
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

function uiInteractZoomIn (evtObj) {
  evtObj.preventDefault()
  const relativeStart = mouseDown.relativeStartPos
  const relativeEnd = calculateActualMousePos(evtObj, window.MetricQWebView.graticule.ele)

  relativeEnd[0] = Math.max(window.MetricQWebView.graticule.dimensions.x,
    Math.min(Math.abs(relativeEnd[0]), window.MetricQWebView.graticule.dimensions.width))

  if (Math.abs(relativeStart[0] - relativeEnd[0]) > 1) {
    let posEnd = window.MetricQWebView.graticule.getTimeValueAtPoint(relativeStart)
    let posStart = window.MetricQWebView.graticule.getTimeValueAtPoint(relativeEnd)
    if (!posEnd || !posStart) {
      return
    }
    if (posEnd[0] < posStart[0]) {
      const swap = posEnd
      posEnd = posStart
      posStart = swap
    }
    if (!window.MetricQWebView.handler.setTimeRange(Math.round(posStart[0]), Math.round(posEnd[0]))) {
      Vue.toasted.error('Zoom-Limit erreicht.', store.state.toastConfiguration)
    }
    window.MetricQWebView.reload() // no need to throttle reload here
    window.MetricQWebView.graticule.draw(false)
  }
}

function uiInteractZoomWheel (evtObj) {
  if (!evtObj.target || !window.MetricQWebView) {
    return
  }
  evtObj.preventDefault()
  if (evtObj.deltaX && uiOptions.horizontalScrolling) { // horizontal scrolling
    const deltaRange = window.MetricQWebView.handler.stopTime.getUnix() - window.MetricQWebView.handler.startTime.getUnix()// window.MetricQWebView.graticule.curTimeRange[1] - window.MetricQWebView.graticule.curTimeRange[0];
    // TODO: set start and stopTime of the handler
    if (evtObj.deltaX < 0) {
      if (!window.MetricQWebView.handler.setTimeRange(window.MetricQWebView.graticule.curTimeRange[0] - deltaRange * 0.2, window.MetricQWebView.graticule.curTimeRange[1] - deltaRange * 0.2)) {
        Vue.toasted.error('Zoom-Limit erreicht.', store.state.toastConfiguration)
      }
    } else if (evtObj.deltaX > 0) {
      if (!window.MetricQWebView.handler.setTimeRange(window.MetricQWebView.graticule.curTimeRange[0] + deltaRange * 0.2, window.MetricQWebView.graticule.curTimeRange[1] + deltaRange * 0.2)) {
        Vue.toasted.error('Zoom-Limit erreicht.', store.state.toastConfiguration)
      }
    }
    window.MetricQWebView.throttledReload()
    window.MetricQWebView.graticule.draw(false)
  } else { // vertical scrolling
    let scrollDirection = evtObj.deltaY
    if (scrollDirection < 0) {
      scrollDirection = -0.2
    }
    if (scrollDirection > 0) {
      scrollDirection = 0.2
    }
    scrollDirection *= store.state.configuration.zoomSpeed / 10
    const curPos = calculateActualMousePos(evtObj, window.MetricQWebView.graticule.ele)
    const curTimeValue = window.MetricQWebView.graticule.getTimeValueAtPoint(curPos)
    if (curTimeValue) {
      if (!window.MetricQWebView.handler.zoomTimeAtPoint(curTimeValue, scrollDirection)) {
        Vue.toasted.error('Konnte nicht weiter zoomen, Limit erreicht', store.state.toastConfiguration)
      }
      window.MetricQWebView.throttledReload()
      window.MetricQWebView.graticule.draw(false)
    }
  }
}

function uiInteractLegend (evtObj) {
  const curPosOnCanvas = calculateActualMousePos(evtObj, window.MetricQWebView.graticule.ele)
  const curPoint = window.MetricQWebView.graticule.getTimeValueAtPoint(curPosOnCanvas)

  if (!curPoint) {
    return
  }

  const timeAt = curPoint[0]
  const valueAt = curPoint[1]

  window.MetricQWebView.graticule.draw(false)

  const myCtx = window.MetricQWebView.graticule.ctx
  myCtx.fillStyle = 'rgba(0,0,0,0.8)'
  myCtx.fillRect(curPosOnCanvas[0] - 1, window.MetricQWebView.graticule.dimensions.y, 2, window.MetricQWebView.graticule.dimensions.height)
  // myCtx.fillRect(window.MetricQWebView.graticule.dimensions.x, curPosOnCanvas[1] - 1, window.MetricQWebView.graticule.dimensions.width, 2)
  myCtx.font = '14px ' + window.MetricQWebView.graticule.DEFAULT_FONT // actually it's sans-serif

  const legendEntries = []
  let maxLabelWidth = 0
  let maxTextWidth = 0

  let closestMetric
  let closestMetricValue

  const range = window.MetricQWebView.graticule.curValueRange
  const maxDistance = 0.05 * (range[1] - range[0])

  for (const metric of Object.values(window.MetricQWebView.graticule.data.metrics)) {
    const metricDrawState = store.getters['metrics/getMetricDrawState'](metric.name)

    if (!metricDrawState.draw) continue

    let curText
    if (metric.series.raw !== undefined) {
      const value = metric.series.raw.getValueAtTimeAndIndex(timeAt)
      if (value === undefined) continue

      if (
        Math.abs(valueAt - value[1]) < maxDistance &&
        (
          closestMetric === undefined ||
          Math.abs(value[1] - valueAt) < Math.abs(closestMetricValue - valueAt)
        )
      ) {
        closestMetric = metric.name
        closestMetricValue = value[1]
      }
      curText = (Number(value[1])).toFixed(3)
    } else if (metric.series.min !== undefined &&
               metric.series.max !== undefined &&
               metric.series.avg !== undefined) {
      const min = metric.series.min.getValueAtTimeAndIndex(timeAt)
      const max = metric.series.max.getValueAtTimeAndIndex(timeAt)
      const avg = metric.series.avg.getValueAtTimeAndIndex(timeAt)
      if (min === undefined || max === undefined || avg === undefined) continue

      if (
        (valueAt < max[1] && valueAt > min[1] && metricDrawState.drawMin && metricDrawState.drawMax) ||
        maxDistance > Math.abs(valueAt - avg[1])
      ) {
        if (
          closestMetric === undefined ||
            Math.abs(avg[1] - valueAt) < Math.abs(closestMetricValue - valueAt)
        ) {
          closestMetric = metric.name
          closestMetricValue = avg[1]
        }
      }

      curText = ''
      if (metricDrawState.drawMin) {
        curText += '▼ ' + (Number(min[1])).toFixed(3) + ' | '
      }
      if (metricDrawState.drawAvg) {
        curText += ' ⌀ ' + (Number(avg[1])).toFixed(3)
      }
      if (metricDrawState.drawMax) {
        curText += ' | ▲ ' + (Number(max[1])).toFixed(3)
      }
    } else {
      continue
    }

    let label = metric.name
    const unit = store.getters['metrics/getUnit'](metric.name)
    if (unit !== undefined && unit !== '1') {
      label += ` [${unit}]`
    }
    const labelWidth = myCtx.measureText(label).width
    if (labelWidth > maxLabelWidth) {
      maxLabelWidth = labelWidth
    }

    const textWidth = myCtx.measureText(curText).width
    if (textWidth > maxTextWidth) {
      maxTextWidth = textWidth
    }

    const newEntry = {
      metric,
      curText,
      label
    }

    legendEntries.push(newEntry)
  }

  store.dispatch('metrics/updatePeakedMetric', { metric: closestMetric })

  let timeString = new Date(curPoint[0]).toLocaleString()

  if (window.MetricQWebView.graticule.curTimeRange !== undefined) {
    const deltaTime = window.MetricQWebView.graticule.curTimeRange[1] - window.MetricQWebView.graticule.curTimeRange[0]
    if (deltaTime < 2500) {
      timeString += '.' + ('00' + curPoint[0] % 1000).slice(-3)
    } else if (deltaTime < 10000) {
      timeString += '.' + ('0' + Math.trunc(curPoint[0] % 1000 / 10)).slice(-2)
    } else if (deltaTime < 30000) {
      timeString += '.' + Math.trunc(curPoint[0] % 1000 / 100)
    }
  }

  // offsetMid: offset from center line
  // offsetTop: offset from top of canvas
  // verticalDiff: y coordinate difference between lines
  // borderPadding: additional filled space around the left and right margins
  const offsetMid = 10
  let offsetTop = 30
  const verticalDiff = 20
  const borderPadding = 10

  const dimensions = window.MetricQWebView.graticule.dimensions

  const distanceToRightEdge = dimensions.width - curPosOnCanvas[0] - offsetMid - borderPadding
  const distanceToTopEdge = curPosOnCanvas[1] - offsetTop - borderPadding

  const legendHeight = offsetTop + legendEntries.length * verticalDiff

  if (distanceToTopEdge < dimensions.height / 2) {
    offsetTop = dimensions.height - offsetTop - legendHeight
  }

  drawHoverDate(myCtx, timeString, curPosOnCanvas[0], maxLabelWidth, offsetTop, offsetMid, verticalDiff, distanceToRightEdge)
  drawHoverText(myCtx, legendEntries, curPosOnCanvas[0], maxTextWidth, maxLabelWidth, offsetTop, offsetMid, verticalDiff, borderPadding, distanceToRightEdge, closestMetric)
}

function drawHoverDate (myCtx, timeString, curXPosOnCanvas, maxNameWidth, offsetTop, offsetMid, verticalDiff, distanceToRightEdge) {
  myCtx.textBaseline = 'middle'
  if (myCtx.measureText(timeString).width > distanceToRightEdge || maxNameWidth > distanceToRightEdge) {
    myCtx.textAlign = 'right'
    offsetMid *= -1
  } else {
    myCtx.textAlign = 'left'
  }
  myCtx.fillText(timeString, curXPosOnCanvas + offsetMid, offsetTop - 0.5 * verticalDiff)
}

function drawHoverText (myCtx, metricsArray, curXPosOnCanvas, maxValueWidth, maxLabelWidth, offsetTop, offsetMid, verticalDiff, borderPadding, distanceToRightEdge, peakedMetric) {
  myCtx.textBaseline = 'middle'
  myCtx.textAlign = 'left'
  let offsetRight = 0

  if (maxLabelWidth > distanceToRightEdge) {
    offsetRight = maxValueWidth + maxLabelWidth + 4 * offsetMid
  } else if (curXPosOnCanvas > maxValueWidth + offsetMid + borderPadding) {
    offsetRight = (offsetMid * 2 + maxValueWidth)
  }

  for (let i = 0; i < metricsArray.length; ++i) {
    const y = offsetTop + i * verticalDiff
    myCtx.fillStyle = metricsArray[i].metric.color
    if (metricsArray[i].metric.name === peakedMetric) {
      myCtx.globalAlpha = 0.8
    } else {
      myCtx.globalAlpha = 0.4
    }
    myCtx.fillRect(curXPosOnCanvas + offsetMid - offsetRight - borderPadding, y, maxValueWidth + maxLabelWidth + (offsetMid + borderPadding) * 2, 20)
    myCtx.fillStyle = '#000000'
    if (metricsArray[i].metric.name === peakedMetric) {
      myCtx.lineWidth = 2
      myCtx.color = '#000000'
      myCtx.strokeRect(curXPosOnCanvas + offsetMid - offsetRight - borderPadding, y, maxValueWidth + maxLabelWidth + (offsetMid + borderPadding) * 2, 20)
    }
    myCtx.globalAlpha = 1
    myCtx.fillText(metricsArray[i].curText, curXPosOnCanvas + offsetMid - offsetRight, y + 0.5 * verticalDiff)
    myCtx.fillText(metricsArray[i].label, curXPosOnCanvas + (offsetMid * 3 + maxValueWidth) - offsetRight, y + 0.5 * verticalDiff)
  }
}

const uiFunctions = {
  uiInteractPan: uiInteractPan,
  uiInteractLegend: uiInteractLegend,
  uiInteractZoomArea: uiInteractZoomArea,
  uiInteractZoomIn: uiInteractZoomIn,
  uiInteractZoomWheel: uiInteractZoomWheel
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
        uiFunctions[uiInteractArr[i][2]](evtObj)
      }
    }
  }
}

export function registerCallbacks (anchoringObject) {
  mouseDown.registerDragCallback((evtObj) => {
    if (anchoringObject && mouseDown.startTarget && mouseDown.startTarget.isSameNode(anchoringObject)) {
      evtObj.preventDefault()
      uiInteractCheck('drag', anchoringObject, evtObj)
    }
  })
  mouseDown.registerDropCallback((evtObj) => {
    if (anchoringObject && mouseDown.startTarget && mouseDown.startTarget === anchoringObject) {
      uiInteractCheck('drop', anchoringObject, evtObj)
    }
  })
  mouseDown.registerMoveCallback((evtObj) => {
    if (anchoringObject && anchoringObject.isSameNode(evtObj.target)) {
      uiInteractCheck('move', anchoringObject, evtObj)
    }
  })
  anchoringObject.addEventListener('mouseout', () => {
    if (anchoringObject) {
      window.MetricQWebView.graticule.draw(false)
    }
  })
  anchoringObject.addEventListener('wheel', (evtObj) => {
    uiInteractCheck('wheel', anchoringObject, evtObj)
  })
}

function calculateActualMousePos (evtObj, target) {
  if (target === undefined) target = evtObj.target
  const box = target.getBoundingClientRect()
  const curPos = [evtObj.x - box.left, evtObj.y - box.top]
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
  calcRelativePos (evtObj) {
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
  startClick (evtObj) {
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
  moving (evtObj) {
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
  endClick (evtObj) {
    mouseDown.endPos = mouseDown.calcRelativePos(evtObj)
    mouseDown.endTime = evtObj.timestamp
    mouseDown.duration = mouseDown.endTime - mouseDown.startTime
    mouseDown.endTarget = evtObj.target
    mouseDown.isDown = false
    for (let i = 0; i < mouseDown.dropCallbacks.length; ++i) {
      mouseDown.dropCallbacks[i](evtObj)
    }
  },
  registerDragCallback (callbackFunc) {
    mouseDown.dragCallbacks.push(callbackFunc)
  },
  registerDropCallback (callbackFunc) {
    mouseDown.dropCallbacks.push(callbackFunc)
  },
  registerMoveCallback (callbackFunc) {
    mouseDown.moveCallbacks.push(callbackFunc)
  }
}
const keyDown = {
  keys: [],
  keyDown (evtObj) {
    keyDown.keys.push(evtObj.keyCode)
  },
  keyUp (evtObj) {
    for (let i = 0; i < keyDown.keys.length; ++i) {
      if (evtObj.keyCode === keyDown.keys[i]) {
        keyDown.keys.splice(i, 1)
        --i
      }
    }
  },
  is (keyCode) {
    for (let i = 0; i < keyDown.keys.length; ++i) {
      if (keyDown.keys[i] === keyCode) {
        return true
      }
    }
    return false
  }
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
window.addEventListener('gesturechange', (evt) => {
  evt.preventDefault()
  const timeRange = window.MetricQWebView.graticule.curTimeRange
  const delta = timeRange[1] - timeRange[0]
  const timeMargin = Math.round((delta * evt.scale - delta) / 2)
  timeRange[0] -= timeMargin
  timeRange[1] += timeMargin
  window.MetricQWebView.handler.setTimeRange(timeRange[0], timeRange[1])
  window.MetricQWebView.throttledReload()
  window.MetricQWebView.graticule.draw(false)
})

window.addEventListener('contextmenu', (event) => {
  if (event.target && event.target.tagName === 'CANVAS') {
    event.preventDefault()
  }
})
