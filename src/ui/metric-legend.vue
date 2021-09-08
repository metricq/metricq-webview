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

export default {
  props: {
    metric: {
      type: Object,
      required: true
    }
  },
  methods: {
    metricPopup: function () {
      this.$store.commit('metrics/setPopup', { metricKey: this.$props.metric.name, popupState: !this.$props.metric.popup })
    },
    trashcanClicked: function () {
      window.MetricQWebView.instances[0].deleteMetric(this.$props.metric.name)
    }
  }
}
</script>

<style scoped>

</style>
