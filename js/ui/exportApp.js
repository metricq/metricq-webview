var exportApp = new Vue({
  'el': '#wrapper_popup_export',
  'data': {
    'globalPopup': globalPopup
  },
  updated () {
    var popupEle = document.querySelector('.export_popup_div')
    if (popupEle) {
      var disablePopupFunc = function () {
        globalPopup.export = false
        window.MetricQWebView.instances[0].reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
      var closeButtonEle = popupEle.querySelector('.popup_close_button')
      closeButtonEle.addEventListener('click', function () {
        veil.destroy()
        disablePopupFunc()
      })
      var modalEle = document.querySelector('.modal')
      modalEle.addEventListener('click', function (evt) {
        if ('dialog' == evt.target.getAttribute('role')) {
          veil.destroy()
          disablePopupFunc()
        }
      })
    }
  }
})