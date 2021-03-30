import { metricPresets } from '../presets.js'
import { veil } from './veil.js'
import { initializeMetrics } from '../MetricQWebView.js'
import { globalPopup } from '../app.js'
import { Store } from '../store.js'

// @vue/component
export const PresetPopup = {
  computed: {
    metricPresets () {
      return metricPresets
    },
    anyMetrics: {
      cache: false,
      get: function () {
        let metricStr = ''
        const ele = document.getElementById('preset_select')
        let referenceArr
        if (ele) {
          referenceArr = metricPresets[ele.value]
        } else if (metricPresets['no preset']) {
          referenceArr = metricPresets['no preset']
        } else {
          return true
        }
        for (const curMetric in referenceArr) {
          metricStr += referenceArr[curMetric]
        }
        return metricStr.length > 0
      },
      set: function (newValue) { }
    },
    metricMetriclist () {
      return Store.state.selectedPreset
    }
  },
  methods: {
    updateList: function () {
      Store.setSelectedPreset(metricPresets[document.getElementById('preset_select').value])
      this.$emit('update:metricMetriclist', metricPresets[document.getElementById('preset_select').value])
    },
    showMetrics: function () {
      veil.destroy()
      globalPopup.presetSelection = false
      let hasEmptyMetric = false
      let i = 0
      const metricNamesArr = []
      for (; i < Store.state.selectedPreset.length; ++i) {
        const metricName = Store.state.selectedPreset[i]
        if (metricName.length === 0) hasEmptyMetric = true
        metricNamesArr.push(metricName)
      }
      if (!hasEmptyMetric) {
        metricNamesArr.push('')
      }
      initializeMetrics(metricNamesArr, (new Date()).getTime() - 3600 * 1000 * 2, (new Date()).getTime())
    }
  },
  template: `<div class="modal popup_div preset_popup_div" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
    <div class="modal-content">
    <div class="modal-header">
    <img src="img/metricq-logo.png" width="150" height="150" style="margin: 0px auto;"/>
    </div>
    <div class="modal-body">
    <div style="float: left;">
    <div class="form-group row">
    <label for="preset_select" class="col-sm-3 form-control-plaintext leftalign">Preset</label>
    <div class="col-sm-9">
    <select class="form-control custom-select fullwidth" id="preset_select" size="1" v-on:change="updateList" v-on:keydown.enter="showMetrics">
    <option class="fullwidth" v-for="(presetValue, presetIndex) in metricPresets" v-bind:value="presetIndex">{{ presetIndex }}</option>
    </select>
    </div></div>
    <div v-if="metricMetriclist.length > 0" class="row">
    <div class="col-sm-3" style="padding-left: 0px;"><label class="leftalign form-control-plaintext">Metriken:</label></div>
    <div class="col-sm-9">
    <ul class="list-group list_preset_show fullwidth">
    <li v-for="metricName in metricMetriclist" v-if="0 < metricName.length" class="list-group-item fullwidth">
    ${/*            + "<img class=\"list_arrow_icon\" src=\"img/icons/arrow-return-right.svg\" width=\"32\" height=\"32\" />" */''}
    ${/*             + "<img class=\"list_arrow_icon\" src=\"img/icons/graph-up.svg\" width=\"32\" height=\"32\">" */''}
    {{ metricName }}</li>
    </ul>
    </div></div></div></div>
    <div class="modal-footer">
    <button class="btn btn-primary" v-on:click="showMetrics">Anzeigen</button>
    </div>
    </div>
    </div>
    </div>`
}
