
/* TODO: bind these locally, somehow */
var globalPopup = {
  "export": false, //not yet implemented
  "yaxis": false,
  "xaxis": false,
  "presetSelection": false
};
var globalSelectedPreset = undefined;
for(var attrib in metricPresets) { globalSelectedPreset = metricPresets[attrib]; break; }
var globalMetricHandle = new MetricHandler(undefined, new Array(), 0, 0);




var veil = {
  "myPopup": undefined,
  "create": function(destroyCallback)
   {
     var veilEle = document.createElement("div");
     veilEle.setAttribute("id", "popup_veil");
     veilEle.style.width = window.innerWidth;
     veilEle.style.height = window.innerHeight;
     veilEle = document.getElementsByTagName("body")[0].appendChild(veilEle);
     veilEle.addEventListener("click", function(evt) { veil.destroy(evt); } );
     veil.ondestroy = destroyCallback;
     return veilEle;
  },
  "ondestroy": undefined,
  "destroy": function(evt)
  {
    if(veil.ondestroy && evt) {
      veil.ondestroy(evt);
    }

    var veilEle = document.querySelector("#popup_veil");
    if(veilEle) {
      veilEle.parentNode.removeChild(veilEle);
    }

    veil.myPopup = undefined;
    veil.ondestroy = undefined;
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
  });
}





Vue.component("metric-legend", {
  "props": ["metric"],
  "template": "<li v-on:click=\"metricPopup(metric.name)\">"
            + "<span v-bind:class=\"metric.popupKey\" v-bind:style=\"{color: metric.color}\">█</span>"
            + " {{ metric.displayName }}"
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
  "template": "<div class=\"popup_header\">{{ popupTitle }}"
            + "<div class=\"popup_close_button\">"
            + "<img class=\"popup_close_image\" src=\"img/popup-close.png\" title=\"Schliessen\" width=\"46\" height=\"46\" />"
            + "</div>"
            + "</div>"
});


Vue.component("metric-popup", {
  "props": ["metric"],
  "template": "<div v-bind:id=\"metric.popupKey\" class=\"popup_div metric_popup_div\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"popup_body\">"
            + "<div style=\"float: left; width: 258px;\">"
            + "<input type=\"text\" class=\"popup_input\" v-model=\"metric.name\" /><br/>"
            + "<canvas class=\"popup_colorchooser\" width=\"270\" height=\"45\"></canvas></div>"
            + "<div style=\"width: 90px; float: left;\">"
            + "<img src=\"img/trashcan.png\" class=\"popup_trashcan\" width=\"17\" height=\"17\">"
            + "</div>"
            + "<div class=\"popup_cleaner\"></div>"
            + "<div style=\"float: left;\">"
            + "<select class=\"popup_legend_select generic_select\" size=\"1\" v-bind:value=\"metric.marker\" v-on:change=\"changeMarker\">"
            + "<option v-for=\"symbol in markerSymbols\" v-bind:value=\"symbol\">{{ symbol }}</option>"
            + "</select>"
            + "</div>"
            + "</div>"
            + "</div>",
  "data": function () {
    return { 
      "markerSymbols": markerSymbols,
      "popupTitle": "Metrik-Eigenschaften"
     };
  },
  "methods": {
    "changeMarker": function()
    {
      this.metric.updateMarker(document.querySelector(".popup_legend_select").value);
    }
  }
});
Vue.component("configuration-popup", {
  "props": ["config"],
  "template": "<div class=\"popup_div config_popup_div\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"popup_body\">"
            + "<div class=\"config_popup_labels\">"
            + "<label for=\"resolution_input\">Auflösung</label><br/>"
            + "<label for=\"zoom_speed_input\">Zoom Geschwindigkeit</label></div>"
            + "<div style=\"float: left;\">"
            + "<button class=\"button_resolution\" v-on:click=\"manipulateResolution(-1)\">-</button>"
            + "<input type=\"range\" class=\"config_popup_slider\" id=\"resolution_input\" v-model=\"uiResolution\" min=\"0\" max=\"29\" step=\"0.25\"/>"
            + "<button class=\"button_resolution\" v-on:click=\"manipulateResolution(+1)\">+</button><br/>"
            + "<button class=\"button_zoom_speed\" v-on:click=\"manipulateZoomSpeed(-3)\">-</button>"
            + "<input type=\"range\" class=\"config_popup_slider\" id=\"zoom_speed_input\" v-model.sync=\"uiZoomSpeed\" min=\"1\" max=\"100\" step=\"0.5\"/>"
            + "<button class=\"button_zoom_speed\" v-on:click=\"manipulateZoomSpeed(+3)\">+</button><br/>"
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
    }
  },
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
  "template": "<div class=\"popup_div xaxis_popup_div\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"popup_body\">"
            + "<div class=\"xaxis_popup_labels\">"
            + "<label>Anfangszeit</label><br/>"
            + "<label>Endzeit</label>"
            + "</div>"
            + "<div class=\"xaxis_popup_time\">"
            + "<input type=\"date\" v-model=\"startDate\" v-bind:max=\"endDate\" required /><input type=\"time\" v-model=\"startTime\" required /><br/>"
            + "<input type=\"date\" v-model=\"endDate\" v-bind:min=\"startDate\" required /><input type=\"time\" v-model=\"endTime\" required />"
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
        window.MetricQWebView.instances[0].handler.startTime = (new Date(newValue)).getTime() + (window.MetricQWebView.instances[0].handler.startTime % 86400000);
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
        window.MetricQWebView.instances[0].handler.stopTime = (new Date(newValue)).getTime() + (window.MetricQWebView.instances[0].handler.stopTime % 86400000);
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
        window.MetricQWebView.instances[0].handler.startTime = dateObj.getTime();
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
        window.MetricQWebView.instances[0].handler.stopTime = dateObj.getTime();
        window.MetricQWebView.instances[0].setPlotRanges(true, true);
      }
    }
  }
});
Vue.component("yaxis-popup", {
  /* use vue-js for radio buttons */
  "template": "<div class=\"popup_div yaxis_popup_div\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"popup_body\">"
            + "<div class=\"yaxis_popup_radio\">"
            + "<input type=\"radio\" value=\"global\" name=\"yaxis\" id=\"yaxis_global\" v-model=\"yaxisRange\" /><label for=\"yaxis_global\">Globales Min/Max</label><br/>"
            + "<input type=\"radio\" value=\"local\" name=\"yaxis\" id=\"yaxis_local\" v-model=\"yaxisRange\" /><label for=\"yaxis_local\">Lokales Min/Max</label><br/>"
            + "<input type=\"radio\" value=\"manual\" name=\"yaxis\" id=\"yaxis_manual\" v-model=\"yaxisRange\" /><label for=\"yaxis_manual\">Manuelles Min/Max</label><br/>"
            + "<div class=\"yaxis_popup_minmax\">"
            + "<label for=\"yaxis_min\" class=\"yaxis_popup_label_minmax\">Min:</label><input type=\"number\" v-model=\"allMin\" id=\"yaxis_min\" :disabled.sync=\"manualDisabled\"/><br/>"
            + "<label for=\"yaxis_max\" class=\"yaxis_popup_label_minmax\">Max:</label><input type=\"number\" v-model=\"allMax\" id=\"yaxis_max\" :disabled.sync=\"manualDisabled\"/><br/>"
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
        return "manual" != window.MetricQWebView.instances[0].yRangeType;
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].yRangeType = "local";
      }
    },
    "yaxisRange": {
      get: function()
      {
        return window.MetricQWebView.instances[0].yRangeType;
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].yRangeType = newValue;
        var ele = document.getElementById("yaxis_min");
        if(ele) {
          ele.disabled = "manual" != newValue;
          ele = document.getElementById("yaxis_max");
          ele.disabled = "manual" != newValue;
        }
        if("global" == newValue)
        {
          window.MetricQWebView.instances[0].handler.loadGlobalMinMax();
        } else
        {
          window.MetricQWebView.instances[0].setPlotRanges(false, true);
        }
      }
    },
    "allMin": {
      get: function()
      {
        let arr = window.MetricQWebView.instances[0].handler.queryAllMinMax();
        if(arr)
        {
          return (new Number(arr[0])).toFixed(3);
        }
      },
      set: function(newValue)
      {
        let arr = window.MetricQWebView.instances[0].handler.queryAllMinMax();
        arr = [newValue, arr[1]];
        window.MetricQWebView.instances[0].yRangeOverride = arr;
        window.MetricQWebView.instances[0].setPlotRanges(false, true);
      }
    },
    "allMax": {
      get: function()
      {
        let arr = window.MetricQWebView.instances[0].handler.queryAllMinMax();
        if(arr)
        {
          return (new Number(arr[1])).toFixed(3);
        }
      },
      set: function(newValue)
      {
        let arr = window.MetricQWebView.instances[0].handler.queryAllMinMax();
        arr = [arr[0], newValue];
        window.MetricQWebView.instances[0].yRangeOverride = arr;
        window.MetricQWebView.instances[0].setPlotRanges(false, true);
      }
    }
  }
});
Vue.component("preset-popup", {
  "template": "<div class=\"popup_div preset_popup_div\">"
            + "<div class=\"popup_body\">"
            + "<img src=\"img/metricq-logo.png\" width=\"150\" height=\"150\" /><br/>"
            + "<select class=\"generic_select\" id=\"preset_select\" size=\"1\" v-on:change=\"updateList\" v-on:keydown.enter=\"showMetrics\">"
            + "<option v-for=\"(presetValue, presetIndex) in metricPresets\" v-bind:value=\"presetIndex\">{{ presetIndex }}</option>"
            + "</select>"
            + "<button class=\"button_preset_show generic_button\" v-on:click=\"showMetrics\">Anzeigen</button>"
            + "<ul class=\"list_preset_show\">"
            + "<li v-for=\"metricName in metricMetriclist\">{{ metricName }}</li>"
            + "</ul>"
            + "</div>"
            + "</div>",
  "computed": {
    metricPresets()
    {
      return metricPresets;
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
    }
  }
});
Vue.component("export-popup", {
  "template": "<div class=\"popup_div export_popup_div\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"popup_body\">"
            + "<div class=\"export_popup_labels\">"
            + "<label for=\"export_width\">Breite</label><br/>"
            + "<label for=\"export_height\">Höhe</label><br/>"
            + "<label for=\"export_format\">Dateiformat</label><br/>"
            + "</div><div style=\"float:left\">"
            + "<input type=\"number\" id=\"export_width\" class=\"export_resolution\" v-model=\"exportWidth\" />px<br/>"
            + "<input type=\"number\" id=\"export_height\" class=\"export_resolution\" v-model=\"exportHeight\" />px<br/>"
            + "<select size=\"1\" id =\"export_format\" v-model=\"selectedFileformat\" class=\"generic_select\">"
            + "<option v-for=\"fileformatName in fileformats\" v-bind:value=\"fileformatName\">{{ fileformatName }}</option>"
            + "</select><br/>"
            + "<button class=\"generic_button\" v-on:click=\"doExport\">Export</button>"
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
      return ["svg", "png", "jpeg", "webp"];
    },
    "selectedFileformat": {
      get: function()
      {
        return window.MetricQWebView.instances[0].plotlyOptions.toImageButtonOptions.format;
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].plotlyOptions.toImageButtonOptions.format = newValue;
      }
    },
    "exportWidth": {
      get: function()
      {
        return window.MetricQWebView.instances[0].plotlyOptions.toImageButtonOptions.width;
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].plotlyOptions.toImageButtonOptions.width = parseInt(newValue);
      }
    },
    "exportHeight":
    {
      get: function()
      {
        return window.MetricQWebView.instances[0].plotlyOptions.toImageButtonOptions.height;
      },
      set: function(newValue)
      {
        window.MetricQWebView.instances[0].plotlyOptions.toImageButtonOptions.height = parseInt(newValue);
      }
    }
  },
  "methods": {
    "doExport": function()
    {
      var instance = window.MetricQWebView.instances[0];
      Plotly.downloadImage(instance.ele, instance.plotlyOptions.toImageButtonOptions);
      veil.destroy();
      globalPopup.export = false;
    }
  }
});

var legendApp = new Vue({
  "el": "#legend_list",
  "computed": {
    "metricsList": {
      cache: false,
      "get": function () {
        if(window["MetricQWebView"])
        {
          return window.MetricQWebView.instances[0].handler.allMetrics;
        } else
        {
          return new Object();
        }
      },
      "set": function (newValue){
        if(window["MetricQWebView"])
        {
          return window.MetricQWebView.instances[0].handler.allMetrics = newValue;
        }
      }
    }
  }
});
var popupApp = new Vue({
  "el": "#wrapper_popup_legend",
  "methods": {
  },
  "computed": {
    "metricsList": {
      cache: false,
      "get": function() {
        if(window["MetricQWebView"])
        {
          return window.MetricQWebView.instances[0].handler.allMetrics;
        } else
        {
          return new Object();
        }
      },
      "set": function (newValue){
        if(window["MetricQWebView"])
        {
          return window.MetricQWebView.instances[0].handler.allMetrics = newValue;
        }
      }
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

            if("popup_trashcan" == evt.target.getAttribute("class"))
            {
              paramMyInstance.deleteMetric(paramMyMetric.name);
              paramMyInstance.deleteTraces(paramMyTraces);
              Vue.nextTick(function() { legendApp.$forceUpdate(); });
            } else
            {
              if(paramMyMetric.name != evt.target.getAttribute("metric-old-name"))
              {
                paramMyInstance.changeMetricName(paramMyMetric, paramMyMetric.name, evt.target.getAttribute("metric-old-name"));
              } else {
                if(evt.target.getAttribute("metric-old-color") != paramMyMetric.color)
                {
                  if("raw" == paramMyMetric.traces[0].name)
                  {
                    Plotly.restyle(document.querySelector(".row_body"), {"marker.color": paramMyMetric.color}, paramMyTraces);
                  } else {
                    Plotly.restyle(document.querySelector(".row_body"), {"line.color": paramMyMetric.color}, paramMyTraces);
                  }
                  let colorEle = document.getElementsByClassName(paramMyMetric.popupKey);
                  if(colorEle && colorEle[0])
                  {
                    colorEle[0].style.color = paramMyMetric.color;
                  }
                }
                if(evt.target.getAttribute("metric-old-marker") != paramMyMetric.marker)
                {
                  Plotly.restyle(document.querySelector(".row_body"), {"marker.symbol": paramMyMetric.marker}, paramMyTraces);
                }
                //don't do a complete repaint
                //renderMetrics();
              }
            }
        } }(myMetric, instance, affectedTraces);
        var veilEle = veil.create(disablePopupFunc);
        veil.attachPopup(popupEle);
        var inputEle = popupEle.querySelector(".popup_input");
        inputEle.addEventListener("keyup", function(evt) {
          if(evt.key.toLowerCase() == "enter")
          {
            disablePopupFunc(evt);
          }
        });
        var closeEle = popupEle.querySelector(".popup_close_button");
        closeEle.addEventListener("click", disablePopupFunc);
        var trashcanEle = popupEle.querySelector(".popup_trashcan");

        var colorchooserEle = popupEle.querySelector(".popup_colorchooser");
        var colorchooserObj = new Colorchooser(colorchooserEle, myMetric);
        colorchooserObj.onchange = function(myTraces, paramMyMetric) { return function() {
          if(0 == paramMyMetric.traces.length)
          {
            return;
          }
          if("markers" == paramMyMetric.traces[0].mode)
          {
            Plotly.restyle(document.querySelector(".row_body"), {"marker.color": paramMyMetric.color}, myTraces);
          } else {
            Plotly.restyle(document.querySelector(".row_body"), {"line.color": paramMyMetric.color}, myTraces);
          }
        }}(affectedTraces, myMetric);
        popupEle.querySelector(".popup_legend_select").addEventListener("change", function(myTraces, paramMyMetric) { return function(evt) {
          Plotly.restyle(document.querySelector(".row_body"), {"marker.symbol": paramMyMetric.marker}, myTraces);
        }}(affectedTraces, myMetric));

        [veilEle, inputEle, closeEle, trashcanEle].forEach(function(paramValue, paramIndex, paramArray) {
          paramValue.setAttribute("metric-old-name", myMetric.name);
          paramValue.setAttribute("metric-old-color", myMetric.color);
          paramValue.setAttribute("metric-old-marker", myMetric.marker);
          paramValue.setAttribute("metric-affected-traces", JSON.stringify(affectedTraces))
        });

        trashcanEle.addEventListener("click", function(paramMetricName, disableFunc){
          return function(evt) {
            disableFunc(evt);
          };
        }(myMetric.name, disablePopupFunc));
      }
    }
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
      closeButtonEle.addEventListener("click", function () { veil.destroy(); disablePopupFunc(); });
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
      closeButtonEle.addEventListener("click", function() { veil.destroy(); disablePopupFunc(); });
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
      closeButtonEle.addEventListener("click", function() { veil.destroy(); disablePopupFunc(); });
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
      veil.create(disablePopupFunc);
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
    }
  }
});


document.addEventListener("DOMContentLoaded", initTest);
