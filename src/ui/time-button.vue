<template>
  <div ref="date_range">
    <b-icon-clock-history class="d-none d-sm-inline" />
    <span class="d-inline d-sm-none">{{ starttime | formatShortDate }} - {{ endtime | formatShortDate }}</span>
    <span class="d-none d-sm-inline">&nbsp;{{ starttime | formatDate }} - {{ endtime | formatDate }}</span>
  </div>
</template>

<script>
import moment from 'moment'
import $ from 'jquery'
import 'daterangepicker'
import styles from 'daterangepicker/daterangepicker.css'

const labelMap = {
  'Letzte 15 Minuten': ['now-15m', 'now'],
  'Letzte Stunde': ['now-1h', 'now'],
  'Letzte 6 Stunden': ['now-6h', 'now'],
  'Letzte 24 Stunden': ['now-24h', 'now'],
  'Letzte 3 Tage': ['now-3d', 'now'],
  'Letzte 7 Tage': ['now-7d', 'now'],
  'Letzte 30 Tage': ['now-30d', 'now'],
  'Letzte 3 Monate': ['now-3M', 'now'],
  'Letzte 6 Monate': ['now-6M', 'now'],
  'Letztes Jahr': ['now-1y', 'now'],
  'Letzte 3 Jahre': ['now-3y', 'now'],
  Heute: ['startday', 'endday'],
  'Heute bis jetzt': ['startday', 'now'],
  Gestern: ['startday-1d', 'endday-1d'],
  'Diese Stunde': ['starthour', 'endhour'],
  'Diese Woche': ['startweek', 'endweek'],
  'Diese Woche bis jetzt': ['startweek', 'now'],
  'Dieser Monat': ['startmonth', 'endmonth'],
  'Dieser Monat bis jetzt': ['startmonth', 'now'],
  'Vorheriger Monat ': ['startmonth-1M', 'endmonth-1M'],
  'Dieses Jahr': ['startyear', 'endyear'],
  'Dieses Jahr bis jetzt': ['startyear', 'now'],
  'Vorheriges Jahr': ['startyear-1y', 'endyear-1y']
}

export default {
  filters: {
    formatDate: function (date) {
      return moment(date).format('DD.MM.YYYY, HH:mm')
    },
    formatShortDate: function (date, short) {
      return moment(date).format('DD.MM.YY HH:mm')
    }

  },
  props: {
    starttime: {
      type: Number,
      required: true
    },
    endtime: {
      type: Number,
      required: true
    }
  },
  mounted () {
    $(() => {
      const daterange = $(this.$refs.date_range)

      daterange.daterangepicker({
        startDate: moment(window.MetricQWebView.handler.startTime.getUnix()),
        endDate: moment(window.MetricQWebView.handler.stopTime.getUnix()),
        opens: 'left',
        cancelButtonClasses: 'btn btn-danger',
        timePicker: true,
        timePicker24Hour: true,
        timePickerSeconds: true,
        showCustomRangeLabel: false,
        alwaysShowCalendars: true,
        locale: {
          format: 'DD.MM.YYYY, HH:mm:ss',
          firstDay: 1,
          daysOfWeek: [
            'So',
            'Mo',
            'Di',
            'Mi',
            'Do',
            'Fr',
            'Sa'
          ],
          applyLabel: 'Anwenden',
          cancelLabel: 'Abbrechen',
          monthNames: [
            'Januar',
            'Februar',
            'März',
            'April',
            'Mai',
            'Juni',
            'Juli',
            'August',
            'September',
            'Oktober',
            'November',
            'Dezember'
          ]
        },
        ranges: labelMap
      }, (start, end, label) => {
        if (label) {
          window.MetricQWebView.handler.setRelativeTimes(labelMap[label][0], labelMap[label][1])
        } else {
          window.MetricQWebView.handler.setTimeRange(start.unix() * 1000, end.unix() * 1000)
        }
        window.MetricQWebView.reload()
        daterange.data('daterangepicker').setStartDate(moment(window.MetricQWebView.handler.startTime.getUnix()))
        daterange.data('daterangepicker').setEndDate(moment(window.MetricQWebView.handler.stopTime.getUnix()))
      })
    })
  }
}
</script>

<style>
.ranges {
    min-height: 33dvh;
    max-height: 70dvh;
    overflow-y: scroll;
}

</style>
