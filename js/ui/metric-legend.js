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
  template: `<li class="btn btn-light legend_item" style="background-color: #FFFFFF; margin-top: 10px;" v-on:click="metricPopup">
    <div v-if="metric.name" v-bind:class="metric.popupKey" v-bind:style="{ backgroundColor: metric.color }">
    &nbsp; ${/* "<img src=\"img/icons/droplet.svg\" width=\"24\" height=\"24\">" */''}
    </div> &nbsp;
    <span v-html="metric.htmlName"></span>&nbsp;
    <img v-if="metric.name" src="img/icons/pencil.svg" width="28" height="28" />
    </li>`
}
