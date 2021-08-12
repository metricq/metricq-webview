import { veil } from './veil.js'
import { PopupHeader } from './popup-header.js'
import { Store } from '../store.js'

// @vue/component
export const AnalyzePopup = {
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
      popupTitle: 'Analyse',
      configuration: Store.state.configuration
    }
  },
  computed: {
    starttimeFormatted: function () {
      return moment(Store.state.timestamp.start).format('DD/MM/YYYY HH:mm')
    },
    endtimeFormatted: function () {
      return moment(Store.state.timestamp.end).format('DD/MM/YYYY HH:mm')
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
    this.resetTable(true)
    this.fillTable(true)
  },
  methods: {
    closePopup (evt) {
      veil.destroy(evt)
    },
    closePopupModal: function (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    },
    resetTable (details = false) {
      const table = document.querySelector('.export_popup_div').getElementsByClassName('table_analyze')[0]
      let newTable = `
        <tr>
          <th>Metrikname</th>`
      if (details) {
        newTable += ` 
        <th>Beschreibung</th>`
      }
      newTable += `
          <th>Min</th>
          <th>Max</th>
          <th>Avg</th>
          <th>Einheit</th>
        </tr>`
      table.innerHTML = newTable
    },
    fillTable (details = false) {
      const table = document.querySelector('.export_popup_div').getElementsByClassName('table_analyze')[0]
      window.MetricQWebView.instances[0].graticule.data.metrics.forEach(item => {
        const name = item.name
        const description = item.meta.description
        const minMax = item.getAllMinMax(Store.state.timestamp.start, Store.state.timestamp.end)
        const avg = item.getAvg(Store.state.timestamp.start, Store.state.timestamp.end)
        const unit = item.meta.unit
        let newRow = `
          <tr>
            <td>${name}</td>`
        if (details) newRow += `<td>${description}</td>`
        newRow += `
            <td>${this.round(minMax[0])}</td>
            <td>${this.round(minMax[1])}</td>
            <td>${this.round(avg)}</td>
            <td>${unit}</td>
          </tr>`
        table.innerHTML += newRow
      })
    },
    round (number) {
      return Math.round((number + Number.EPSILON) * 100) / 100
    },
    changeTable (evt) {
      this.resetTable(evt.target.checked)
      this.fillTable(evt.target.checked)
    }
  },
  template: `
  <div class="modal popup_div export_popup_div" tabindex="-1" role="dialog" v-on:click="closePopupModal">
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <popup-header v-bind:popupTitle="popupTitle"></popup-header>
        <div class="modal-body">
          Zeitraum: {{starttimeFormatted}} - {{endtimeFormatted}}
          <input type="checkbox" checked v-on:change="changeTable">
          <table class="table_analyze" id="analyze_table" style="width:750px">
          </table>
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
