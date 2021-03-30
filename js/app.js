import { veil } from './uicode.js'
import { ConfigurationPopup } from './ui/configuration-popup.js'
import { ExportPopup } from './ui/export-popup.js'
import { MetricLegend } from './ui/metric-legend.js'
import { MetricPopup } from './ui/metric-popup.js'
import { PresetPopup } from './ui/preset-popup.js'
import { XaxisPopup } from './ui/xaxis-popup.js'
import { YaxisPopup } from './ui/yaxis-popup.js'
import { metricPresets } from './presets.js'

const globalPopup = {
  export: false,
  yaxis: false,
  xaxis: false,
  presetSelection: false
}
let globalSelectedPreset = Object.values(metricPresets).shift()

export function setGlobalSelectedPreset (newPreset) {
  globalSelectedPreset = newPreset
}

export { globalPopup, globalSelectedPreset }

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
    globalPopup
  },
  computed: {
    config: {
      cache: false,
      get: function () {
        if (window.MetricQWebView) {
          return window.MetricQWebView.instances[0].configuration
        } else {
          return { resolution: 2, zoomSpeed: 4 }
        }
      },
      set: function (newValue) {
        window.MetricQWebView.instances[0].configuration = newValue
      }
    },
    metricsList: {
      cache: false,
      get: function () {
        if (window.MetricQWebView) {
          return window.MetricQWebView.instances[0].handler.allMetrics
        } else {
          return {}
        }
      },
      set: function (newValue) {
        if (window.MetricQWebView) {
          window.MetricQWebView.instances[0].handler.allMetrics = newValue
        }
      }
    }
  },
  updated () {
    {
      const popupEle = document.querySelector('.config_popup_div')
      if (popupEle) {
        const disablePopupFunc = function () {
          window.MetricQWebView.instances[0].configuration.popup = false
          mainApp.$forceUpdate()
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
      window.MetricQWebView.instances[0].configuration.popup = !window.MetricQWebView.instances[0].configuration.popup
      this.$forceUpdate()
    }
  }
})
