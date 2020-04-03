var METRICQ_BACKEND = "https://grafana.metricq.zih.tu-dresden.de/metricq/query";


class MetricHandler {
  constructor(paramRenderer, paramMetricsArr, paramStartTime, paramStopTime)
  {
  	this.renderer = paramRenderer;
  	this.initialMetricNames = paramMetricsArr;
  	this.startTime = paramStartTime;
  	this.stopTime = paramStopTime;

    this.WIGGLEROOM_PERCENTAGE = 0.05;

  	this.allMetrics = new Object();
    for(var i = 0; i < this.initialMetricNames.length; ++i)
    {
      var curMetricName = this.initialMetricNames[i];
      if(0 < curMetricName.length)
      {
        this.allMetrics[curMetricName] = new Metric(curMetricName, metricBaseToRgb(curMetricName), markerSymbols[i * 4], new Array(), [undefined, undefined]);
      } else
      {
        this.allMetrics["empty"] = new Metric("", metricBaseToRgb(""), markerSymbols[i * 4], new Array(), [undefined, undefined]);
      }
    }
  }
  doRequest(maxDataPoints) {
  	var timeMargin = (this.stopTime - this.startTime) / 3;
    var nonErrorProneMetrics = new Array();
    var remainingMetrics = new Array();
  	for (var metricBase in this.allMetrics)
  	{
      var curMetric = this.allMetrics[metricBase];
	    if(0 < curMetric.name.length)
	    {
        if(curMetric.errorprone)
        {
          remainingMetrics.push(curMetric.name);
        } else
        {
          nonErrorProneMetrics.push(curMetric.name);
        }
      }
    }
    var queryJSON = this.createMetricQQuery(this.startTime - timeMargin,
                                            this.stopTime + timeMargin,
                                            maxDataPoints,
                                            nonErrorProneMetrics,
                                            ["min", "max", "avg", "count"]);
    if(queryJSON)
    {
      // TODO: use modern WebWorkers, or even better:
      //       use fetch-API with promises, it's modern!
      var req = new XMLHttpRequest();
      req.open("POST", METRICQ_BACKEND, true);
      req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
      req.onreadystatechange = function(selfReference, paramMetricArr) { return function(evtObj) {
        selfReference.handleMetricResponse(selfReference, paramMetricArr, evtObj);
      }; }(this, nonErrorProneMetrics);
      req.send(queryJSON);
    }
    for(var i = 0; i < remainingMetrics.length; ++i)
    {
      var queryJSON = this.createMetricQQuery(this.startTime - timeMargin,
                                              this.stopTime + timeMargin,
                                              maxDataPoints,
                                              [remainingMetrics[i]],
                                              ["min", "max", "avg", "count"]);
      if(queryJSON)
      {
        var req = new XMLHttpRequest();
        req.open("POST", METRICQ_BACKEND, true);
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.onreadystatechange = function(selfReference, paramMetricArr) { return function(evtObj) {
          selfReference.handleMetricResponse(selfReference, paramMetricArr, evtObj);
        }; }(this, [remainingMetrics[i]]);
        req.send(queryJSON);
      }
    }
  }
  handleMetricResponse(selfReference, metricArr, evt)
  {
    if(4 == evt.target.readyState)
    {
      if(200 <= evt.target.status
      && 300 > evt.target.status)
      {
        var parsedObj = undefined;
        try {
          parsedObj = JSON.parse(evt.target.responseText);
          selfReference.parseResponse(parsedObj, metricArr);
        } catch(exc)
        {
          console.log("Couldn't parse");
          console.log(exc);
        }
      } else
      {
        selfReference.receivedError(evt.target.status, metricArr);
      }
    }
  }
  createMetricQQuery(startTime, stopTime, maxDataPoints, metricArr, metricFunctions)
  {
    if(startTime instanceof Date)
    {
      startTime = startTime.getTime();
    }
    if(stopTime instanceof Date)
    {
      stopTime = stopTime.getTime();
    }
    startTime = parseInt(startTime);
    stopTime = parseInt(stopTime);
    maxDataPoints = parseInt(maxDataPoints);
    if(!(startTime < stopTime))
    {
      return undefined;
    }
    if(!maxDataPoints)
    {
      maxDataPoints = 400;
    }
    var queryObj = {"range":
      {
        "from": new Date(startTime).toISOString(),
        "to": new Date(stopTime).toISOString()
      },
      "maxDataPoints": maxDataPoints,
      "targets": new Array()
    };
    for(var i = 0; i < metricArr.length; ++i)
    {
      var targetObj = {
        "metric": metricArr[i],
        "functions": metricFunctions
      };
      queryObj.targets.push(targetObj);
    }
    return JSON.stringify(queryObj);
  }
  queryAllMinMax() {
    let referenceAttribute = "minmax";
    if("manual" == this.renderer.yRangeType && this.renderer.yRangeOverride)
    {
      return this.renderer.yRangeOverride;
    } else if("global" == this.renderer.yRangeType)
    {
      referenceAttribute = "globalMinmax";
    }
    let allMinMax = [undefined, undefined];
    //TODO: restrict local min/max to actual visual area
    //      as in the prototype
    for(var metricBase in this.allMetrics)
    {
      let curMetric = this.allMetrics[metricBase];
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
    allMinMax[0] -= delta * this.WIGGLEROOM_PERCENTAGE;
    allMinMax[1] += delta * this.WIGGLEROOM_PERCENTAGE;
    return allMinMax;
  }
  parseResponse(parsedJson, paramMetricsArr)
  {
    //TODO: write this to handle multiple metrics
    var tracesAll = {
      "min": undefined,
      "max": undefined
    };
    var traceRgbCss = undefined;
    var traceMarker = markerSymbols[0];
    var metricBase = undefined;
    var metricAggregate = undefined;
    var minmaxValue = [ undefined, undefined];
    for(var i = 0; i < parsedJson.length; ++i)
    {
      if(-1 < parsedJson[i].target.indexOf("/")
      && parsedJson[i]["datapoints"]
      && parsedJson[i].datapoints[0])
      {
        metricBase = parsedJson[i].target.substring(0, parsedJson[i].target.indexOf("/"));
        metricAggregate = parsedJson[i].target.substring(parsedJson[i].target.indexOf("/") + 1);

        if(undefined === traceRgbCss)
        {
          if(this.allMetrics[metricBase])
          {
          	traceRgbCss = this.allMetrics[metricBase].color;
            traceMarker = this.allMetrics[metricBase].marker;
          } else
          {
            traceRgbCss = metricBaseToRgb(metricBase);
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
      this.loadedMetric(metricBase, traceRgbCss, traceMarker, traces, minmaxValue);
      this.renderer.renderMetrics();
    } else if(tracesAll["raw"])
    {
      var rawTrace = [tracesAll["raw"]]
      rawTrace[0].mode = "markers";
      rawTrace[0].marker = {
        "size": 10,
        "color": traceRgbCss,
        "symbol": traceMarker
      }
      this.loadedMetric(metricBase, traceRgbCss, traceMarker, rawTrace, minmaxValue);
      this.renderer.renderMetrics();
    }
  }
  loadedMetric(metricBase, metricColor, metricMarker, metricTraces, minmaxValue)
  {
    if(this.allMetrics[metricBase])
    {
      this.allMetrics[metricBase].traces = metricTraces;
      this.allMetrics[metricBase].minmax = minmaxValue;
    } else
    {
      this.allMetrics[metricBase] = new Metric(metricBase, metricColor, metricMarker, metricTraces, minmaxValue);
    }
  }
  receivedError(errorCode, metricBase)
  {
    // mark a metric so it is being excluded in bulk-requests
    this.allMetrics[metricBase].errorprone = true;
  }
  reload()
  {
  	let rowBodyEle = document.querySelector(".row_body");
    let maxDataPoints = Math.round(rowBodyEle.offsetWidth / this.renderer.configuration.resolution);
    this.doRequest(maxDataPoints);
  }

  loadGlobalMinMax()
  {
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
    for(var metricBase in this.allMetrics)
    {
      if(0 < this.allMetrics[metricBase].name.length)
      {
        if(undefined === this.allMetrics[metricBase].globalMinmax)
        {
          let curTarget = {
            "metric": this.allMetrics[metricBase].name,
            "functions": ["min", "max"]
          };
          queryObj.targets.push(curTarget);
        }
      }
    }
    if(0 == queryObj.targets.length)
    {
      return;
    }
    //TODO: maybe use fetch-API with promises
    var req = new XMLHttpRequest();
    req.open("POST", METRICQ_BACKEND, true);
    req.onreadystatechange = function(selfReference) { return function(evt)
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
              var metricObj = selfReference.allMetrics[metricBase];
              if(metricObj)
              {
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
    };}(this);
    req.send(JSON.stringify(queryObj));
  }
}