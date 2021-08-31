<template>
  <li
    class="btn btn-light legend_item"
    style="background-color: #FFFFFF; margin-top: 10px;"
  >
    <div
      :class="metric.popupKey"
      :style="{ backgroundColor: metric.color }"
    />
    {{ metric.htmlName }} - {{ metric.description }}
    <img
      src="img/icons/pencil.svg"
      @click="metricPopup"
    >
    <img
      src="img/icons/trash.svg"
      @click="trashcanClicked"
    >
  </li>
</template>

<script>
import { Store } from '../store.js'

export default {
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
  }
}
</script>

<style scoped>

</style>
