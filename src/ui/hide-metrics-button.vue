<template>
  <li
    v-if="hasMetrics"
    :class="'legend_double_item legend_item_' + position"
  >
    <span
      class="clickable legend_item legend_end"
      @click="onHideClicked"
    >
      <b-icon-eye-slash />
      <span class="d-none d-sm-inline">Metriken verstecken</span>
    </span>
    <span
      class="clickable legend_item legend_end"
      @click="onShowClicked"
    >
      <b-icon-eye-fill />
      <span class="d-none d-sm-inline">Metriken anzeigen</span>
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
    onHideClicked () {
      for (const metric of this.$store.getters['metrics/getAll']()) {
        if (metric.draw) window.MetricQWebView.toggleDraw(metric.key)
      }
    },
    onShowClicked () {
      for (const metric of this.$store.getters['metrics/getAll']()) {
        if (!metric.draw) window.MetricQWebView.toggleDraw(metric.key)
      }
    }
  }
}
</script>

<style scoped>
</style>
