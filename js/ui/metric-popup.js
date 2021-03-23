import { markerSymbols } from '../metric.js'

Vue.component('metric-popup', {
  props: ['metric'],
  template: '<div v-bind:id="metric.popupKey" class="modal popup_div metric_popup_div" tabindex="-1" role="dialog">' +
    '<div class="modal-dialog" role="document">' +
    '<div class="modal-content">' +
    '<popup-header v-bind:popupTitle="popupTitle"></popup-header>' +
    '<div class="modal-body">' +
    '<div class="form-group row">' +
    '<label class="col-sm-2 col-form-label" for="input_metric_name">Name</label>' +
    '<div class="col-sm-10">' +
    '<input type="text" list="autocomplete_metric" id="input_metric_name" class="popup_input form-control" v-model="metric.name" />' +
    '<datalist id="autocomplete_metric">' +
    // using v-for here doesn't work :(
    // + "<option v-for=\"suggestion in autocompleteList\" v-bind:value=\"suggestion\">{{ suggestion }}</option>"
    '</datalist>' +
    '</div></div>' +
    '<div class="form-group row">' +
    '<label class="col-sm-2 col-form-label">Farbe</label>' +
    '<div class="col-sm-10">' +
    '<canvas class="popup_colorchooser form-control" width="345" height="32"></canvas>' + // 270,45
    '</div></div>' +
    '<div class="form-group row">' +
    '<label class="col-sm-2 col-form-label" for="select_marker">Symbol</label>' +
    '<div class="col-sm-10">' +
    '<select id="select_marker" class="form-control custom-select popup_legend_select" size="1" v-bind:value="metric.marker" v-on:change="changeMarker">' +
    '<option v-for="symbol in markerSymbols" v-bind:value="symbol">{{ symbol }}</option>' +
    '</select>' +
    '</div></div>' +
    '</div>' +
    '<div class="modal-footer">' +
    '<button v-if="!isEmpty" class="btn btn-danger">' +
    '<img src="img/icons/trash.svg" class="popup_trashcan" width="26" height="26" />' +
    '</button>' +
    '<button class="btn btn-primary popup_ok">' +
    '{{ saveButtonText }}' +
    '</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>',
  data: function () {
    return {
      markerSymbols: markerSymbols,
      popupTitle: 'Metrik-Eigenschaften'
    }
  },
  computed: {
    saveButtonText: {
      get: function () {
        return this.metric.name === '' ? 'Erstellen' : 'OK'
      },
      set: function (newValue) {
        // do nothing
      }
    },
    isEmpty: {
      get: function () {
        return this.metric.name === ''
      },
      set: function (newValue) {
        // do nothing
      }
    }
  },
  methods: {
    changeMarker: function () {
      this.metric.updateMarker(document.querySelector('.popup_legend_select').value)
    }
  }
})
