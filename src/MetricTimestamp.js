import moment from 'moment'
import store from './store/'

export class MetricTimestamp {
  constructor (paramTime, paramStartEnd) {
    this.startEnd = paramStartEnd
    this.updateTime(paramTime)
  }

  updateTime (paramTime) {
    // timeValue is a string for relative times or a number for absolute times
    this.timeValue = paramTime
    if (this.startEnd === 'start') {
      store.commit('setStartTime', this.getUnix())
    } else if (this.startEnd === 'end') {
      store.commit('setEndTime', this.getUnix())
    }
  }

  getUnix () {
    if (!isNaN(parseInt(this.timeValue))) {
      return parseInt(this.timeValue)
    } else {
      const stringToUnixMap = {
        now: moment(),
        starthour: moment().startOf('hour'),
        endhour: moment().endOf('hour'),
        startday: moment().startOf('day'),
        endday: moment().endOf('day'),
        startweek: moment().startOf('week'),
        endweek: moment().endOf('week'),
        startmonth: moment().startOf('month'),
        endmonth: moment().endOf('month'),
        startyear: moment().startOf('year'),
        endyear: moment().endOf('year')
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

  getString () {
    return new Date(this.getUnix()).toLocaleString()
  }
}
