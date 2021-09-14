<template>
  <li
    :class="'legend_item legend_item_' + position"
  >
    <div
      :class="metric.popupKey"
      :style="{ backgroundColor: metric.color }"
    />
    <span class="metricText">&nbsp;{{ metric.htmlName }}</span>
    <span
      v-if="metric.description"
      class="metricText"
    >&nbsp;-
      {{ metric.description }}</span>
    &nbsp;
    <img
      class="metricImg metricImgLeft clickable"
      src="img/icons/pencil.svg"
      @click="metricPopup"
    >
    <img
      class="metricImg clickable"
      src="img/icons/trash.svg"
      @click="trashcanClicked"
    >
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
  methods: {
    metricPopup: function () {
      this.$store.commit('metrics/setPopup', {
        metricKey: this.$props.metric.name,
        popupState: !this.$props.metric.popup
      })
    },
    trashcanClicked: function () {
      window.MetricQWebView.instances[0].deleteMetric(this.$props.metric.name)
    }
  }
}
</script>

<style scoped>
.metricText {
  margin-top: 1px;
  margin-bottom: -2px;
}

.metricImg {
  margin-top: 3px;
}

.metricImgLeft {
  margin-left: auto
}

span {
  cursor: default;
}
</style>
