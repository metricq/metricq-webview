<template>
  <div class="analyzeTable">
    <div v-if="$asyncComputed.entries.success">
      {{ finishedLoading() }}
    </div>
    <span class="time">Zeitraum: {{ startTimeFormatted }} - {{
      endTimeFormatted
    }}</span>
    <table style="border-collapse: collapse">
      <thead>
        <tr>
          <th />
          <th>Metrikname</th>
          <th>Beschreibung</th>
          <th>Min</th>
          <th>Max</th>
          <th>Avg</th>
          <th>Einheit</th>
          <th>Aggregate</th>
          <th>Raw</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="entry in entries"
          :key="entry.name"
          :class="entry.error? 'entry_error' : ''"
        >
          <td>
            <div
              class="box"
              :style="{ backgroundColor: entry.color }"
            />
          </td>
          <td class="text">
            {{ entry.name }}
          </td>
          <td class="text">
            {{ entry.desc }}
          </td>
          <td class="number">
            {{ entry.min | withDecimalPlaces(3) }}
          </td>
          <td class="number">
            {{ entry.max | withDecimalPlaces(3) }}
          </td>
          <td class="number">
            {{ entry.avg | withDecimalPlaces(3) }}
          </td>
          <td class="unit">
            {{ entry.unit }}
          </td>
          <td class="number">
            <template v-if="entry.agg !== null">
              {{ entry.agg | withDecimalPlaces(0) }}
            </template>
          </td>
          <td class="number">
            {{ entry.raw | withDecimalPlaces(0) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import moment from 'moment'

export default {
  name: 'AnalyzeTable',
  data () {
    return {
      loaded: false
    }
  },
  computed: {
    startTimeFormatted () {
      return moment(this.timestamp.start).format()
    },
    endTimeFormatted () {
      return moment(this.timestamp.end).format()
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
          promises.push(window.MetricQWebView.handler.metricQHistory.analyze(this.timestamp.start, this.timestamp.end).target(metricKey).run().then((data) => ({
            color: metric.color,
            name: metric.htmlName,
            desc: metric.description,
            unit: metric.unit,
            min: Object.values(data)[0].minimum,
            max: Object.values(data)[0].maximum,
            avg: Object.values(data)[0].mean,
            agg: metric.pointsAgg,
            raw: metric.pointsRaw
          }), () => ({
            name: metric.htmlName,
            desc: 'Fehler beim Laden der Metrik',
            unit: '-',
            min: 'NaN',
            max: 'NaN',
            avg: 'NaN',
            agg: 'NaN',
            raw: 'NaN',
            error: true
          })))
        }
        return Promise.all(promises)
      },
      default: [{ name: 'Bitte warten!', desc: 'Tabelle lädt!' }]
    }
  },
  methods: {
    finishedLoading () {
      this.$emit('finished')
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

.analyzeTable {
  text-align: center;
}

.time {
  display: inline-block;
}

.box {
  display: inline-block;
  width: 15px;
  height: 15px;
}
</style>
