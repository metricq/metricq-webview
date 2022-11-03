import Vue from 'vue'
import store from '@/store'
import jquery from 'jquery'

const METRICQ_BACKEND = process.env.VUE_APP_METRICQ_BACKEND
const [METRICQ_BACKEND_USER, METRICQ_BACKEND_PASSWORD] = process.env.VUE_APP_METRICQ_BACKEND_AUTH === undefined ? [undefined, undefined] : process.env.VUE_APP_METRICQ_BACKEND_AUTH.split(':')

class MetricQBackendConfig {
  constructor () {
    this.backend = METRICQ_BACKEND
    this.user = METRICQ_BACKEND_USER
    this.password = METRICQ_BACKEND_PASSWORD
  }
}

export async function getMetricQBackendConfig () {
  const config = new MetricQBackendConfig()
  try {
    const json = await jquery.ajax({
      url: 'configuration.json',
      type: 'GET',
      dataType: 'json'
    })
    config.backend = json.backend
    config.user = json.user
    config.password = json.password
  } catch (exc) {
    console.log('Could not load backend config.')
    console.log(exc)
  }
  if (config.backend === undefined) Vue.toasted.info('Could not find a suitable MetricQ backend configuration.', store.state.toastConfiguration)
  return config
}

export class Configuration {
  constructor (resolutionParam, zoomSpeedParam) {
    this.resolution = resolutionParam
    this.zoomSpeed = zoomSpeedParam
    this.popup = false
    this.key = 'configuration'
    this.lastWheelEvent = undefined
    this.exportFormat = 'pdf'
    this.exportWidth = 640
    this.exportHeight = 480
    this.legendDisplay = 'right'
  }
}

export class ToastConfig {
  constructor () {
    this.theme = 'toasted-primary'
    this.position = 'top-center'
    this.duration = 5000
  }
}
