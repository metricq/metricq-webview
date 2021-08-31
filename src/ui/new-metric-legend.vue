<template>
  <li
    class="btn btn-light legend_item"
    style="background-color: #FFFFFF; margin-top: 10px;"
    @click="newMetricPopup"
  >
    <span v-once>Neu</span>
    <img src="img/icons/plus-circle.svg">
  </li>
</template>

<script>
import { Store } from '../store.js'

export default {
  methods: {
    newMetricPopup: function () {
      Store.togglePopup('newmetric')
    }
  }
}
</script>

<style scoped>

</style>
