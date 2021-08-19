import { Store } from './store.js'

export class MetricTimestamp {
  constructor (paramTime, paramStartEnd) {
    this.startEnd = paramStartEnd
    this.updateTime(paramTime)
  }

  updateTime (paramTime) {
    // timeValue is a string for relative times or a number for absolute times
    this.timeValue = paramTime
    if (this.startEnd === 'start') {
      Store.setStartTime(this.getUnix())
    } else if (this.startEnd === 'end') {
      Store.setEndTime(this.getUnix())
    }
  }

  getUnix () {
    if (!isNaN(parseInt(this.timeValue))) {
      return parseInt(this.timeValue)
    } else {
      const stringToUnixMap = {
        now: moment(),
        startday: moment().startOf('day')
      }
      const timeArray = ['y', 'M', 'd', 'h', 'm', 's']
      const splitTime = String(this.timeValue).split('-')
      const unixTime = stringToUnixMap[splitTime[0]]
      for (let i = 1; i < splitTime.length; ++i) {
        const split = splitTime[i]
        if (timeArray.includes(split.charAt(split.length - 1))) {
          unixTime.subtract(parseInt(split.substring(0, split.length - 1)), split.charAt(split.length - 1))
        } else {
          console.log('Fehler beim Umwandeln von String to Unix in Zeitstempel')
        }
      }
      return unixTime.valueOf()
    }
  }

  getValue () {
    return this.timeValue
  }
}
