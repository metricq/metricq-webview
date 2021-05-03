import { Store } from './store.js'

export class MetricTimestamp {
  constructor (paramStartEnd) {
    // TODO: besserer Name für timeString und Erklärung
    this.startEnd = paramStartEnd
  }

  updateTime (paramTime) {
    this.timeString = paramTime
    if (this.startEnd === 'start') {
      Store.setStartTime(this.getUnix())
    } else if (this.startEnd === 'end') {
      Store.setEndTime(this.getUnix())
    }
  }

  getUnix () {
    if (!isNaN(parseInt(this.timeString))) {
      return parseInt(this.timeString)
    } else {
      const stringToUnixMap = {
        now: moment(),
        startday: moment().startOf('day'),
        startweek: moment().startOf('week'),
        startmonth: moment().startOf('month')
      }
      const timeArray = ['y', 'M', 'd', 'h', 'm']
      const splitTime = String(this.timeString).split('-')
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
}
