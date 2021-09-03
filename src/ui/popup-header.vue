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
.popup_header {
  border-bottom: 1px solid #d0d0d0;
  background-color: #e8e8e8;
  height: 29px;
  text-align: left;
  padding: 0px 0px 0px 0.5em;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  box-shadow: inset -4px -1px 4px 0px #a0a0a0;
  user-select: none;
}

.popup_close_button {
  float: right;
  transform: translate(11px, -24px) scale(0.8);
}

.popup_close_button:hover {
  transform: translate(11px, -24px) scale(1);
}

.close_button_symbol {
  font-size: 36pt;
}
</style>
