Vue.component('preset-popup', {
  'template': '<div class="modal popup_div preset_popup_div" tabindex="-1" role="dialog">'
    + '<div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">'
    + '<div class="modal-content">'
    + '<div class="modal-header">'
    + '<img src="img/metricq-logo.png" width="150" height="150" style="margin: 0px auto;"/>'
    + '</div>'
    + '<div class="modal-body">'
    + '<div style="float: left;">'
    + '<div class="form-group row">'
    + '<label for="preset_select" class="col-sm-3 form-control-plaintext leftalign">Preset</label>'
    + '<div class="col-sm-9">'
    + '<select class="form-control custom-select fullwidth" id="preset_select" size="1" v-on:change="updateList" v-on:keydown.enter="showMetrics">'
    + '<option class="fullwidth" v-for="(presetValue, presetIndex) in metricPresets" v-bind:value="presetIndex">{{ presetIndex }}</option>'
    + '</select>'
    + '</div></div>'
    + '<div v-if="anyMetrics" class="row">'
    + '<div class="col-sm-3" style="padding-left: 0px;"><label class="leftalign form-control-plaintext">Metriken:</label></div>'
    + '<div class="col-sm-9">'
    + '<ul class="list-group list_preset_show fullwidth">'
    + '<li v-for="metricName in metricMetriclist" v-if="0 < metricName.length" class="list-group-item fullwidth">'
    //            + "<img class=\"list_arrow_icon\" src=\"img/icons/arrow-return-right.svg\" width=\"32\" height=\"32\" />"
    //            + "<img class=\"list_arrow_icon\" src=\"img/icons/graph-up.svg\" width=\"32\" height=\"32\">"
    + '{{ metricName }}</li>'
    + '</ul>'
    + '</div></div></div></div>'
    + '<div class="modal-footer">'
    + '<button class="btn btn-primary" v-on:click="showMetrics">Anzeigen</button>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>',
  'computed': {
    metricPresets () {
      return metricPresets
    },
    'anyMetrics': {
      cache: false,
      get: function () {
        var metricStr = ''
        var ele = document.getElementById('preset_select')
        var referenceArr = undefined
        if (ele) {
          referenceArr = metricPresets[ele.value]
        } else if (metricPresets['no preset']) {
          referenceArr = metricPresets['no preset']
        } else {
          return true
        }
        for (var curMetric in referenceArr) {
          metricStr += referenceArr[curMetric]
        }
        return 0 < metricStr.length
      },
      set: function (newValue) { }
    },
    'metricMetriclist': {
      cache: false,
      get: function () {
        var ele = document.getElementById('preset_select')
        if (ele) {
          return metricPresets[ele.value]
        } else {
          for (var attrib in metricPresets) {
            return metricPresets[attrib]
          }
        }
      },
      set: function (newValue) {}
    }
  },
  'methods': {
    'updateList': function () {
      globalSelectedPreset = metricPresets[document.getElementById('preset_select').value]
      this.$emit('update:metricMetriclist', metricPresets[document.getElementById('preset_select').value])
      // BEHOLD, the MAGIC of forceUpdate!
      this.$forceUpdate()
    },
    'showMetrics': function () {
      veil.destroy()
      globalPopup.presetSelection = false
      let hasEmptyMetric = false
      var i = 0
      var metricNamesArr = new Array()
      for (; i < globalSelectedPreset.length; ++i) {
        let metricName = globalSelectedPreset[i]
        if (0 == metricName.length) hasEmptyMetric = true
        metricNamesArr.push(metricName)
      }
      if (!hasEmptyMetric) {
        metricNamesArr.push('')
      }
      initializeMetrics(metricNamesArr, (new Date()).getTime() - 3600 * 1000 * 2, (new Date()).getTime())
      legendApp.$forceUpdate()
    }
  }
})