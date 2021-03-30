import { PopupHeader } from './popup-header.js'
import { veil } from './veil.js'

// @vue/component
export const XaxisPopup = {
  components: {
    PopupHeader
  },
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
      popupTitle: 'Zeitachsen-Einstellungen'
    }
  },
  computed: {
    startDate: {
      get: function () {
        const dateObj = new Date(window.MetricQWebView.instances[0].handler.startTime)
        return dateObj.getFullYear() + '-' + ((dateObj.getMonth() + 1) < 10 ? '0' : '') + (dateObj.getMonth() + 1) + '-' + (dateObj.getDate() < 10 ? '0' : '') + dateObj.getDate()
      },
      set: function (newValue) {
        window.MetricQWebView.instances[0].handler.setTimeRange((new Date(newValue)).getTime() + (window.MetricQWebView.instances[0].handler.startTime % 86400000), undefined)
        window.MetricQWebView.instances[0].setPlotRanges(true, true)
      }
    },
    endDate: {
      get: function () {
        const dateObj = new Date(window.MetricQWebView.instances[0].handler.stopTime)
        return dateObj.getFullYear() + '-' + ((dateObj.getMonth() + 1) < 10 ? '0' : '') + (dateObj.getMonth() + 1) + '-' + (dateObj.getDate() < 10 ? '0' : '') + dateObj.getDate()
      },
      set: function (newValue) {
        window.MetricQWebView.instances[0].handler.setTimeRange(undefined, (new Date(newValue)).getTime() + (window.MetricQWebView.instances[0].handler.stopTime % 86400000))
        window.MetricQWebView.instances[0].setPlotRanges(true, true)
      }
    },
    startTime: {
      get: function () {
        const dateObj = new Date(window.MetricQWebView.instances[0].handler.startTime)
        return (dateObj.getHours() < 10 ? '0' : '') + dateObj.getHours() + ':' + (dateObj.getMinutes() < 10 ? '0' : '') + dateObj.getMinutes() + ':' + (dateObj.getSeconds() < 10 ? '0' : '') + dateObj.getSeconds()
      },
      set: function (newValue) {
        const dateObj = new Date(this.startDate + ' ' + newValue)
        window.MetricQWebView.instances[0].handler.setTimeRange(dateObj.getTime(), undefined)
        window.MetricQWebView.instances[0].setPlotRanges(true, true)
      }
    },
    endTime: {
      get: function () {
        const dateObj = new Date(window.MetricQWebView.instances[0].handler.stopTime)
        return (dateObj.getHours() < 10 ? '0' : '') + dateObj.getHours() + ':' + (dateObj.getMinutes() < 10 ? '0' : '') + dateObj.getMinutes() + ':' + (dateObj.getSeconds() < 10 ? '0' : '') + dateObj.getSeconds()
      },
      set: function (newValue) {
        const dateObj = new Date(this.endDate + ' ' + newValue)
        window.MetricQWebView.instances[0].handler.setTimeRange(undefined, dateObj.getTime())
        window.MetricQWebView.instances[0].setPlotRanges(true, true)
      }
    }
  },
  mounted () {
    const popupEle = document.querySelector('.xaxis_popup_div')
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
    closePopup (evt) {
      veil.destroy(evt)
    },
    closePopupModal: function (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    }
  },
  template: `<div class="modal popup_div xaxis_popup_div" tabindex="-1" role="dialog" v-on:click="closePopupModal">
    <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
    <popup-header v-bind:popupTitle="popupTitle"></popup-header>
    <div class="modal-body">
    <div class="form-group row">
    <label class="col-sm-3 col-form-label" for="start_date_time">Anfangszeit</label>
    <div class="col-sm-9">
    <input type="date" class="form-control col-sm-6" v-model="startDate" v-bind:max="endDate" required /><input type="time" class="form-control col-sm-6" v-model="startTime" id="start_date_time" step="1" required /><br/>
    </div>
    </div>
    <div class="form-group row">
    <label class="col-sm-3 col-form-label" for="end_date_time">Endzeit</label>
    <div class="col-sm-9">
    <input type="date" class="form-control col-sm-6" v-model="endDate" v-bind:min="startDate" required /><input type="time" class="form-control col-sm-6" id="end_date_time" v-model="endTime" step="1" required />
    </div>
    </div>
    ${/* TODO: put fancy time window selection here, like in ISSUE #17 */''}
    
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
