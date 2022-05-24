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
import { veil } from './veil.js'
import { Colorchooser } from '../colorchooser.js'
import Vue from 'vue'

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
        this.$store.dispatch('metrics/updateDrawState', { metricKey: this.metric.key, drawState: { drawMin: newValue } })
      }
    },
    metricAvg: {
      get: function () {
        return this.metric.drawAvg
      },
      set: function (newValue) {
        this.$store.dispatch('metrics/updateDrawState', { metricKey: this.metric.key, drawState: { drawAvg: newValue } })
      }
    },
    metricMax: {
      get: function () {
        return this.metric.drawMax
      },
      set: function (newValue) {
        this.$store.dispatch('metrics/updateDrawState', { metricKey: this.metric.key, drawState: { drawMax: newValue } })
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

    const disablePopupFunc = ((paramMyMetric, paramMyNewMetric, paramMyInstance) => {
      return (evt) => {
        const metricKey = paramMyMetric.key
        this.$store.commit('metrics/setPopup', { metricKey, popupState: false })
        veil.destroy()

        const newName = paramMyNewMetric.name

        if (evt.target.getAttribute('class') === 'popup_trashcan') {
          if (newName.length > 0) {
            paramMyInstance.deleteMetric(newName)
          }
        } else {
          if (paramMyMetric.name !== newName) {
            if (paramMyMetric.name === '' && !newName) {
              // do nothing
            } else {
              paramMyInstance.changeMetricName(paramMyMetric, newName)
            }
          }
          if (paramMyNewMetric.color !== paramMyMetric.color) {
            this.$store.dispatch('metrics/updateColor', { metricKey, color: paramMyMetric.color })
            const colorEle = document.getElementsByClassName(paramMyMetric.popupKey)
            if (colorEle && colorEle[0]) {
              colorEle[0].style.color = paramMyMetric.color
            }
          }
          if (paramMyNewMetric.marker !== paramMyMetric.marker) {
            this.$store.dispatch('metrics/updateMarker', { metricKey, marker: paramMyMetric.marker })
          }
          // don't do a complete repaint
          // renderMetrics();
        }
      }
    })(this.metric, this.newMetric, instance)
    veil.create(disablePopupFunc)
    veil.attachPopup(popupEle)

    const colorchooserEle = popupEle.querySelector('.popup_colorchooser')
    const colorchooserObj = new Colorchooser(colorchooserEle, this.metric)

    document.getElementById('input_metric_name').focus()
  },
  methods: {
    changeDraw: function (evt) {
      if (this.metric.drawMin === false && this.metric.drawAvg === false && this.metric.drawMax === false) {
        evt.target.click()
        Vue.toasted.error('Fehler! Mindestens eine Anzeigeoption muss ausgewählt bleiben!', this.$store.state.toastConfiguration)
      } else {
        this.$store.dispatch('metrics/checkGlobalDrawState')
      }
    },
    changeMarker: function (evt) {
      this.$store.dispatch('metrics/updateMarker', { metricKey: this.metric.key, marker: evt.target.value })
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
        (searchSuggestions) => {
          const datalistEle = document.getElementById('autocomplete_metric')
          if (!datalistEle) {
            Vue.toasted.error('Auto-Vervollständigung nicht verfügbar, konnte Element #autocomplete_metric nicht finden.', this.$store.state.toastConfiguration)
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
