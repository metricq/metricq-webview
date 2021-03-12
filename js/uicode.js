var globalPopup = {
  'export': false,
  'yaxis': false,
  'xaxis': false,
  'presetSelection': false
}
var globalSelectedPreset = undefined
for (var attrib in metricPresets) {
  globalSelectedPreset = metricPresets[attrib]
  break
}
new MetricQWebView(document.querySelector('.row_body'), new Array(), (new Date()).getTime() - 7200 * 1000, (new Date()).getTime())

var veil = {
  'myPopup': undefined,
  'inDestroymentPhase': false,
  'create': function (destroyCallback, solidVeil) {
    var veilEle = document.createElement('div')
    veilEle.setAttribute('id', 'popup_veil')
    veilEle.style.width = window.innerWidth
    veilEle.style.height = window.innerHeight
    if (solidVeil) {
      veilEle.style.backgroundColor = '#808080'
      veilEle.style.opacity = 1
    }
    veilEle = document.getElementsByTagName('body')[0].appendChild(veilEle)
    veilEle.addEventListener('click', function (evt) { veil.destroy(evt) })
    veil.ondestroy = destroyCallback
    return veilEle
  },
  'ondestroy': undefined,
  'destroy': function (evt) {
    if (veil.inDestroymentPhase) {
      return undefined

    }
    veil.inDestroymentPhase = true
    if (veil.ondestroy && evt) {
      veil.ondestroy(evt)
    }

    var veilEle = document.querySelector('#popup_veil')
    if (veilEle) {
      veilEle.parentNode.removeChild(veilEle)
    }

    veil.myPopup = undefined
    veil.ondestroy = undefined
    veil.inDestroymentPhase = false
  },
  'attachPopup': function (popupEle) {
    popupEle.style.top = Math.round(window.innerHeight / 2 - popupEle.offsetHeight / 2) + 'px'
    popupEle.style.left = Math.round(window.innerWidth / 2 - popupEle.offsetWidth / 2) + 'px'
    popupEle.style.zIndex = 500
    veil.myPopup = popupEle
  }
}

function initTest () {
  document.getElementById('button_export').addEventListener('click', function (evt) {
    globalPopup.export = !globalPopup.export
  })
  document.getElementById('button_configuration').addEventListener('click', function (evt) {
    configApp.togglePopup()
    Vue.nextTick(initializeConfigPopup)
  })
}

function initializeMetricPopup () {
  var instance = window.MetricQWebView.instances[0]
  var myMetric = undefined
  for (var metricBase in instance.handler.allMetrics) {
    if (instance.handler.allMetrics[metricBase].popup) {
      myMetric = instance.handler.allMetrics[metricBase]
      break
    }
  }
  if (undefined !== myMetric) {
    var popupEle = document.getElementById(myMetric.popupKey)
    if (popupEle) {
      //TODO: remove this 'affectedTraces' stuff
      let affectedTraces = new Array()
      var j = 0
      for (var metricBase in instance.handler.allMetrics) {
        if (instance.handler.allMetrics[metricBase].traces) {
          for (var k = 0; k < instance.handler.allMetrics[metricBase].traces.length; ++k) {
            if (metricBase == myMetric.name) {
              affectedTraces.push(j)
            }
            ++j
          }
        }
      }
      var disablePopupFunc = function (paramMyMetric, paramMyInstance, paramMyTraces) {
        return function (evt) {
          myMetric.popup = false
          popupApp.$forceUpdate()
          veil.destroy()

          let oldName = evt.target.getAttribute('metric-old-name')

          //special behavior when creating a new metric
          if (null === oldName
            || undefined === oldName) {
            if ('popup_trashcan' == evt.target.getAttribute('class')) return

            if ('popup_ok' == evt.target.getAttribute('class')) {
              // code duplication :(
              if (paramMyInstance.changeMetricName(paramMyMetric, paramMyMetric.name, evt.target.getAttribute('metric-old-name'))) {
                nameChanged = true
              } else {
                paramMyMetric.updateName(oldName)
                showUserHint('Konnte Metrik-Namen nicht ändern. Metrik evtl. schon vorhanden?')
              }
            }
          } else {
            if ('popup_trashcan' == evt.target.getAttribute('class')) {
              if (0 < oldName.length) {
                paramMyInstance.deleteMetric(oldName)
                Vue.nextTick(function () { legendApp.$forceUpdate() })
              }
            } else {
              var nameChanged = false
              if (paramMyMetric.name != oldName) {
                if ('' == paramMyMetric.name && !oldName) {
                  //do nothing
                } else {
                  if (paramMyInstance.changeMetricName(paramMyMetric, paramMyMetric.name, evt.target.getAttribute('metric-old-name'))) {
                    nameChanged = true
                  } else {
                    paramMyMetric.updateName(oldName)
                    showUserHint('Konnte Metrik-Namen nicht ändern. Metrik evtl. schon vorhanden?')
                  }
                }
              }
              if (evt.target.getAttribute('metric-old-color') != paramMyMetric.color) {
                paramMyMetric.updateColor(paramMyMetric.color)
                let colorEle = document.getElementsByClassName(paramMyMetric.popupKey)
                if (colorEle && colorEle[0]) {
                  colorEle[0].style.color = paramMyMetric.color
                }
              }
              if (nameChanged) {
                //TODO: do something, in this case, do forceUpdate the legendApp
                //         so the metric's color will be shown
              }
              if (evt.target.getAttribute('metric-old-marker') != paramMyMetric.marker) {
                paramMyMetric.updateMarker(paramMyMetric.marker)
              }
              //don't do a complete repaint
              //renderMetrics();
            }
          }
        }
      }(myMetric, instance, affectedTraces)
      var veilEle = veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
      var closeEle = popupEle.querySelector('.popup_close_button')
      var modalEle = document.querySelector('.modal')
      modalEle.addEventListener('click', function (evt) {
        if ('dialog' == evt.target.getAttribute('role')) {
          veil.destroy()
          disablePopupFunc(evt)
        }
      })
      var inputEle = popupEle.querySelector('.popup_input')
      inputEle.addEventListener('keyup', function (evt) {
        if (evt.key.toLowerCase() == 'enter') {
          disablePopupFunc(evt)
        }
        //TODO: implement throttling?
        instance.handler.searchMetricsPromise(evt.target.value).then(function (myInstance, wrapperEle, paramMetric) {
          return function (searchSuggestions) {
            var datalistEle = document.getElementById('autocomplete_metric')
            if (!datalistEle) {
              showUserHint('Auto-Vervollständigung nicht verfügbar, konnte Element #autocomplete_metric nicht finden.')
            } else {
              for (var i = datalistEle.childNodes.length - 1; i >= 0; --i) {
                datalistEle.removeChild(datalistEle.childNodes[i])
              }
              for (var i = 0; i < searchSuggestions.length; ++i) {
                var optionEle = document.createElement('option')
                optionEle.setAttribute('value', searchSuggestions[i])
                datalistEle.appendChild(optionEle)
              }
            }
          }
        }(instance, popupEle, myMetric))
      })
      var trashcanEle = popupEle.querySelector('.popup_trashcan')

      var colorchooserEle = popupEle.querySelector('.popup_colorchooser')
      var colorchooserObj = new Colorchooser(colorchooserEle, myMetric)
      colorchooserObj.onchange = function (myTraces, paramMyMetric) {
        return function () {
          document.querySelector('div.' + paramMyMetric.popupKey).style.backgroundColor = paramMyMetric.color
          paramMyMetric.renderer.graticule.draw(false)
        }
      }(affectedTraces, myMetric)
      popupEle.querySelector('.popup_legend_select').addEventListener('change', function (myTraces, paramMyMetric) {
        return function (evt) {
          paramMyMetric.updateMarker(paramMyMetric.marker)
        }
      }(affectedTraces, myMetric))
      var okEle = document.querySelector('.popup_ok');

      [veilEle, inputEle, closeEle, trashcanEle, okEle].forEach(function (paramValue, paramIndex, paramArray) {
        if (paramValue) {
          paramValue.setAttribute('metric-old-name', myMetric.name)
          paramValue.setAttribute('metric-old-color', myMetric.color)
          paramValue.setAttribute('metric-old-marker', myMetric.marker)
          paramValue.setAttribute('metric-affected-traces', JSON.stringify(affectedTraces))
        }
      });

      [okEle, closeEle, trashcanEle].forEach(function (paramValue, paramIndex, paramArray) {
        if (paramValue) {
          paramValue.addEventListener('click', function (paramMetricName, disableFunc) {
            return function (evt) {
              disableFunc(evt)
            }
          }(myMetric.name, disablePopupFunc))
        }
      })
      document.getElementById('input_metric_name').focus()
    }
  }
}

function initializeConfigPopup () {
  // nothing to do here
}

document.addEventListener('DOMContentLoaded', initTest)