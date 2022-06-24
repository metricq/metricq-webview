<template>
  <li>
    <img
      src="img/icons/clock.svg"
      width="20"
      height="20"
    >&nbsp;
    <span>{{ starttimeFormatted }} - {{ endtimeFormatted }}</span>
  </li>
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
  Heute: ['startday', 'now']
}

export default {
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
  computed: {
    starttimeFormatted: function () {
      return moment(this.starttime).format('DD/MM/YYYY HH:mm')
    },
    endtimeFormatted: function () {
      return moment(this.endtime).format('DD/MM/YYYY HH:mm')
    }
  },
  mounted () {
    $(function () {
      const daterange = $('#date_range')

      daterange.daterangepicker({
        startDate: moment(window.MetricQWebView.instances[0].handler.startTime.getUnix()),
        endDate: moment(window.MetricQWebView.instances[0].handler.stopTime.getUnix()),
        opens: 'left',
        timePicker: true,
        timePicker24Hour: true,
        showCustomRangeLabel: false,
        alwaysShowCalendars: true,
        timePickerSeconds: true,
        locale: {
          format: 'DD/MM/YYYY HH:mm:ss',
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
      }, function (start, end, label) {
        if (label) {
          window.MetricQWebView.instances[0].handler.setRelativeTimes(labelMap[label][0], labelMap[label][1])
        } else {
          window.MetricQWebView.instances[0].handler.setTimeRange(start.unix() * 1000, end.unix() * 1000)
        }
        window.MetricQWebView.instances[0].reload()
        this.startDate = moment(window.MetricQWebView.instances[0].handler.startTime.getUnix())
        this.endDate = moment(window.MetricQWebView.instances[0].handler.stopTime.getUnix())
      })
    })
  }
}
</script>

<style scoped>

</style>
