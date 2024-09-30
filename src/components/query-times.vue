<template>
  <li
    v-if="hasMetrics"
    :class="'legend_end legend_item legend_item_' + configuration.legendDisplay + ' legend_list_' + configuration.legendDisplay + '_bottom'"
  >
    <span>
      Anfragezeit: {{ performance.querytime | withDecimalPlaces(0) }} ms;
      Gesamtzeit: {{ performance.totaltime | withDecimalPlaces(0) }} ms
    </span>
  </li>
</template>

<script>
export default {
  props: {
    performance: {
      type: Object,
      required: true
    },
    configuration: {
      type: Object,
      required: true
    }
  },
  computed: {
    hasMetrics () {
      return this.$store.getters['metrics/length']() > 0
    }
  }
}
</script>

<style scoped>

</style>
