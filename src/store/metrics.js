import Vue from 'vue'
import store from '@/store/index'
import { MetricHelper } from '@/metric'

export default {
  namespaced: true,
  state: {
    metrics: {}
  },
  getters: {
    getMetricDrawState: (state) => (metricName) => {
      const metric = state.metrics[metricName]
      return {
        drawMin: metric.drawMin,
        drawAvg: metric.drawAvg,
        drawMax: metric.drawMax
      }
    },
    getAllKeys: (state) => () => {
      return Object.keys(state.metrics)
    },
    getAll: (state) => () => {
      return Object.values(state.metrics)
    },
    get: (state) => (metricKey) => {
      return state.metrics[metricKey]
    }
  },
  mutations: {
    resetAll (state) {
      Object.keys(state.metrics).forEach(function (key) { if (!key.startsWith('_')) { Vue.delete(state.metrics, key) } })
    },
    privateRemoveEntry (state, { metricKey }) {
      Vue.delete(state.metrics, metricKey)
    },

    privateSet (state, { metricKey, metric: { name, description, color, traces, marker, errorprone, drawMin, drawMax, drawAvg } }) {
      if (name !== undefined && metricKey !== name) {
        throw new Error('metricKey and metric.name must be equal!')
      }
      if (state.metrics[metricKey] === undefined) {
        Vue.set(state.metrics, metricKey, {
          key: metricKey,
          name: metricKey,
          description: description || '',
          marker: marker || MetricHelper.metricBaseToMarker(metricKey),
          color: color || MetricHelper.metricBaseToRgb(metricKey),
          traces: traces || [],
          errorprone: errorprone === undefined ? false : errorprone,
          popup: false,
          drawMin: drawMin === undefined ? store.state.globalMinMax : drawMin,
          drawAvg: drawAvg === undefined ? true : drawAvg,
          drawMax: drawMax === undefined ? store.state.globalMinMax : drawMax,
          popupKey: 'popup_' + MetricHelper.filterKey(metricKey),
          htmlName: metricKey
        })
      } else {
        if (name !== undefined) {
          Vue.set(state.metrics[metricKey], 'name', name)
          Vue.set(state.metrics[metricKey], 'htmlName', name)
          Vue.set(state.metrics[metricKey], 'popupKey', 'popup_' + MetricHelper.filterKey(name))
        }
        if (description !== undefined) {
          Vue.set(state.metrics[metricKey], 'description', description)
        }
        if (color !== undefined) {
          Vue.set(state.metrics[metricKey], 'color', color)
        }
        if (traces !== undefined) {
          Vue.set(state.metrics[metricKey], 'traces', traces)
        }
        if (marker !== undefined) {
          Vue.set(state.metrics[metricKey], 'marker', marker)
        }
        if (errorprone !== undefined) {
          Vue.set(state.metrics[metricKey], 'errorprone', errorprone)
        }
        if (drawMin !== undefined) {
          Vue.set(state.metrics[metricKey], 'drawMin', drawMin)
        }
        if (drawAvg !== undefined) {
          Vue.set(state.metrics[metricKey], 'drawAvg', drawAvg)
        }
        if (drawMax !== undefined) {
          Vue.set(state.metrics[metricKey], 'drawMax', drawMax)
        }
      }
    },

    setPopup (state, { metricKey, popupState }) {
      if (state.metrics[metricKey]) {
        Vue.set(state.metrics[metricKey], 'popup', popupState)
      } else {
        throw new Error('Metric not found!')
      }
    }
  },
  actions: {
    checkGlobalDrawState ({ commit, getters }) {
      const stateArray = []
      const metricsArray = getters.getAll()
      document.getElementById('checkbox_min_max').indeterminate = false
      if (metricsArray.length > 0) {
        metricsArray.forEach(metric => {
          stateArray.push(metric.drawMin)
          stateArray.push(metric.drawMax)
        })

        if (stateArray.includes(true) && stateArray.includes(false)) {
          commit('setGlobalMinMax', false, { root: true })
          document.getElementById('checkbox_min_max').indeterminate = true
        } else {
          commit('setGlobalMinMax', stateArray[0], { root: true })
        }
      }
    },
    delete ({ commit, dispatch }, { metricKey }) {
      commit('privateRemoveEntry', { metricKey: metricKey })
      dispatch('checkGlobalDrawState')
    },

    create ({ commit, state, dispatch, getters }, { metric: { name, description, color, traces, marker, errorprone, drawMin, drawMax, drawAvg } }) {
      if (state.metrics[name] !== undefined) {
        throw new Error('Metric already exists!')
      }

      commit('privateSet', { metricKey: name, metric: { name, description, color, traces, marker, errorprone, drawMin, drawMax, drawAvg } })
      const metric = state.metrics[name]
      // marker and color are stored here and deep inside MetricQWebView/MetricHandler/Graticule and the traces
      dispatch('updateColor', { metricKey: name, color: metric.color })
      dispatch('updateMarker', { metricKey: name, color: metric.marker })
      // fetch description from the backend, if necessary
      dispatch('updateDescription', { metricKey: name, description })
      // maybe we changed the globale draw state?
      dispatch('checkGlobalDrawState')
    },
    updateDescription ({ commit, state }, { metricKey, description }) {
      const metric = state.metrics[metricKey]
      if (description === undefined) {
        commit('privateSet', { metricKey, metric: { description: '' } })
        window.MetricQWebView.instances[0].handler.metricQHistory.metadata(metric.name).then((metadataObj) => {
          commit('privateSet', { metricKey, metric: { description: metadataObj.description } })
        })
      } else {
        commit('privateSet', { metricKey, metric: { description: description } })
      }
    },
    updateColor ({ commit, state }, { metricKey, color }) {
      commit('privateSet', { metricKey, metric: { color } })
      const name = state.metrics[metricKey].name
      const renderer = window.MetricQWebView.instances[0]
      if (renderer && renderer.graticule && renderer.graticule.data) {
        const metricCache = renderer.graticule.data.getMetricCache(name)
        if (metricCache) {
          metricCache.color = color
          metricCache.band.styleOptions.color = color
          for (const curSeries in metricCache.series) {
            if (metricCache.series[curSeries]) {
              metricCache.series[curSeries].styleOptions.color = color
            }
          }
        }
      }
    },
    updateMarker ({ commit, state }, { metricKey, marker }) {
      commit('privateSet', { metricKey, metric: { marker } })
      const metric = state.metrics[metricKey]
      const renderer = window.MetricQWebView.instances[0]
      const newTraces = metric.traces.map(function (paramValue) {
        if (paramValue.marker) {
          paramValue.marker.symbol = marker
        }
        return paramValue
      })
      commit('privateSet', { metricKey, metric: { traces: newTraces } })
      if (renderer && renderer.graticule && renderer.graticule.data) {
        const metricCache = renderer.graticule.data.getMetricCache(metric.name)
        if (metricCache) {
          for (const curSeries in metricCache.series) {
            // TODO: change this so that marker type ist being stored
            //        but it only applies marker to /raw aggregate
            if (metricCache.series[curSeries]) {
              metricCache.series[curSeries].styleOptions.dots = marker
            }
          }
        }
      }
    },
    updateTraces ({ commit, state, dispatch }, { metricKey, traces }) {
      commit('privateSet', { metricKey, metric: { traces: traces } })

      const metric = state.metrics[metricKey]
      // marker and color are stored here and deep inside MetricQWebView/MetricHandler/Graticule and the traces
      dispatch('updateColor', { metricKey, color: metric.color })
      dispatch('updateMarker', { metricKey, marker: metric.marker })
    },
    setError ({ commit, state }, { metricKey }) {
      const metric = state.metrics[metricKey]
      commit('privateSet', { metricKey: metricKey, metric: { name: metric.name, errorprone: true } })
    },
    updateDrawStateGlobally ({ state, commit }, newState) {
      for (const metricKey in state.metrics) {
        const newDrawStates = {
          drawMin: newState,
          drawMax: newState
        }
        if (newState === false) {
          newDrawStates.drawAvg = true
        }
        commit('privateSet', { metricKey, metric: newDrawStates })
      }
      window.MetricQWebView.instances[0].graticule.draw(false)
      commit('setGlobalMinMax', newState, { root: true })
    },
    updateDrawState ({ dispatch, commit }, { metricKey, drawState: { drawMin, drawAvg, drawMax } }) {
      commit('privateSet', { metricKey, metric: { drawMin, drawAvg, drawMax } })
      dispatch('checkGlobalDrawState')
    }
  },
  modules: {
  }
}
