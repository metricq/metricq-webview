import { crc32 } from '../lib/pseudo-crc32.js'
import distinctColors from 'distinct-colors'

export class MetricHelper {
  static filterKey (paramKey) {
    return paramKey.replace(/[^_a-zA-Z0-9]/g, '_').replace(/__+/g, '_')
  }

  static metricBaseToRgb (metric) {
    const PALETTE_SIZE = 37
    const palette = distinctColors({ count: PALETTE_SIZE, lightMin: 25, lightMax: 75 })
    const index = crc32(metric) % PALETTE_SIZE

    return palette[index].css()
  }
}
