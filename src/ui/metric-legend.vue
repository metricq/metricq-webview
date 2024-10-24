<template>
  <li
    :class="[{ 'no_drawing' : !draw } , 'legend_item', 'legend_item_' + position]"
    @click="metricPopup"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <span>
      <div
        class="color_indicator clickable"
        :style="{ backgroundColor: color }"
      />
      <span class="actionables">
        <b-icon-eye-fill
          v-if="draw"
          class="clickable"
          @click.stop="toggleDraw"
        />
        <b-icon-eye-slash
          v-else
          class="clickable"
          @click.stop="toggleDraw"
        />
        <b-icon-pencil
          class="clickable"
          variant="primary"
          @click.stop="metricPopup"
        />
        <b-icon-trash
          class="clickable"
          variant="danger"
          @click.stop="trashcanClicked"
        />
      </span>     <span
        ref="metricName"
        :class="['metricText', { 'peaked': peaked }]"
      >
        <span
          v-if="metric.factor !== 1"
          class="factor"
        >
          {{ metric.factor }} ×
        </span>
        {{ metric.key }}
        <span
          v-if="metric.unit"
          class="d-none d-md-inline"
        >
          [{{ metric.unit }}]
        </span>
      </span>
      <span
        v-if="metric.description"
        class="description d-none d-md-inline"
      >
        {{ metric.description }}
      </span>

    </span>
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
  computed: {
    draw () {
      return this.$props.metric.draw
    },
    color () {
      return this.$props.metric.draw ? this.$props.metric.color : 'grey'
    },
    peaked () {
      return this.$store.getters['metrics/getPeakedMetric']() === this.metric.key
    }
  },
  methods: {
    onMouseEnter () {
      this.$store.commit('metrics/setPeakedMetric', { metric: this.metric.key })
      window.MetricQWebView.graticule.draw(false)
    },
    onMouseLeave () {
      this.$store.commit('metrics/setPeakedMetric', { metric: undefined })
      window.MetricQWebView.graticule.draw(false)
    },
    metricPopup () {
      this.$store.commit('metrics/setPopup', {
        metricKey: this.$props.metric.key,
        popupState: !this.$props.metric.popup
      })
    },
    trashcanClicked () {
      window.MetricQWebView.deleteMetric(this.$props.metric.key)
    },
    toggleDraw () {
      window.MetricQWebView.toggleDraw(this.$props.metric.key)
    }
  }
}
</script>

<style scoped>

.color_indicator {
    display: inline-block;
    min-width: 15px;
    height: 15px;
    border-radius: 4px;
    box-shadow: 0px 0px 0px 0px #000000;
    position: relative;
    top: 2px;
}

.factor {
  font-weight: bold;
}

.description {
  color: grey;
}

.no_drawing {
  background-color: lightgrey;
  color: grey;
}

span {
  cursor: default;
}

.actionables {
  float: right;
  display: flex;
  align-items: center;
  gap: 3px;
  margin: 4px 0px 0px 8px;
}

.peaked {
  font-weight: bold;
}
</style>
