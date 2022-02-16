import Vue from 'vue'
import VueHtml2pdf from 'vue-html2pdf'
import AsyncComputed from 'vue-async-computed'
import Toasted from 'vue-toasted'

export function importPlugins () {
  Vue.use(VueHtml2pdf)
  Vue.use(AsyncComputed)
  Vue.use(Toasted)
}
