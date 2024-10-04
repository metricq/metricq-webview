import Vue from 'vue'
import store from '@/store/index'
import { MetricHelper } from '@/metric'
import * as Error from '@/errors'

export default {
  namespaced: true,
  state: {
    metrics: {},
    peakedMetric: undefined
  },
  getters: {
    getMetricDrawState: (state) => (metricName) => {
      const metric = state.metrics[metricName]
      return {
        draw: metric.draw,
        drawMin: metric.drawMin,
        drawAvg: metric.drawAvg,
        drawMax: metric.drawMax
      }
    },
    getAllKeys: (state) => () => {
      const metrics = Object.keys(state.metrics)
      return metrics.sort((a, b) => {
        if (a > b) return 1
        if (a < b) return -1
        return 0
      })
    },
    getAll: (state) => () => {
      const metrics = Object.values(state.metrics)
      return metrics.sort((a, b) => {
        if (a.key > b.key) return 1
        if (a.key < b.key) return -1
        return 0
      })
    },
    length: (state) => () => {
      return Object.keys(state.metrics).length
    },
    get: (state) => (metricKey) => {
      return state.metrics[metricKey]
    },
    getColor: (state) => (metric) => {
      return state.metrics[metric].color
    },
    getUnit: (state) => (metric) => {
      return state.metrics[metric].unit
    },
    getPeakedMetric: (state) => () => {
      return state.peakedMetric
    }
  },
  mutations: {
    resetAll (state) {
      Object.keys(state.metrics).forEach((key) => { if (!key.startsWith('_')) { Vue.delete(state.metrics, key) } })
    },
    privateRemoveEntry (state, { metricKey }) {
      Vue.delete(state.metrics, metricKey)
    },

    privateSet (state, {
      metricKey,
      metric: { description, unit, color, errorprone, drawMin, drawMax, drawAvg, pointsAgg, pointsRaw, draw, factor }
    }) {
      if (state.metrics[metricKey] === undefined) {
        Vue.set(state.metrics, metricKey, {
          key: metricKey,
          description: description || '',
          unit: unit || '',
          color: color || MetricHelper.metricBaseToRgb(metricKey),
          errorprone: errorprone === undefined ? false : errorprone,
          popup: false,
          draw: draw === undefined ? true : draw,
          drawMin: drawMin === undefined ? store.state.globalMinMax : drawMin,
          drawAvg: drawAvg === undefined ? true : drawAvg,
          drawMax: drawMax === undefined ? store.state.globalMinMax : drawMax,
          popupKey: 'popup_' + MetricHelper.filterKey(metricKey),
          pointsAgg: pointsAgg || null,
          pointsRaw: pointsRaw || null,
          factor: factor || 1
        })
      } else {
        Vue.set(state.metrics[metricKey], 'popupKey', 'popup_' + MetricHelper.filterKey(metricKey))

        if (description !== undefined) {
          Vue.set(state.metrics[metricKey], 'description', description)
        }
        if (unit !== undefined) {
          Vue.set(state.metrics[metricKey], 'unit', unit)
        }
        if (color !== undefined) {
          Vue.set(state.metrics[metricKey], 'color', color)
        }
        if (errorprone !== undefined) {
          Vue.set(state.metrics[metricKey], 'errorprone', errorprone)
        }
        if (draw !== undefined) {
          Vue.set(state.metrics[metricKey], 'draw', draw)
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
        if (pointsAgg !== undefined) {
          Vue.set(state.metrics[metricKey], 'pointsAgg', pointsAgg)
        }
        if (pointsRaw !== undefined) {
          Vue.set(state.metrics[metricKey], 'pointsRaw', pointsRaw)
        }
        if (factor !== undefined) {
          Vue.set(state.metrics[metricKey], 'factor', factor)
        }
      }
    },

    setPopup (state, { metricKey, popupState }) {
      if (state.metrics[metricKey]) {
        Vue.set(state.metrics[metricKey], 'popup', popupState)
      } else {
        throw new Error('Metric not found!')
      }
    },

    setPeakedMetric (state, { metric }) {
      if (state.metrics[metric] || metric === undefined) {
        Vue.set(state, 'peakedMetric', metric)
      }
    }

  },
  actions: {
    checkGlobalDrawState ({ commit, getters }) {
      const stateArray = []
      const metricsArray = getters.getAll()
      document.getElementById('checkbox_min_max').indeterminate = false
      if (metricsArray.length > 0) {
        metricsArray.forEach((metric) => {
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

    async create ({ commit, state, dispatch }, {
      metric: {
        name,
        description,
        unit,
        color,
        errorprone,
        drawMin,
        drawMax,
        drawAvg,
        pointsAgg,
        pointsRaw
      }
    }) {
      if (state.metrics[name] !== undefined) {
        throw new Error.DuplicateMetricError(name)
      } else {
        let metadataObj
        try {
          metadataObj = await window.MetricQWebView.handler.metricQHistory.metadata(name)
        } catch (error) {
          throw new Error.InvalidMetricError(name)
        }
        commit('privateSet', {
          metricKey: name,
          metric: { description, unit, color, errorprone, drawMin, drawMax, drawAvg, pointsAgg, pointsRaw }
        })
        const metric = state.metrics[name]
        // color are stored here and deep inside MetricQWebView/MetricHandler/Graticule
        dispatch('updateColor', { metricKey: name, color: metric.color })
        // fetch description from the backend, if necessary
        dispatch('updateDescription', { metricKey: name, description, metadataObj })
        // maybe we changed the globale draw state?
        dispatch('checkGlobalDrawState')
        dispatch('updateUnit', { metricKey: name, unit, metadataObj })
      }
    },
    updateDescription ({ commit }, { metricKey, description, metadataObj }) {
      if (description === undefined) {
        description = metadataObj.description
      }
      commit('privateSet', { metricKey, metric: { description: description } })
    },
    updateUnit ({ commit }, { metricKey, unit, metadataObj }) {
      if (unit === undefined) {
        unit = metadataObj.unit
      }
      unit = MetricHelper.normalizeSIUnits(unit)
      commit('privateSet', { metricKey, metric: { unit: unit } })
    },
    updateFactor ({ commit, state }, { metricKey, factor }) {
      if (state.metrics[metricKey] === undefined || state.metrics[metricKey].factor === factor) {
        return
      }
      commit('privateSet', { metricKey, metric: { factor } })
      const renderer = window.MetricQWebView
      if (renderer && renderer.graticule && renderer.graticule.data) {
        const metricCache = renderer.graticule.data.getMetricCache(metricKey)
        if (metricCache) {
          metricCache.updateFactor(factor)
        }
        renderer.setPlotRanges(false, true)
      }
    },
    updateColor ({ commit }, { metricKey, color }) {
      commit('privateSet', { metricKey, metric: { color } })
      const renderer = window.MetricQWebView
      if (renderer && renderer.graticule && renderer.graticule.data) {
        const metricCache = renderer.graticule.data.getMetricCache(metricKey)
        if (metricCache) {
          metricCache.updateColor(color)
        }
        renderer.graticule.draw(false)
      }
    },
    setError ({ commit }, { metricKey }) {
      commit('privateSet', { metricKey: metricKey, metric: { errorprone: true } })
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
      window.MetricQWebView.graticule.draw(false)
      commit('setGlobalMinMax', newState, { root: true })
    },
    updateDrawState ({ dispatch, commit }, { metricKey, drawState: { drawMin, drawAvg, drawMax } }) {
      commit('privateSet', { metricKey, metric: { drawMin, drawAvg, drawMax } })
      dispatch('checkGlobalDrawState')
    },
    toggleDraw ({ state, commit }, { metricKey }) {
      commit('privateSet', { metricKey, metric: { draw: !state.metrics[metricKey].draw } })
    },
    updateDataPoints ({ state, commit }, { metricKey, pointsAgg, pointsRaw }) {
      commit('privateSet', { metricKey, metric: { pointsAgg: pointsAgg, pointsRaw: pointsRaw } })
    },
    updatePeakedMetric ({ commit }, { metric }) {
      commit('setPeakedMetric', { metric })
    }
  },
  modules: {}
}
