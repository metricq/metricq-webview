import { markerSymbols } from '../metric.js'
import { PopupHeader } from './popup-header.js'
import { Store } from '../store.js'
import { veil } from './veil.js'
import { showUserHint } from '../interact.js'
import { Colorchooser } from '../colorchooser.js'

// @vue/component
export const MetricPopup = {
  components: { PopupHeader },
  props: {
    metric: {
      type: Object,
      required: true
    }
  },
  data: function () {
    return {
      markerSymbols: markerSymbols,
      popupTitle: 'Metrik-Eigenschaften',
      oldMetric: Object.assign({}, this.metric)
    }
  },
  computed: {
    isEmpty: {
      get: function () {
        return this.metric.name === ''
      },
      set: function (newValue) {
        // do nothing
      }
    }
  },
  mounted () {
    const instance = window.MetricQWebView.instances[0]
    const popupEle = document.getElementById(this.metric.popupKey)
    if (!popupEle) {
      return
    }

    // TODO: remove this 'affectedTraces' stuff
    const affectedTraces = []
    let j = 0
    for (const metricBase in Store.state.allMetrics) {
      if (Store.state.allMetrics[metricBase].traces) {
        for (let k = 0; k < Store.state.allMetrics[metricBase].traces.length; ++k) {
          if (metricBase === this.metric.name) {
            affectedTraces.push(j)
          }
          ++j
        }
      }
    }

    const disablePopupFunc = (function (paramMyMetric, paramMyOldMetric, paramMyInstance, paramMyTraces) {
      return function (evt) {
        const metricBase = Store.getMetricBase(paramMyMetric.name)
        Store.setMetricPopup(metricBase, false)
        veil.destroy()

        const oldName = paramMyOldMetric.name

        // special behavior when creating a new metric
        if (oldName === null ||
          undefined === oldName) {
          if (evt.target.getAttribute('class') === 'popup_trashcan') return

          if (evt.target.getAttribute('class') === 'popup_ok') {
            // code duplication :( - not really
            if (!paramMyInstance.changeMetricName(paramMyMetric, paramMyMetric.name, oldName)) {
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
                if (paramMyInstance.changeMetricName(paramMyMetric, paramMyMetric.name, oldName)) {
                  nameChanged = true
                } else {
                  paramMyMetric.updateName(oldName)
                  showUserHint('Konnte Metrik-Namen nicht ändern. Metrik evtl. schon vorhanden?')
                }
              }
            }
            if (paramMyOldMetric.color !== paramMyMetric.color) {
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
            if (paramMyOldMetric.marker !== paramMyMetric.marker) {
              paramMyMetric.updateMarker(paramMyMetric.marker)
            }
            // don't do a complete repaint
            // renderMetrics();
          }
        }
      }
    }(this.metric, this.oldMetric, instance, affectedTraces))
    veil.create(disablePopupFunc)
    veil.attachPopup(popupEle)

    const colorchooserEle = popupEle.querySelector('.popup_colorchooser')
    const colorchooserObj = new Colorchooser(colorchooserEle, this.metric)
    colorchooserObj.onchange = (function (myTraces, paramMyMetric) {
      return function () {
        paramMyMetric.renderer.graticule.draw(false)
      }
    }(affectedTraces, this.metric))

    const metricDrawState = Store.getMetricDrawState(this.metric.name)
    document.getElementById('checkbox_min').checked = metricDrawState[0]
    document.getElementById('checkbox_avg').checked = metricDrawState[1]
    document.getElementById('checkbox_max').checked = metricDrawState[2]

    document.getElementById('input_metric_name').focus()

  },
  methods: {
    changeMin: function (evt) {
      this.metric.drawMin = !this.metric.drawMin
      Store.checkMetricDrawState()
    },
    changeAvg: function (evt) {
      this.metric.drawAvg = !this.metric.drawAvg
      Store.checkMetricDrawState()
    },
    changeMax: function (evt) {
      this.metric.drawMax = !this.metric.drawMax
      Store.checkMetricDrawState()
    },
    changeMarker: function (evt) {
      this.metric.updateMarker(evt.target.value)
    },
    trashcanClicked: function (evt) {
      veil.destroy(evt)
    },
    metricNameKeyup: function (evt) {
      const instance = window.MetricQWebView.instances[0]
      if (evt.key.toLowerCase() === 'enter') {
        veil.destroy(evt)
      }
      // TODO: implement throttling?
      instance.handler.searchMetricsPromise(evt.target.value).then(
        function (searchSuggestions) {
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
      )
    },
    closePopup: function (evt) {
      veil.destroy(evt)
    },
    closePopupModal: function (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    }
  },
  template: `
    <div v-bind:id="metric.popupKey" class="modal popup_div metric_popup_div" tabindex="-1" role="dialog" v-on:click="closePopupModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <popup-header v-bind:popupTitle="popupTitle"></popup-header>
          <div class="modal-body">
            <div class="form-group row">
              <label class="col-sm-2 col-form-label" for="input_metric_name">Name</label>
              <div class="col-sm-10">
                <input type="text" list="autocomplete_metric" id="input_metric_name" class="popup_input form-control" v-model="metric.name" v-on:keyup="metricNameKeyup" />
                <datalist id="autocomplete_metric">
                  ${/* using v-for here doesn't work :( */''}
                  ${/* + "<option v-for=\"suggestion in autocompleteList\" v-bind:value=\"suggestion\">{{ suggestion }}</option>" */''}
                </datalist>
              </div>
            </div>
            <div class="form-group row">
              <label class="col-sm-2 col-form-label">Farbe</label>
              <div class="col-sm-10">
                <canvas class="popup_colorchooser form-control" width="345" height="32"></canvas> ${/* 270,45 */''}
              </div>
            </div>
            <div class="form-group row">
              <label class="col-sm-2 col-form-label" for="select_marker">Symbol</label>
              <div class="col-sm-10">
                <select id="select_marker" class="form-control custom-select popup_legend_select" size="1" v-bind:value="metric.marker" v-on:change="changeMarker">
                  <option v-for="symbol in markerSymbols" v-bind:value="symbol">{{ symbol }}</option>
                </select>
              </div>
            </div>
            <table>
              <tr>
                <td>
                  <label>
                    <input type="checkbox" id='checkbox_min' checked=true v-on:click='changeMin'> min anzeigen
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" id='checkbox_avg' checked=true v-on:click='changeAvg'> avg anzeigen
                  </label>
                </td>
                <td>
                  <label>
                    <input type="checkbox" id='checkbox_max' checked=true v-on:click='changeMax'> max anzeigen
                  </label>
                </td>
              </tr>
            </table>
          </div>
          <div class="modal-footer">
            <button v-if="!isEmpty" class="btn btn-danger" v-on:click="trashcanClicked">
              <img src="img/icons/trash.svg" class="popup_trashcan" width="18" height="18" />
            </button>
            <button class="btn btn-primary popup_ok" v-on:click="closePopup">
              OK
            </button>
          </div>
        </div>
      </div>
    </div>`
}
