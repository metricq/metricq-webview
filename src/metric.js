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

  static normalizeSIUnits (unit) {
    switch (unit) {
      case 'kiloWatts':
      case 'kilowatts':
        return 'kW'
      case 'wattHours':
        return 'Wh'
      case 'kilowattHours':
        return 'kWh'
      case 'Watts':
      case 'watts':
        return 'W'
      case 'degC':
      case 'degreesCelsius':
        return '°C'
      case 'cubicMeters':
        return 'm³'
      case 'cubicMetersPerHour':
        return 'm³/h'
      case 'hertz':
        return 'Hz'
      case 'kilovoltAmperes':
      case 'kilovoltAmperesReactive':
        return 'kVA'
      case 'bytes':
        return 'B'
      case 'bars':
        return 'bar'
      case 'amperes':
        return 'A'
      case 'volts':
        return 'V'
      case 'kilovolts':
        return 'kV'
      case 'litersPerHour':
        return 'l/h'
      case 'litersPerMinute':
        return 'l/min'
      case 'litersPerSecond':
        return 'l/s'
      case 'metersPerSecond':
        return 'm/s'
      case 'None':
      case 'nan':
      case 'noUnits':
        return '1'
      case 'pascals':
        return 'Pa'
      case 'partsPerMillion':
        return 'ppm'
      case 'percent':
        return '%'
      case 'percentRelativeHumidity':
        return '%'
      case 'RPM':
        return 'rpm'
      case 'voltAmperes':
        return 'VA'
      case 'millimeters':
        return 'mm'
      case 'minutes':
        return 'min'
      case 'LMin':
        return 'l/min'
    }

    return unit
  }
}
