import { setUiInteractArr, uiInteractArr } from '../interact.js'
import { PopupHeader } from './popup-header.js'
import { InteractionArrayOption } from './interaction-array-option.js'
import { Store } from '../store.js'
import { veil } from './veil.js'

// @vue/component
export const ConfigurationPopup = {
  components: {
    InteractionArrayOption,
    PopupHeader
  },
  model: {
    prop: 'popupStatus',
    event: 'toggle'
  },
  props: {
    config: {
      type: Object, required: true
    },
    popupStatus: {
      type: Boolean,
      required: true
    }
  },
  data: function () {
    return {
      popupTitle: 'Globale-Einstellungen'
    }
  },
  computed: {
    uiResolution: {
      cache: false,
      get: function () {
        return 30 - this.config.resolution
      },
      set: function (newValue) {
        Store.state.configuration.resolution = 30 - newValue
        this.$emit('update:uiResolution', newValue)
      }
    },
    uiZoomSpeed: {
      cache: false,
      get: function () {
        return this.config.zoomSpeed
      },
      set: function (newValue) {
        Store.state.configuration.zoomSpeed = newValue
        this.$emit('update:uiZoomSpeed', newValue)
      }
    },
    uiInteractArr: {
      cache: false,
      get: function () {
        return uiInteractArr
      },
      set: function (newValue) {
        setUiInteractArr(newValue)
      }
    },
    uiLegendDisplay: {
      cache: false,
      get: function () {
        return this.config.legendDisplay
      },
      set: function (newValue) {
        Store.state.configuration.legendDisplay = newValue
      }
    }
  },
  mounted () {
    const popupEle = document.querySelector('.config_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$emit('toggle', false)
        window.MetricQWebView.instances[0].reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
    }
  },
  /* TODO: remove the following functions as they are no longer needed */
  methods: {
    manipulateResolution: function (increment) {
      let newValue = parseFloat(this.uiResolution) + increment
      newValue = this.withinRange(document.getElementById('resolution_input'), newValue)
      this.uiResolution = newValue
    },
    manipulateZoomSpeed: function (increment) {
      let newValue = parseFloat(this.uiZoomSpeed) + increment
      newValue = this.withinRange(document.getElementById('zoom_speed_input'), newValue)
      this.uiZoomSpeed = newValue
      // make vue js update using force
    },
    withinRange: function (ele, newValue) {
      if (newValue < parseFloat(ele.getAttribute('min'))) {
        newValue = parseFloat(ele.getAttribute('min'))
      }
      if (newValue > parseFloat(ele.getAttribute('max'))) {
        newValue = parseFloat(ele.getAttribute('max'))
      }
      return newValue
    },
    closePopup (evt) {
      veil.destroy(evt)
    },
    closePopupModal: function (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    }
  },
  template: `
    <div class="modal popup_div config_popup_div" tabindex="-1" role="dialog" v-on:click="closePopupModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <popup-header v-bind:popupTitle="popupTitle"></popup-header>
          <div class="modal-body">
            <div class="form-group row">
              <label class="col-sm-6 col-form-label" for="resolution_input">Auflösung</label>
              <div class="col-sm-6">
                <input type="range" class="form-control" id="resolution_input" v-model="uiResolution" min="0" max="29" step="0.25"/>
              </div>
            </div>
            <div class="form-group row">
              <label class="col-sm-6 col-form-label" for="zoom_speed_input">Zoom Geschwindigkeit</label>
              <div class="col-sm-6">
                <input type="range" class="form-control" id="zoom_speed_input" v-model.sync="uiZoomSpeed" min="1" max="100" step="0.5"/>
              </div>
            </div>
            <h5 class="modal-title">Bedienung</h5>
            <div id="ui_configurator">
              <div class="form-group row" >
                <label class="col-sm-5 col-form-label">Funktion</label>
                <label class="col-sm-4 col-form-label">Event</label>
                <label class="col-sm-3 col-form-label">Tasten</label>
              </div>
              <interaction-array-option v-for="(action, index) in uiInteractArr" v-bind:action="action" v-on:input="uiInteractArr[index]=$event" v-bind:key="action[2]"></interaction-array-option>
            </div>
            <h5 class="modal-title">Position Legende</h5>
            <div class="config_radio_legend">
              <div>
                <input type="radio" id="legend_bottom" name="legendDisplay" value="bottom" v-model="uiLegendDisplay">
                <label for="legend_bottom">Unten</label>
              </div>
              <div>
                <input type="radio" id="legend_right" name="legendDisplay" value="right" v-model="uiLegendDisplay">
                <label for="legend_right">Rechts</label>
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
