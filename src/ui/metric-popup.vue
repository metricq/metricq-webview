<template>
  <div
    :id="metric.popupKey"
    class="modal popup_div metric_popup_div"
    tabindex="-1"
    role="dialog"
    @click="closePopupModal"
  >
    <div
      class="modal-dialog"
      role="document"
    >
      <div class="modal-content">
        <popup-header :popup-title="popupTitle" />
        <div class="modal-body">
          <div class="form-group row">
            <label
              class="col-sm-2 col-form-label"
              for="input_metric_name"
            >Name</label>
            <div class="col-sm-10">
              <input
                id="input_metric_name"
                v-model="metricName"
                type="text"
                list="autocomplete_metric"
                class="form-control"
                @keyup="metricNameKeyup"
              >
              <datalist id="autocomplete_metric" />
            </div>
          </div>
          <div class="form-group row">
            <label class="col-sm-2 col-form-label">Farbe</label>
            <div class="col-sm-10">
              <canvas
                class="popup_colorchooser form-control"
                width="345"
                height="32"
              />
            </div>
          </div>
          <div class="form-group row">
            <label
              class="col-sm-2 col-form-label"
              for="select_marker"
            >Symbol</label>
            <div class="col-sm-10">
              <select
                id="select_marker"
                class="form-control custom-select popup_legend_select"
                size="1"
                :value="metric.marker"
                @change="changeMarker"
              >
                <option
                  v-for="symbol in markerSymbols"
                  :key="symbol"
                >
                  {{ symbol }}
                </option>
              </select>
            </div>
          </div>
          <table>
            <tr>
              <td>
                <label>
                  <input
                    id="checkbox_min"
                    v-model="metricMin"
                    type="checkbox"
                    @change="changeDraw"
                  > min
                  anzeigen
                </label>
              </td>
              <td>
                <label>
                  <input
                    id="checkbox_avg"
                    v-model="metricAvg"
                    type="checkbox"
                    @change="changeDraw"
                  > avg
                  anzeigen
                </label>
              </td>
              <td>
                <label>
                  <input
                    id="checkbox_max"
                    v-model="metricMax"
                    type="checkbox"
                    @change="changeDraw"
                  > max
                  anzeigen
                </label>
              </td>
            </tr>
          </table>
        </div>
        <div class="modal-footer">
          <button
            v-if="!isEmpty"
            class="btn btn-danger"
            @click="trashcanClicked"
          >
            <img
              src="img/icons/trash.svg"
              class="popup_trashcan"
              width="18"
              height="18"
            >
          </button>
          <button
            class="btn btn-primary popup_ok"
            @click="closePopup"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { markerSymbols } from '../metric.js'
import PopupHeader from './popup-header.vue'
import { Store } from '../store.js'
import { veil } from './veil.js'
import { showUserHint } from '../interact.js'
import { Colorchooser } from '../colorchooser.js'

export default {
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
      newMetric: Object.assign({}, this.metric)
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
    },
    metricMin: {
      get: function () {
        return this.metric.drawMin
      },
      set: function (newValue) {
        Store.setMetricDrawState(this.metric.name, 'drawMin', newValue)
      }
    },
    metricAvg: {
      get: function () {
        return this.metric.drawAvg
      },
      set: function (newValue) {
        Store.setMetricDrawState(this.metric.name, 'drawAvg', newValue)
      }
    },
    metricMax: {
      get: function () {
        return this.metric.drawMax
      },
      set: function (newValue) {
        Store.setMetricDrawState(this.metric.name, 'drawMax', newValue)
      }
    },
    metricName: {
      get: function () {
        return this.metric.name
      },
      set: function (newValue) {
        this.newMetric.name = newValue
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

    const disablePopupFunc = (function (paramMyMetric, paramMyNewMetric, paramMyInstance, paramMyTraces) {
      return function (evt) {
        const metricBase = Store.getMetricBase(paramMyMetric.name)
        Store.setMetricPopup(metricBase, false)
        veil.destroy()

        const newName = paramMyNewMetric.name

        if (evt.target.getAttribute('class') === 'popup_trashcan') {
          if (newName.length > 0) {
            paramMyInstance.deleteMetric(newName)
          }
        } else {
          let nameChanged = false
          if (paramMyMetric.name !== newName) {
            if (paramMyMetric.name === '' && !newName) {
              // do nothing
            } else {
              if (paramMyInstance.changeMetricName(paramMyMetric, newName, paramMyMetric.name)) {
                nameChanged = true
              } else {
                showUserHint('Konnte Metrik-Namen nicht ändern. Metrik evtl. schon vorhanden?')
              }
            }
          }
          if (paramMyNewMetric.color !== paramMyMetric.color) {
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
          if (paramMyNewMetric.marker !== paramMyMetric.marker) {
            paramMyMetric.updateMarker(paramMyMetric.marker)
          }
          // don't do a complete repaint
          // renderMetrics();
        }
      }
    }(this.metric, this.newMetric, instance, affectedTraces))
    veil.create(disablePopupFunc)
    veil.attachPopup(popupEle)

    const colorchooserEle = popupEle.querySelector('.popup_colorchooser')
    const colorchooserObj = new Colorchooser(colorchooserEle, this.metric)
    colorchooserObj.onchange = (function (myTraces, paramMyMetric) {
      return function () {
        paramMyMetric.renderer.graticule.draw(false)
      }
    }(affectedTraces, this.metric))

    document.getElementById('input_metric_name').focus()
  },
  methods: {
    changeDraw: function (evt) {
      if (this.metric.drawMin === false && this.metric.drawAvg === false && this.metric.drawMax === false) {
        evt.target.click()
        window.alert('Fehler! Mindestens eine Option muss ausgewählt bleiben!')
      } else {
        Store.checkMetricDrawState()
      }
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
  }
}
</script>

<style scoped>
.metric_popup_div {
}

.popup_trashcan {
  margin: 2px;
}

.popup_legend_select {
  font-size: 12pt;
  width: 100%;
}

.popup_legend_select option {
  font-size: 12pt;
}
</style>
