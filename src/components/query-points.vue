<template>
  <li
    v-if="hasMetrics"
    :class="'legend_end legend_item legend_item_' + configuration.legendDisplay + ' legend_list_' + configuration.legendDisplay + '_last'"
  >
    <span>
      <span>Datenpunkte:</span>
      <span> Raw: {{ performance.raw | withDecimalPlaces(0) }}
        <span v-if="performance.agg !== null">( Aggregate: {{ performance.agg | withDecimalPlaces(0) }} )</span>
      </span>
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
