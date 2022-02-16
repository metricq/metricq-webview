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
    toastConfiguration: new ToastConfig()
  },
  mutations: {
    setStartTime (state, time) {
      state.timestamp.start = time
    },
    setEndTime (state, time) {
      state.timestamp.end = time
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
    }
  },
  actions: {},
  modules: {
    metrics
  },
  strict: process.env.NODE_ENV !== 'production'
})
