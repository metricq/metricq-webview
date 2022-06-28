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
            Legende
          </h5>
          <div class="form-group row">
            <label class="col-sm-5 col-form-label">
              Position
            </label>
            <div class="form-check form-check-inline">
              <div class="form-check form-check-inline">
                <input
                  id="legend_bottom"
                  v-model="uiLegendDisplay"
                  class="form-check-input"
                  type="radio"
                  name="legendDisplay"
                  value="bottom"
                >
                <label
                  class="form-check-label"
                  for="legend_bottom"
                >Unten</label>
              </div>
              <div class="form-check form-check-inline">
                <input
                  id="legend_right"
                  v-model="uiLegendDisplay"
                  class="form-check-input"
                  type="radio"
                  name="legendDisplay"
                  value="right"
                >
                <label
                  class="form-check-label"
                  for="legend_right"
                >Rechts</label>
              </div>
            </div>
          </div>
          <br>
          <h5 class="modal-title">
            Canvas
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PopupHeader from './popup-header.vue'
import { veil } from './veil.js'
import { mapState } from 'vuex'

export default {
  components: {
    PopupHeader
  },
  props: { },
  data () {
    return {
      popupTitle: 'Einstellungen'
    }
  },
  computed: {
    uiResolution: {
      cache: false,
      get () {
        return 30 - this.configuration.resolution
      },
      set (newValue) {
        this.$store.commit('setResolution', 30 - newValue)
      }
    },
    uiZoomSpeed: {
      cache: false,
      get () {
        return this.configuration.zoomSpeed
      },
      set (newValue) {
        this.$store.commit('setZoomSpeed', 1 * newValue)
      }
    },
    uiLegendDisplay: {
      cache: false,
      get () {
        return this.configuration.legendDisplay
      },
      set (newValue) {
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
.config_radio_legend {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}
</style>
