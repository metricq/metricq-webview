export class Configuration {
  constructor (resolutionParam, zoomSpeedParam) {
    this.resolution = resolutionParam
    this.zoomSpeed = zoomSpeedParam
    this.popup = false
    this.key = 'configuration'
    this.lastWheelEvent = undefined
    this.exportFormat = 'png'
    this.exportWidth = 640
    this.exportHeight = 480
    this.legendDisplay = 'right'
  }
}

export class ToastConfig {
  constructor () {
    this.theme = 'outline'
    this.position = 'top-center'
    this.duration = 5000
  }
}
