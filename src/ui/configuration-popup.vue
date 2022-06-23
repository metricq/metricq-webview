<template>
  <div
    class="modal popup_div config_popup_div"
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
          <h5 class="modal-title">
            Position Legende
          </h5>
          <div class="config_radio_legend">
            <div>
              <input
                id="legend_bottom"
                v-model="uiLegendDisplay"
                type="radio"
                name="legendDisplay"
                value="bottom"
              >
              <label for="legend_bottom">Unten</label>
            </div>
            <div>
              <input
                id="legend_right"
                v-model="uiLegendDisplay"
                type="radio"
                name="legendDisplay"
                value="right"
              >
              <label for="legend_right">Rechts</label>
            </div>
          </div>
          <br>
          <h5 class="modal-title">
            Canvas Optionen
          </h5>
          <div class="form-group row">
            <label
              class="col-sm-5 col-form-label"
              for="resolution_input"
            >Auflösung</label>
            <div class="col-sm-5">
              <input
                id="resolution_input"
                v-model="uiResolution"
                type="range"
                class="form-control"
                min="0"
                max="29"
                step="0.25"
              >
            </div>
            <label
              class="col-sm-2 col-form-label"
              for="resolution_input"
            >{{ configuration.resolution }}</label>
          </div>
          <div class="form-group row">
            <label
              class="col-sm-5 col-form-label"
              for="zoom_speed_input"
            >Zoom Geschwindigkeit</label>
            <div class="col-sm-5">
              <input
                id="zoom_speed_input"
                v-model="uiZoomSpeed"
                type="range"
                class="form-control"
                min="1"
                max="100"
                step="0.5"
              >
            </div>
            <label
              class="col-sm-2 col-form-label"
              for="resolution_input"
            >{{ configuration.zoomSpeed }}</label>
          </div>
          <br>
          <h5 class="modal-title">
            Bedienung
          </h5>
          <div id="ui_configurator">
            <div class="form-group row">
              <label class="col-sm-5 col-form-label">Funktion</label>
              <label class="col-sm-4 col-form-label">Event</label>
              <label class="col-sm-3 col-form-label">Tasten</label>
            </div>
            <interaction-array-option
              v-for="(action, index) in uiInteractArr"
              :key="action[2]"
              :action="action"
              @input="uiInteractArr[index]=$event"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { setUiInteractArr, uiInteractArr } from '../interact.js'
import PopupHeader from './popup-header.vue'
import InteractionArrayOption from './interaction-array-option.vue'
import { veil } from './veil.js'
import { mapState } from 'vuex'

export default {
  components: {
    InteractionArrayOption,
    PopupHeader
  },
  props: { },
  data: function () {
    return {
      popupTitle: 'Globale-Einstellungen'
    }
  },
  computed: {
    uiResolution: {
      cache: false,
      get: function () {
        return 30 - this.configuration.resolution
      },
      set: function (newValue) {
        this.$store.commit('setResolution', 30 - newValue)
      }
    },
    uiZoomSpeed: {
      cache: false,
      get: function () {
        return this.configuration.zoomSpeed
      },
      set: function (newValue) {
        this.$store.commit('setZoomSpeed', 1 * newValue)
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
        return this.configuration.legendDisplay
      },
      set: function (newValue) {
        this.$store.commit('setLegendDisplay', newValue)
      }
    },
    ...mapState([
      'configuration'
    ])
  },
  mounted () {
    const popupEle = document.querySelector('.config_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$store.commit('togglePopup', 'configuration')
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
  }
}

</script>

<style scoped>
.config_radio_legend {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}
</style>
