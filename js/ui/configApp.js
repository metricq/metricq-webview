const configApp = new Vue({
  el: '#wrapper_popup_configuration',
  methods: {
    togglePopup: function () {
      window.MetricQWebView.instances[0].configuration.popup = !window.MetricQWebView.instances[0].configuration.popup
      this.$forceUpdate()
    }
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
    }
  },
  updated () {
    const popupEle = document.querySelector('.config_popup_div')
    if (popupEle) {
      const disablePopupFunc = function () {
        window.MetricQWebView.instances[0].configuration.popup = false
        configApp.$forceUpdate()
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
})
