var xaxisApp = new Vue({
  'el': '#wrapper_popup_xaxis',
  'data': {
    'globalPopup': globalPopup
  },
  updated () {
    var popupEle = document.querySelector('.xaxis_popup_div')
    if (popupEle) {
      var disablePopupFunc = function () {
        globalPopup.xaxis = false
        window.MetricQWebView.instances[0].reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
      var closeButtonEle = popupEle.querySelector('.popup_close_button')
      var okEle = popupEle.querySelector('.popup_ok');
      [closeButtonEle, okEle].forEach(function (paramValue, paramIndex, paramArr) {
        paramValue.addEventListener('click', function () {
          veil.destroy()
          disablePopupFunc()
        })
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