var popupApp = new Vue({
  'el': '#wrapper_popup_legend',
  'methods': {},
  'computed': {
    'metricsList': {
      cache: false,
      'get': function () {
        if (window['MetricQWebView']) {
          return window.MetricQWebView.instances[0].handler.allMetrics
        } else {
          return new Object()
        }
      },
      'set': function (newValue) {
        if (window['MetricQWebView']) {
          return window.MetricQWebView.instances[0].handler.allMetrics = newValue
        }
      }
    }
  },
  //not called by $forceUpdate :(
  updated () {
  }
})

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