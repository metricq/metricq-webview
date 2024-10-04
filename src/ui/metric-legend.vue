<template>
  <li
    :class="[{ 'no_drawing' : !draw } , 'legend_item', 'legend_item_' + position]"
  >
    <table>
      <tr>
        <td>
          <div
            :class="[metric.popupKey, 'clickable']"
            :style="{ backgroundColor: color }"
            @click="metricPopup"
          />
        </td>
        <td>
          <span
            ref="metricName"
            :class="['metricText', peakedClass]"
          >
            <span
              v-if="metric.factor !== 1"
              class="factor"
            >
              {{ metric.factor }} ×
            </span>
            {{ metric.key }}
            <span v-if="metric.unit">
              [{{ metric.unit }}]
            </span>
          </span>
        </td>
        <td v-if="!multiline || position==='bottom'">
          <span
            v-if="metric.description"
            class="metricText"
          >&nbsp;-&nbsp;</span>
          <span
            v-if="metric.description"
            ref="metricDesc"
            class="metricText"
          >{{ metric.description }}</span>
        </td>
        <td>
          <span class="clickables">
            <b-icon-eye-fill
              v-if="draw"
              class="clickable"
              @click="toggleDraw"
            />
            <b-icon-eye-slash
              v-else
              class="clickable"
              @click="toggleDraw"
            />
            &nbsp;
            <b-icon-pencil
              class="clickable"
              variant="primary"
              @click="metricPopup"
            />&nbsp;
            <b-icon-trash
              class="clickable"
              variant="danger"
              @click="trashcanClicked"
            />
          </span>
        </td>
      </tr>
      <tr v-if="multiline && position === 'right'">
        <td colspan="3">
          <span
            v-if="metric.description"
            ref="metricDesc"
            class="metricText"
          >{{ metric.description }}</span>
        </td>
      </tr>
    </table>
  </li>
</template>

<script>

export default {
  props: {
    metric: {
      type: Object,
      required: true
    },
    position: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      multiline: false,
      maxwidth: 0
    }
  },
  computed: {
    draw () {
      return this.$props.metric.draw
    },
    color () {
      return this.$props.metric.draw ? this.$props.metric.color : 'grey'
    },
    peakedClass () {
      if (this.$store.getters['metrics/getPeakedMetric']() === this.metric.key) return 'peaked'

      return undefined
    }
  },
  updated () {
    this.maxwidth = this.$refs.metricName.clientWidth + this.$refs.metricDesc.clientWidth + 100
    this.onResize()
  },
  mounted () {
    this.ro = new ResizeObserver(this.onResize).observe(document.body)
    try {
      this.maxwidth = this.$refs.metricName.clientWidth + this.$refs.metricDesc.clientWidth + 100
    } catch (ignore) {}
  },
  methods: {
    metricPopup () {
      this.$store.commit('metrics/setPopup', {
        metricKey: this.$props.metric.key,
        popupState: !this.$props.metric.popup
      })
    },
    trashcanClicked () {
      window.MetricQWebView.deleteMetric(this.$props.metric.key)
    },
    onResize () {
      const style = getComputedStyle(document.body)
      const docMaxWidth = style.getPropertyValue('--legend_right_max_width').slice(0, -2) * document.body.clientWidth / 100
      this.multiline = this.maxwidth > docMaxWidth
    },
    toggleDraw () {
      window.MetricQWebView.toggleDraw(this.$props.metric.key)
    }
  }
}
</script>

<style scoped>
.metricText {
  margin-top: 1px;
  margin-bottom: -2px;
  display: inline-block;
  text-align: left;
}

.factor {
  font-weight: bold;
}

.no_drawing {
  background-color: lightgrey;
  color: grey;
}

.metricImg {
  float: right;
}

span {
  cursor: default;
}

table {
  width: 100%;
}

.clickables {
  display: flex;
  justify-content: flex-end;
  position: relative;
  top: 3px;
}

.peaked {
  font-weight: bold;
}
</style>
