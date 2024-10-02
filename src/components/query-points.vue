<template>
  <li
    v-if="hasMetrics"
    :class="'legend_end legend_item legend_item_' + configuration.legendDisplay + ' legend_list_' + configuration.legendDisplay + '_last'"
  >
    <span>
      <span>Datenpunkte:</span>
      <span> {{ performance.raw | withDecimalPlaces(0) }} Punkte
        <span v-if="performance.agg !== null">in {{ performance.agg | withDecimalPlaces(0) }} Aggregate</span>
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
