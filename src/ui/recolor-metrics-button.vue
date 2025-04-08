<template>
  <li
    v-if="hasMetrics"
    :class="'legend_double_item legend_item_' + position"
  >
    <span
      class="clickable legend_item legend_end"
      @click="onClassicRecolorClicked"
    >
      <b-icon-brush />
      <span class="d-none d-sm-inline">
        Klassisch einfärben
      </span>
    </span>

    <span
      class="clickable legend_item legend_end"
      @click="onRecolorClicked"
    >
      <b-icon-palette2 />
      <span class="d-none d-sm-inline">
        Eindeutig einfärben
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
    },
    onClassicRecolorClicked () {
      const palette = [
        '#ff0000',
        '#008000',
        '#0000ff',
        '#ffa500',
        '#800080',
        '#8b4513',
        '#808000',
        '#800000',
        '#00ff00',
        '#ffff00',
        '#cc0000',
        '#006600',
        '#0000cc',
        '#cc8400',
        '#660066',
        '#6f370f',
        '#666600',
        '#660000',
        '#00cc00'
      ]
      let i = 0

      for (const metric of this.$store.getters['metrics/getAll']()) {
        const color = palette[i++ % palette.length]
        this.$store.dispatch('metrics/updateColor', { metricKey: metric.key, color: color })
      }
    }
  }
}
</script>

<style scoped>
</style>
