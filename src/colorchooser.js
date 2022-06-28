import { rgbToHsl, hslToRgb } from '../lib/color-conversion.js'
import store from './store/'

/* TODO: implement this as a vue-js component, maybe? */
export class Colorchooser {
  constructor (canvasEle, metricParam) {
    this.canvas = canvasEle
    this.metric = metricParam
    this.ctx = this.canvas.getContext('2d')
    this.mouseDown = false
    const colorMatches = metricParam.color.match(/rgb\(([0-9]+),([0-9]+),([0-9]+)\)/)
    const hslVal = rgbToHsl(colorMatches[1], colorMatches[2], colorMatches[3])
    this.colorVal = hslVal[0]
    this.width = parseInt(this.canvas.getAttribute('width'))
    this.height = parseInt(this.canvas.getAttribute('height'))
    this.onchange = undefined
    this.render()
    this.registerCallbacks()
  }

  render () {
    this.ctx.clearRect(0, 0, this.width, this.height)
    const barBaseY = 15
    const barHeight = 14
    for (let i = 0; i < 256; ++i) {
      const rgbArr = hslToRgb(i / 256.00, 1, 0.46)
      this.ctx.fillStyle = 'rgb(' + rgbArr[0] + ',' + rgbArr[1] + ',' + rgbArr[2] + ')'
      // this.ctx.beginPath();
      // this.ctx.moveTo(i, 30);
      // this.ctx.lineTo(i, 60);
      // this.ctx.stroke();
      this.ctx.fillRect(1 + 0.5 + i, barBaseY, 2, barHeight)
    }
    this.ctx.strokeStyle = '#000000'
    this.ctx.strokeRect(0.5, barBaseY - 0.5, 259, barHeight + 1)

    const colorX = this.colorVal * 256 + 1.5
    const rgbArr = hslToRgb(this.colorVal, 1, 0.46)
    this.ctx.fillStyle = 'rgb(' + rgbArr[0] + ',' + rgbArr[1] + ',' + rgbArr[2] + ')'
    this.ctx.beginPath()
    this.ctx.moveTo(colorX - 1, barBaseY - 4)
    this.ctx.lineTo(colorX - 7, barBaseY - 10)
    this.ctx.lineTo(colorX - 7, 1)
    this.ctx.lineTo(colorX + 7, 1)
    this.ctx.lineTo(colorX + 7, barBaseY - 10)
    this.ctx.lineTo(colorX + 1, barBaseY - 4)
    this.ctx.closePath()
    this.ctx.fill()
    this.ctx.strokeStyle = '#B0B0B0'
    this.ctx.beginPath()
    this.ctx.moveTo(colorX, 62)
    this.ctx.lineTo(colorX - 1, barBaseY + barHeight + 1)
    this.ctx.lineTo(colorX - 1, barBaseY - 4)
    this.ctx.lineTo(colorX - 7, barBaseY - 10)
    this.ctx.lineTo(colorX - 7, 1)
    this.ctx.lineTo(colorX + 7, 1)
    this.ctx.lineTo(colorX + 7, barBaseY - 10)
    this.ctx.lineTo(colorX + 1, barBaseY - 4)
    this.ctx.lineTo(colorX + 1, barBaseY + barHeight + 1)
    this.ctx.closePath()
    this.ctx.stroke()
  }

  onmousedown () {
    this.mouseDown = true
  }

  onmouseup () {
    this.mouseDown = false
  }

  onmousemove (evt) {
    if (this.mouseDown) {
      this.onclick(evt)
    }
  }

  onclick (evt) {
    const x = evt.layerX - 1 - 0.5 - parseInt(this.canvas.offsetLeft) - 15
    this.colorVal = x / 256
    if (this.colorVal > 1) {
      this.colorVal = 1
    } else if (this.colorVal < 0) {
      this.colorVal = 0
    }
    this.render()
    const rgbArr = hslToRgb(this.colorVal, 1, 0.46)
    store.dispatch('metrics/updateColor', { metricKey: this.metric.key, color: 'rgb(' + rgbArr[0] + ',' + rgbArr[1] + ',' + rgbArr[2] + ')' })
    if (this.onchange) {
      this.onchange()
    }
  }

  registerCallbacks () {
    this.canvas.addEventListener('mousedown', () => this.onmousedown())
    this.canvas.addEventListener('mouseup', () => this.onmouseup())
    this.canvas.addEventListener('mousemove', (evt) => this.onmousemove(evt))
    this.canvas.addEventListener('click', (evt) => this.onclick(evt))
  }
}
