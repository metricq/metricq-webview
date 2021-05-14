import { Store } from '../store.js'

// @vue/component
export const MetricLegend = {
  props: {
    metric: {
      type: Object,
      required: true
    }
  },
  methods: {
    metricPopup: function () {
      const metricBase = Store.getMetricBase(this.$props.metric.name)
      Store.setMetricPopup(metricBase, !this.$props.metric.popup)
    },
    trashcanClicked: function () {
      const metricBase = Store.getMetricBase(this.$props.metric.name)
      window.MetricQWebView.instances[0].deleteMetric(metricBase)
    }
  },
  template: `
    <li class="btn btn-light legend_item" style="background-color: #FFFFFF; margin-top: 10px;" >
      <div v-bind:class="metric.popupKey" v-bind:style="{ backgroundColor: metric.color }">
      </div>
      <span v-html="metric.htmlName"></span> - <span v-html="metric.description"></span>
      <img src="img/icons/pencil.svg" v-on:click="metricPopup" />
      <img src="img/icons/trash.svg" v-on:click="trashcanClicked" />
    </li>`
}
