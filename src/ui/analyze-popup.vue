<template>
  <div
    class="modal popup_div analyze_popup_div"
    tabindex="-1"
    role="dialog"
    @click="closePopupModal"
  >
    <div
      class="modal-dialog modal-dialog-scrollable modal-xl"
      role="document"
    >
      <div class="modal-content">
        <popup-header :popup-title="popupTitle" />
        <div class="modal-body">
          <div class="mb-3 text-center">
            Zeitraum von <b>{{ startTimeFormatted }}</b> bis <b>{{ endTimeFormatted }}</b> <span class="text-secondary">{{ timeLenghtFormatted }} Sekunden</span>
          </div>
          <analyzeTable />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { veil } from './veil.js'
import PopupHeader from './popup-header.vue'
import AnalyzeTable from '../components/analyzeTable'

export default {
  components: {
    PopupHeader, AnalyzeTable
  },
  props: {},
  data () {
    return {
      popupTitle: 'Analyse'
    }
  },
  computed: {
    startTimeFormatted () {
      return new Date(this.timestamp.start).toLocaleString()
    },
    endTimeFormatted () {
      return new Date(this.timestamp.end).toLocaleString()
    },
    ...mapState([
      'timestamp'
    ])
  },
  mounted () {
    const popupEle = document.querySelector('.analyze_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$store.commit('togglePopup', 'analyze')
        window.MetricQWebView.reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
    }
  },
  methods: {
    closePopup (evt) {
      veil.destroy(evt)
    },
    closePopupModal (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    }
  }
}
</script>

<style scoped>
</style>
