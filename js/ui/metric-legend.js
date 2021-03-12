Vue.component('metric-legend', {
  props: ['metric'],
  template: '<li class="btn btn-light legend_item" style="background-color: #FFFFFF; margin-top: 10px;" v-on:click="metricPopup(metric.name)">' +
    '<div v-if="metric.name" v-bind:class="metric.popupKey" v-bind:style="{ backgroundColor: metric.color}">' +
    '&nbsp;' + // "<img src=\"img/icons/droplet.svg\" width=\"24\" height=\"24\">"
    '</div> &nbsp;' +
    '<span v-html="metric.htmlName"></span>&nbsp;' +
    '<img v-if="metric.name" src="img/icons/pencil.svg" width="28" height="28" />' +
    '</li>',
  methods: {
    metricPopup: function (metricName) {
      // console.log(metricName);
      const myMetric = window.MetricQWebView.instances[0].getMetric(metricName)
      if (myMetric) {
        myMetric.popup = !myMetric.popup
      }
      popupApp.$forceUpdate()
      Vue.nextTick(initializeMetricPopup)
    }
  }
})
