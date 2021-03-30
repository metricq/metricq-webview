import { veil } from './veil.js'
import { PopupHeader } from './popup-header.js'
import { Store } from '../store.js'

// @vue/component
export const ExportPopup = {
  components: { PopupHeader },
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
      popupTitle: 'Export',
      configuration: Store.state.configuration
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
        this.configuration.exportFormat = newValue
      }
    },
    exportWidth: {
      get: function () {
        return this.configuration.exportWidth
      },
      set: function (newValue) {
        this.configuration.exportWidth = parseInt(newValue)
      }
    },
    exportHeight:
      {
        get: function () {
          return this.configuration.exportHeight
        },
        set: function (newValue) {
          this.configuration.exportHeight = parseInt(newValue)
        }
      }
  },
  mounted () {
    const popupEle = document.querySelector('.export_popup_div')
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
    doExport: function () {
      const instance = window.MetricQWebView.instances[0]
      instance.doExport()
      veil.destroy()
      this.$emit('toggle', false)
    },
    closePopupModal: function (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    }
  },
  template: `<div class="modal popup_div export_popup_div" tabindex="-1" role="dialog" v-on:click="closePopupModal">
    <div class="modal-dialog" role="document">
    <div class="modal-content">
    <popup-header v-bind:popupTitle="popupTitle"></popup-header>
    <div class="modal-body">
    <div class="form-group row">
    <label class="col-sm-3 col-form-label" for="export_width">Breite</label>
    <div class="col-sm-7">
    <input type="number" id="export_width" v-model="exportWidth" class="form-control"/>
    </div></div>
    <div class="form-group row">
    <label class="col-sm-3 col-form-label" for="export_height">Höhe</label>
    <div class="col-sm-7">
    <input type="number" id="export_height" v-model="exportHeight" class="form-control" />
    </div></div>
    <div class="form-group row">
    <label class="col-sm-3 col-form-label" for="export_format">Dateiformat</label>
    <div class="col-sm-7">
    <select size="1" id ="export_format" v-model="selectedFileformat" class="form-control custom-select" style="width: 100%;">
    <option v-for="fileformatName in fileformats" v-bind:value="fileformatName">{{ fileformatName }}</option>
    </select>
    </div></div>
    </div>
    <div class="modal-footer">
    <button class="btn btn-primary" v-on:click="doExport">
    <img src="img/icons/image.svg" width="28" height="28" />
     Export</button>
    </div>
    </div>
    </div>
    </div>`
}
