<template>
  <li
    :class="'clickable legend_end legend_item legend_item_' + position"
    @click="newMetricPopup"
  >
    <span>
      <b-icon-plus-circle />
      <span
        v-once
        class="m-2 d-none d-sm-inline"
      >Metriken hinzufügen</span>
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
    newMetricPopup () {
      this.$store.commit('togglePopup', 'newmetric')
    }
  }
}
</script>

<style scoped>
</style>
