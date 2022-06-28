<template>
  <li
    :class="'legend_item legend_item_' + position"
  >
    <table>
      <tr>
        <td>
          <div
            :class="metric.popupKey"
            :style="{ backgroundColor: metric.color }"
          />
        </td>
        <td>
          <span
            ref="metricName"
            class="metricText"
          >&nbsp;{{ metric.htmlName }}</span>
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
        metricKey: this.$props.metric.name,
        popupState: !this.$props.metric.popup
      })
    },
    trashcanClicked () {
      window.MetricQWebView.instances[0].deleteMetric(this.$props.metric.name)
    },
    onResize () {
      const style = getComputedStyle(document.body)
      const docMaxWidth = style.getPropertyValue('--legend_right_max_width').slice(0, -2) * document.body.clientWidth / 100
      this.multiline = this.maxwidth > docMaxWidth
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
</style>
