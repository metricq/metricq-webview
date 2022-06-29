import Vue from 'vue'

export function importFilter () {
  Vue.filter('withDecimalPlaces', (value, digits) => {
    if (!value && value !== 0) return ''
    return value.toLocaleString('de', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    })
  })
}
