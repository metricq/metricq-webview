import { createGlobalMetricQWebview, importMetricUrl } from './MetricQWebView.js'
import { Colorchooser } from './colorchooser.js'
import { showUserHint } from './interact.js'
import { globalPopup, mainApp } from './app.js'
import { Store } from './store.js'
import { veil } from './ui/veil.js'

createGlobalMetricQWebview(document.querySelector('.row_body'), [], (new Date()).getTime() - 7200 * 1000, (new Date()).getTime(), Store)

function initTest () {
  document.getElementById('button_export').addEventListener('click', function (evt) {
    globalPopup.export = !globalPopup.export
  })
  document.getElementById('button_configuration').addEventListener('click', function (evt) {
    mainApp.togglePopup()
    Vue.nextTick(initializeConfigPopup)
  })
}

export function initializeMetricPopup () {
  const instance = window.MetricQWebView.instances[0]
  let myMetric
  for (const metricBase in Store.state.allMetrics) {
    if (Store.state.allMetrics[metricBase].popup) {
      myMetric = Store.state.allMetrics[metricBase]
      break
    }
  }
  if (undefined !== myMetric) {
    const popupEle = document.getElementById(myMetric.popupKey)
    if (popupEle) {
      // TODO: remove this 'affectedTraces' stuff
      const affectedTraces = []
      let j = 0
      for (const metricBase in Store.state.allMetrics) {
        if (Store.state.allMetrics[metricBase].traces) {
          for (let k = 0; k < Store.state.allMetrics[metricBase].traces.length; ++k) {
            if (metricBase === myMetric.name) {
              affectedTraces.push(j)
            }
            ++j
          }
        }
      }
      const disablePopupFunc = (function (paramMyMetric, paramMyInstance, paramMyTraces) {
        return function (evt) {
          const metricBase = Store.getMetricBase(myMetric.name)
          Store.setMetricPopup(metricBase, false)
          veil.destroy()

          const oldName = evt.target.getAttribute('metric-old-name')

          // special behavior when creating a new metric
          if (oldName === null ||
            undefined === oldName) {
            if (evt.target.getAttribute('class') === 'popup_trashcan') return

            if (evt.target.getAttribute('class') === 'popup_ok') {
              // code duplication :( - not really
              if (!paramMyInstance.changeMetricName(paramMyMetric, paramMyMetric.name, evt.target.getAttribute('metric-old-name'))) {
                paramMyMetric.updateName(oldName)
                showUserHint('Konnte Metrik-Namen nicht ändern. Metrik evtl. schon vorhanden?')
              }
            }
          } else {
            if (evt.target.getAttribute('class') === 'popup_trashcan') {
              if (oldName.length > 0) {
                paramMyInstance.deleteMetric(oldName)
              }
            } else {
              let nameChanged = false
              if (paramMyMetric.name !== oldName) {
                if (paramMyMetric.name === '' && !oldName) {
                  // do nothing
                } else {
                  if (paramMyInstance.changeMetricName(paramMyMetric, paramMyMetric.name, evt.target.getAttribute('metric-old-name'))) {
                    nameChanged = true
                  } else {
                    paramMyMetric.updateName(oldName)
                    showUserHint('Konnte Metrik-Namen nicht ändern. Metrik evtl. schon vorhanden?')
                  }
                }
              }
              if (evt.target.getAttribute('metric-old-color') !== paramMyMetric.color) {
                paramMyMetric.updateColor(paramMyMetric.color)
                const colorEle = document.getElementsByClassName(paramMyMetric.popupKey)
                if (colorEle && colorEle[0]) {
                  colorEle[0].style.color = paramMyMetric.color
                }
              }
              if (nameChanged) {
                // TODO: do something, in this case, do forceUpdate the legendApp
                //         so the metric's color will be shown
              }
              if (evt.target.getAttribute('metric-old-marker') !== paramMyMetric.marker) {
                paramMyMetric.updateMarker(paramMyMetric.marker)
              }
              // don't do a complete repaint
              // renderMetrics();
            }
          }
        }
      }(myMetric, instance, affectedTraces))
      const veilEle = veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
      const closeEle = popupEle.querySelector('.popup_close_button')
      const modalEle = document.querySelector('.modal')
      modalEle.addEventListener('click', function (evt) {
        if (evt.target.getAttribute('role') === 'dialog') {
          veil.destroy()
          disablePopupFunc(evt)
        }
      })
      const inputEle = popupEle.querySelector('.popup_input')
      inputEle.addEventListener('keyup', function (evt) {
        if (evt.key.toLowerCase() === 'enter') {
          disablePopupFunc(evt)
        }
        // TODO: implement throttling?
        instance.handler.searchMetricsPromise(evt.target.value).then(function (myInstance, wrapperEle, paramMetric) {
          return function (searchSuggestions) {
            const datalistEle = document.getElementById('autocomplete_metric')
            if (!datalistEle) {
              showUserHint('Auto-Vervollständigung nicht verfügbar, konnte Element #autocomplete_metric nicht finden.')
            } else {
              for (let i = datalistEle.childNodes.length - 1; i >= 0; --i) {
                datalistEle.removeChild(datalistEle.childNodes[i])
              }
              for (let i = 0; i < searchSuggestions.length; ++i) {
                const optionEle = document.createElement('option')
                optionEle.setAttribute('value', searchSuggestions[i])
                datalistEle.appendChild(optionEle)
              }
            }
          }
        }(instance, popupEle, myMetric))
      })
      const trashcanEle = popupEle.querySelector('.popup_trashcan')

      const colorchooserEle = popupEle.querySelector('.popup_colorchooser')
      const colorchooserObj = new Colorchooser(colorchooserEle, myMetric)
      colorchooserObj.onchange = (function (myTraces, paramMyMetric) {
        return function () {
          document.querySelector('div.' + paramMyMetric.popupKey).style.backgroundColor = paramMyMetric.color
          paramMyMetric.renderer.graticule.draw(false)
        }
      }(affectedTraces, myMetric))
      popupEle.querySelector('.popup_legend_select').addEventListener('change', (function (myTraces, paramMyMetric) {
        return function (evt) {
          paramMyMetric.updateMarker(paramMyMetric.marker)
        }
      }(affectedTraces, myMetric)))
      const okEle = document.querySelector('.popup_ok');

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
          paramValue.addEventListener('click', (function (paramMetricName, disableFunc) {
            return function (evt) {
              disableFunc(evt)
            }
          }(myMetric.name, disablePopupFunc)))
        }
      })
      document.getElementById('input_metric_name').focus()
    }
  }
}

function initializeConfigPopup () {
  // nothing to do here
}

// At Startup:
if (window.location.href.indexOf('#') > -1) {
  try {
    importMetricUrl()
  } catch (exc) {
    console.log('Could not import metrics.')
    console.log(exc)
  }
} else {
  Vue.nextTick(function () { globalPopup.presetSelection = true })
}

document.addEventListener('DOMContentLoaded', initTest)
