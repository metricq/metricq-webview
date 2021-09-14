<template>
  <li
    :class="'clickable legend_end legend_item legend_item_' + position"
    @click="newMetricPopup"
  >
    <span>
      <span
        v-once
      >Neu&nbsp;</span>
      <img src="img/icons/plus-circle.svg">
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
    newMetricPopup: function () {
      this.$store.commit('togglePopup', 'newmetric')
    }
  }
}
</script>

<style scoped>

</style>
