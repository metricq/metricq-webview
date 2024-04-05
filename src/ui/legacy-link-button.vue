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
      const startTime = window.MetricQWebView.handler.startTime.getValue()
      const endTime = window.MetricQWebView.handler.stopTime.getValue()

      const target = {
        cntr: [],
        start: startTime,
        stop: endTime
      }

      for (const metricKey of this.$store.getters['metrics/getAllKeys']()) {
        target.cntr.push(metricKey)
      }

      return this.$store.getters.getLegacyLink() + '#' + JSURL.stringify(target)
    }
  }
}
</script>

<style scoped>
</style>
