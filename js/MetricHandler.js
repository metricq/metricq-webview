class MetricHandler {
  constructor(paramRenderer, paramMetricsArr, paramStartTime, paramStopTime)
  {
  	this.renderer = paramRenderer;
  	this.initialMetricNames = paramMetricsArr;
  	this.startTime = paramStartTime;
  	this.stopTime = paramStopTime;

  	this.allMetrics = new Object();
  }
  doRequest(maxDataPoints) {
  	var timeMargin = (this.stopTime - this.startTime) / 3;
  	let metricNamesArr = new Array();
    for(var metricBase in this.allMetrics)
    {
      metricNamesArr.push(this.allMetrics[metricBase].name);
    }
  	if(0 == metricNamesArr.length)
  	{
  	  metricNamesArr = this.initialMetricNames;
  	}
  	for (var i = 0; i < metricNamesArr.length; ++i)
  	{
  	  var metricName = metricNamesArr[i];
	    if(0 == metricName.length)
      {
        if(!this.allMetrics["empty"])
        {
          this.allMetrics["empty"] = new Metric("", metricBaseToRgb(""), markerSymbols[0], new Array(), [undefined, undefined]);
        }
      } else
	    {
        var queryObj = {"range":
          {
                "from": new Date(this.startTime - timeMargin).toISOString(),
                "to": new Date(this.stopTime + timeMargin).toISOString()
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
        req.onreadystatechange = function(selfReference, paramMetricName) { return function(evtObj) {
          if(4 == evtObj.target.readyState)
            if(200 <= evtObj.target.status
            && 300 > evtObj.target.status)
            {
              var parsedObj = undefined;
              try {
                parsedObj = JSON.parse(evtObj.target.responseText);
                selfReference.parseResponse(parsedObj);
              } catch(exc)
              {
                console.log("Couldn't parse");
                console.log(exc);
              }
            } else
            {
              selfReference.receivedError(evtObj.target.status, paramMetricName);
            }
          }
        }(this, metricName);
        req.send(JSON.stringify(queryObj));
      }
    }
  }
  /* TODO: move this into metric class */
  parseResponse(parsedJson)
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
    //TODO: Implement me,
    // some fancy code, marking a metric as faulty,
    //   which entails it being excluded in bulk-requests
  }
  reload()
  {
  	let rowBodyEle = document.querySelector(".row_body");
    let maxDataPoints = Math.round(rowBodyEle.offsetWidth / this.renderer.configuration.resolution);
    this.doRequest(maxDataPoints);
  }
}