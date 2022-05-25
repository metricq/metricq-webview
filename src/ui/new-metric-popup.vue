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
            v-model="value"
            track-by="title"
            select-label=""
            deselect-label=""
            selected-label=""
            :options="options"
            :multiple="true"
            :searchable="true"
            :internal-search="false"
            :clear-on-select="false"
            :close-on-select="false"
            :options-limit="3000"
            :limit="5"
            :limit-text="limitText"
            :max-height="searchHeight"
            :show-no-results="false"
            :hide-selected="false"
            :custom-label="customLabel"
            placeholder="Metrik suchen"
            @open="firstSearch"
            @search-change="changeSearch"
            @close="keepOpen"
          >
            <template
              slot="option"
              slot-scope="props"
            >
              <span>{{ multiselectLabel(props.option.title, props.option.desc) }}</span>
            </template>
          </VueMultiSelect>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-primary btn-metric"
            @click="addMetrics"
          >
            <img
              src="img/icons/plus-circle.svg"
              width="28"
              height="28"
            >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PopupHeader from './popup-header.vue'
import { veil } from './veil.js'
import Vue from 'vue'
import VueMultiSelect from 'vue-multiselect'
import { DuplicateMetricError } from '@/errors'
import style from 'vue-multiselect/dist/vue-multiselect.min.css'

export default {
  components: {
    PopupHeader,
    VueMultiSelect
  },
  props: {},
  data: function () {
    return {
      popupTitle: 'Metriken hinzufügen',
      value: null,
      options: [],
      requestCount: 0,
      searchHeight: document.body.scrollHeight * 0.60
    }
  },
  mounted () {
    const popupEle = document.querySelector('.new_metric_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$store.commit('togglePopup', 'newmetric')
        window.MetricQWebView.instances[0].reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
      this.$refs.multi.activate()
    }
  },
  methods: {
    customLabel ({ title }) {
      return `${title}`
    },
    multiselectLabel (title, desc) {
      if (desc) {
        return `${title} – ${desc}`
      } else {
        return `${title} – no description`
      }
    },
    limitText (count) {
      return `und ${count} weitere Metriken`
    },
    keepOpen () {
      if (veil.myPopup) {
        this.$refs.multi.activate()
      }
    },
    addMetrics: function (evt) {
      if (this.value != null) {
        for (const item of this.value) {
          window.MetricQWebView.instances[0].addMetric(item.title, item.desc)
        }
      }
      this.closePopup(evt)
    },
    closePopup (evt) {
      veil.destroy(evt)
    },
    closePopupModal: function (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    },
    changeSearch (value) {
      const instance = window.MetricQWebView.instances[0]
      const requestId = ++this.requestCount
      instance.handler.searchMetricsPromise(value, true).then(matches => {
        if (requestId < this.requestCount) {
          return
        }
        this.options.length = 0
        for (let i = 0; i < Object.keys(matches).length; ++i) {
          this.options.push({
            title: Object.keys(matches)[i],
            desc: Object.values(matches)[i].description
          })
        }
      })
    },
    firstSearch (value) {
      this.changeSearch('')
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
