<template>
  <li>
    <span>
      <span>Genutzte Punkte:</span>
      <span v-if="agg !== 0"> Aggregate: {{ agg | withDecimalPlaces(0) }}</span>
      <span> Raw: {{ raw | withDecimalPlaces(0) }}</span>
    </span>
  </li>
</template>

<script>
export default {
  props: {
    agg: {
      type: Number,
      required: true
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
