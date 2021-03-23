import { globalPopup, veil } from '../uicode.js'
import { importMetricUrl } from '../MetricQWebView.js'

// At Startup:
if (window.location.href.indexOf('#') > -1) {
  try {
    importMetricUrl()
  } catch (exc) {
    console.log('Could not import metrics.')
    console.log(exc)
  }
} else {
  Vue.nextTick(function () { globalPopup.presetSelection = true })
}

const presetApp = new Vue({
  el: '#wrapper_popup_preset',
  data: {
    globalPopup: globalPopup
  },
  updated () {
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
})
