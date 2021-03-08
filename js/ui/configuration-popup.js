Vue.component('configuration-popup', {
  'props': ['config'],
  'template': '<div class="modal popup_div config_popup_div" tabindex="-1" role="dialog">'
    + '<div class="modal-dialog" role="document">'
    + '<div class="modal-content">'
    + '<popup-header v-bind:popupTitle="popupTitle"></popup-header>'
    + '<div class="modal-body">'
    + '<div class="form-group row">'
    + '<label class="col-sm-6 col-form-label" for="resolution_input">Auflösung</label>'
    + '<div class="col-sm-6">'
    + '<input type="range" class="form-control" id="resolution_input" v-model="uiResolution" min="0" max="29" step="0.25"/>'
    + '</div></div>'
    + '<div class="form-group row">'
    + '<label class="col-sm-6 col-form-label" for="zoom_speed_input">Zoom Geschwindigkeit</label>'
    + '<div class="col-sm-6">'
    + '<input type="range" class="form-control" id="zoom_speed_input" v-model.sync="uiZoomSpeed" min="1" max="100" step="0.5"/>'
    + '</div></div>'
    + '<h5 class="modal-title">Bedienung</h5>'
    + '<div id="ui_configurator">'
    + '<div class="form-group row" >'
    + '<label class="col-sm-5 col-form-label">Funktion</label>'
    + '<label class="col-sm-4 col-form-label">Event</label>'
    + '<label class="col-sm-3 col-form-label">Tasten</label>'
    + '</div>'
    + '<interaction-array-option v-for="action in uiInteractArr" v-bind:action="action" v-bind:key="action[2]"></interaction-array-option>'
    + '</div>'
    + '</div>'
    + '<div class="modal-footer">'
    + '<button class="btn btn-primary popup_ok">'
    + 'OK'
    + '</button>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>',
  'data': function () {
    return {
      'popupTitle': 'Globale-Einstellungen'
    }
  },
  'computed': {
    'uiResolution': {
      cache: false,
      get: function () {
        return 30 - window.MetricQWebView.instances[0].configuration.resolution
      },
      set: function (newValue) {
        window.MetricQWebView.instances[0].configuration.resolution = 30 - newValue
        this.$emit('update:uiResolution', newValue)
      }
    },
    'uiZoomSpeed': {
      cache: false,
      get: function () {
        return window.MetricQWebView.instances[0].configuration.zoomSpeed
      },
      set: function (newValue) {
        window.MetricQWebView.instances[0].configuration.zoomSpeed = newValue
        this.$emit('update:uiZoomSpeed', newValue)
      }
    },
    'uiInteractArr': {
      cache: false,
      get: function () {
        return uiInteractArr
      },
      set: function (newValue) {
        uiInteractArr = newValue
      }
    }
  }
})