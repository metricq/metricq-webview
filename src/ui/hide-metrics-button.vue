<template>
  <li
    :class="'legend_double_item legend_item_' + position"
  >
    <span
      class="clickable legend_item legend_end"
      @click="onHideClicked"
    >
      <b-icon-eye-slash />
      <span
        v-once
        class="m-2"
      >Alle Metriken verstecken</span>
    </span>
    <span
      class="clickable legend_item legend_end"
      @click="onShowClicked"
    >
      <b-icon-eye-fill />
      <span
        v-once
        class="m-2"
      >Alle Metriken anzeigen</span>
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

.legend_double_item {
    padding: 0;
    display: inline-flex;
    column-gap: 10px;
}

.legend_double_item > .legend_item {
    display: inline-block;
    flex: 1;
    text-align: center;
}
</style>
