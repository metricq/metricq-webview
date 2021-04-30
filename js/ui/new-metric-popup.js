import { PopupHeader } from './popup-header.js'
import { veil } from './veil.js'
import { Store } from '../store.js'
import { Metric } from '../metric.js'

export const NewMetricPopup = {
  components: {
    PopupHeader
  },
  model: {
    prop: 'popupStatus',
    event: 'toggle'
  },
  props: {
    popupStatus: {
      type: Boolean,
      required: true
    }
  },
  data: function () {
    return {
      popupTitle: 'Metriken hinzufügen',
      value: null,
      options: []
    }
  },
  mounted () {
    const popupEle = document.querySelector('.new_metric_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$emit('toggle', false)
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
        if (title.length + desc.length >= 50) {
          return `${title} – ${desc.substring(0, 50 - title.length)} ...`
        } else {
          return `${title} – ${desc}`
        }
      } else {
        return `${title} – no description`
      }
    },
    limitText (count) {
      return `und ${count} weitere Metriken`
    },
    keepOpen () {
      this.$refs.multi.activate()
    },
    addMetrics: function (evt) {
      if (this.value != null) {
        this.value.forEach(function (item, index, array) {
          Store.setMetric(item.title, new Metric(window.MetricQWebView.instances[0], item.title, []))
        })
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
      instance.handler.searchMetricsPromise(value).then(matches => {
        this.options.length = 0
        for (let i = 0; i < matches.length; ++i) {
          instance.handler.metricQHistory.metadata(matches[i]).then((metadataObj) => {
            if (this.options.map(({ title }) => title).indexOf(matches[i]) === -1) {
              this.options.push({
                title: matches[i],
                desc: metadataObj.description
              })
            }
          })
        }
      })
    },
    firstSearch (value) {
      this.changeSearch('')
    }
  },
  template: `
    <div class="modal popup_div new_metric_popup_div" tabindex="-1" role="dialog" v-on:click="closePopupModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <popup-header v-bind:popupTitle="popupTitle"></popup-header>
          <div class="modal-body " >
            <VueMultiSelect v-model="value" ref="multi" track-by="title" :options="options" :multiple="true" :searchable="true" :internal-search="false" :clear-on-select="false" :close-on-select="false" :options-limit="3000" :limit="5" :limit-text="limitText" :max-height="250" :show-no-results="false" :hide-selected="false" :custom-label="customLabel" @open="firstSearch" @search-change="changeSearch" @close="keepOpen" placeholder="Metrik suchen" >
              <template slot="option" slot-scope="props">
                <span>{{ multiselectLabel(props.option.title,props.option.desc) }}</span>
              </template>
            </VueMultiSelect>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary btn-metric" v-on:click="addMetrics">
              <img src="img/icons/plus-circle.svg" width="28" height="28" />
              Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>`
}
