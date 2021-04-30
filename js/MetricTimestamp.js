export class MetricTimestamp {
  constructor (paramTime) {
    // TODO: besserer Name für timeString und Erklärung
    this.timeString = paramTime
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
