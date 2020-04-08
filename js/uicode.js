
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
  "template": "<li class=\"btn btn-info legend_item\" v-on:click=\"metricPopup(metric.name)\">"
            + "<div v-bind:class=\"metric.popupKey\" v-bind:style=\"{ backgroundColor: metric.color}\">&nbsp;</div>"
            + " {{ metric.displayName }}"
            + "<img src=\"img/icons/pencil.svg\" width=\"28\" height=\"28\" />"
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
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"input_metric_name\">Name</label></div></div>"
            + "<input type=\"text\" id=\"input_metric_name\" class=\"popup_input\" v-model=\"metric.name\" />"
            + "</div>"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label>Farbe:</label></div></div>"
            + "<canvas class=\"popup_colorchooser\" width=\"270\" height=\"45\"></canvas>"
            + "</div>"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"select_marker\">Symbol:</label></div></div>"
            + "<select id=\"select_marker\" class=\"popup_legend_select form-control\" size=\"1\" v-bind:value=\"metric.marker\" v-on:change=\"changeMarker\">"
            + "<option v-for=\"symbol in markerSymbols\" v-bind:value=\"symbol\">{{ symbol }}</option>"
            + "</select>"
            + "</div>"
            + "<div class=\"modal-footer\">"
            + "<button class=\"btn btn-danger\">"
            + "<img src=\"img/icons/trash.svg\" class=\"popup_trashcan\" width=\"32\" height=\"32\">"
            + "</button>"
            + "</div>"
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
  "methods": {
    "changeMarker": function()
    {
      this.metric.updateMarker(document.querySelector(".popup_legend_select").value);
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
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"resolution_input\">Auflösung</label></div></div>"
            + "<input type=\"range\" class=\"config_popup_slider form-control\" id=\"resolution_input\" v-model=\"uiResolution\" min=\"0\" max=\"29\" step=\"0.25\"/>"
            + "</div>"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"zoom_speed_input\">Zoom Geschwindigkeit</label></div></div>"
            + "<input type=\"range\" class=\"config_popup_slider form-control\" id=\"zoom_speed_input\" v-model.sync=\"uiZoomSpeed\" min=\"1\" max=\"100\" step=\"0.5\"/>"
            + "</div>"
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
  "template": "<div class=\"modal popup_div xaxis_popup_div\" tabindex=\"-1\" role=\"dialog\">"
            + "<div class=\"modal-dialog\" role=\"document\">"
            + "<div class=\"modal-content\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"modal-body\">"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"start_date_time\">Anfangszeit</label></div></div>"
            + "<input type=\"date\" v-model=\"startDate\" v-bind:max=\"endDate\" required /><input type=\"time\" v-model=\"startTime\" id=\"start_date_time\" required /><br/>"
            + "</div>"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"end_date_time\">Endzeit</label></div></div>"
            + "<input type=\"date\" v-model=\"endDate\" v-bind:min=\"startDate\" required /><input type=\"time\" id=\"end_date_time\" v-model=\"endTime\" required />"
            + "</div>"
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
  "template": "<div class=\"modal popup_div yaxis_popup_div\" tabindex=\"-1\" role=\"dialog\">"
            + "<div class=\"modal-dialog\" role=\"document\">"
            + "<div class=\"modal-content\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"modal-body\">"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><input type=\"radio\" value=\"global\" name=\"yaxis\" id=\"yaxis_global\" v-model=\"yaxisRange\" /></div></div>"
            + "<label for=\"yaxis_global\" class=\"form-control\">Globales Min/Max</label>"
            + "</div>"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><input type=\"radio\" value=\"local\" name=\"yaxis\" id=\"yaxis_local\" v-model=\"yaxisRange\" /></div></div>"
            + "<label for=\"yaxis_local\" class=\"form-control\">Lokales Min/Max</label>"
            + "</div>"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><input type=\"radio\" value=\"manual\" name=\"yaxis\" id=\"yaxis_manual\" v-model=\"yaxisRange\" /></div></div>"
            + "<label for=\"yaxis_manual\" class=\"form-control\">Manuelles Min/Max</label>"
            + "</div>"
            + "<div class=\"yaxis_popup_minmax\">"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"yaxis_min\" class=\"yaxis_popup_label_minmax\">Min:</label></div></div>"
            + "<input type=\"number\" v-model=\"allMin\" id=\"yaxis_min\" :disabled.sync=\"manualDisabled\"/>"
            + "</div>"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"yaxis_ax\" class=\"yaxis_popup_label_minmax\">Max:</label></div></div>"
            + "<input type=\"number\" v-model=\"allMax\" id=\"yaxis_max\" :disabled.sync=\"manualDisabled\"/>"
            + "</div>"
            + "</div>"
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
        var ele = document.getElementById("yaxis_min");
        if(ele) {
          ele.disabled = "manual" != newValue;
          ele = document.getElementById("yaxis_max");
          ele.disabled = "manual" != newValue;
        }
        if("global" == newValue)
        {
          window.MetricQWebView.instances[0].yRangeType = newValue;
          window.MetricQWebView.instances[0].handler.loadGlobalMinMax();
        } else
        {
          if("manual" == newValue)
          {
            let arr = window.MetricQWebView.instances[0].handler.queryAllMinMax();
            window.MetricQWebView.instances[0].yRangeOverride = arr;
            this.$forceUpdate();
          }
          window.MetricQWebView.instances[0].yRangeType = newValue;
          window.MetricQWebView.instances[0].setPlotRanges(false, true);
        }
      }
    },
    "allMin": {
      cache: false,
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
      cache: false,
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
  "template": "<div class=\"modal popup_div preset_popup_div\" tabindex=\"-1\" role=\"dialog\">"
            + "<div class=\"modal-dialog modal-lg\" role=\"document\">"
            + "<div class=\"modal-content\">"
            + "<div class=\"modal-header\">"
            + "<img src=\"img/metricq-logo.png\" width=\"150\" height=\"150\" style=\"margin: 0px auto;\"/>"
            + "</div>"
            + "<div class=\"modal-body\">"
            + "<div style=\"float: left;\">"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"preset_select\">Preset</label></div></div>"
            + "<select class=\"form-control\" id=\"preset_select\" size=\"1\" v-on:change=\"updateList\" v-on:keydown.enter=\"showMetrics\">"
            + "<option v-for=\"(presetValue, presetIndex) in metricPresets\" v-bind:value=\"presetIndex\">{{ presetIndex }}</option>"
            + "</select>"
            + "</div>"
            + "<ul class=\"list-group list_preset_show\">"
            + "<li v-for=\"metricName in metricMetriclist\" class=\"list-group-item\">"
            + "<img class=\"list_arrow_icon\" src=\"img/icons/arrow-return-right.svg\" width=\"32\" height=\"32\" />"
            + "{{ metricName }}</li>"
            + "</ul>"
            + "</div>"
            + "</div>"
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
  "template": "<div class=\"modal popup_div export_popup_div\" tabindex=\"-1\" role=\"dialog\">"
            + "<div class=\"modal-dialog\" role=\"document\">"
            + "<div class=\"modal-content\">"
            + "<popup-header v-bind:popupTitle=\"popupTitle\"></popup-header>"
            + "<div class=\"modal-body\">"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"export_width\">Breite</label></div></div>"
            + "<input type=\"number\" id=\"export_width\" class=\"export_resolution\" v-model=\"exportWidth\" />"
            + "</div>"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"export_height\">Höhe</label></div></div>"
            + "<input type=\"number\" id=\"export_height\" class=\"export_resolution\" v-model=\"exportHeight\" />"
            + "</div>"
            + "<div class=\"input-group\">"
            + "<div class=\"input-group-prepend\"><div class=\"input-group-text\"><label for=\"export_format\">Dateiformat</label></div></div>"
            + "<select size=\"1\" id =\"export_format\" v-model=\"selectedFileformat\" class=\"form-control\">"
            + "<option v-for=\"fileformatName in fileformats\" v-bind:value=\"fileformatName\">{{ fileformatName }}</option>"
            + "</select>"
            + "</div>"
            + "<button class=\"btn btn-primary\" v-on:click=\"doExport\">Export</button>"
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
                if("" == paramMyMetric.name && !evt.target.getAttribute("metric-old-name"))
                {
                  //do nothing
                } else
                {
                  paramMyInstance.changeMetricName(paramMyMetric, paramMyMetric.name, evt.target.getAttribute("metric-old-name"));
                }
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
        var closeEle = popupEle.querySelector(".popup_close_button");
        closeEle.addEventListener("click", disablePopupFunc);
        var modalEle = document.querySelector(".modal");
        modalEle.addEventListener("click", function (evt) { if("dialog" == evt.target.getAttribute("role")) { veil.destroy(); disablePopupFunc(evt); } });
        var inputEle = popupEle.querySelector(".popup_input");
        inputEle.addEventListener("keyup", function(evt) {
          if(evt.key.toLowerCase() == "enter")
          {
            disablePopupFunc(evt);
          }
        });
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
          document.querySelector("div." + paramMyMetric.popupKey).style.backgroundColor = paramMyMetric.color;
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
      closeButtonEle.addEventListener("click", function() { veil.destroy(); disablePopupFunc(); });
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
      closeButtonEle.addEventListener("click", function() { veil.destroy(); disablePopupFunc(); });
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
      var modalEle = document.querySelector(".modal");
      modalEle.addEventListener("click", function (evt) { if("dialog" == evt.target.getAttribute("role")) { veil.destroy(); disablePopupFunc(); } });
    }
  }
});


document.addEventListener("DOMContentLoaded", initTest);
