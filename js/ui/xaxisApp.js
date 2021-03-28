import { globalPopup, veil } from '../uicode.js'
import { XaxisPopup } from './xaxis-popup.js'

const xaxisApp = new Vue({
  el: '#wrapper_popup_xaxis',
  components: {
    XaxisPopup
  },
  data: {
    globalPopup: globalPopup
  },
  updated () {
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
})
