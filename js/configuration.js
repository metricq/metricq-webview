class Configuration {
  constructor(resolutionParam, zoomSpeedParam)
  {
    this.resolution = resolutionParam;
    this.zoomSpeed = zoomSpeedParam;
    this.popup = false;
    this.key = "configuration";
    this.lastWheelEvent = undefined;
    this.exportFormat = "png";
    this.exportWidth  = 640;
    this.exportHeight = 480;
  }
}