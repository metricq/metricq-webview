//At Startup:
if (-1 < window.location.href.indexOf('#')) {
  try {
    importMetricUrl()
  } catch (exc) {
    console.log('Could not import metrics.')
    console.log(exc)
  }
} else {
  Vue.nextTick(function () { globalPopup.presetSelection = true })
}

var presetApp = new Vue({
  'el': '#wrapper_popup_preset',
  'data': {
    'globalPopup': globalPopup
  },
  updated () {
    var popupEle = document.querySelector('.preset_popup_div')
    if (popupEle) {
      var disablePopupFunc = function () {
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
        var selectEle = document.getElementById('preset_select')
        selectEle.focus()
      }, 100)
    }
  }
})