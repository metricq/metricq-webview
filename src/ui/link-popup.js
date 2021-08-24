import { veil } from './veil.js'
import { PopupHeader } from './popup-header.js'
import { Store } from '../store.js'

// @vue/component
export const LinkPopup = {
  components: {
    PopupHeader
  },
  model: {
    prop: 'popupStatus',
    event: 'toggle'
  },
  props: {
    popupStatus: {
      type: Boolean,
      required: true
    }
  },
  data: function () {
    return {
      popupTitle: 'Information',
      configuration: Store.state.configuration
    }
  },
  mounted () {
    const popupEle = document.querySelector('.new_metric_popup_div')
    if (popupEle) {
      const disablePopupFunc = () => {
        this.$emit('toggle', false)
        window.MetricQWebView.instances[0].reload()
      }
      veil.create(disablePopupFunc)
      veil.attachPopup(popupEle)
    }
  },
  methods: {
    closePopup (evt) {
      veil.destroy(evt)
    },
    closePopupModal: function (evt) {
      if (evt.target.getAttribute('role') === 'dialog') {
        veil.destroy(evt)
      }
    }
  },
  template: `
    <div class="modal popup_div new_metric_popup_div" tabindex="-1" role="dialog" v-on:click="closePopupModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <popup-header v-bind:popupTitle="popupTitle"></popup-header>
          <div class="modal-body" align="left">
          <a href="https://github.com/metricq/metricq-webview" target="_blank"><img loading="lazy" src="img/Banner.png" class="ribbon" alt="Fork me on GitHub" data-recalc-dims="1"> </a>
            <br>MetricQWebview dient der Visualisierung von MetricQ-Daten
            <br>unter Ausnutzung der  Vorteile des HTA DB Backends
            <br><br>
            Autoren: 
            <ul>
              <li><a href="https://github.com/Quimoniz" target="_blank">Lars Jitschin</a></li>
              <li><a href="https://github.com/kinnarr" target="_blank">Franz Höpfner</a></li>
              <li><a href="https://github.com/AndyBuchwald" target="_blank">Andy Buchwald</a></li>
              <li><a href="https://github.com/tilsche" target="_blank">Thomas Ilsche</a></li>
              <li><a href="https://github.com/bmario" target="_blank">Mario Bielert</a></li>
            </ul>
          </div>
          <div class="modal-footer">  
            MetricQ-WebView Copyright (C) 2021 Technische Universität Dresden
            <br>
            This program is free software: you can redistribute it and/or modify
            it under the terms of the GNU General Public License as published by
            the Free Software Foundation, either version 3 of the License, or
            (at your option) any later version.
            <br>
            This program is distributed in the hope that it will be useful,
            but WITHOUT ANY WARRANTY; without even the implied warranty of
            MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
            See the <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">GNU General Public License</a> for more details.
          </div>
        </div>
      </div>
    </div>`
}
