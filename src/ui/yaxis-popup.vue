<template>
  <div
    class="modal popup_div yaxis_popup_div"
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
          <div class="form-check form-group">
            <input
              id="yaxis_global"
              v-model="yaxisRange"
              class="form-check-input"
              type="radio"
              value="global"
              name="yaxis"
            >
            <label
              for="yaxis_global"
              class="form-check-label"
            >Globales Min/Max</label>
          </div>
          <div class="form-check form-group">
            <input
              id="yaxis_local"
              v-model="yaxisRange"
              class="form-check-input"
              type="radio"
              value="local"
              name="yaxis"
            >
            <label
              for="yaxis_local"
              class="form-check-label"
            >Lokales Min/Max</label>
          </div>
          <div class="form-check form-group">
            <input
              id="yaxis_manual"
              v-model="yaxisRange"
              class="form-check-input"
              type="radio"
              value="manual"
              name="yaxis"
            >
            <label
              for="yaxis_manual"
              class="form-check-label"
            >Manuelles Min/Max</label>
          </div>
          <div class="form-group yaxis_popup_minmax">
            <div class="form-group row">
              <label
                for="yaxis_min"
                class="yaxis_popup_label_minmax col-sm-2 col-form-label"
              >Min:</label>
              <div class="col-sm-10">
                <input
                  id="yaxis_min"
                  v-model="allMin"
                  class="form-control"
                  type="number"
                  :disabled="manualDisabled"
                  step="0.001"
                >
              </div>
            </div>
            <div class="form-group row">
              <label
                for="yaxis_ax"
                class="yaxis_popup_label_minmax col-sm-2 col-form-label"
              >Max:</label>
              <div class="col-sm-10">
                <input
                  id="yaxis_max"
                  v-model="allMax"
                  class="form-control"
                  type="number"
                  :disabled="manualDisabled"
                  step="0.001"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PopupHeader from './popup-header.vue'
import { veil } from './veil.js'

export default {
  components: {
    PopupHeader
  },
  props: { },
  data () {
    return {
      popupTitle: 'Wertebereich der Y-Achse'
    }
  },
  computed: {
    manualDisabled: {
      cache: false,
      get () {
        return window.MetricQWebView.graticule.yRangeOverride.type !== 'manual'
      },
      set (newValue) {
        window.MetricQWebView.graticule.setYRangeOverride('local', undefined, undefined)
      }
    },
    yaxisRange: {
      get () {
        return window.MetricQWebView.graticule.yRangeOverride.type
      },
      set (newValue) {
        let ele = document.getElementById('yaxis_min')
        if (ele) {
          ele.disabled = newValue !== 'manual'
          ele = document.getElementById('yaxis_max')
          ele.disabled = newValue !== 'manual'
        }
        if (newValue === 'global') {
          window.MetricQWebView.graticule.setYRangeOverride(newValue, undefined, undefined)
        } else {
          if (newValue === 'manual') {
            const arr = window.MetricQWebView.handler.getAllMinMax()
            window.MetricQWebView.graticule.setYRangeOverride(newValue, arr[0], arr[1])
            this.$forceUpdate()
          } else {
            window.MetricQWebView.graticule.setYRangeOverride(newValue, undefined, undefined)
          }
        }
        window.MetricQWebView.setPlotRanges(false, true)
      }
    },
    allMin: {
      cache: false,
      get () {
        const arr = window.MetricQWebView.handler.getAllMinMax()
        if (arr) {
          return (Number(arr[0])).toFixed(3)
        }
        return 0
      },
      set (newValue) {
        let arr = window.MetricQWebView.handler.getAllMinMax()
        arr = [parseFloat(newValue), arr[1]]
        window.MetricQWebView.graticule.setYRangeOverride(undefined, arr[0], arr[1])
        window.MetricQWebView.setPlotRanges(false, true)
      }
    },
    allMax: {
      cache: false,
      get () {
        const arr = window.MetricQWebView.handler.getAllMinMax()
        if (arr) {
          return (Number(arr[1])).toFixed(3)
        }
        return 1
      },
      set (newValue) {
        let arr = window.MetricQWebView.handler.getAllMinMax()
        arr = [arr[0], parseFloat(newValue)]
        window.MetricQWebView.graticule.setYRangeOverride(undefined, arr[0], arr[1])
        window.MetricQWebView.setPlotRanges(false, true)
      }
    }
  },
  mounted () {
    const popupEle = document.querySelector('.yaxis_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$store.commit('togglePopup', 'yaxis')
        window.MetricQWebView.reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
    }
  },
  methods: {
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
.yaxis_popup_div {
  text-align: left;
}

.yaxis_popup_radio {
  float: left;
}

.yaxis_popup_radio label {
  user-select: none;
}

.yaxis_popup_minmax {
  margin: 0px 0px 0px 50px;
}

.yaxis_popup_label_minmax {
  display: inline-block;
  width: 2.5em;
}
</style>
