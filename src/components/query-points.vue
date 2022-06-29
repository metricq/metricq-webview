<template>
  <li>
    <span>
      <span>Genutzte Punkte:</span>
      <span v-if="agg !== null"> Aggregate: {{ agg | withDecimalPlaces(0) }}</span>
      <span> Raw: {{ raw | withDecimalPlaces(0) }}</span>
    </span>
  </li>
</template>

<script>
export default {
  props: {
    agg: {
      type: Number,
      default: null
    },
    raw: {
      type: Number,
      required: true
    }
  }
}
</script>

<style scoped>

</style>
