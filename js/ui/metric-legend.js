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
    }
  },
  template: `
    <li class="btn btn-light legend_item" style="background-color: #FFFFFF; margin-top: 10px;" v-on:click="metricPopup">
      <div v-bind:class="metric.popupKey" v-bind:style="{ backgroundColor: metric.color }">
        &nbsp; ${/* "<img src=\"img/icons/droplet.svg\" width=\"24\" height=\"24\">" */''}
      </div>
      <span v-html="metric.htmlName"></span>
      <img src="img/icons/pencil.svg" />
    </li>`
}
