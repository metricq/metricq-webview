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
              class="col-sm-2"
            >Anzeige</label>
            <div class="col-sm-3">
              <label>
                <input
                  id="checkbox_min"
                  v-model="metricMin"
                  type="checkbox"
                  @change="changeDraw"
                > Minimum
              </label>
            </div>
            <div class="col-sm-4">
              <label>
                <input
                  id="checkbox_avg"
                  v-model="metricAvg"
                  type="checkbox"
                  @change="changeDraw"
                > Durchschnitt
              </label>
            </div>
            <div class="col-sm-3">
              <label>
                <input
                  id="checkbox_max"
                  v-model="metricMax"
                  type="checkbox"
                  @change="changeDraw"
                > Maximum
              </label>
            </div>
          </div>
          <div class="form-group row">
            <label
              class="col-sm-2 col-form-label"
              for="input_metric_factor"
            >Faktor</label>
            <div class="col-sm-10">
              <input
                id="input_metric_factor"
                ref="input_factor"
                :value="metric.factor"
                type="number"
                list="autocomplete_metric"
                class="form-control"
                step="any"
                @change="onFactorUpdate"
              >
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            v-if="!isEmpty"
            class="btn btn-danger"
            @click="trashcanClicked"
          >
            <b-icon-trash variant="danger-outline" />
          </button>
          <button
            class="btn btn-success popup_ok"
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
  data () {
    return {
      popupTitle: 'Metrik-Eigenschaften',
      newMetric: Object.assign({}, this.metric)
    }
  },
  computed: {
    isEmpty () {
      return this.metric.key === ''
    },
    metricMin: {
      get () {
        return this.metric.drawMin
      },
      set (newValue) {
        this.$store.dispatch('metrics/updateDrawState', { metricKey: this.metric.key, drawState: { drawMin: newValue } })
      }
    },
    metricAvg: {
      get () {
        return this.metric.drawAvg
      },
      set (newValue) {
        this.$store.dispatch('metrics/updateDrawState', { metricKey: this.metric.key, drawState: { drawAvg: newValue } })
      }
    },
    metricMax: {
      get () {
        return this.metric.drawMax
      },
      set (newValue) {
        this.$store.dispatch('metrics/updateDrawState', { metricKey: this.metric.key, drawState: { drawMax: newValue } })
      }
    },
    metricName: {
      get () {
        return this.metric.key
      },
      set (newValue) {
        this.newMetric.key = newValue
      }
    }
  },
  mounted () {
    const popupEle = document.getElementById(this.metric.popupKey)
    if (!popupEle) {
      return
    }

    const disablePopupFunc = ((paramMyMetric, paramMyNewMetric) => {
      return (evt) => {
        const metricKey = paramMyMetric.key
        this.$store.commit('metrics/setPopup', { metricKey, popupState: false })
        veil.destroy()

        const newName = paramMyNewMetric.key

        if (evt.target.getAttribute('class') === 'popup_trashcan') {
          if (newName.length > 0) {
            window.MetricQWebView.deleteMetric(newName)
          }
        } else {
          if (paramMyMetric.key !== newName) {
            if (paramMyMetric.key === '' && !newName) {
              // do nothing
            } else {
              window.MetricQWebView.changeMetricName(paramMyMetric, newName)
            }
          }
          if (paramMyNewMetric.color !== paramMyMetric.color) {
            this.$store.dispatch('metrics/updateColor', { metricKey, color: paramMyMetric.color })
            const colorEle = document.getElementsByClassName(paramMyMetric.popupKey)
            if (colorEle && colorEle[0]) {
              colorEle[0].style.color = paramMyMetric.color
            }
          }
          // don't do a complete repaint
          // renderMetrics();
        }
      }
    })(this.metric, this.newMetric)
    veil.create(disablePopupFunc)
    veil.attachPopup(popupEle)

    const colorchooserEle = popupEle.querySelector('.popup_colorchooser')
    const colorchooserObj = new Colorchooser(colorchooserEle, this.metric)
  },
  methods: {
    onFactorUpdate () {
      let factor = Number.parseFloat(this.$refs.input_factor.value)
      if (Number.isNaN(factor)) {
        factor = 1
      }
      this.$store.dispatch('metrics/updateFactor', { metricKey: this.metric.key, factor })
      window.MetricQWebView.updateMetricUrl()
    },
    changeDraw (evt) {
      if (this.metric.drawMin === false && this.metric.drawAvg === false && this.metric.drawMax === false) {
        evt.target.click()
        Vue.toasted.error('Fehler! Mindestens eine Anzeigeoption muss ausgewählt bleiben!', this.$store.state.toastConfiguration)
      } else {
        this.$store.dispatch('metrics/checkGlobalDrawState')
      }
    },
    trashcanClicked (evt) {
      veil.destroy(evt)
    },
    metricNameKeyup (evt) {
      if (evt.key.toLowerCase() === 'enter') {
        veil.destroy(evt)
      }
      // TODO: implement throttling?
      window.MetricQWebView.handler.searchMetricsPromise(evt.target.value).then((searchSuggestions) => {
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
      })
    },
    closePopup (evt) {
      veil.destroy(evt)
    },
    closePopupModal (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    }
  }
}
</script>

<style scoped>
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
