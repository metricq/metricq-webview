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
          <table>
            <thead>
              <tr>
                <th>Metrikname</th>
                <th>Beschreibung</th>
                <th>Min</th>
                <th>Max</th>
                <th>Avg</th>
                <th>Einheit</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in entries"
                :key="entry.name"
                :class="entry.error? 'entry_error' : ''"
              >
                <td class="text">
                  {{ entry.name }}
                </td>
                <td class="text">
                  {{ entry.desc }}
                </td>
                <td class="number">
                  {{ entry.min }}
                </td>
                <td class="number">
                  {{ entry.max }}
                </td>
                <td class="number">
                  {{ entry.avg }}
                </td>
                <td class="unit">
                  {{ entry.unit }}
                </td>
              </tr>
            </tbody>
          </table>
          <span class="time">Zeitraum: {{ starttimeFormatted }} - {{
            endtimeFormatted
          }}</span>
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
import { mapState } from 'vuex'
import moment from 'moment'

export default {
  components: {
    PopupHeader
  },
  props: {},
  data: function () {
    return {
      popupTitle: 'Analyse'
    }
  },
  computed: {
    starttimeFormatted: function () {
      return moment(this.timestamp.start).format('DD/MM/YYYY HH:mm')
    },
    endtimeFormatted: function () {
      return moment(this.timestamp.end).format('DD/MM/YYYY HH:mm')
    },
    ...mapState([
      'timestamp'
    ])
  },
  asyncComputed: {
    entries: {
      get () {
        const promises = []
        for (const metricKey of this.$store.getters['metrics/getAllKeys']()) {
          const metric = this.$store.getters['metrics/get'](metricKey)
          const instance = window.MetricQWebView.instances[0]
          promises.push(instance.handler.metricQHistory.analyze(this.timestamp.start, this.timestamp.end).target(metricKey).run().then((data) => ({
            name: metric.htmlName,
            desc: metric.description,
            unit: metric.unit,
            min: this.convert(Object.values(data)[0].minimum),
            max: this.convert(Object.values(data)[0].maximum),
            avg: this.convert(Object.values(data)[0].mean)
          }), () => ({
            name: metric.htmlName,
            desc: 'Fehler beim Laden der Metrik',
            unit: '-',
            min: 'NaN',
            max: 'NaN',
            avg: 'NaN',
            error: true
          })))
        }
        return Promise.all(promises)
      },
      default: [{ name: 'Bitte warten!', desc: 'Tabelle lädt!' }]
    }
  },
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
    },
    convert (object) {
      return object.toLocaleString('de', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      })
    }
  }
}
</script>

<style scoped>
table, th, tr, td {
  border: 1px solid black;
}

table {
  margin-left: auto;
  margin-right: auto;
}

th, td {
  padding-left: 10px;
  padding-right: 10px;
}

.text {
  text-align: left;
}

.entry_error .text {
  text-align: center;
  color: red;
}
.number {
  text-align: right;
}

.entry_error .number {
  text-align: center;
  color: grey;
}

.unit {
  text-align: center;
}

.entry_error .unit {
  color: grey;
}

.time {
  margin-left: auto;
  margin-right: auto;
}
</style>
