import { veil } from './ui/veil.js'
import { ConfigurationPopup } from './ui/configuration-popup.js'
import { ExportPopup } from './ui/export-popup.js'
import { MetricLegend } from './ui/metric-legend.js'
import { MetricPopup } from './ui/metric-popup.js'
import { PresetPopup } from './ui/preset-popup.js'
import { XaxisPopup } from './ui/xaxis-popup.js'
import { YaxisPopup } from './ui/yaxis-popup.js'
import { Store } from './store.js'

const globalPopup = {
  export: false,
  yaxis: false,
  xaxis: false,
  presetSelection: false
}

export { globalPopup }

export const mainApp = new Vue({
  el: '#main_app',
  components: {
    ConfigurationPopup,
    ExportPopup,
    MetricLegend,
    MetricPopup,
    PresetPopup,
    XaxisPopup,
    YaxisPopup
  },
  data: {
    globalPopup,
    state: Store.state,
    configuration: Store.state.configuration,
    metricsList: Store.state.allMetrics
  },
  computed: {
  },
  updated () {
    {
      const popupEle = document.querySelector('.config_popup_div')
      if (popupEle) {
        const disablePopupFunc = function () {
          Store.disablePopup()
          window.MetricQWebView.instances[0].reload()
        }
        veil.create(function (evt) { disablePopupFunc() })
        veil.attachPopup(popupEle)
        const closeButtonEle = popupEle.querySelector('.popup_close_button')
        const okEle = popupEle.querySelector('.popup_ok');
        [closeButtonEle, okEle].forEach(function (paramValue, paramIndex, paramArr) {
          paramValue.addEventListener('click', function () {
            veil.destroy()
            disablePopupFunc()
          })
        })
        const modalEle = document.querySelector('.modal')
        modalEle.addEventListener('click', function (evt) {
          if (evt.target.getAttribute('role') === 'dialog') {
            veil.destroy()
            disablePopupFunc()
          }
        })
      }
    }
    {
      const popupEle = document.querySelector('.export_popup_div')
      if (popupEle) {
        const disablePopupFunc = function () {
          globalPopup.export = false
          window.MetricQWebView.instances[0].reload()
        }
        veil.create(disablePopupFunc)
        veil.attachPopup(popupEle)
        const closeButtonEle = popupEle.querySelector('.popup_close_button')
        closeButtonEle.addEventListener('click', function () {
          veil.destroy()
          disablePopupFunc()
        })
        const modalEle = document.querySelector('.modal')
        modalEle.addEventListener('click', function (evt) {
          if (evt.target.getAttribute('role') === 'dialog') {
            veil.destroy()
            disablePopupFunc()
          }
        })
      }
    }
    {
      const popupEle = document.querySelector('.preset_popup_div')
      if (popupEle) {
        const disablePopupFunc = function () {
          globalPopup.presetSelection = false
          window.MetricQWebView.instances[0].reload()
        }
        veil.create(disablePopupFunc, true)
        veil.attachPopup(popupEle)
        popupEle.style.width = '100%'
        popupEle.style.height = '100%'
        popupEle.style.left = '0px'
        popupEle.style.top = '0px'
        setTimeout(function () {
          const selectEle = document.getElementById('preset_select')
          selectEle.focus()
        }, 100)
      }
    }
    {
      const popupEle = document.querySelector('.xaxis_popup_div')
      if (popupEle) {
        const disablePopupFunc = function () {
          globalPopup.xaxis = false
          window.MetricQWebView.instances[0].reload()
        }
        veil.create(disablePopupFunc)
        veil.attachPopup(popupEle)
        const closeButtonEle = popupEle.querySelector('.popup_close_button')
        const okEle = popupEle.querySelector('.popup_ok');
        [closeButtonEle, okEle].forEach(function (paramValue, paramIndex, paramArr) {
          paramValue.addEventListener('click', function () {
            veil.destroy()
            disablePopupFunc()
          })
        })
        const modalEle = document.querySelector('.modal')
        modalEle.addEventListener('click', function (evt) {
          if (evt.target.getAttribute('role') === 'dialog') {
            veil.destroy()
            disablePopupFunc()
          }
        })
      }
    }
    {
      const popupEle = document.querySelector('.yaxis_popup_div')
      if (popupEle) {
        const disablePopupFunc = function () {
          globalPopup.yaxis = false
          window.MetricQWebView.instances[0].reload()
        }
        veil.create(disablePopupFunc)
        veil.attachPopup(popupEle)
        const closeButtonEle = popupEle.querySelector('.popup_close_button')
        const okEle = popupEle.querySelector('.popup_ok');
        [closeButtonEle, okEle].forEach(function (paramValue, paramIndex, paramArr) {
          paramValue.addEventListener('click', function () {
            veil.destroy()
            disablePopupFunc()
          })
        })
        const modalEle = document.querySelector('.modal')
        modalEle.addEventListener('click', function (evt) {
          if (evt.target.getAttribute('role') === 'dialog') {
            veil.destroy()
            disablePopupFunc()
          }
        })
      }
    }
  },
  methods: {
    togglePopup: function () {
      this.configuration.popup = !this.configuration.popup
    }
  }
})
