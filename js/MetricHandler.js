var METRICQ_BACKEND = "https://grafana.metricq.zih.tu-dresden.de/metricq";


class MetricHandler {
  constructor(paramRenderer, paramMetricsArr, paramStartTime, paramStopTime)
  {
  	this.renderer = paramRenderer;
  	this.startTime = paramStartTime;
  	this.stopTime = paramStopTime;
    this.metricQHistoric = new MetricQHistoric(METRICQ_BACKEND);

    this.WIGGLEROOM_PERCENTAGE = 0.05;

    this.initializeMetrics(paramMetricsArr)
  }
  initializeMetrics(initialMetricNames)
  {
    this.allMetrics = new Object();
    for(var i = 0; i < initialMetricNames.length; ++i)
    {
      var curMetricName = initialMetricNames[i];
      if(0 < curMetricName.length)
      {
        this.allMetrics[curMetricName] = new Metric(this.renderer, curMetricName, metricBaseToRgb(curMetricName), markerSymbols[i * 4], new Array());
      } else
      {
        this.allMetrics["empty"] = new Metric(this.renderer, "", metricBaseToRgb(""), markerSymbols[i * 4], new Array());
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
    
                                           
    var queryObj = this.metricQHistoric.query(this.startTime - timeMargin,
                                              this.stopTime  + timeMargin,
                                              maxDataPoints);
    var defaultAggregates = ['min', 'max', 'avg', 'count'];
    for(var i = 0; i < nonErrorProneMetrics.length; ++i)
    {
      queryObj.target(nonErrorProneMetrics[i], defaultAggregates);
    }
    if(0 < queryObj.targets.length)
    {
      //TODO: register some callback

      //execute query
      //TODO: pass parameter nonErrorProneMetrics
      queryObj.run().then(function(selfReference, requestedMetrics) { return function(dataset) { selfReference.handleResponse(selfReference, requestedMetrics, dataset); }; }(this, nonErrorProneMetrics));
      //queryObj.run().then((dataset) => { this.handleResponse(dataset); });



    }
    for(var i = 0; i < remainingMetrics.length; ++i)
    {
      var queryObj = this.metricQHistoric.query(this.startTime - timeMargin,
                                                this.stopTime  + timeMargin,
                                                maxDataPoints);
      queryObj.target(remainingMetrics[i], defaultAggregates);

      queryObj.run().then(function(selfReference, requestedMetrics) { return function(dataset) { selfReference.handleResponse(selfReference, requestedMetrics, dataset); }; }(this, [ remainingMetrics[i] ]));
    }
  }
  handleResponse(selfReference, requestedMetrics, myData)
  {
    var listOfFaultyMetrics = new Array();
    for(var i = 0; i < requestedMetrics.length; ++i)
    {
      var metricName = requestedMetrics[i];
      var matchingAggregatesObj = new Object();
      var matchingAggregatesCount = 0;
      for(var curMetricName in myData)
      {
        var splitted = curMetricName.split("/");
        if(splitted[0] === requestedMetrics[i])
        {
          matchingAggregatesObj[splitted[1]] = true;
          matchingAggregatesCount += 1;
        }
      }
      if(!selfReference.checkIfMetricIsOk(metricName, matchingAggregatesCount, matchingAggregatesObj))
      {
        listOfFaultyMetrics.push(metricName);
        console.log("Metric not ok:" + metricName);
        selfReference.receivedError(0, metricName);
      }
    }
    if(0 < listOfFaultyMetrics)
    {
      showUserHint("Error with metrics: " + listOfFaultyMetrics.join(", "));
    }
    selfReference.renderer.renderMetrics(myData);
  }
  checkIfMetricIsOk(metricName, aggregateCount, aggregateObj)
  {
    if(!metricName
    || 1 > aggregateCount
    || (!aggregateObj["count"] && !aggregateObj["raw"]))
    {
      return false;
    }
    if(!((aggregateObj["raw"] && !aggregateObj["min"] && !aggregateObj["max"])
      ||(!aggregateObj["raw"] && aggregateObj["min"] && aggregateObj["max"])))
    {
      return false;
    }
    return true;
  }
  searchMetricsPromise(inputStr)
  {
    return this.metricQHistoric.search(inputStr);
  }
  //TODO: 'drop'/remove this function
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
          //selfReference.parseResponse(parsedObj, metricArr);
          //console.log("old Data format:");
          //console.log(parsedObj);
          console.log("Dropping data...");
          //selfReference.renderer.renderMetrics(parsedObj);
        } catch(exc)
        {
          console.log("Couldn't parse");
          console.log(exc);
        }
      } else
      {
        console.log(evt.target);
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
  //TODO: rename to getAllMinMax() as this function does not do an active query!
  queryAllMinMax() {
    let referenceAttribute = "minmax";
    if("manual" == this.renderer.yRangeType && this.renderer.yRangeOverride)
    {
      return this.renderer.yRangeOverride;
    }
    let allMinMax = [undefined, undefined];
    for(var metricBase in this.allMetrics)
    {
      let curMetric = this.allMetrics[metricBase];
      let curMinMax = undefined;
      if("global" == this.renderer.yRangeType)
      {
        curMinMax = curMetric.globalMinmax;
      }
      if("local" == this.renderer.yRangeType)
      {
        curMinMax = curMetric.getMinMax(this.startTime, this.stopTime);
      }
      if(curMinMax)
      {
        if(undefined === allMinMax[0])
        {
         allMinMax = curMinMax;
        } else
        {
          if(curMinMax[0] < allMinMax[0])
          {
            allMinMax[0] = curMinMax[0];
          }
          if(curMinMax[1] > allMinMax[1])
          {
            allMinMax[1] = curMinMax[1];
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
  parseTrace(metricBase, metricAggregate, datapointsArr) {
    var curTrace = {
      "x": new Array(),
      "y": new Array(),
      "name": metricBase + "/" + metricAggregate,
      "type": "scatter",
      "hoverinfo": "skip"
    }
    switch(metricAggregate)
    {
      case "min": 
      case "max": /* fall-through */
      case "avg": /* fall-through */
      case "raw": /* fall-through */
        for(var j = 0; j < datapointsArr.length; ++j)
        {
          curTrace.x.push(datapointsArr[j][1]);
          curTrace.y.push(datapointsArr[j][0]);
        }
        return curTrace;
    }
    return undefined;
  }
  processTracesArr(tracesAll)
  {
    // parse multiple metrics/traces
    let i = 0;
    for(var curMetric in tracesAll)
    {
      var curTraces = tracesAll[curMetric];
      if(curTraces["min"] && curTraces["max"])
      {
        var storeTraces = [ curTraces["min"], curTraces["max"]];
        storeTraces[1].fill = "tonexty";
        if(curTraces["avg"])
        {
          storeTraces.push(curTraces["avg"]);
        }
        storeTraces.forEach( function (paramValue, paramIndex, paramArray) {
          paramValue.mode = "lines";
          paramValue.line = {
          "width": 0,
          "color": undefined,
          "shape": "vh" }; // connect "next"
          //"shape": "hv" // connect "last"
          //"shape": "linear" // connect "direct"
        });
        if(curTraces["avg"])
        {
          storeTraces[2].line.dash = "dash";
          storeTraces[2].line.width = 2;
        }
        //add traces to metricList, create an object of metric class in before
        this.loadedMetric(curMetric, storeTraces, i);
      } else if(curTraces["raw"])
      {
        var rawTrace = [curTraces["raw"]];
        rawTrace[0].mode = "markers";
        rawTrace[0].marker = {
          "size": 10,
          "color": undefined,
          "symbol": undefined
        }
        this.loadedMetric(curMetric, rawTrace, i);
      }
      ++i;
    }
    if(0 < i)
    {
      this.renderer.renderMetrics();
    }
  }
  parseResponse(parsedJson, paramMetricsArr)
  {
    //TODO: track metrics thate were requested but got no response,
    //        mark these as errorpone=true
    let tracesAll = new Object();
    let metricBase = undefined;
    let metricAggregate = undefined;
    for(var i = 0; i < parsedJson.length; ++i)
    {
      let fullMetric = parsedJson[i].target;
      if(-1 < fullMetric.indexOf("/")
      && parsedJson[i]["datapoints"]
      && parsedJson[i].datapoints[0])
      {
        metricBase = fullMetric.substring(0, fullMetric.indexOf("/"));
        metricAggregate = fullMetric.substring(fullMetric.indexOf("/") + 1);

        let parsedTrace = this.parseTrace(metricBase, metricAggregate, parsedJson[i].datapoints);
        if(parsedTrace)
        {
          if(!tracesAll[metricBase])
          {
            tracesAll[metricBase] = new Object();
          }
          tracesAll[metricBase][metricAggregate] = parsedTrace;
        }
      }
    }
    this.processTracesArr(tracesAll);
  }
  loadedMetric(metricBase, metricTraces, metricIndex)
  {
    let myMetric = this.allMetrics[metricBase];
    if(!myMetric)
    {
      this.allMetrics[metricBase] = new Metric(this.renderer, metricBase, metricBaseToRgb(metricBase), markerSymbols[metricIndex * 4], metricTraces);
    } else 
    {
      myMetric.setTraces(metricTraces);
    }
  }
  setTimeRange(paramStartTime, paramStopTime)
  {
    //TODO: check for zoom area if it is too narrow (i.e. less than 1000 ms)
    //TODO: sync the aforementioned minimum time window
    if(undefined === paramStartTime)
    {
      paramStartTime = this.startTime;
    }
    if(undefined === paramStopTime)
    {
      paramStopTime = this.stopTime;
    }

    if(isNaN(paramStartTime) || isNaN(paramStopTime))
    {
      throw "uh oh time is NaN";
    }
    if(paramStartTime >= paramStopTime)
    {
      throw `startTime(${paramStartTime}) is not smaller than stopTime(${paramStopTime})`;
    }

    
    var timeSuitable = true;
    if((paramStopTime - paramStartTime) < this.renderer.graticule.MIN_ZOOM_TIME)
    {
      var oldDelta = paramStopTime - paramStartTime;
      var newDelta = this.renderer.graticule.MIN_ZOOM_TIME;
      paramStartTime -= Math.round((newDelta - oldDelta) / 2.00);
      paramStopTime  += Math.round((newDelta - oldDelta) / 2.00);
      timeSuitable = false;
    }
    if((paramStopTime - paramStartTime) > this.renderer.graticule.MAX_ZOOM_TIME)
    {
      var oldDelta = paramStopTime - paramStartTime;
      var newDelta = this.renderer.graticule.MAX_ZOOM_TIME;
      paramStartTime += Math.round((oldDelta - newDelta) / 2.00);
      paramStopTime  -= Math.round((oldDelta - newDelta) / 2.00);
      timeSuitable = false;
    }

    this.startTime = paramStartTime;
    this.stopTime  = paramStopTime;
    
    this.renderer.updateMetricUrl();

    //maybe move this line to MetricQWebView.setPlotRanges()? NAW
    this.renderer.graticule.setTimeRange(this.startTime, this.stopTime);
    return timeSuitable;
    //this.lastRangeChangeTime = (new Date()).getTime();
    //TODO: return false when intended zoom area is smaller than e.g. 1000 ms
    //TODO: define a CONSTANT that is MINIMUM_ZOOM_AREA

    //TODO: call url export here?
    //return true;
  }
  zoomTimeAtPoint(pointAt, zoomDirection)
  {
    var zoomFactor = 1 + zoomDirection;
    var newTimeDelta  = (this.stopTime - this.startTime  ) * zoomFactor;
    var couldZoom = false;
    if(newTimeDelta > this.renderer.graticule.MIN_ZOOM_TIME)
    {
      var relationalPositionOfPoint = (pointAt[0] - this.startTime) / (this.stopTime - this.startTime);
      if(this.setTimeRange(pointAt[0] - (newTimeDelta * relationalPositionOfPoint),
                             pointAt[0] + (newTimeDelta * (1 - relationalPositionOfPoint))))
      {
        couldZoom = true;
      }
    }
    return couldZoom;
  }
  receivedError(errorCode, metricBase)
  {
    // mark a metric so it is being excluded in bulk-requests
    if(this.allMetrics[metricBase])
    {
      this.allMetrics[metricBase].errorprone = true;
    }
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
      this.renderer.setPlotRanges(false, true);
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
          selfReference.renderer.setPlotRanges(false, true);
        }
      }
    };}(this);
    req.send(JSON.stringify(queryObj));
  }
}