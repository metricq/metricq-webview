<template>
  <li>
    <span>
      Zeiten:
      Query: {{ querytime | withDecimalPlaces(0) }} ms;
      Render: {{ rendertime | withDecimalPlaces(0) }} ms
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
    rendertime: {
      type: Number,
      required: true
    }
  }
}
</script>

<style scoped>

</style>
