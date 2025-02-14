<template>
  <a
    v-if="hasLegacyLink"
    :href="legacyLink"
    class="btn btn-primary"
  >
    <span>
      <b-icon-graph-down />
      <span class="m-1">In Legacy Charts öffnen</span>
    </span>
  </a>
</template>

<script>

import JSURL from 'jsurl'

export default {
  computed: {
    hasLegacyLink () {
      return this.$store.getters.getLegacyLink() !== undefined
    },
    legacyLink () {
      const startTime = window.MetricQWebView.handler.startTime.getUnix()
      const endTime = window.MetricQWebView.handler.stopTime.getUnix()

      const target = {
        cntr: [],
        start: startTime,
        stop: endTime
      }

      for (const metric of this.$store.getters['metrics/getAll']()) {
        if (metric.factor === undefined || metric.factor === 1) {
          target.cntr.push(metric.key)
        } else {
          target.cntr.push([metric.key, metric.factor])
        }
      }

      return this.$store.getters.getLegacyLink() + '#' + JSURL.stringify(target)
    }
  }
}
</script>

<style scoped>
</style>
