<template>
  <li
    v-if="hasMetrics"
    :class="'clickable legend_end legend_item legend_item_' + position"
    @click="onRecolorClicked"
  >
    <span>
      <b-icon-palette />
      <span class="m-2 d-none d-sm-inline">
        Metriken eindeutig einfärben
      </span>
    </span>
  </li>
</template>

<script>
import distinctColors from 'distinct-colors'

export default {
  props: {
    position: {
      type: String,
      required: true
    }
  },
  computed: {
    hasMetrics () {
      return this.$store.getters['metrics/length']() > 0
    }
  },
  methods: {
    onRecolorClicked () {
      const palette = distinctColors({ count: this.$store.getters['metrics/length'](), lightMin: 25, lightMax: 75 }).values()
      for (const metric of this.$store.getters['metrics/getAll']()) {
        const color = palette.next().value.css()
        this.$store.dispatch('metrics/updateColor', { metricKey: metric.key, color: color })
      }
    }
  }
}
</script>

<style scoped>
</style>
