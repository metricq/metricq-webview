<template>
  <div
    class="modal popup_div analyze_popup_div"
    tabindex="-1"
    role="dialog"
    @click="closePopupModal"
  >
    <div
      class="modal-dialog modal-xl"
      role="document"
    >
      <div class="modal-content">
        <popup-header :popup-title="popupTitle" />
        <div class="modal-body">
          <analyzeTable />
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-primary popup_ok"
            @click="closePopup"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { veil } from './veil.js'
import PopupHeader from './popup-header.vue'
import AnalyzeTable from '../components/analyzeTable'

export default {
  components: {
    PopupHeader, AnalyzeTable
  },
  props: {},
  data: function () {
    return {
      popupTitle: 'Analyse'
    }
  },
  computed: {},
  mounted () {
    const popupEle = document.querySelector('.analyze_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$store.commit('togglePopup', 'analyze')
        window.MetricQWebView.instances[0].reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
    }
  },
  methods: {
    closePopup (evt) {
      veil.destroy(evt)
    },
    closePopupModal: function (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    }
  }
}
</script>

<style scoped>

</style>
