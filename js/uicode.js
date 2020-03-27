var plotlyLayout = {
  xaxis: {
    type: 'date',
    showticklabels: true,
    tickangle: 'auto',
    tickfont: {
      family: 'Open Sans, Sans, Verdana',
      size: 14,
      color: 'black'
    },
    exponentformat: 'e',
    showexponent: 'all'
  },
  yaxis: {
    showticklabels: true,
    tickangle: 'auto',
    tickmode: "last",
    tickfont: {
      family: 'Open Sans, Sans, Verdana',
      size: 14,
      color: 'black'
    },
    exponentformat: 'e',
    showexponent: 'all',
    fixedrange: true // disable y-zooming
  },
  showlegend: false,
  dragmode: "pan"
};
var plotlyOptions = {
  scrollZoom: true,
  // "zoom2d", "zoomIn2d", "zoomOut2d"
  modeBarButtonsToRemove: [ "lasso2d", "autoScale2d", "resetScale2d", "toggleHover", "toggleSpikelines", "hoverClosestCartesian", "hoverCompareCartesian", "toImage"],
  displaylogo: false, // don't show the plotly logo
  toImageButtonOptions: {
    format: "svg", // also available: jpeg, png, webp
    filename: "metricq-webview",
    height: 500,
    width: 800,
    scale: 1
  },
  responsive: true, // automatically adjust to window resize
  displayModeBar: true // icons always visible
}
/* TODO: bind these locally, somehow */
var METRICQ_BACKEND = "https://grafana.metricq.zih.tu-dresden.de/metricq/query";
var globalEnd = new Date().getTime();
var globalStart = globalEnd - 3600 * 2 * 1000;
var globalZoomSpeed = 4; // TODO: make this setting configurable
var globalConfiguration = new Configuration(2);
var globalYRangeOverride = undefined;
var globalYRangeType = 'local';
var globalMainPlot = undefined;
var globalCountTraces = 0;
var globalLastWheelEvent = undefined;
var globalPopup = {
  "export": false, //not yet implemented
  "yaxis": false,
  "xaxis": false,
  "presetSelection": false
};
var globalSelectedPreset = undefined;
for(var attrib in metricPresets) { globalSelectedPreset = metricPresets[attrib]; break; }

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
function queryAllMinMax() {
  let referenceAttribute = "minmax";
  if("manual" == globalYRangeType && globalYRangeOverride)
  {
    return globalYRangeOverride;
  } else if("global" == globalYRangeType)
  {
    referenceAttribute = "globalMinmax";
  }
  let allMinMax = [undefined, undefined];
  //TODO: restrict local min/max to actual visual area
  //      as in the prototype
  for(var i = 0; i < legendApp.metricsList.length; ++i)
  {
    let curMetric = legendApp.metricsList[i];
    if(curMetric[referenceAttribute])
    {
      if(undefined === allMinMax[0])
      {
       allMinMax = [curMetric[referenceAttribute][0], curMetric[referenceAttribute][1]];
      } else
      {
        if(curMetric[referenceAttribute][0] < allMinMax[0])
        {
          allMinMax[0] = curMetric[referenceAttribute][0];
        }
        if(curMetric[referenceAttribute][1] > allMinMax[1])
        {
          allMinMax[1] = curMetric[referenceAttribute][1];
        }
      }
    }
  }
  //add a little wiggle room, so that markers won't be cut off
  const delta = allMinMax[1] - allMinMax[0];
  allMinMax[0] -= delta * 0.05;
  allMinMax[1] += delta * 0.05;
  return allMinMax;
}
function setPlotRanges(updateXAxis, updateYAxis)
{
  if(!updateXAxis && !updateYAxis)
  {
    return;
  }
  var relayoutObj = new Object();
  if(updateXAxis) {
    relayoutObj["xaxis.range[0]"] = globalStart;
    relayoutObj["xaxis.range[1]"] = globalEnd;
  }
  if(updateYAxis) {
    let allMinMax = queryAllMinMax();
    relayoutObj["yaxis.range[0]"] = allMinMax[0];
    relayoutObj["yaxis.range[1]"] = allMinMax[1];
  }
  var rowBodyEle = document.querySelector(".row_body");
  Plotly.relayout(rowBodyEle, relayoutObj );
}
function renderMetrics()
{
  let allTraces = new Array();

  for(var i = 0; i < legendApp.metricsList.length; ++i)
  {
    let curMetric = legendApp.metricsList[i];
    if(curMetric.traces) {
      allTraces = allTraces.concat(curMetric.traces);
    }
  }

  updateMetricUrl();
  var rowBodyEle = document.querySelector(".row_body");
  //console.log("Render " + Math.round((globalEnd - globalStart)/1000) + " seconds delta");
  if(undefined === globalMainPlot)
  {
    let allMinMax = queryAllMinMax();
    plotlyLayout.xaxis.range = [globalStart, globalEnd];
    plotlyLayout.yaxis.range = allMinMax;
    globalMainPlot = Plotly.newPlot(rowBodyEle, 
      allTraces, plotlyLayout, plotlyOptions);
    globalCountTraces = allTraces.length;
    rowBodyEle.on("plotly_relayout", function(eventdata) {
      if(!eventdata['yaxis.range[0]'])
      {
        var startTime = eventdata['xaxis.range[0]'];
        var endTime = eventdata['xaxis.range[1]'];
//        console.log("Time Diff:" + (endTime - startTime));
        if(startTime === undefined || endTime === undefined)
        {
          //we got a reset/zoom out
        } else {
          if("string" == (typeof startTime))
          {
            startTime = new Date(startTime).getTime();
          }
          if("string" == (typeof endTime))
          {
            endTime = new Date(endTime).getTime();
          }
          if(globalStart != startTime
          || globalEnd != endTime)
          {
            let oldDelta = globalEnd - globalStart;
            let newDelta = endTime - startTime;
            let wheelEventString = "";
            let zoomingIsAcceptable = true;
            if(globalLastWheelEvent)
            {
              let deltaWheelEvent = (new Date()).getTime() - globalLastWheelEvent.time;
              if(1500 > deltaWheelEvent)
              {
                wheelEventString = " (deltaY: " + globalLastWheelEvent.deltaY + ")";
                if((globalLastWheelEvent.deltaY < 0 && newDelta > oldDelta)
                || (globalLastWheelEvent.deltaY > 0 && newDelta < oldDelta))
                {
                  zoomingIsAcceptable = false;
                  console.log("Invalid Zoom: " + Math.round(newDelta * 100/ oldDelta) + "%" + wheelEventString);
                }
              }
            }
            if(zoomingIsAcceptable)
            {
              globalStart = startTime;
              globalEnd = endTime;
              //console.log("Zoom " + Math.round((globalEnd - globalStart)/1000) + " seconds delta");
              reload();
              updateMetricUrl();
            }
          }
        }
      }
    });
    //some plotly events: plotly_redraw, plotly_update, plotly_react,
    // plotly_relayouting, plotly_selecting, plotly_deselect, plotly_selected,
    // plotly_beforeexport, plotly_afterexport, plotly_autosize
    rowBodyEle.on("plotly_autosize", function(evt) {
      var gearEle = document.getElementById("gear_xaxis");
      var rowBody = document.querySelector(".row_body");
      positionXAxisGear(rowBody, gearEle);
    });
  } else
  {
    // don't rerender everything
    var oldTraces = new Array();
    for(var i = 0; i < globalCountTraces; ++i)
    {
      oldTraces.push(i);
    }
    Plotly.deleteTraces(rowBodyEle, oldTraces);
    if("local" == globalYRangeType)
    {
      setPlotRanges(false, true);
    }
    Plotly.addTraces(rowBodyEle, allTraces);
    globalCountTraces = allTraces.length;
  }
  var gearEle = document.getElementById("gear_xaxis");
  if(gearEle)
  {
    gearEle.parentNode.removeChild(gearEle);
    gearEle = document.getElementById("gear_yaxis");
    gearEle.parentNode.removeChild(gearEle);
  }
  const BODY = document.getElementsByTagName("body")[0];
  /* TODO: abstract gear creation into separate class */
  var gears = [undefined, undefined];
  for(var i = 0; i < 2; ++i)
  {
    gears[i] = document.createElement("img");
    var img = new Image();
    img.src = "img/gear.png";
    gears[i].src = img.src;
    gears[i].setAttribute("class", "gear_axis");
    gears[i] = BODY.appendChild(gears[i]);
  }
  gears[0].setAttribute("id", "gear_xaxis");
  positionXAxisGear(rowBodyEle, gears[0]);
  gears[0].addEventListener("click", function() {
    globalPopup.xaxis = ! globalPopup.xaxis;
  });
  gears[1].setAttribute("id", "gear_yaxis");
  positionYAxisGear(rowBodyEle, gears[1]);
  gears[1].addEventListener("click", function() {
    globalPopup.yaxis = ! globalPopup.yaxis;
  })
}
function positionXAxisGear(rowBodyEle, gearEle) {
  gearEle.style.position = "absolute";
  var posGear = getTopLeft(rowBodyEle);
  posGear[0] += parseInt(rowBodyEle.offsetWidth) - parseInt(gearEle.offsetWidth);
  posGear[1] += parseInt(rowBodyEle.offsetHeight) - parseInt(gearEle.offsetHeight);
  posGear[0] += -35;
  posGear[1] += -30;
  gearEle.style.left = posGear[0] + "px";
  gearEle.style.top = posGear[1] + "px";  
}
function positionYAxisGear(rowBodyEle, gearEle) {
  gearEle.style.position = "absolute";
  var posGear = getTopLeft(rowBodyEle);
  posGear[0] += 20;
  posGear[1] += 70;
  gearEle.style.left = posGear[0] + "px";
  gearEle.style.top = posGear[1] + "px";    
}
function getTopLeft(ele) {
  var topLeft = [0, 0];
  var curEle = ele;
  while(!curEle.tagName || (curEle.tagName && curEle.tagName.toLowerCase() != "html")) {
    topLeft[0] += parseInt(curEle.offsetLeft);
    topLeft[1] += parseInt(curEle.offsetTop);
    curEle = curEle.parentNode;
  }
  return topLeft;
}
function updateMetricUrl()
{
  let encodedStr = "";
  //old style: 
  if(false)
  {
    let jsurlObj = {
      "cntr": new Array(),
      "start": globalStart,
      "stop": globalEnd,
    };
    for(var i = 0; i < legendApp.metricsList.length; ++i)
    {
      jsurlObj.cntr.push(legendApp.metricsList[i].name);
    }
    encodedStr = encodeURIComponent(window.JSURL.stringify(jsurlObj));
  } else
  {
    encodedStr = "." + globalStart + "_" + globalEnd;
    for(var i = 0; i < legendApp.metricsList.length; ++i)
    {
      encodedStr += "_" + legendApp.metricsList[i].name;
    }
    encodedStr = encodeURIComponent(encodedStr);
  }
  window.location.href =
     parseLocationHref()[0]
   + "#"
   + encodedStr;
}
function parseLocationHref()
{
  let hashPos = window.location.href.indexOf("#");
  let baseUrl = "";
  let jsurlStr = "";
  if(-1 == hashPos)
  {
    baseUrl = window.location.href;
  } else
  {
    baseUrl = window.location.href.substring(0, hashPos);
    jsurlStr = decodeURIComponent(window.location.href.substring(hashPos + 1));
  }
  return [baseUrl, jsurlStr];
}
function importMetricUrl()
{
  var jsurlStr = parseLocationHref()[1];
  if(1 < jsurlStr.length)
  {
    if("~" == jsurlStr.charAt(0))
    {
      let metricsObj = undefined;
      try {
        metricsObj = window.JSURL.parse(jsurlStr);
      } catch(exc)
      {
        console.log("Could not interpret URL");
        console.log(exc);
        return false;
      }
      for(var i = 0; i < metricsObj.cntr.length; ++i)
      {
        legendApp.metricsList.push(new Metric(metricsObj.cntr[i], metricBaseToRgb(metricsObj.cntr[i]), markerSymbols[i * 4], new Array(), [undefined, undefined]));
      }
      globalStart = parseInt(metricsObj.start);
      globalEnd = parseInt(metricsObj.stop);
      reload();
      return true;
    } else if("." == jsurlStr.charAt(0))
    {
      const splitted = jsurlStr.split("_");
      if(1 < splitted.length)
      {
        globalStart = parseInt(splitted[0].substring(1));
        globalEnd = parseInt(splitted[1]);
        for(var i = 2; i < splitted.length; ++i)
        {
          let metricName = splitted[i];
          legendApp.metricsList.push(new Metric(metricName, metricBaseToRgb(metricName), markerSymbols[(i - 2) * 4], new Array(), [undefined, undefined]));
        }
        reload();
        return true;
      }
    }
  }
  return false;
}
function reload()
{
  var requestMetrics = new Array();
  legendApp.metricsList.forEach(function(paramValue, paramIndex, paramArray) {
    if(0 < paramValue.name.length)
    {
      requestMetrics.push(paramValue.name);
    }
  });
  let rowBodyEle = document.querySelector(".row_body");
  let maxDataPoints = Math.round(rowBodyEle.offsetWidth / globalConfiguration.resolution);
  requestMetrics.forEach(function(paramValue, paramIndex, paramArray) {
    sampleRequest(globalStart, globalEnd, maxDataPoints, paramValue);
  });

}

function initTest()
{
  // accelerate zooming with scroll wheel
  document.querySelector(".row_body").addEventListener("wheel", function (evt) {
    evt.stopPropagation();
    var dataObj = {
      time: (new Date()).getTime(),
      clientX: evt.clientX,
      clientY: evt.clientY,
      deltaY: evt.deltaY * globalZoomSpeed
    }
    var newEvent = new WheelEvent("wheel", dataObj );
    globalLastWheelEvent = dataObj;
    evt.target.dispatchEvent(newEvent);
  });
  document.getElementById("button_export").addEventListener("click", function(evt) {
    globalPopup.export = ! globalPopup.export;
  });
  document.getElementById("button_configuration").addEventListener("click", function(evt) {
    configApp.togglePopup();
  });
  if(-1 < window.location.href.indexOf("#"))
  {
    importMetricUrl();
  } else
  {
    globalPopup.presetSelection = true;
    /*
    let maxDataPoints = Math.round(window.innerWidth / globalConfiguration.resolution);
    sampleRequest(globalStart, globalEnd, maxDataPoints, "elab.ariel.power");
    sampleRequest(globalStart, globalEnd, maxDataPoints, "elab.ariel.s0.package.power");
    legendApp.metricsList.push(new Metric("", metricBaseToRgb(""), markerSymbols[0], new Array(), [undefined, undefined]));
    */
  }  
}
function loadGlobalMinMaxPreemptively() {
  const now = (new Date()).getTime();
  const tenYears = 10 * 365 * 86400 * 1000;
  var queryObj = {
    "range": {
      "from": (new Date(now - tenYears)).toISOString(),
      "to": (new Date(now)).toISOString()
    },
    "maxDataPoints": 3,
    "targets": new Array()
  };
  for(var i = 0; i < legendApp.metricsList.length; ++i)
  {
    if(0 < legendApp.metricsList[i].name.length)
    {
      let curTarget = {
        "metric": legendApp.metricsList[i].name,
        "functions": ["min", "max"]
      };
      queryObj.targets.push(curTarget);
    }
  }
  //TODO: use fetch-API with promises
  var req = new XMLHttpRequest();
  req.open("POST", METRICQ_BACKEND, true);
  req.onreadystatechange = function(evt)
  {
    //TODO: take into account server
    //      response code (i.e. code 500)
    if(4 == evt.target.readyState) {
      var responseObj = undefined;
      try {
        responseObj = JSON.parse(evt.target.responseText);
      } catch(exc)
      {
        console.log("Couldn't parse");
        console.log(exc);
      }
      if(responseObj) {
        for(var i = 0; i < responseObj.length; ++i)
        {
          var slashPos = responseObj[i].target.indexOf("/");
          if(-1 < slashPos) {
            var metricBase = responseObj[i].target.substring(0, slashPos);
            var correspondingIndex = legendApp.metricsList.findIndex(function(paramValue, paramIndex, paramArr) { return paramValue.name == metricBase; });
            if(-1 < correspondingIndex)
            {
              var metricObj = legendApp.metricsList[correspondingIndex];
              var curDatapoints = responseObj[i].datapoints;
              var curMinMax = [ curDatapoints[0][0], curDatapoints[0][0]];
              if(metricObj.globalMinmax)
              {
                curMinMax = [metricObj.globalMinmax[0], metricObj.globalMinmax[1]];
              }
              for(var j = 1; j < curDatapoints.length; ++j)
              {
                if(curDatapoints[j][0] < curMinMax[0])
                {
                  curMinMax[0] = curDatapoints[j][0];
                }
                if(curDatapoints[j][0] > curMinMax[1])
                {
                  curMinMax[1] = curDatapoints[j][0];
                }
              }
              metricObj.globalMinmax = curMinMax;
            }
          }
        }
      }
    }
  }
  req.send(JSON.stringify(queryObj));
}
function sampleRequest(startDate, endDate, maxDataPoints, metricName)
{
  var timeMargin = (endDate - startDate) / 3;
  var queryObj = {"range":
        {
                "from": new Date(startDate - timeMargin).toISOString(),
                "to": new Date(endDate + timeMargin).toISOString()
        },
        "maxDataPoints": maxDataPoints,
        "targets":[{
                "metric": metricName,
                "functions":[
                        "min",
                        "max",
                        "avg",
                        "count"
                ]}
        ]
  };
  // TODO: put a validity checker for the queryObj here
  // it should validate, that dates are well-formed
  // it should validate, that maxDataPoints is an integer greater null
  // TODO: use modern WebWorkers, or even better:
  //       use fetch-API with promises, it's modern!
  var req = new XMLHttpRequest();
  req.open("POST", METRICQ_BACKEND, true);
  req.onreadystatechange = function(evtObj) {
    if(4 == evtObj.target.readyState)
    {
      var parsedObj = undefined;
      try {
        parsedObj = JSON.parse(evtObj.target.responseText);
        parseResponse(parsedObj);
      } catch(exc)
      {
        console.log("Couldn't parse");
        console.log(exc);
      }
    }
  }
  req.send(JSON.stringify(queryObj));
}

function metricBaseToRgb(metricBase)
{
  var rgbArr = hslToRgb((crc32(metricBase) >> 24 & 255) / 255.00, 1, 0.46);
  return "rgb(" + rgbArr[0] + "," + rgbArr[1] + "," + rgbArr[2] + ")";
}

/* TODO: move this into metric class */
function parseResponse(parsedJson)
{
  var tracesAll = {
    "min": undefined,
    "max": undefined
  }
  var traceRgbCss = undefined;
  var traceMarker = markerSymbols[0];
  var metricBase = undefined;
  var metricAggregate = undefined;
  var minmaxValue = [ undefined, undefined];
  for(var i = 0; i < parsedJson.length; ++i)
  {
    if(-1 < parsedJson[i].target.indexOf("/"))
    {
      metricBase = parsedJson[i].target.substring(0, parsedJson[i].target.indexOf("/"));
      metricAggregate = parsedJson[i].target.substring(parsedJson[i].target.indexOf("/") + 1);
    }
    if(undefined === traceRgbCss)
    {
      let existingIndex = legendApp.metricsList.findIndex(function(paramValue, paramIndex, paramArray) { return paramValue.name == metricBase; });
      if(-1 == existingIndex)
      {
        traceRgbCss = metricBaseToRgb(metricBase);
      } else
      {
        traceRgbCss = legendApp.metricsList[existingIndex].color;
        traceMarker = legendApp.metricsList[existingIndex].marker;
      }
    }

    var curTrace = {
      "x": new Array(),
      "y": new Array(),
      "name": metricAggregate,
      "type": "scatter"
    }
    switch(metricAggregate)
    {
      case "min": 
      case "max": /* fall-through */
      case "avg": /* fall-through */
      case "raw": /* fall-through */
        if(undefined === minmaxValue[0])
        {
          minmaxValue[0] =  minmaxValue[1] = parsedJson[i].datapoints[0][0];
        }
        for(var j = 0, curY; j < parsedJson[i].datapoints.length; ++j)
        {
          curTrace.x.push(parsedJson[i].datapoints[j][1]);
          curY = parsedJson[i].datapoints[j][0];
          curTrace.y.push(curY);
          if(curY > minmaxValue[1]) minmaxValue[1] = curY;
          if(curY < minmaxValue[0]) minmaxValue[0] = curY;
        }
        tracesAll[metricAggregate] = curTrace;
        break;
    }
  }
  if(tracesAll["min"] && tracesAll["max"])
  {
    var traces = [ tracesAll["min"], tracesAll["max"]];
    traces[1].fill = "tonexty";
    if(tracesAll["avg"])
    {
      traces.push(tracesAll["avg"]);
    }
    traces.forEach( function (paramValue, paramIndex, paramArray) {
      paramValue.mode = "lines";
      paramValue.line = {
      "width": 0,
      "color": traceRgbCss,
      "shape": "vh" }; // connect "next"
      //"shape": "hv" // connect "last"
      //"shape": "linear" // connect "direct"
    });
    if(tracesAll["avg"])
    {
      traces[2].line.dash = "dash";
      traces[2].line.width = 2;
    }
    //add traces to metricList, create an object of metric class in before
    loadedMetric(metricBase, traceRgbCss, traceMarker, traces, minmaxValue);
    renderMetrics();
  } else if(tracesAll["raw"])
  {
    var rawTrace = [tracesAll["raw"]]
    rawTrace[0].mode = "markers";
    rawTrace[0].marker = {
      "size": 10,
      "color": traceRgbCss,
      "symbol": traceMarker
    }
    loadedMetric(metricBase, traceRgbCss, traceMarker, rawTrace, minmaxValue);
    renderMetrics();
  }
}
function loadedMetric(metricBase, metricColor, metricMarker, metricTraces, minmaxValue)
{
  //check for previously existing metrics with the same name
  let existingIndex = legendApp.metricsList.findIndex(function(paramValue, paramIndex, paramArray) { return paramValue.name == metricBase; });
  if(-1 == existingIndex)
  {
    let newMetric = new Metric(metricBase, metricColor, metricMarker, metricTraces, minmaxValue);
    legendApp.metricsList.push(newMetric);
  } else {
    legendApp.metricsList[existingIndex].traces = metricTraces;
    legendApp.metricsList[existingIndex].minmax = minmaxValue;
  }
}


Vue.component("metric-legend", {
  "props": ["metric"],
  "template": "<li v-on:click=\"metricPopup(metric.name)\"><span v-bind:style=\"{color: metric.color}\">█</span> {{ metric.name }} </li>",
  "methods": {
    "metricPopup": function(metricName) {
      //console.log(metricName);
      let existingIndex = legendApp.metricsList.findIndex(function(paramValue, paramIndex, paramArray) { return paramValue.name == metricName; });
      if(-1 != existingIndex)
      {
        legendApp.metricsList[existingIndex].popup = ! legendApp.metricsList[existingIndex].popup;
      }
    }
  }
});

//adapted from https://plot.ly/python/marker-style/
// not working:
//   "cross-thin", "x-thin", "asterisk", "hash", "hash-dot", "y-up", "y-down", "y-left", "y-right",
//   "line-ew", "line-ns", "line-ne", "line-nw"
var markerSymbols = ["circle", "circle-dot", "circle-open", "circle-open-dot", "square", "square-dot",
 "square-open", "square-open-dot", "diamond", "diamond-dot", "diamond-open", "diamond-open-dot", "cross",
 "cross-dot", "cross-open", "cross-open-dot", "x", "x-dot", "x-open", "x-open-dot", "triangle-up",
 "triangle-up-dot", "triangle-up-open", "triangle-up-open-dot", "triangle-down", "triangle-down-dot",
 "triangle-down-open", "triangle-down-open-dot", "triangle-left", "triangle-left-dot",
 "triangle-left-open", "triangle-left-open-dot", "triangle-right", "triangle-right-dot",
 "triangle-right-open", "triangle-right-open-dot", "triangle-ne", "triangle-ne-dot", "triangle-ne-open",
 "triangle-ne-open-dot", "triangle-se", "triangle-se-dot", "triangle-se-open", "triangle-se-open-dot",
 "triangle-sw", "triangle-sw-dot", "triangle-sw-open", "triangle-sw-open-dot", "triangle-nw",
 "triangle-nw-dot", "triangle-nw-open", "triangle-nw-open-dot", "pentagon", "pentagon-dot",
 "pentagon-open", "pentagon-open-dot", "hexagon", "hexagon-dot", "hexagon-open", "hexagon-open-dot",
 "hexagon2", "hexagon2-dot", "hexagon2-open", "hexagon2-open-dot", "octagon", "octagon-dot",
 "octagon-open", "octagon-open-dot", "star", "star-dot", "star-open", "star-open-dot", "hexagram",
 "hexagram-dot", "hexagram-open", "hexagram-open-dot", "star-triangle-up", "star-triangle-up-dot",
 "star-triangle-up-open", "star-triangle-up-open-dot", "star-triangle-down", "star-triangle-down-dot",
 "star-triangle-down-open", "star-triangle-down-open-dot", "star-square", "star-square-dot",
 "star-square-open", "star-square-open-dot", "star-diamond", "star-diamond-dot", "star-diamond-open",
 "star-diamond-open-dot", "diamond-tall", "diamond-tall-dot", "diamond-tall-open",
 "diamond-tall-open-dot", "diamond-wide", "diamond-wide-dot", "diamond-wide-open",
 "diamond-wide-open-dot", "hourglass", "hourglass-open", "bowtie", "bowtie-open", "circle-cross",
 "circle-cross-open", "circle-x", "circle-x-open", "square-cross", "square-cross-open", "square-x",
 "square-x-open", "diamond-cross", "diamond-cross-open", "diamond-x", "diamond-x-open",  "cross-thin-open",
 "x-thin-open", "asterisk-open", "hash-open", "hash-open-dot", "y-up-open", "y-down-open", "y-left-open",
 "y-right-open", "line-ew-open", "line-ns-open", "line-ne-open", "line-nw-open"];

Vue.component("metric-popup", {
  "props": ["metric"],
  "template": "<div v-bind:id=\"metric.popupKey\" class=\"popup_div metric_popup_div\"><div style=\"float: left; width: 258px;\">"
            + "<input type=\"text\" class=\"popup_input\" v-model=\"metric.name\" /><br/>"
            + "<canvas class=\"popup_colorchooser\" width=\"260\" height=\"45\"></canvas></div>"
            + "<div style=\"width: 90px; float: left;\">"
            + "<img src=\"img/trashcan.png\" class=\"popup_trashcan\" width=\"17\" height=\"17\">"
            + "</div>"
            + "<div class=\"popup_close_button\">X</div>"
            + "<div class=\"popup_cleaner\"></div>"
            + "<div style=\"float: left;\">"
            + "<select class=\"popup_legend_select generic_select\" size=\"1\" v-bind:value=\"metric.marker\" v-on:change=\"changeMarker\">"
            + "<option v-for=\"symbol in markerSymbols\" v-bind:value=\"symbol\">{{ symbol }}</option>"
            + "</select>"
            + "</div>"
            + "</div>",
  "data": function () {
    return { "markerSymbols": markerSymbols };
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
            + "<div class=\"config_popup_labels\"><label>Auflösung</label><br/>"
            + "<label>Zoom Geschwindigkeit</label></div>"
            + "<div style=\"float: left;\">"
            + "<button class=\"button_resolution\" v-on:click=\"manipulateResolution(-1)\">-</button>"
            + "<input type=\"range\" class=\"config_popup_slider\" id=\"resolution_input\" v-model=\"uiResolution\" min=\"0\" max=\"29\" step=\"0.25\"/>"
            + "<button class=\"button_resolution\" v-on:click=\"manipulateResolution(+1)\">+</button><br/>"
            + "<button class=\"button_zoom_speed\" v-on:click=\"manipulateZoomSpeed(-3)\">-</button>"
            + "<input type=\"range\" class=\"config_popup_slider\" id=\"zoom_speed_input\" v-model.sync=\"uiZoomSpeed\" min=\"1\" max=\"100\" step=\"0.5\"/>"
            + "<button class=\"button_zoom_speed\" v-on:click=\"manipulateZoomSpeed(+3)\">+</button><br/>"
            + "</div>"
            + "<div class=\"popup_close_button\">X</div>"
            + "</div>",
  "computed": {
    "uiResolution": {
      get: function() {
        return 30 - globalConfiguration.resolution;
      },
      set: function(newValue) {
        globalConfiguration.resolution = 30 - newValue;
        this.$emit("update:uiResolution", newValue);
      }
    },
    "uiZoomSpeed": {
      cache: false,
      get: function() {
        return globalZoomSpeed;
      },
      set: function(newValue) {
        globalZoomSpeed = newValue;
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
    },
    "manipulateZoomSpeed": function(increment)
    {
      let newValue = parseFloat(this.uiZoomSpeed) + increment;
      newValue =  this.withinRange(document.getElementById("zoom_speed_input"), newValue);
      this.uiZoomSpeed = newValue;
      //manually update the DOM, because
      // vue js is too dumb to do that
      document.getElementById("zoom_speed_input").value = newValue;
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
            + "<div class=\"xaxis_popup_labels\">"
            + "<label>Anfangszeit</label><br/>"
            + "<label>Endzeit</label>"
            + "</div>"
            + "<div class=\"xaxis_popup_time\">"
            + "<input type=\"date\" v-model=\"startDate\" required /><input type=\"time\" v-model=\"startTime\" required /><br/>"
            + "<input type=\"date\" v-model=\"endDate\" required /><input type=\"time\" v-model=\"endTime\" required />"
            + "</div>"
            + "<div class=\"popup_close_button\">X</div>"
            + "</div>",
  "computed": {
    "startDate": {
      get: function()
      {
        var dateObj = new Date(globalStart);
        return dateObj.getFullYear() + "-" + ((dateObj.getMonth() + 1) < 10 ? "0" : "") + (dateObj.getMonth() + 1) + "-" + (dateObj.getDate() < 10 ? "0" : "") + dateObj.getDate()
      },
      set: function(newValue)
      {
        globalStart = (new Date(newValue)).getTime() + (globalStart % 86400000);
        setPlotRanges(true, true);
      }
    },
    "endDate": {
      get: function()
      {
        var dateObj = new Date(globalEnd);
        return dateObj.getFullYear() + "-" + ((dateObj.getMonth() + 1) < 10 ? "0" : "") + (dateObj.getMonth() + 1) + "-" + (dateObj.getDate() < 10 ? "0" : "") + dateObj.getDate()
      },
      set: function(newValue)
      {
        globalEnd = (new Date(newValue)).getTime() + (globalEnd % 86400000);
        setPlotRanges(true, true);
      }
    },
    "startTime": {
      get: function()
      {
        var dateObj = new Date(globalStart);
        return (dateObj.getHours() < 10 ? "0" : "") + dateObj.getHours() + ":" + (dateObj.getMinutes() < 10 ? "0" : "") + dateObj.getMinutes() + ":" + (dateObj.getSeconds() < 10 ? "0" : "") + dateObj.getSeconds()
      },
      set: function(newValue)
      {
        var dateObj = new Date(this.startDate + " " + newValue);
        globalStart = dateObj.getTime();
        setPlotRanges(true, true);
      }
    },
    "endTime": {
      get: function()
      {
        var dateObj = new Date(globalEnd);
        return (dateObj.getHours() < 10 ? "0" : "") + dateObj.getHours() + ":" + (dateObj.getMinutes() < 10 ? "0" : "") + dateObj.getMinutes() + ":" + (dateObj.getSeconds() < 10 ? "0" : "") + dateObj.getSeconds()
      },
      set: function(newValue)
      {
        var dateObj = new Date(this.endDate + " " + newValue);
        globalEnd = dateObj.getTime();
        setPlotRanges(true, true);
      }
    }
  }
});
Vue.component("yaxis-popup", {
  /* use vue-js for radio buttons */
  "template": "<div class=\"popup_div yaxis_popup_div\">"
            + "<div class=\"yaxis_popup_radio\">"
            + "<input type=\"radio\" value=\"global\" name=\"yaxis\" id=\"yaxis_global\" v-model=\"yaxisRange\" /><label for=\"yaxis_global\">Globales Min/Max</label><br/>"
            + "<input type=\"radio\" value=\"local\" name=\"yaxis\" id=\"yaxis_local\" v-model=\"yaxisRange\" /><label for=\"yaxis_local\">Lokales Min/Max</label><br/>"
            + "<input type=\"radio\" value=\"manual\" name=\"yaxis\" id=\"yaxis_manual\" v-model=\"yaxisRange\" /><label for=\"yaxis_manual\">Manuelles Min/Max</label><br/>"
            + "<div class=\"yaxis_popup_minmax\">"
            + "<label for=\"yaxis_min\" class=\"yaxis_popup_label_minmax\">Min:</label><input type=\"number\" v-model=\"allMin\" id=\"yaxis_min\" :disabled.sync=\"manualDisabled\"/><br/>"
            + "<label for=\"yaxis_max\" class=\"yaxis_popup_label_minmax\">Max:</label><input type=\"number\" v-model=\"allMax\" id=\"yaxis_max\" :disabled.sync=\"manualDisabled\"/><br/>"
            + "</div>"
            + "</div>"
            + "<div class=\"popup_close_button\">X</div>"
            + "</div>",
  "computed": {
    "manualDisabled": {
      cache: false,
      get: function()
      {
        return "manual" != globalYRangeType;
      },
      set: function(newValue)
      {
        globalYRangeType = "local";
      }
    },
    "yaxisRange": {
      get: function()
      {
        return globalYRangeType;
      },
      set: function(newValue)
      {
        globalYRangeType = newValue;
        var ele = document.getElementById("yaxis_min");
        if(ele) {
          ele.disabled = "manual" != newValue;
          ele = document.getElementById("yaxis_max");
          ele.disabled = "manual" != newValue;
        }
        if("global" == newValue)
        {
          loadGlobalMinMaxPreemptively();
        }
        setPlotRanges(false, true);
      }
    },
    "allMin": {
      get: function()
      {
        let arr = queryAllMinMax();
        if(arr)
        {
          return (new Number(arr[0])).toFixed(3);
        }
      },
      set: function(newValue)
      {
        let arr = queryAllMinMax();
        arr = [newValue, arr[1]];
        globalYRangeOverride = arr;
        setPlotRanges(false, true);
      }
    },
    "allMax": {
      get: function()
      {
        let arr = queryAllMinMax();
        if(arr)
        {
          return (new Number(arr[1])).toFixed(3);
        }
      },
      set: function(newValue)
      {
        let arr = queryAllMinMax();
        arr = [arr[0], newValue];
        globalYRangeOverride = arr;
        setPlotRanges(false, true);
      }
    }
  }
});
Vue.component("preset-popup", {
  "template": "<div class=\"popup_div preset_popup_div\">"
            + "<img src=\"img/metricq-webview-logo.png\" width=\"322\" height=\"123\" /><br/>"
            + "<select class=\"generic_select\" id=\"preset_select\" size=\"1\" v-on:change=\"updateList\" v-on:keydown.enter=\"showMetrics\">"
            + "<option v-for=\"(presetValue, presetIndex) in metricPresets\" v-bind:value=\"presetIndex\">{{ presetIndex }}</option>"
            + "</select>"
            + "<button class=\"button_preset_show generic_button\" v-on:click=\"showMetrics\">Anzeigen</button>"
            + "<ul class=\"list_preset_show\">"
            + "<li v-for=\"metricName in metricMetriclist\">{{ metricName }}</li>"
            + "</ul>"
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
      for(; i < globalSelectedPreset.length; ++i)
      {
        let metricName = globalSelectedPreset[i];
        if(0 == metricName.length) hasEmptyMetric = true;
        legendApp.metricsList.push(new Metric(metricName, metricBaseToRgb(metricName), markerSymbols[i*4], new Array(), [undefined, undefined]));
      }
      if( ! hasEmptyMetric)
      {
        legendApp.metricsList.push(new Metric("", metricBaseToRgb(""), markerSymbols[i * 4], new Array(), [undefined, undefined]));
      }
      reload();
    }
  }
});
Vue.component("export-popup", {
  "template": "<div class=\"popup_div export_popup_div\">"
            + "<div style=\"float: left; line-height: 25pt;\">"
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
            + "<div class=\"popup_close_button\">X</div>"
            + "</div>",
  "computed": {
    fileformats() {
      return ["svg", "png", "jpeg", "webp"];
    },
    "selectedFileformat": {
      get: function()
      {
        return plotlyOptions.toImageButtonOptions.format;
      },
      set: function(newValue)
      {
        plotlyOptions.toImageButtonOptions.format = newValue;
      }
    },
    "exportWidth": {
      get: function()
      {
        return plotlyOptions.toImageButtonOptions.width;
      },
      set: function(newValue)
      {
        plotlyOptions.toImageButtonOptions.width = parseInt(newValue);
      }
    },
    "exportHeight":
    {
      get: function()
      {
        return plotlyOptions.toImageButtonOptions.height;
      },
      set: function(newValue)
      {
        plotlyOptions.toImageButtonOptions.height = parseInt(newValue);
      }
    }
  },
  "methods": {
    "doExport": function()
    {
      Plotly.downloadImage(document.querySelector(".row_body"), plotlyOptions.toImageButtonOptions);
      veil.destroy();
      globalPopup.export = false;
    }
  }
});

var legendApp = new Vue({
  "el": "#legend_list",
  "data": {
    "metricsList": new Array()
  }
});
var popupApp = new Vue({
  "el": "#wrapper_popup_legend",
  "methods": {
  },
  "computed": {
    "metricsList": function() { return legendApp.metricsList; }
  },
  updated() {
    var selectedIndex = -1;
    for(var i = 0; i < legendApp.metricsList.length; ++i)
    {
      if(legendApp.metricsList[i].popup)
      {
        selectedIndex = i;
        break;
      }
    }
    if(-1 != selectedIndex) {
      var popupEle = document.querySelector("#" + legendApp.metricsList[i].popupKey);
      if(popupEle)
      {
        let affectedTraces = new Array();
        for(var i = 0, j = 0; i < legendApp.metricsList.length; ++i)
        {
          if(legendApp.metricsList[i].traces)
          {
            for(var k = 0; k < legendApp.metricsList[i].traces.length; ++k)
            {
              if(selectedIndex == i)
              {
                affectedTraces.push(j);
              }
              ++j;
            }
          }
        }
        var disablePopupFunc = function(paramIndex) {
          return function(evt) {
            var myMetric = legendApp.metricsList[parseInt(evt.target.getAttribute("metric-array-index"))];
            var myTraces = JSON.parse(evt.target.getAttribute("metric-affected-traces"));
            myMetric.popup = false
            veil.destroy();

            if("popup_trashcan" != evt.target.getAttribute("class"))
            {
              if(myMetric.name != evt.target.getAttribute("metric-old-name"))
              {
                myMetric.updateName(myMetric.name);
                if("" == evt.target.getAttribute("metric-old-name"))
                {
                  legendApp.metricsList.push(new Metric("", metricBaseToRgb(""), markerSymbols[0], new Array(), [undefined, undefined]));
                } else {
                  /* TODO: reject metric names that already exist */
                }
                reload();
              } else {
                if(evt.target.getAttribute("metric-old-color") != myMetric.color)
                {
                  if("raw" == myMetric.traces[0].name)
                  {
                    Plotly.restyle(document.querySelector(".row_body"), {"marker.color": myMetric.color}, myTraces);
                  } else {
                    Plotly.restyle(document.querySelector(".row_body"), {"line.color": myMetric.color}, myTraces);
                  }
                }
                if(evt.target.getAttribute("metric-old-marker") != myMetric.marker)
                {
                  Plotly.restyle(document.querySelector(".row_body"), {"marker.symbol": myMetric.marker}, myTraces);
                }
                //don't do a complete repaint
                //renderMetrics();
              }
            }
        } }(selectedIndex);
        var veilEle = veil.create(disablePopupFunc);
        veil.attachPopup(popupEle);
        popupEle.style.zIndex = 500 + selectedIndex;
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
        var colorchooserObj = new Colorchooser(colorchooserEle, legendApp.metricsList[selectedIndex]);
        colorchooserObj.onchange = function(myTraces, myMetric) { return function() {
          if(0 == myMetric.traces.length)
          {
            return;
          }
          if("raw" == myMetric.traces[0].name)
          {
            Plotly.restyle(document.querySelector(".row_body"), {"marker.color": myMetric.color}, myTraces);
          } else {
            Plotly.restyle(document.querySelector(".row_body"), {"line.color": myMetric.color}, myTraces);
          }
        }}(affectedTraces, legendApp.metricsList[selectedIndex]);
        popupEle.querySelector(".popup_legend_select").addEventListener("change", function(myTraces, myMetric) { return function(evt) {
          Plotly.restyle(document.querySelector(".row_body"), {"marker.symbol": myMetric.marker}, myTraces);
        }}(affectedTraces, legendApp.metricsList[selectedIndex]));

        [veilEle, inputEle, closeEle, trashcanEle].forEach(function(paramValue, paramIndex, paramArray) {
          paramValue.setAttribute("metric-array-index", "" + selectedIndex);
          paramValue.setAttribute("metric-old-name", legendApp.metricsList[selectedIndex].name);
          paramValue.setAttribute("metric-old-color", legendApp.metricsList[selectedIndex].color);
          paramValue.setAttribute("metric-old-marker", legendApp.metricsList[selectedIndex].marker);
          paramValue.setAttribute("metric-affected-traces", JSON.stringify(affectedTraces))
        });

        trashcanEle.addEventListener("click", function(paramIndex, disableFunc){
          return function(evt) {
            disableFunc(evt);
            //legendApp.metricsList = legendApp.metricsList.slice(paramIndex, 1);
            var newArray = new Array();
            for(var i = 0; i < legendApp.metricsList.length; ++i)
            {
              if(i != paramIndex)
              {
                newArray.push(legendApp.metricsList[i]);
              }
            }
            legendApp.metricsList = newArray;
            renderMetrics();
          };
        }(selectedIndex, disablePopupFunc));
      }
    }
  }
});
var configApp = new Vue({
  "el": "#wrapper_popup_configuration",
  "methods": {
    "togglePopup": function()
    {
      globalConfiguration.popup = ! globalConfiguration.popup;
    }
  },
  "data": {
    "config": globalConfiguration
  },
  updated() {
    var popupEle = document.querySelector(".config_popup_div");
    if(popupEle)
    {
      var disablePopupFunc = function() { globalConfiguration.popup = false; reload(); };
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
      var disablePopupFunc = function() { globalPopup.xaxis = false; reload(); };
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
      var disablePopupFunc = function() { globalPopup.yaxis = false; reload(); };
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
      var disablePopupFunc = function() { globalPopup.presetSelection = false; reload(); };
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
      var disablePopupFunc = function() { globalPopup.export = false; reload(); };
      veil.create(disablePopupFunc);
      veil.attachPopup(popupEle);
      var closeButtonEle = popupEle.querySelector(".popup_close_button");
      closeButtonEle.addEventListener("click", function() { veil.destroy(); disablePopupFunc(); });
    }
  }
});


document.addEventListener("DOMContentLoaded", initTest);
