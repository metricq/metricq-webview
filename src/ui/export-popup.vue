<template>
  <div
    class="modal popup_div export_popup_div"
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
              class="col-sm-3 col-form-label"
              for="export_width"
            >Breite</label>
            <div class="col-sm-7">
              <input
                id="export_width"
                v-model="exportWidth"
                type="number"
                class="form-control"
              >
            </div>
          </div>
          <div class="form-group row">
            <label
              class="col-sm-3 col-form-label"
              for="export_height"
            >Höhe</label>
            <div class="col-sm-7">
              <input
                id="export_height"
                v-model="exportHeight"
                type="number"
                class="form-control"
              >
            </div>
          </div>
          <div class="form-group row">
            <label
              class="col-sm-3 col-form-label"
              for="export_format"
            >Dateiformat</label>
            <div class="col-sm-7">
              <select
                id="export_format"
                v-model="selectedFileformat"
                size="1"
                class="form-control custom-select"
                style="width: 100%;"
              >
                <option
                  v-for="fileformatName in fileformats"
                  :key="fileformatName"
                >
                  {{
                    fileformatName
                  }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-primary"
            @click="doExport"
          >
            <img
              src="img/icons/image.svg"
              width="28"
              height="28"
            >
            Export
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { veil } from './veil.js'
import PopupHeader from './popup-header.vue'
import { mapState } from 'vuex'

export default {
  components: { PopupHeader },
  props: { },
  data: function () {
    return {
      popupTitle: 'Export'
    }
  },
  computed: {
    fileformats () {
      return ['png', 'jpeg']
    },
    selectedFileformat: {
      get: function () {
        return this.configuration.exportFormat
      },
      set: function (newValue) {
        this.$store.commit('setExportFormat', newValue)
      }
    },
    exportWidth: {
      get: function () {
        return this.configuration.exportWidth
      },
      set: function (newValue) {
        this.$store.commit('setExportWidth', parseInt(newValue))
      }
    },
    exportHeight:
        {
          get: function () {
            return this.configuration.exportHeight
          },
          set: function (newValue) {
            this.$store.commit('setExportHeight', parseInt(newValue))
          }
        },
    ...mapState(['configuration'])
  },
  mounted () {
    const popupEle = document.querySelector('.export_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$store.commit('togglePopup', 'export')
        window.MetricQWebView.instances[0].reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
    }
  },
  methods: {
    doExport: function () {
      const instance = window.MetricQWebView.instances[0]
      instance.doExport()
      veil.destroy()
      this.$store.commit('togglePopup', 'export')
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

</style>
