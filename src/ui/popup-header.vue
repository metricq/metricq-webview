<template>
  <div class="modal-header">
    <h5 class="modal-title">
      {{ popupTitle }}
    </h5>
    <button
      type="button"
      class="close popup_close_button"
      data-dismiss="modal"
      aria-label="Close"
      @click="closePopup"
    >
      <span
        aria-hidden="true"
        class="close_button_symbol"
      >&times;</span>
    </button>
  </div>
</template>

<script>
import { veil } from './veil.js'

export default {
  props: {
    popupTitle: {
      type: String,
      default: ''
    }
  },
  methods: {
    closePopup: function (evt) {
      veil.destroy(evt)
    }
  }
}
</script>

<style scoped>

</style>
