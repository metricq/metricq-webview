<template>
  <div
    id="wrapper_body"
  >
    <div id="webview_container" />
    <b-button
      v-b-tooltip.hover
      variant="outline-secondary"
      class="overlay"
      title="Wertebereich der Y-Achse einstellen"
      size="sm"
      @click="togglePopup"
    >
      <b-icon-border-left />
    </b-button>
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
    margin: 0px 10px 0px 10px;
    padding: 0 5px 0 5px;
    border-radius: 4px;
    background-color: white;
    box-shadow: 0px 1px 2px 1px #D0D0D0;
    flex: 1;
    position: relative;
}

#webview_container {
    touch-action: none;
}

.overlay {
    position: absolute;
    bottom: 10px;
    left: 10px;
    z-index: 1;
}
</style>
