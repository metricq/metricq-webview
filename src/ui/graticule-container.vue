<template>
  <div
    id="wrapper_body"
    class="wrapper_body"
  >
    <div
      v-b-tooltip.hover
      class="btn btn-outline-secondary overlay"
      title="Wertebereich der Y-Achse einstellen"
      @click="togglePopup"
    >
      <b-icon-gear variant="dark" />
      <br>
      <b-icon-arrow-down-up variant="dark" />
    </div>
    <div
      id="webview_container"
      class="row_body"
    />
  </div>
</template>

<script>
export default {
  methods: {
    togglePopup: function () {
      this.$store.commit('togglePopup', 'yaxis')
    }
  }
}
</script>

<style scoped>
#wrapper_body {
    position: relative;
}

.overlay {
    position: fixed;
    margin-top: 6px;
    z-index: 1;
}
</style>
