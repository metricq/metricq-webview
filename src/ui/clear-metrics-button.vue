<template>
  <li
    :class="'clickable legend_end legend_item legend_item_' + position"
    @click="clearAllButtonClicked"
  >
    <span id="button_clear_all">
      <b-icon-trash />
      <span class="m-1">Alle Metriken entfernen</span>
    </span>
  </li>
</template>

<script>
export default {
  props: {
    position: {
      type: String,
      required: true
    }
  },
  methods: {
    clearAllButtonClicked: function () {
      this.$store.getters['metrics/getAllKeys']().forEach(metricBase => window.MetricQWebView.instances[0].deleteMetric(metricBase))
      this.$store.commit('setGlobalMinMax', true)
    }
  }
}
</script>

<style scoped>
</style>
