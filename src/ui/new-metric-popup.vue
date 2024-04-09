<template>
  <div
    class="modal popup_div new_metric_popup_div"
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
        <div class="modal-body ">
          <VueMultiSelect
            ref="multi"
            track-by="name"
            select-label=""
            deselect-label=""
            selected-label=""
            :value="metrics"
            :options="options"
            :multiple="true"
            :searchable="true"
            :internal-search="false"
            :clear-on-select="false"
            :close-on-select="false"
            :options-limit="3000"
            :max-height="searchHeight"
            :show-no-results="false"
            :hide-selected="false"
            :custom-label="customLabel"
            placeholder="Metrik suchen"
            @select="onSelected"
            @remove="onRemoved"
            @open="changeSearch('')"
            @search-change="changeSearch"
            @close="keepOpen"
          >
            <template
              slot="option"
              slot-scope="props"
            >
              <span v-if="props.option.description">
                {{ props.option.name }} - {{ props.option.description }}
              </span>
              <span v-else>
                {{ props.option.name }}
              </span>
            </template>
          </VueMultiSelect>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-primary btn-metric"
            @click="addMetrics"
          >
            <b-icon-check2-circle />
            Anwenden
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PopupHeader from './popup-header.vue'
import { veil } from './veil.js'
import VueMultiSelect from 'vue-multiselect'

import { mapState } from 'vuex'

import style from 'vue-multiselect/dist/vue-multiselect.min.css'

export default {
  components: {
    PopupHeader,
    VueMultiSelect
  },
  props: {},
  data () {
    return {
      popupTitle: 'Metriken auswählen',
      value: null,
      options: [],
      requestCount: 0,
      searchHeight: document.body.scrollHeight * 0.60
    }
  },
  computed: {
    ...mapState({
      metrics: state => {
        const result = []
        for (const metric in state.metrics.metrics) {
          result.push({ name: metric })
        }
        return result
      }
    })
  },
  mounted () {
    const popupEle = document.querySelector('.new_metric_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$store.commit('togglePopup', 'newmetric')
        window.MetricQWebView.reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
      this.$refs.multi.activate()
    }
  },
  methods: {
    onSelected (metric) {
      window.MetricQWebView.addMetric(metric.name, metric.description)
    },
    onRemoved (metric) {
      window.MetricQWebView.deleteMetric(metric.name)
    },
    customLabel ({ name }) {
      return name
    },
    keepOpen () {
      if (veil.myPopup) {
        this.$refs.multi.activate()
      }
    },
    addMetrics (evt) {
      if (this.value != null) {
        for (const item of this.value) {
          window.MetricQWebView.addMetric(item.title, item.description)
        }
      }
      this.closePopup(evt)
    },
    closePopup (evt) {
      veil.destroy(evt)
    },
    closePopupModal (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    },
    async changeSearch (value) {
      const matches = await window.MetricQWebView.handler.searchMetricsPromise(value, true)
      this.options.length = 0
      for (let i = 0; i < Object.keys(matches).length; ++i) {
        this.options.push({
          name: Object.keys(matches)[i],
          description: Object.values(matches)[i].description
        })
      }
    }
  }
}
</script>

<style scoped>
.new_metric_popup_div {
  text-align: left;
}

.btn-metric {
  margin-top: 60vh
}
</style>
