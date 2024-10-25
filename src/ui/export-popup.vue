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
          <b-form-group label="Dateiformat">
            <b-form-select
              v-model="selectedFileformat"
              :options="fileformats"
            />
          </b-form-group>
          <b-form-group
            v-if="selectedFileformat !== 'pdf'"
            label="Breite"
            label-for="export_width"
          >
            <b-form-input
              id="export_width"
              v-model="exportWidth"
              type="number"
              class="form-control"
            />
          </b-form-group>
          <b-form-group
            v-if="selectedFileformat !== 'pdf'"
            label="Höhe"
            label-for="export_height"
          >
            <b-form-input
              id="export_height"
              v-model="exportHeight"
              type="number"
            />
          </b-form-group>
          <b-form-group v-if="selectedFileformat === 'pdf'">
            <b-form-checkbox v-model="exportAnalyze">
              mit Legende und Wertetabelle
            </b-form-checkbox>
          </b-form-group>
        </div>
        <div class="modal-footer">
          <legacy-link-button class="text-align-left" />
          <button
            class="btn btn-primary"
            :disabled="!analyzeTableReady && selectedFileformat === 'pdf' && exportAnalyze"
            @click="doExport"
          >
            <span
              v-if="analyzeTableReady || selectedFileformat !== 'pdf' || !exportAnalyze"
            >
              Export
            </span>
            <span v-else>Export lädt</span>
          </button>
        </div>
      </div>
    </div>
    <div>
      <VueHtml2pdf
        ref="html2Pdf"
        :show-layout="false"
        :float-layout="true"
        :enable-download="true"
        :preview-modal="true"
        filename="MetricQWebview"
        :pdf-quality="2"
        :manual-pagination="true"
        pdf-format="a4"
        pdf-orientation="landscape"
        pdf-content-width="99%"
      >
        <section slot="pdf-content">
          <img
            :src="image"
            style="height: 100%; width: 100%"
          >
          <div
            v-if="exportAnalyze"
            id="anaTable"
            class="anaTable mx-3"
          >
            <analyzeTable @finished="onAnalyzeTableLoaded" />
          </div>
        </section>
      </VueHtml2pdf>
    </div>
  </div>
</template>

<script>
import { veil } from './veil.js'
import PopupHeader from './popup-header.vue'
import { mapState } from 'vuex'
import AnalyzeTable from '.././components/analyzeTable.vue'
import LegacyLinkButton from './legacy-link-button.vue'

export default {
  components: { PopupHeader, AnalyzeTable, LegacyLinkButton },
  props: {},
  data () {
    return {
      popupTitle: 'Export',
      image: '',
      analyzeTableReady: false,
      exportAnalyze: false
    }
  },
  computed: {
    fileformats () {
      return ['png', 'jpeg', 'pdf']
    },
    selectedFileformat: {
      get () {
        return this.configuration.exportFormat
      },
      set (newValue) {
        this.$store.commit('setExportFormat', newValue)
      }
    },
    exportWidth: {
      get () {
        return this.configuration.exportWidth
      },
      set (newValue) {
        this.$store.commit('setExportWidth', parseInt(newValue))
      }
    },
    exportHeight:
        {
          get () {
            return this.configuration.exportHeight
          },
          set (newValue) {
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
        window.MetricQWebView.reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
    }
  },
  methods: {
    async doExport () {
      if (this.selectedFileformat === 'pdf') {
        let marginBottom = 0
        if (this.exportAnalyze) {
          marginBottom = document.getElementById('anaTable').offsetHeight
        }
        const canvas = this.createNewCanvas(marginBottom)
        this.addData(canvas)
        this.image = canvas.toDataURL('image/png')
        const result = await this.waitNewCanvas()
        this.$refs.html2Pdf.generatePdf()
      } else {
        window.MetricQWebView.doExport()
      }
      veil.destroy()
      this.$store.commit('togglePopup', 'export')
    },
    waitNewCanvas () {
      return new Promise((resolve) => {
        resolve('resolved')
      })
    },
    closePopupModal (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    },
    createNewCanvas (tableHeight) {
      const exportCanvas = document.createElement('canvas')
      exportCanvas.setAttribute('width', 1100)
      exportCanvas.setAttribute('height', 770 - tableHeight)
      return exportCanvas
    },
    addData (canvas) {
      const exportCanvasContext = canvas.getContext('2d')
      const scale = 2
      canvas.width *= scale
      canvas.height *= scale
      exportCanvasContext.scale(scale, scale)
      const margins = {
        top: window.MetricQWebView.margins.canvas.top + 16,
        bottom: window.MetricQWebView.margins.canvas.bottom,
        left: window.MetricQWebView.margins.canvas.left,
        right: window.MetricQWebView.margins.canvas.right + 16
      }
      const size = [canvas.width / scale, canvas.height / scale, margins.left,
        margins.top,
        canvas.width / scale - (margins.right + margins.left),
        canvas.height / scale - (margins.top + margins.bottom)]
      window.MetricQWebView.graticule.draw(false, exportCanvasContext, size)
      const timeRangeText = window.MetricQWebView.handler.startTime.getString() + ' - ' + window.MetricQWebView.handler.stopTime.getString()
      exportCanvasContext.textAlign = 'center'
      exportCanvasContext.fillText(timeRangeText, size[4] / 2 + margins.left, 15)
    },
    onAnalyzeTableLoaded () {
      this.analyzeTableReady = true
    }
  }
}
</script>

<style scoped>

.anaTable >>> * {
  font-size: 12px;
  border: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.anaTable >>> .box {
  width: 12px;
  height: 12px;
  margin-top: 5px;
}

</style>
