/* eslint-env jquery */
// @vue/component
export const TimeButton = {
  props: {
    tstart: {
      type: Number,
      required: true
    },
    tend: {
      type: Number,
      required: true
    }
  },
  computed: {
    ststart: function () {
      return moment(this.tstart).format('DD/MM/YYYY HH:mm')
    },
    stend: function () {
      return moment(this.tend).format('DD/MM/YYYY HH:mm')
    }
  },
  mounted () {
    $(function () {
      const daterange = $('#date_range')

      daterange.daterangepicker({
        'startDate': moment(window.MetricQWebView.instances[0].handler.startTime.getUnix()),
        'endDate': moment(window.MetricQWebView.instances[0].handler.stopTime.getUnix()),
        opens: 'left',
        timePicker: true,
        timePicker24Hour: true,
        showCustomRangeLabel: false,
        alwaysShowCalendars: true,
        locale: {
          format: 'DD/MM/YYYY HH:mm',
          firstDay: 1,
          'daysOfWeek': [
            'So',
            'Mo',
            'Di',
            'Mi',
            'Do',
            'Fr',
            'Sa'
          ],
          'monthNames': [
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
        ranges: window.MetricQWebView.instances[0].handler.labelMap
      }, function (start, end, label) {
        if (label) {
          window.MetricQWebView.instances[0].handler.setrelativeTimes(label)
        } else {
          window.MetricQWebView.instances[0].handler.setTimeRange(start.unix() * 1000, end.unix() * 1000)
        }
        window.MetricQWebView.instances[0].reload()
        this.startDate = moment(window.MetricQWebView.instances[0].handler.startTime.getUnix())
        this.endDate = moment(window.MetricQWebView.instances[0].handler.stopTime.getUnix())
      })
    })
  },
  template: `
    <li>
      <img src="img/icons/clock.svg" width="20" height="20">&nbsp;
      {{ststart}} - {{stend}}
    </li>`
}