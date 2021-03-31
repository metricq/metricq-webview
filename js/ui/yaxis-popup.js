import { PopupHeader } from './popup-header.js'
import { veil } from './veil.js'

// @vue/component
export const YaxisPopup = {
  components: {
    PopupHeader
  },
  model: {
    prop: 'popupStatus',
    event: 'toggle'
  },
  props: {
    popupStatus: {
      type: Boolean,
      required: true
    }
  },
  data: function () {
    return {
      popupTitle: 'Y-Achsen-Einstellungen'
    }
  },
  computed: {
    manualDisabled: {
      cache: false,
      get: function () {
        return window.MetricQWebView.instances[0].graticule.yRangeOverride.type !== 'manual'
      },
      set: function (newValue) {
        window.MetricQWebView.instances[0].graticule.setYRangeOverride('local', undefined, undefined)
      }
    },
    yaxisRange: {
      get: function () {
        return window.MetricQWebView.instances[0].graticule.yRangeOverride.type
      },
      set: function (newValue) {
        let ele = document.getElementById('yaxis_min')
        if (ele) {
          ele.disabled = newValue !== 'manual'
          ele = document.getElementById('yaxis_max')
          ele.disabled = newValue !== 'manual'
        }
        if (newValue === 'global') {
          window.MetricQWebView.instances[0].graticule.setYRangeOverride(newValue, undefined, undefined)
        } else {
          if (newValue === 'manual') {
            const arr = window.MetricQWebView.instances[0].handler.getAllMinMax()
            window.MetricQWebView.instances[0].graticule.setYRangeOverride(newValue, arr[0], arr[1])
            this.$forceUpdate()
          } else {
            window.MetricQWebView.instances[0].graticule.setYRangeOverride(newValue, undefined, undefined)
          }
        }
        window.MetricQWebView.instances[0].setPlotRanges(false, true)
      }
    },
    allMin: {
      cache: false,
      get: function () {
        const arr = window.MetricQWebView.instances[0].handler.getAllMinMax()
        if (arr) {
          return (Number(arr[0])).toFixed(3)
        }
        return 0
      },
      set: function (newValue) {
        let arr = window.MetricQWebView.instances[0].handler.getAllMinMax()
        arr = [parseFloat(newValue), arr[1]]
        window.MetricQWebView.instances[0].graticule.setYRangeOverride(undefined, arr[0], arr[1])
        window.MetricQWebView.instances[0].setPlotRanges(false, true)
      }
    },
    allMax: {
      cache: false,
      get: function () {
        const arr = window.MetricQWebView.instances[0].handler.getAllMinMax()
        if (arr) {
          return (Number(arr[1])).toFixed(3)
        }
        return 1
      },
      set: function (newValue) {
        let arr = window.MetricQWebView.instances[0].handler.getAllMinMax()
        arr = [arr[0], parseFloat(newValue)]
        window.MetricQWebView.instances[0].graticule.setYRangeOverride(undefined, arr[0], arr[1])
        window.MetricQWebView.instances[0].setPlotRanges(false, true)
      }
    }
  },
  mounted () {
    const popupEle = document.querySelector('.yaxis_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$emit('toggle', false)
        window.MetricQWebView.instances[0].reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
    }
  },
  methods: {
    closePopup (evt) {
      veil.destroy(evt)
    },
    closePopupModal: function (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    }
  },
  /* use vue-js for radio buttons */
  template: `
    <div class="modal popup_div yaxis_popup_div" tabindex="-1" role="dialog" v-on:click="closePopupModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <popup-header v-bind:popupTitle="popupTitle"></popup-header>
          <div class="modal-body">
            <div class="form-check">
              <input class="form-check-input" type="radio" value="global" name="yaxis" id="yaxis_global" v-model="yaxisRange" />
              <label for="yaxis_global" class="form-check-label form-control-plaintext">Globales Min/Max</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" value="local" name="yaxis" id="yaxis_local" v-model="yaxisRange" />
              <label for="yaxis_local" class="form-check-label form-control-plaintext">Lokales Min/Max</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" value="manual" name="yaxis" id="yaxis_manual" v-model="yaxisRange" />
              <label for="yaxis_manual" class="form-check-label form-control-plaintext">Manuelles Min/Max</label>
            </div>
            <div class="form-group yaxis_popup_minmax">
              <div class="form-group row">
                <label for="yaxis_min" class="yaxis_popup_label_minmax col-sm-2 col-form-label">Min:</label>
                <div class="col-sm-10"><input class="form-control" type="number" v-model="allMin" id="yaxis_min" :disabled.sync="manualDisabled" step="0.001"/></div>
              </div>
              <div class="form-group row">
                <label for="yaxis_ax" class="yaxis_popup_label_minmax col-sm-2 col-form-label">Max:</label>
                <div class="col-sm-10"><input class="form-control" type="number" v-model="allMax" id="yaxis_max" :disabled.sync="manualDisabled" step="0.001"/></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary popup_ok" v-on:click="closePopup">
              OK
            </button>
          </div>
        </div>
      </div>
    </div>`
}
