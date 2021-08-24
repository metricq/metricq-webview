import { Store } from '../store.js'

// @vue/component
export const NewMetricLegend = {
  methods: {
    newMetricPopup: function () {
      Store.togglePopup('newmetric')
    }
  },
  template: `
    <li class="btn btn-light legend_item" style="background-color: #FFFFFF; margin-top: 10px;" v-on:click="newMetricPopup">
      <span v-once>Neu</span>
      <img src="img/icons/plus-circle.svg" />
    </li>`
}
