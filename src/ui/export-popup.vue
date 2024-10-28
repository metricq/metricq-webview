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
              mit Wertetabelle
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
            class="w-100"
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
      // width and height from A7 with 300dpi for pdf
      // chosen as reasonable pixel count and ratio
      let width = 1240
      let height = 874
      if (this.exportAnalyze) {
        // why 27? Because that is the smallest number without a page break
        height -= document.getElementById('anaTable').offsetHeight + 27
      } else if (this.selectedFileformat !== 'pdf') {
        width = this.exportWidth
        height = this.exportHeight
      }

      const canvas = this.createNewCanvas(width, height)

      this.renderExportTo(canvas)

      let imageFormat = 'image/png'
      if (this.selectedFileformat !== 'pdf') {
        imageFormat = 'image/' + this.selectedFileformat
      }

      this.image = canvas.toDataURL(imageFormat)
      await this.waitNewCanvas()

      if (this.selectedFileformat === 'pdf') {
        this.$refs.html2Pdf.generatePdf()
      } else {
        const linkEle = document.createElement('a')
        linkEle.setAttribute('href', this.image)
        linkEle.setAttribute('download', 'MetricQ-WebView.' + this.selectedFileformat)
        linkEle.click()
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
    createNewCanvas (width, height) {
      const exportCanvas = document.createElement('canvas')
      exportCanvas.setAttribute('width', width)
      exportCanvas.setAttribute('height', height)
      return exportCanvas
    },
    renderExportTo (canvas) {
      const ctx = canvas.getContext('2d')

      const scale = this.selectedFileformat === 'pdf' ? 2 : 1
      canvas.width *= scale
      canvas.height *= scale
      ctx.scale(scale, scale)

      const margins = {
        top: window.MetricQWebView.margins.canvas.top + 16,
        bottom: window.MetricQWebView.margins.canvas.bottom,
        left: window.MetricQWebView.margins.canvas.left,
        right: window.MetricQWebView.margins.canvas.right + 16
      }

      const size = [
        canvas.width / scale,
        canvas.height / scale,
        margins.left,
        margins.top,
        canvas.width / scale - (margins.right + margins.left),
        canvas.height / scale - (margins.top + margins.bottom)
      ]

      window.MetricQWebView.graticule.draw(false, ctx, size)

      const timeRangeText = window.MetricQWebView.handler.startTime.getString() + ' - ' + window.MetricQWebView.handler.stopTime.getString()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'hanging'
      ctx.fillText(timeRangeText, size[4] / 2 + margins.left, 8)

      if (!this.exportAnalyze) {
        this.renderLegend(ctx, margins, size)
      }
    },
    renderLegend (ctx, margins, size) {
      const entries = []
      let longestLabel = ''
      for (const metric of this.$store.getters['metrics/getAll']()) {
        if (metric.draw) {
          let label = metric.key
          if (metric.unit) {
            label += ` [${metric.unit}]`
          }
          if (label.length > longestLabel) {
            longestLabel = label
          }
          entries.push({
            label,
            color: metric.color
          })
        }
      }
      const labelWidth = ctx.measureText(longestLabel).width

      const legendBox = {
        x: size[0] - labelWidth - margins.right - 20,
        y: margins.top,
        width: labelWidth + 20,
        height: entries.length * 20
      }

      // draw a white box with black border
      ctx.fillStyle = 'white'
      ctx.globalAlpha = 0.8
      ctx.fillRect(legendBox.x, legendBox.y, legendBox.width, legendBox.height)
      ctx.fillStyle = 'black'
      ctx.strokeRect(legendBox.x, legendBox.y, legendBox.width, legendBox.height)

      ctx.globalAlpha = 1
      ctx.textAlign = 'left'
      ctx.textBaseline = 'hanging'

      // draw each legend entry
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        // draw metric name and unit in black
        ctx.fillStyle = 'black'
        ctx.fillText(entry.label, legendBox.x + 16, 4 + legendBox.y + i * 20)

        // draw a 8x8-pixel square in the color of the metric
        ctx.fillStyle = entry.color
        ctx.fillRect(legendBox.x + 4, 4 + legendBox.y + i * 20, 8, 8)
      }
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
