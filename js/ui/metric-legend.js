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
      <div v-if="metric.name" v-bind:class="metric.popupKey" v-bind:style="{ backgroundColor: metric.color }">
        &nbsp; ${/* "<img src=\"img/icons/droplet.svg\" width=\"24\" height=\"24\">" */''}
      </div>
      <span v-html="metric.htmlName"></span>
      <img v-if="metric.name" src="img/icons/pencil.svg" v-on:click="metricPopup" />
      <img v-if="metric.name" src="img/icons/trash.svg" v-on:click="trashcanClicked" />
    </li>`
}
