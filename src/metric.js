import { hslToRgb } from '../lib/color-conversion.js'
import { crc32 } from '../lib/pseudo-crc32.js'
import store from './store/'

// adapted from https://plot.ly/python/marker-style/
// not working:
//   "cross-thin", "x-thin", "asterisk", "hash", "hash-dot", "y-up", "y-down", "y-left", "y-right",
//   "line-ew", "line-ns", "line-ne", "line-nw"
const markerSymbols = ['.', 'o', 'v', '^', '<', '>', 's', 'p', '*', 'h', '+', 'x', 'd', '|', '_']
export { markerSymbols }

export class MetricHelper {
  static filterKey (paramKey) {
    return paramKey.replace(/[^_a-zA-Z0-9]/g, '_').replace(/__+/g, '_')
  }

  static metricBaseToRgb (metricBase) {
    const rgbArr = hslToRgb((crc32(metricBase) >> 24 & 255) / 255.00, 1, 0.46)
    return 'rgb(' + rgbArr[0] + ',' + rgbArr[1] + ',' + rgbArr[2] + ')'
  }

  static metricBaseToMarker (metricBase) {
    return markerSymbols[crc32(metricBase) % markerSymbols.length]
  }
}
