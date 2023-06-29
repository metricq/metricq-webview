import Vue from 'vue'
import Vuex from 'vuex'
import { Configuration, ToastConfig } from '@/configuration'
import metrics from '@/store/metrics'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    configuration: new Configuration(5, 10),
    globalMinMax: true,
    popups: {
      export: false,
      yaxis: false,
      configuration: false,
      link: false,
      newmetric: false,
      analyze: false
    },
    timestamp: {
      start: 0,
      end: 0
    },
    performance: {
      querytime: 0,
      totaltime: 0,
      agg: 0,
      raw: 0
    },
    toastConfiguration: new ToastConfig(),
    isWebviewLoaded: false
  },
  mutations: {
    setStartTime (state, time) {
      state.timestamp.start = time
    },
    setEndTime (state, time) {
      state.timestamp.end = time
    },
    setQueryTime (state, time) {
      state.performance.querytime = time
    },
    setTotalTime (state, time) {
      state.performance.totaltime = time
    },
    setAggregatePoints (state, agg) {
      state.performance.agg = agg
    },
    setRawPoints (state, raw) {
      state.performance.raw = raw
    },
    setGlobalMinMax (state, newState) {
      state.globalMinMax = newState
    },
    togglePopup (state, name) {
      Vue.set(state.popups, name, !state.popups[name])
    },
    setLegendDisplay (state, newValue) {
      state.configuration.legendDisplay = newValue
    },
    setResolution (state, newValue) {
      state.configuration.resolution = newValue
    },
    setZoomSpeed (state, newValue) {
      state.configuration.zoomSpeed = newValue
    },
    setExportHeight (state, newValue) {
      state.configuration.exportHeight = newValue
    },
    setExportWidth (state, newValue) {
      state.configuration.exportWidth = newValue
    },
    setExportFormat (state, newValue) {
      state.configuration.exportFormat = newValue
    },
    setIsWebviewLoaded (state, newValue) {
      state.isWebviewLoaded = newValue
    }
  },
  actions: {},
  modules: {
    metrics
  },
  strict: process.env.NODE_ENV !== 'production'
})
