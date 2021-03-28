import { veil, globalPopup } from '../uicode.js'
import { ExportPopup } from './export-popup.js'

const exportApp = new Vue({
  el: '#wrapper_popup_export',
  components: {
    ExportPopup
  },
  data: {
    globalPopup: globalPopup
  },
  updated () {
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
})
