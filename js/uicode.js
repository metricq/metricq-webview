
var globalPopup = {
  "export": false,
  "yaxis": false,
  "xaxis": false,
  "presetSelection": false
};
var globalSelectedPreset = undefined;
for(var attrib in metricPresets) { globalSelectedPreset = metricPresets[attrib]; break; }
new MetricQWebView(document.querySelector(".row_body"), new Array(), (new Date()).getTime() - 7200 * 1000, (new Date()).getTime());




var veil = {
  "myPopup": undefined,
  "inDestroymentPhase": false,
  "create": function(destroyCallback, solidVeil)
   {
     var veilEle = document.createElement("div");
     veilEle.setAttribute("id", "popup_veil");
     veilEle.style.width = window.innerWidth;
     veilEle.style.height = window.innerHeight;
     if(solidVeil)
     {
       veilEle.style.backgroundColor = "#808080";
       veilEle.style.opacity = 1;
     }
     veilEle = document.getElementsByTagName("body")[0].appendChild(veilEle);
     veilEle.addEventListener("click", function(evt) { veil.destroy(evt); } );
     veil.ondestroy = destroyCallback;
     return veilEle;
  },
  "ondestroy": undefined,
  "destroy": function(evt)
  {
    if(veil.inDestroymentPhase)
    {
      return undefined;;
    }
    veil.inDestroymentPhase = true;
    if(veil.ondestroy && evt) {
      veil.ondestroy(evt);
    }

    var veilEle = document.querySelector("#popup_veil");
    if(veilEle) {
      veilEle.parentNode.removeChild(veilEle);
    }

    veil.myPopup = undefined;
    veil.ondestroy = undefined;
    veil.inDestroymentPhase = false;
  },
  "attachPopup": function(popupEle)
  {
    popupEle.style.top = Math.round(window.innerHeight / 2 - popupEle.offsetHeight / 2) + "px";
    popupEle.style.left = Math.round(window.innerWidth / 2 - popupEle.offsetWidth / 2) + "px";
    popupEle.style.zIndex = 500;
    veil.myPopup = popupEle;
  }
}

//At Startup:
if(-1 < window.location.href.indexOf("#"))
{
  try {
    importMetricUrl();
  } catch(exc)
  {
    console.log("Could not import metrics.");
    console.log(exc);
  }
} else
{
  Vue.nextTick(function() { globalPopup.presetSelection = true; });
}  



function initTest()
{
  document.getElementById("button_export").addEventListener("click", function(evt) {
    globalPopup.export = ! globalPopup.export;
  });
  document.getElementById("button_configuration").addEventListener("click", function(evt) {
    configApp.togglePopup();
    Vue.nextTick(initializeConfigPopup);
  });
}





Vue.component("metric-legend", {
  "props": ["metric"],
  "template": "<li class=\"btn btn-light legend_item\" style=\"background-color: #FFFFFF; margin-top: 10px;\" v-on:click=\"metricPopup(metric.name)\">"
            + "<div v-if=\"metric.name\" v-bind:class=\"metric.popupKey\" v-bind:style=\"{ backgroundColor: metric.color}\">"
            + "&nbsp;" //"<img src=\"img/icons/droplet.svg\" width=\"24\" height=\"24\">"
            + "</div> &nbsp;"
            + "<span v-html=\"metric.htmlName\"></span>&nbsp;"
            + "<img v-if=\"metric.name\" src=\"img/icons/pencil.svg\" width=\"28\" height=\"28\" />"
            + "<br/><span>{{ metric.description }}</span>&nbsp;"
            + "</li>",
  "methods": {
    "metricPopup": function(metricName) {
      //console.log(metricName);
      var myMetric = window.MetricQWebView.instances[0].getMetric(metricName);
      if(myMetric)
      {
        myMetric.popup = ! myMetric.popup;
      }
      popupApp.$forceUpdate();
      Vue.nextTick(initializeMetricPopup);
    }
  }
});

Vue.component("popup-header", {
  "props": ["popupTitle"],
  "template": "<div class=\"modal-header\">" 
            + "<h5 class=\"modal-title\">{{ popupTitle }}</h5>"
            + "<button type=\"button\" class=\"close popup_close_button\" data-dismiss=\"modal\" aria-label=\"Close\">"
            + "<span aria-hidden=\"true\" class=\"close_button_symbol\">&times;</span>"
            + "</button>"
            + "</div>"
});


Vue.component("metric-popup", {
  "props": ["metric"],
  "template": "<div v-bind:id=\"metric.popupKey\" class=\"modal popup_div metric_popup_div\" tabindex=\"-1\" role=\"dialog\">"
            + "<div class=\"modal-dialog\" role=\"document\">"
            + "<div class=\"modal-content\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"modal-body\">"
            + "<div class=\"form-group row\">"
            + "<label class=\"col-sm-2 col-form-label\" for=\"input_metric_name\">Name</label>"
            + "<div class=\"col-sm-10\">"
            + "<input type=\"text\" list=\"autocomplete_metric\" id=\"input_metric_name\" class=\"popup_input form-control\" v-model=\"metric.name\" />"
            + "<datalist id=\"autocomplete_metric\">"
            // using v-for here doesn't work :(
            //+ "<option v-for=\"suggestion in autocompleteList\" v-bind:value=\"suggestion\">{{ suggestion }}</option>"
            + "</datalist>"
            + "</div></div>"
            + "<div class=\"form-group row\">"
            + "<label class=\"col-sm-2 col-form-label\">Farbe</label>"
            + "<div class=\"col-sm-10\">"
            + "<canvas class=\"popup_colorchooser form-control\" width=\"345\" height=\"32\"></canvas>" //270,45
            + "</div></div>"
            + "<div class=\"form-group row\">"
            + "<label class=\"col-sm-2 col-form-label\" for=\"select_marker\">Symbol</label>"
            + "<div class=\"col-sm-10\">"
            + "<select id=\"select_marker\" class=\"form-control custom-select popup_legend_select\" size=\"1\" v-bind:value=\"metric.marker\" v-on:change=\"changeMarker\">"
            + "<option v-for=\"symbol in markerSymbols\" v-bind:value=\"symbol\">{{ symbol }}</option>"
            + "</select>"
            + "</div></div>"
            + "</div>"
            + "<div class=\"modal-footer\">"
            + "<button v-if=\"!isEmpty\" class=\"btn btn-danger\">"
            + "<img src=\"img/icons/trash.svg\" class=\"popup_trashcan\" width=\"26\" height=\"26\" />"
            + "</button>"
            + "<button class=\"btn btn-primary popup_ok\">"
            + "{{ saveButtonText }}"
            + "</button>"
            + "</div>"
            + "</div>"
            + "</div>"
            + "</div>",
  "data": function () {
    return { 
      "markerSymbols": markerSymbols,
      "popupTitle": "Metrik-Eigenschaften"
     };
  },
  "computed": {
    "saveButtonText": {
      get: function()
      {
        return "" === this.metric.name ? "Erstellen" : "OK";
      },
      set: function(newValue)
      {
        //do nothing
      }
    },
    "isEmpty": {
      get: function()
      {
        return "" === this.metric.name;
      },
      set: function(newValue)
      {
        //do nothing
      }
    }
  },
  "methods": {
    "changeMarker": function()
    {
      this.metric.updateMarker(document.querySelector(".popup_legend_select").value);
    }
  }
});
Vue.component("interaction-array-option", {
  "props": ["action"],
  "template": "<div class=\"form-group row\" >"
            + "<label class=\"col-sm-5 col-form-label\">{{ functionName }}</label>"
            + "<div class=\"col-sm-4\">"
            + "<select class=\"form-control custom-select\" size=\"1\" v-model=\"eventName\">"
            + "<option v-for=\"curEvent in eventList\" v-bind:value=\"curEvent\">{{ curEvent }}</option>"
            + "</select>"
            + "</div>"
            + "<div class=\"col-sm-3\">"
            + "<input type=\"text\" class=\"form-control\" v-model=\"keyField\"/>"
            + "</div>"
            + "</div>",
  "data": function()
  {
    return {
      "functionList": ["uiInteractPan", "uiInteractZoomArea", "uiInteractZoomIn", "uiInteractLegend", "uiInteractZoomWheel"],
      "eventList": ["none", "drag", "drop", "move", "wheel"]
    };
  },
  "computed": {
    "functionName": {
      get: function() {
        return this.action[2];
      },
      set: function(newValue) {
        this.action[2] = newValue;
      }
    },
    "keyField": {
      get: function() {
        var keyStr = "";
        var keyCodeArray = this.action[1];
        for(var i = 0; i < keyCodeArray.length; ++i)
        {
          var curKeyCode = keyCodeArray[i];
          if(0 < curKeyCode.length)
          {
            var isNegated = ("!" == curKeyCode.charAt(0));
            if(isNegated)
            {
              curKeyCode = curKeyCode.substring(1);
            }
            curKeyCode = parseInt(curKeyCode);
            for(var curKeyName in window.KeyJS)
            {
              if(curKeyCode == window.KeyJS[curKeyName])
              {
                if(0 < keyStr.length)
                {
                  keyStr += " ";
                }
                if(isNegated)
                {
                  keyStr += "!";
                }
                keyStr += curKeyName;
                break;
              }
            }
          }
        }
        return keyStr;
      },
      set: function(newValue) {
        var rawEntriesArray = newValue.split(" ");
        var actionKeyArray = new Array();
        for(var i = 0; i < rawEntriesArray.length; ++i)
        {
          var curEntry = rawEntriesArray[i];
          if(0 < curEntry.length)
          {
            var newEntry = "";
            if("!" == curEntry.charAt(0))
            {
              curEntry = curEntry.substring(1);
              newEntry += "!";
              if(0 == curEntry.length)
              {
                continue;
              }
            }
            if(curEntry.match(/^[0-9]+$/))
            {
              newEntry += curEntry;
            } else
            {
              if(undefined !== window.KeyJS[curEntry.toUpperCase()])
              {
                newEntry += "" + window.KeyJS[curEntry.toUpperCase()];
              }
            }
            actionKeyArray.push(newEntry);
          }
        }
        this.action[1] = actionKeyArray;
      }
    },
    "eventName": {
      get: function() {
        return this.action[0];
      },
      set: function(newValue) {
        this.action[0] = newValue;
      }
    }
  }
});
Vue.component("configuration-popup", {
  "props": ["config"],
  "template": "<div class=\"modal popup_div config_popup_div\" tabindex=\"-1\" role=\"dialog\">"
            + "<div class=\"modal-dialog\" role=\"document\">"
            + "<div class=\"modal-content\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"modal-body\">"
            + "<div class=\"form-group row\">"
            + "<label class=\"col-sm-6 col-form-label\" for=\"resolution_input\">Auflösung</label>"
            + "<div class=\"col-sm-6\">"
            + "<input type=\"range\" class=\"form-control\" id=\"resolution_input\" v-model=\"uiResolution\" min=\"0\" max=\"29\" step=\"0.25\"/>"
            + "</div></div>"
            + "<div class=\"form-group row\">"
            + "<label class=\"col-sm-6 col-form-label\" for=\"zoom_speed_input\">Zoom Geschwindigkeit</label>"
            + "<div class=\"col-sm-6\">"
            + "<input type=\"range\" class=\"form-control\" id=\"zoom_speed_input\" v-model.sync=\"uiZoomSpeed\" min=\"1\" max=\"100\" step=\"0.5\"/>"
            + "</div></div>"
            + "<h5 class=\"modal-title\">Bedienung</h5>"
            + "<div id=\"ui_configurator\">"
            + "<div class=\"form-group row\" >"
            + "<label class=\"col-sm-5 col-form-label\">Funktion</label>"
            + "<label class=\"col-sm-4 col-form-label\">Event</label>"
            + "<label class=\"col-sm-3 col-form-label\">Tasten</label>"
            + "</div>"
            + "<interaction-array-option v-for=\"action in uiInteractArr\" v-bind:action=\"action\" v-bind:key=\"action[2]\"></interaction-array-option>"
            + "</div>"
            + "</div>"
            + "<div class=\"modal-footer\">"
            + "<button class=\"btn btn-primary popup_ok\">"
            + "OK"
            + "</button>"
            + "</div>"
            + "</div>"
            + "</div>"
            + "</div>",
  "data": function() {
    return {
      "popupTitle": "Globale-Einstellungen"
    }
  },
  "computed": {
    "uiResolution": {
      cache: false,
      get: function() {
        return 30 - window.MetricQWebView.instances[0].configuration.resolution;
      },
      set: function(newValue) {
        window.MetricQWebView.instances[0].configuration.resolution = 30 - newValue;
        this.$emit("update:uiResolution", newValue);
      }
    },
    "uiZoomSpeed": {
      cache: false,
      get: function() {
        return window.MetricQWebView.instances[0].configuration.zoomSpeed;
      },
      set: function(newValue) {
        window.MetricQWebView.instances[0].configuration.zoomSpeed = newValue;
        this.$emit("update:uiZoomSpeed", newValue);
      }
    },
    "uiInteractArr": {
      cache: false,
      get: function()
      {
        return uiInteractArr;
      },
      set: function(newValue) {
        uiInteractArr = newValue;
      }
    }
  },
  /* TODO: remove the following functions as they are no longer needed */
  "methods": {
    "manipulateResolution": function(increment)
    {
      let newValue = parseFloat(this.uiResolution) + increment;
      newValue = this.withinRange(document.getElementById("resolution_input"), newValue);
      this.uiResolution = newValue;
      this.$forceUpdate();
    },
    "manipulateZoomSpeed": function(increment)
    {
      let newValue = parseFloat(this.uiZoomSpeed) + increment;
      newValue =  this.withinRange(document.getElementById("zoom_speed_input"), newValue);
      this.uiZoomSpeed = newValue;
      // make vue js update using force
      this.$forceUpdate();
    },
    "withinRange": function(ele, newValue)
    {
      if(newValue < parseFloat(ele.getAttribute("min")))
      {
        newValue = parseFloat(ele.getAttribute("min"));
      }
      if(newValue > parseFloat(ele.getAttribute("max")))
      {
        newValue = parseFloat(ele.getAttribute("max"));
      }
      return newValue;
    }
  }
});

Vue.component("xaxis-popup", {
  "template": "<div class=\"modal popup_div xaxis_popup_div\" tabindex=\"-1\" role=\"dialog\">"
            + "<div class=\"modal-dialog modal-lg\" role=\"document\">"
            + "<div class=\"modal-content\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"modal-body\">"
            + "<div class=\"form-group row\">"
            + "<label class=\"col-sm-3 col-form-label\" for=\"start_date_time\">Anfangszeit</label>"
            + "<div class=\"col-sm-9\">"
            + "<input type=\"date\" class=\"form-control col-sm-6\" v-model=\"startDate\" v-bind:max=\"endDate\" required /><input type=\"time\" class=\"form-control col-sm-6\" v-model=\"startTime\" id=\"start_date_time\" step=\"1\" required /><br/>"
            + "</div>"
            + "</div>"
            + "<div class=\"form-group row\">"
            + "<label class=\"col-sm-3 col-form-label\" for=\"end_date_time\">Endzeit</label>"
            + "<div class=\"col-sm-9\">"
            + "<input type=\"date\" class=\"form-control col-sm-6\" v-model=\"endDate\" v-bind:min=\"startDate\" required /><input type=\"time\" class=\"form-control col-sm-6\" id=\"end_date_time\" v-model=\"endTime\" step=\"1\" required />"
            + "</div>"
            + "</div>"
//TODO: put fancy time window selection here, like in ISSUE #17
            + ""
            + "</div>"
            + "<div class=\"modal-footer\">"
            + "<button class=\"btn btn-primary popup_ok\">"
            + "OK"
            + "</button>"
            + "</div>"
            + "</div>"
            + "</div>"
            + "</div>",
  "data": function() {
    return {
      "popupTitle": "Zeitachsen-Einstellungen"
    }
  },
  "computed": {
    "startDate": {
      get: function()
      {
        var dateObj = new Date(window.MetricQWebView.instances[0].handler.startTime);
        return dateObj.getFullYear() + "-" + ((dateObj.getMonth() + 1) < 10 ? "0" : "") + (dateObj.getMonth() + 1) + "-" + (dateObj.getDate() < 10 ? "0" : "") + dateObj.getDate()
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].handler.setTimeRange((new Date(newValue)).getTime() + (window.MetricQWebView.instances[0].handler.startTime % 86400000), undefined);
        window.MetricQWebView.instances[0].setPlotRanges(true, true);
      }
    },
    "endDate": {
      get: function()
      {
        var dateObj = new Date(window.MetricQWebView.instances[0].handler.stopTime);
        return dateObj.getFullYear() + "-" + ((dateObj.getMonth() + 1) < 10 ? "0" : "") + (dateObj.getMonth() + 1) + "-" + (dateObj.getDate() < 10 ? "0" : "") + dateObj.getDate()
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].handler.setTimeRange(undefined, (new Date(newValue)).getTime() + (window.MetricQWebView.instances[0].handler.stopTime % 86400000));
        window.MetricQWebView.instances[0].setPlotRanges(true, true);
      }
    },
    "startTime": {
      get: function()
      {
        var dateObj = new Date(window.MetricQWebView.instances[0].handler.startTime);
        return (dateObj.getHours() < 10 ? "0" : "") + dateObj.getHours() + ":" + (dateObj.getMinutes() < 10 ? "0" : "") + dateObj.getMinutes() + ":" + (dateObj.getSeconds() < 10 ? "0" : "") + dateObj.getSeconds()
      },
      set: function(newValue)
      {
        var dateObj = new Date(this.startDate + " " + newValue);
        window.MetricQWebView.instances[0].handler.setTimeRange(dateObj.getTime(), undefined);
        window.MetricQWebView.instances[0].setPlotRanges(true, true);
      }
    },
    "endTime": {
      get: function()
      {
        var dateObj = new Date(window.MetricQWebView.instances[0].handler.stopTime);
        return (dateObj.getHours() < 10 ? "0" : "") + dateObj.getHours() + ":" + (dateObj.getMinutes() < 10 ? "0" : "") + dateObj.getMinutes() + ":" + (dateObj.getSeconds() < 10 ? "0" : "") + dateObj.getSeconds()
      },
      set: function(newValue)
      {
        var dateObj = new Date(this.endDate + " " + newValue);
        window.MetricQWebView.instances[0].handler.setTimeRange(undefined, dateObj.getTime());
        window.MetricQWebView.instances[0].setPlotRanges(true, true);
      }
    }
  }
});
Vue.component("yaxis-popup", {
  /* use vue-js for radio buttons */
  "template": "<div class=\"modal popup_div yaxis_popup_div\" tabindex=\"-1\" role=\"dialog\">"
            + "<div class=\"modal-dialog\" role=\"document\">"
            + "<div class=\"modal-content\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"modal-body\">"
            + "<div class=\"form-check\">"
            + "<input class=\"form-check-input\" type=\"radio\" value=\"global\" name=\"yaxis\" id=\"yaxis_global\" v-model=\"yaxisRange\" />"
            + "<label for=\"yaxis_global\" class=\"form-check-label form-control-plaintext\">Globales Min/Max</label>"
            + "</div>"
            + "<div class=\"form-check\">"
            + "<input class=\"form-check-input\" type=\"radio\" value=\"local\" name=\"yaxis\" id=\"yaxis_local\" v-model=\"yaxisRange\" />"
            + "<label for=\"yaxis_local\" class=\"form-check-label form-control-plaintext\">Lokales Min/Max</label>"
            + "</div>"
            + "<div class=\"form-check\">"
            + "<input class=\"form-check-input\" type=\"radio\" value=\"manual\" name=\"yaxis\" id=\"yaxis_manual\" v-model=\"yaxisRange\" />"
            + "<label for=\"yaxis_manual\" class=\"form-check-label form-control-plaintext\">Manuelles Min/Max</label>"
            + "</div>"
            + "<div class=\"form-group yaxis_popup_minmax\">"
            + "<div class=\"form-group row\">"
            + "<label for=\"yaxis_min\" class=\"yaxis_popup_label_minmax col-sm-2 col-form-label\">Min:</label>"
            + "<div class=\"col-sm-10\"><input class=\"form-control\" type=\"number\" v-model=\"allMin\" id=\"yaxis_min\" :disabled.sync=\"manualDisabled\" step=\"0.001\"/></div>"
            + "</div>"
            + "<div class=\"form-group row\">"
            + "<label for=\"yaxis_ax\" class=\"yaxis_popup_label_minmax col-sm-2 col-form-label\">Max:</label>"
            + "<div class=\"col-sm-10\"><input class=\"form-control\" type=\"number\" v-model=\"allMax\" id=\"yaxis_max\" :disabled.sync=\"manualDisabled\" step=\"0.001\"/></div>"
            + "</div>"
            + "</div>"
            + "</div>"
            + "<div class=\"modal-footer\">"
            + "<button class=\"btn btn-primary popup_ok\">"
            + "OK"
            + "</button>"
            + "</div>"
            + "</div>"
            + "</div>"
            + "</div>"
            + "</div>",
  "data": function() {
    return {
      "popupTitle": "Y-Achsen-Einstellungen"
    }
  },
  "computed": {
    "manualDisabled": {
      cache: false,
      get: function()
      {
        return "manual" != window.MetricQWebView.instances[0].graticule.yRangeOverride.type;
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].graticule.setYRangeOverride("local", undefined, undefined);
      }
    },
    "yaxisRange": {
      get: function()
      {
        return window.MetricQWebView.instances[0].graticule.yRangeOverride.type;
      },
      set: function(newValue)
      {
        var ele = document.getElementById("yaxis_min");
        if(ele) {
          ele.disabled = "manual" != newValue;
          ele = document.getElementById("yaxis_max");
          ele.disabled = "manual" != newValue;
        }
        if("global" == newValue)
        {
          window.MetricQWebView.instances[0].graticule.setYRangeOverride(newValue, undefined, undefined);
        } else
        {
          if("manual" == newValue)
          {
            let arr = window.MetricQWebView.instances[0].handler.getAllMinMax();
            window.MetricQWebView.instances[0].graticule.setYRangeOverride(newValue, arr[0], arr[1]);
            this.$forceUpdate();
          } else
          {
            window.MetricQWebView.instances[0].graticule.setYRangeOverride(newValue, undefined, undefined);
          }
        }
        window.MetricQWebView.instances[0].setPlotRanges(false, true);
      }
    },
    "allMin": {
      cache: false,
      get: function()
      {
        let arr = window.MetricQWebView.instances[0].handler.getAllMinMax();
        if(arr)
        {
          return (new Number(arr[0])).toFixed(3);
        }
      },
      set: function(newValue)
      {
        let arr = window.MetricQWebView.instances[0].handler.getAllMinMax();
        arr = [parseFloat(newValue), arr[1]];
        window.MetricQWebView.instances[0].graticule.setYRangeOverride(undefined, arr[0], arr[1]);
        window.MetricQWebView.instances[0].setPlotRanges(false, true);
      }
    },
    "allMax": {
      cache: false,
      get: function()
      {
        let arr = window.MetricQWebView.instances[0].handler.getAllMinMax();
        if(arr)
        {
          return (new Number(arr[1])).toFixed(3);
        }
      },
      set: function(newValue)
      {
        let arr = window.MetricQWebView.instances[0].handler.getAllMinMax();
        arr = [arr[0], parseFloat(newValue)];
        window.MetricQWebView.instances[0].graticule.setYRangeOverride(undefined, arr[0], arr[1]);
        window.MetricQWebView.instances[0].setPlotRanges(false, true);
      }
    }
  }
});
Vue.component("preset-popup", {
  "template": "<div class=\"modal popup_div preset_popup_div\" tabindex=\"-1\" role=\"dialog\">"
            + "<div class=\"modal-dialog modal-lg modal-dialog-scrollable\" role=\"document\">"
            + "<div class=\"modal-content\">"
            + "<div class=\"modal-header\">"
            + "<img src=\"img/metricq-logo.png\" width=\"150\" height=\"150\" style=\"margin: 0px auto;\"/>"
            + "</div>"
            + "<div class=\"modal-body\">"
            + "<div style=\"float: left;\">"
            + "<div class=\"form-group row\">"
            + "<label for=\"preset_select\" class=\"col-sm-3 form-control-plaintext leftalign\">Preset</label>"
            + "<div class=\"col-sm-9\">"
            + "<select class=\"form-control custom-select fullwidth\" id=\"preset_select\" size=\"1\" v-on:change=\"updateList\" v-on:keydown.enter=\"showMetrics\">"
            + "<option class=\"fullwidth\" v-for=\"(presetValue, presetIndex) in metricPresets\" v-bind:value=\"presetIndex\">{{ presetIndex }}</option>"
            + "</select>"
            + "</div></div>"
            + "<div v-if=\"anyMetrics\" class=\"row\">"
            + "<div class=\"col-sm-3\" style=\"padding-left: 0px;\"><label class=\"leftalign form-control-plaintext\">Metriken:</label></div>"
            + "<div class=\"col-sm-9\">"
            + "<ul class=\"list-group list_preset_show fullwidth\">"
            + "<li v-for=\"metricName in metricMetriclist\" v-if=\"0 < metricName.length\" class=\"list-group-item fullwidth\">"
//            + "<img class=\"list_arrow_icon\" src=\"img/icons/arrow-return-right.svg\" width=\"32\" height=\"32\" />"
//            + "<img class=\"list_arrow_icon\" src=\"img/icons/graph-up.svg\" width=\"32\" height=\"32\">"
            + "{{ metricName }}</li>"
            + "</ul>"
            + "</div></div></div></div>"
            + "<div class=\"modal-footer\">"
            + "<button class=\"btn btn-primary\" v-on:click=\"showMetrics\">Anzeigen</button>"
            + "</div>"
            + "</div>"
            + "</div>"
            + "</div>",
  "computed": {
    metricPresets()
    {
      return metricPresets;
    },
    "anyMetrics": {
      cache: false,
      get: function()
      {
        var metricStr = "";
        var ele = document.getElementById("preset_select");
        var referenceArr = undefined;
        if(ele) {
          referenceArr = metricPresets[ele.value];
        } else if(metricPresets["no preset"])
        {
          referenceArr = metricPresets["no preset"];
        } else
        {
          return true;
        }
        for(var curMetric in referenceArr)
        {
          metricStr += referenceArr[curMetric];
        }
        return 0 < metricStr.length;
      },
      set: function(newValue) { }
    },
    "metricMetriclist": {
      cache: false,
      get: function() {
        var ele = document.getElementById("preset_select");
        if(ele)
        {
          return metricPresets[ele.value];
        } else
        {
          for(var attrib in metricPresets)
          {
            return metricPresets[attrib];
          }
        }
      },
      set: function(newValue) {}
    }
  },
  "methods": {
    "updateList": function()
    {
      globalSelectedPreset = metricPresets[document.getElementById("preset_select").value];
      this.$emit("update:metricMetriclist", metricPresets[document.getElementById("preset_select").value]);
      // BEHOLD, the MAGIC of forceUpdate!
      this.$forceUpdate();
    },
    "showMetrics": function()
    {
      veil.destroy();
      globalPopup.presetSelection = false;
      let hasEmptyMetric = false;
      var i = 0;
      var metricNamesArr = new Array();
      for(; i < globalSelectedPreset.length; ++i)
      {
        let metricName = globalSelectedPreset[i];
        if(0 == metricName.length) hasEmptyMetric = true;
        metricNamesArr.push(metricName);
      }
      if( ! hasEmptyMetric)
      {
        metricNamesArr.push("");
      }
      initializeMetrics(metricNamesArr, (new Date()).getTime() - 3600 * 1000 * 2, (new Date()).getTime());
      legendApp.$forceUpdate();
    }
  }
});
Vue.component("export-popup", {
  "template": "<div class=\"modal popup_div export_popup_div\" tabindex=\"-1\" role=\"dialog\">"
            + "<div class=\"modal-dialog\" role=\"document\">"
            + "<div class=\"modal-content\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"modal-body\">"
            + "<div class=\"form-group row\">"
            + "<label class=\"col-sm-3 col-form-label\" for=\"export_width\">Breite</label>"
            + "<div class=\"col-sm-7\">"
            + "<input type=\"number\" id=\"export_width\" v-model=\"exportWidth\" class=\"form-control\"/>"
            + "</div></div>"
            + "<div class=\"form-group row\">"
            + "<label class=\"col-sm-3 col-form-label\" for=\"export_height\">Höhe</label>"
            + "<div class=\"col-sm-7\">"
            + "<input type=\"number\" id=\"export_height\" v-model=\"exportHeight\" class=\"form-control\" />"
            + "</div></div>"
            + "<div class=\"form-group row\">"
            + "<label class=\"col-sm-3 col-form-label\" for=\"export_format\">Dateiformat</label>"
            + "<div class=\"col-sm-7\">"
            + "<select size=\"1\" id =\"export_format\" v-model=\"selectedFileformat\" class=\"form-control custom-select\" style=\"width: 100%;\">"
            + "<option v-for=\"fileformatName in fileformats\" v-bind:value=\"fileformatName\">{{ fileformatName }}</option>"
            + "</select>"
            + "</div></div>"
            + "</div>"
            + "<div class=\"modal-footer\">"
            + "<button class=\"btn btn-primary\" v-on:click=\"doExport\">"
            + "<img src=\"img/icons/image.svg\" width=\"28\" height=\"28\" />"
            + " Export</button>"
            + "</div>"
            + "</div>"
            + "</div>"
            + "</div>",
  "data": function() {
    return {
      "popupTitle": "Export"
    }
  },
  "computed": {

    fileformats() {
      return ["png", "jpeg"];
    },
    "selectedFileformat": {
      get: function()
      {
        return window.MetricQWebView.instances[0].configuration.exportFormat;
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].configuration.exportFormat = newValue;
      }
    },
    "exportWidth": {
      get: function()
      {
        return window.MetricQWebView.instances[0].configuration.exportWidth;
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].configuration.exportWidth = parseInt(newValue);
      }
    },
    "exportHeight":
    {
      get: function()
      {
        return window.MetricQWebView.instances[0].configuration.exportHeight;
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].configuration.exportHeight = parseInt(newValue);
      }
    }
  },
  "methods": {
    "doExport": function()
    {
      var instance = window.MetricQWebView.instances[0];
      instance.doExport();
      veil.destroy();
      globalPopup.export = false;
    }
  }
});

var legendApp = new Vue({
  "el": "#legend_list",
  data () {
    return {
      "metricsList": window.MetricQWebView.instances[0].handler.allMetrics
    }
  }
});
var popupApp = new Vue({
  "el": "#wrapper_popup_legend",
  "methods": {
  },
  data () {
    return {
      "metricsList": window.MetricQWebView.instances[0].handler.allMetrics
    }
  },
  //not called by $forceUpdate :(
  updated() {
  }
});
function initializeMetricPopup() {
    var instance = window.MetricQWebView.instances[0];
    var myMetric = undefined;
    for(var metricBase in instance.handler.allMetrics)
    {
      if(instance.handler.allMetrics[metricBase].popup)
      {
        myMetric = instance.handler.allMetrics[metricBase];
        break;
      }
    }
    if(undefined !== myMetric) {
      var popupEle = document.getElementById(myMetric.popupKey);
      if(popupEle)
      {
        //TODO: remove this 'affectedTraces' stuff
        let affectedTraces = new Array();
        var j = 0;
        for(var metricBase in instance.handler.allMetrics)
        {
          if(instance.handler.allMetrics[metricBase].traces)
          {
            for(var k = 0; k < instance.handler.allMetrics[metricBase].traces.length; ++k)
            {
              if(metricBase == myMetric.name)
              {
                affectedTraces.push(j);
              }
              ++j;
            }
          }
        }
        var disablePopupFunc = function(paramMyMetric, paramMyInstance, paramMyTraces) {
          return function(evt) {
            myMetric.popup = false;
            popupApp.$forceUpdate();
            veil.destroy();

            let oldName = evt.target.getAttribute("metric-old-name");

            //special behavior when creating a new metric
            if(null === oldName
            || undefined === oldName)
            {
              if("popup_trashcan" == evt.target.getAttribute("class")) return;

              if("popup_ok" == evt.target.getAttribute("class"))
              {
                // code duplication :(
                if(paramMyInstance.changeMetricName(paramMyMetric, paramMyMetric.name, evt.target.getAttribute("metric-old-name")))
                {
                  nameChanged = true;
                } else {
                  paramMyMetric.updateName(oldName);
                  showUserHint("Konnte Metrik-Namen nicht ändern. Metrik evtl. schon vorhanden?");
                }
              }
            }
            else
            {
              if("popup_trashcan" == evt.target.getAttribute("class"))
              {
                if(0 < oldName.length)
                {
                  paramMyInstance.deleteMetric(oldName);
                  Vue.nextTick(function() { legendApp.$forceUpdate(); });
                }
              } else
              {
                var nameChanged = false;
                if(paramMyMetric.name != oldName)
                {
                  if("" == paramMyMetric.name && !oldName)
                  {
                    //do nothing
                  } else
                  {
                    if(paramMyInstance.changeMetricName(paramMyMetric, paramMyMetric.name, evt.target.getAttribute("metric-old-name")))
                    {
                      nameChanged = true;
                    } else {
                      paramMyMetric.updateName(oldName);
                      showUserHint("Konnte Metrik-Namen nicht ändern. Metrik evtl. schon vorhanden?");
                    }
                  }
                }
                if(evt.target.getAttribute("metric-old-color") != paramMyMetric.color)
                {
                  paramMyMetric.updateColor(paramMyMetric.color);
                  let colorEle = document.getElementsByClassName(paramMyMetric.popupKey);
                  if(colorEle && colorEle[0])
                  {
                    colorEle[0].style.color = paramMyMetric.color;
                  }
                }
                if(nameChanged)
                {
                  //TODO: do something, in this case, do forceUpdate the legendApp
                  //         so the metric's color will be shown
                }
                if(evt.target.getAttribute("metric-old-marker") != paramMyMetric.marker)
                {
                  paramMyMetric.updateMarker(paramMyMetric.marker);
                }
                //don't do a complete repaint
                //renderMetrics();
              }
            }
        } }(myMetric, instance, affectedTraces);
        var veilEle = veil.create(disablePopupFunc);
        veil.attachPopup(popupEle);
        var closeEle = popupEle.querySelector(".popup_close_button");
        var modalEle = document.querySelector(".modal");
        modalEle.addEventListener("click", function (evt) { if("dialog" == evt.target.getAttribute("role")) { veil.destroy(); disablePopupFunc(evt); } });
        var inputEle = popupEle.querySelector(".popup_input");
        inputEle.addEventListener("keyup", function(evt) {
          if(evt.key.toLowerCase() == "enter")
          {
            disablePopupFunc(evt);
          }
          //TODO: implement throttling? 
          instance.handler.searchMetricsPromise(evt.target.value).then(function(myInstance, wrapperEle, paramMetric) { return function(searchSuggestions) {
            var datalistEle = document.getElementById("autocomplete_metric");
            if(!datalistEle)
            {
              showUserHint("Auto-Vervollständigung nicht verfügbar, konnte Element #autocomplete_metric nicht finden.");
            } else
            {
              for(var i = datalistEle.childNodes.length - 1; i >= 0; --i)
              {
                datalistEle.removeChild(datalistEle.childNodes[i]);
              }
              for(var i = 0; i < searchSuggestions.length; ++i)
              {
                var optionEle = document.createElement("option");
                optionEle.setAttribute("value", searchSuggestions[i]);
                datalistEle.appendChild(optionEle);
              }
            }
          }; }(instance, popupEle, myMetric));
        });
        var trashcanEle = popupEle.querySelector(".popup_trashcan");

        var colorchooserEle = popupEle.querySelector(".popup_colorchooser");
        var colorchooserObj = new Colorchooser(colorchooserEle, myMetric);
        colorchooserObj.onchange = function(myTraces, paramMyMetric) { return function() {
          document.querySelector("div." + paramMyMetric.popupKey).style.backgroundColor = paramMyMetric.color;
          paramMyMetric.renderer.graticule.draw(false);
        }}(affectedTraces, myMetric);
        popupEle.querySelector(".popup_legend_select").addEventListener("change", function(myTraces, paramMyMetric) { return function(evt) {
          paramMyMetric.updateMarker(paramMyMetric.marker);
        }}(affectedTraces, myMetric));
        var okEle = document.querySelector(".popup_ok");

        [veilEle, inputEle, closeEle, trashcanEle, okEle].forEach(function(paramValue, paramIndex, paramArray) {
          if(paramValue)
          {
            paramValue.setAttribute("metric-old-name", myMetric.name);
            paramValue.setAttribute("metric-old-color", myMetric.color);
            paramValue.setAttribute("metric-old-marker", myMetric.marker);
            paramValue.setAttribute("metric-affected-traces", JSON.stringify(affectedTraces));
          }
        });

        [okEle, closeEle, trashcanEle].forEach(function(paramValue, paramIndex, paramArray) {
          if(paramValue)
          {
            paramValue.addEventListener("click", function(paramMetricName, disableFunc){
              return function(evt) {
                disableFunc(evt);
              }
            }(myMetric.name, disablePopupFunc));
          }
        });
        document.getElementById("input_metric_name").focus();
      }
    }
  }
function initializeConfigPopup()
{
  // nothing to do here
}

var configApp = new Vue({
  "el": "#wrapper_popup_configuration",
  "methods": {
    "togglePopup": function()
    {
      window.MetricQWebView.instances[0].configuration.popup = !window.MetricQWebView.instances[0].configuration.popup;
      this.$forceUpdate();
    }
  },
  "computed": {
    "config": {
      "cache": false,
      "get": function()
      {
        if(window["MetricQWebView"])
        {
          return window.MetricQWebView.instances[0].configuration;
        } else
        {
          return {"resolution": 2, "zoomSpeed": 4};
        }
      },
      "set": function(newValue)
      {
        window.MetricQWebView.instances[0].configuration = newValue;
      }
    }
  },
  updated() {
    var popupEle = document.querySelector(".config_popup_div");
    if(popupEle)
    {
      var disablePopupFunc = function() { window.MetricQWebView.instances[0].configuration.popup = false; configApp.$forceUpdate(); window.MetricQWebView.instances[0].reload(); };
      veil.create(function(evt) { disablePopupFunc(); });
      veil.attachPopup(popupEle);
      var closeButtonEle = popupEle.querySelector(".popup_close_button");
      var okEle = popupEle.querySelector(".popup_ok");
      [closeButtonEle, okEle].forEach(function (paramValue, paramIndex, paramArr) { paramValue.addEventListener("click", function () { veil.destroy(); disablePopupFunc(); })});
      var modalEle = document.querySelector(".modal");
      modalEle.addEventListener("click", function (evt) { if("dialog" == evt.target.getAttribute("role")) { veil.destroy(); disablePopupFunc(); } });
    }
  }
});
var xaxisApp = new Vue({
  "el": "#wrapper_popup_xaxis",
  "data": {
    "globalPopup": globalPopup
  },
  updated() {
    var popupEle = document.querySelector(".xaxis_popup_div");
    if(popupEle)
    {
      var disablePopupFunc = function() { globalPopup.xaxis = false; window.MetricQWebView.instances[0].reload(); };
      veil.create(disablePopupFunc);
      veil.attachPopup(popupEle);
      var closeButtonEle = popupEle.querySelector(".popup_close_button");
      var okEle = popupEle.querySelector(".popup_ok");
      [closeButtonEle, okEle].forEach(function (paramValue, paramIndex, paramArr) { paramValue.addEventListener("click", function () { veil.destroy(); disablePopupFunc(); })});
      var modalEle = document.querySelector(".modal");
      modalEle.addEventListener("click", function (evt) { if("dialog" == evt.target.getAttribute("role")) { veil.destroy(); disablePopupFunc(); } });
    }

  }
});
var yaxisApp = new Vue({
  "el": "#wrapper_popup_yaxis",
  "data": {
    "globalPopup": globalPopup
  },
  updated() {
    var popupEle = document.querySelector(".yaxis_popup_div");
    if(popupEle)
    {
      var disablePopupFunc = function() { globalPopup.yaxis = false; window.MetricQWebView.instances[0].reload(); };
      veil.create(disablePopupFunc);
      veil.attachPopup(popupEle);
      var closeButtonEle = popupEle.querySelector(".popup_close_button");
      var okEle = popupEle.querySelector(".popup_ok");
      [closeButtonEle, okEle].forEach(function (paramValue, paramIndex, paramArr) { paramValue.addEventListener("click", function () { veil.destroy(); disablePopupFunc(); })});
      var modalEle = document.querySelector(".modal");
      modalEle.addEventListener("click", function (evt) { if("dialog" == evt.target.getAttribute("role")) { veil.destroy(); disablePopupFunc(); } });
    }

  }
});

var presetApp = new Vue({
  "el": "#wrapper_popup_preset",
  "data": {
    "globalPopup": globalPopup
  },
  updated() {
    var popupEle = document.querySelector(".preset_popup_div");
    if(popupEle)
    {
      var disablePopupFunc = function() { globalPopup.presetSelection = false; window.MetricQWebView.instances[0].reload(); };
      veil.create(disablePopupFunc, true);
      veil.attachPopup(popupEle);
      popupEle.style.width = "100%";
      popupEle.style.height = "100%";
      popupEle.style.left = "0px";
      popupEle.style.top = "0px";
      setTimeout(function() {
        var selectEle = document.getElementById("preset_select");
        selectEle.focus();
      }, 100);
    }
  }
});

var exportApp = new Vue({
  "el": "#wrapper_popup_export",
  "data": {
    "globalPopup": globalPopup
  },
  updated() {
    var popupEle = document.querySelector(".export_popup_div");
    if(popupEle)
    {
      var disablePopupFunc = function() { globalPopup.export = false; window.MetricQWebView.instances[0].reload(); };
      veil.create(disablePopupFunc);
      veil.attachPopup(popupEle);
      var closeButtonEle = popupEle.querySelector(".popup_close_button");
      closeButtonEle.addEventListener("click", function() { veil.destroy(); disablePopupFunc(); });
      var modalEle = document.querySelector(".modal");
      modalEle.addEventListener("click", function (evt) { if("dialog" == evt.target.getAttribute("role")) { veil.destroy(); disablePopupFunc(); } });
    }
  }
});


document.addEventListener("DOMContentLoaded", initTest);
