<template>
  <li
    v-if="hasMetrics"
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
  computed: {
    hasMetrics () {
      return this.$store.getters['metrics/length']() > 0
    }
  },
  methods: {
    clearAllButtonClicked: function () {
      this.$store.getters['metrics/getAllKeys']().forEach((metricBase) => window.MetricQWebView.deleteMetric(metricBase))
      this.$store.commit('setGlobalMinMax', true)
    }
  }
}
</script>

<style scoped>
</style>
