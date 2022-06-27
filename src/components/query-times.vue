<template>
  <li>
    <span>
      Anfragezeit: {{ querytime | withDecimalPlaces(0) }} ms;
      Gesamtzeit: {{ totaltime | withDecimalPlaces(0) }} ms
    </span>
  </li>
</template>

<script>
export default {
  props: {
    querytime: {
      type: Number,
      required: true
    },
    totaltime: {
      type: Number,
      required: true
    }
  }
}
</script>

<style scoped>

</style>
