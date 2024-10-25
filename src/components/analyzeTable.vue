<template>
  <div class="analyzeTable">
    <div v-if="$asyncComputed.entries.success">
      {{ finishedLoading() }}
    </div>
    <b-table-simple
      small
      hover
      striped
      bordered
      caption-top
    >
      <b-thead>
        <b-tr>
          <b-th />
          <b-th>Metrik</b-th>
          <b-th>Beschreibung</b-th>
          <b-th>Min</b-th>
          <b-th>Avg</b-th>
          <b-th>Max</b-th>
          <b-th>Einheit</b-th>
          <b-th>Datenpunkte</b-th>
        </b-tr>
      </b-thead>
      <b-tbody>
        <b-tr
          v-for="entry in entries"
          :key="entry.key"
          :class="entry.error? 'entry_error' : ''"
        >
          <b-td class="color">
            <div
              class="box"
              :style="{ backgroundColor: entry.color }"
            />
          </b-td>
          <b-td class="text">
            {{ entry.key }}
          </b-td>
          <b-td class="text">
            {{ entry.desc }}
          </b-td>
          <b-td class="number">
            {{ entry.min | withDecimalPlaces(3) }}
          </b-td>
          <b-td class="number">
            {{ entry.avg | withDecimalPlaces(3) }}
          </b-td>
          <b-td class="number">
            {{ entry.max | withDecimalPlaces(3) }}
          </b-td>
          <b-td class="unit">
            {{ entry.unit }}
          </b-td>
          <b-td
            class="number"
          >
            <span
              v-b-tooltip.hover.noninteractive
              :title="`in ${entry.agg} Aggregates`"
            >
              {{ entry.raw | withDecimalPlaces(0) }}
            </span>
          </b-td>
        </b-tr>
      </b-tbody>
    </b-table-simple>
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
    timeLenghtFormatted () {
      return moment(this.timestamp.end).diff(moment(this.timestamp.start), 'seconds')
    },
    ...mapState([
      'timestamp'
    ])
  },
  asyncComputed: {
    entries: {
      get () {
        const promises = []
        for (const metric of this.$store.getters['metrics/getAll']()) {
          if (!metric.draw) continue

          promises.push(window.MetricQWebView.handler.metricQHistory.analyze(this.timestamp.start, this.timestamp.end).target(metric.key).run().then((data) => ({
            color: metric.color,
            key: metric.key,
            desc: metric.description,
            unit: metric.unit,
            min: Object.values(data)[0].minimum,
            max: Object.values(data)[0].maximum,
            avg: Object.values(data)[0].mean,
            agg: metric.pointsAgg,
            raw: metric.pointsRaw
          }), () => ({
            key: metric.key,
            color: metric.color,
            desc: 'Fehler beim Laden der Metrik',
            unit: '-',
            min: 'NaN',
            max: 'NaN',
            avg: 'NaN',
            agg: null,
            raw: '-',
            error: true
          })))
        }
        return Promise.all(promises)
      },
      default: [{ key: 'Bitte warten!', desc: 'Tabelle lädt!' }]
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

.entry_error .text {
  color: red;
}

.entry_error {
  color: grey;
}

.color {
  text-align: center;
}

.box {
  display: inline-block;
  vertical-align: baseline;
  width: 1.5ex;
  height: 1.5ex;
}
</style>
