export const veil = {
  myPopup: undefined,
  inDestroymentPhase: false,
  create: function (destroyCallback, solidVeil) {
    const oldVeil = document.getElementById('popup_veil')
    if (oldVeil !== null) {
      oldVeil.destroy()
    }

    let veilEle = document.createElement('div')
    veilEle.setAttribute('id', 'popup_veil')
    veilEle.style.width = window.innerWidth
    veilEle.style.height = window.innerHeight
    if (solidVeil) {
      veilEle.style.backgroundColor = '#808080'
      veilEle.style.opacity = 1
    }
    veilEle = document.getElementsByTagName('body')[0].appendChild(veilEle)
    veilEle.addEventListener('click', function (evt) { veil.destroy(evt) })
    veil.ondestroy = destroyCallback
    return veilEle
  },
  ondestroy: undefined,
  destroy: function (evt) {
    if (veil.inDestroymentPhase) {
      return undefined
    }
    veil.inDestroymentPhase = true
    if (veil.ondestroy && evt) {
      veil.ondestroy(evt)
    }

    const veilEle = document.querySelector('#popup_veil')
    if (veilEle) {
      veilEle.parentNode.removeChild(veilEle)
    }

    veil.myPopup = undefined
    veil.ondestroy = undefined
    veil.inDestroymentPhase = false
  },
  attachPopup: function (popupEle) {
    popupEle.style.top = Math.round(window.innerHeight / 2 - popupEle.offsetHeight / 2) + 'px'
    popupEle.style.left = Math.round(window.innerWidth / 2 - popupEle.offsetWidth / 2) + 'px'
    popupEle.style.zIndex = 500
    veil.myPopup = popupEle
  }
}
