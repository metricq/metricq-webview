
function DataCache()
{
  this.metrics = new Array();
  this.processMetricQDatapoints = function(datapointsJSON, doDraw, doResize)
  {
    //TODO: remove this DEBUG-Output
    console.log(datapointsJSON);
    var distinctMetrics = new Object();
    var metricCountIndex = undefined;
    for(var i = 0; i < datapointsJSON.length; ++i)
    {
      var metric = datapointsJSON[i];
      var metricParts = metric.target.split("/");
      if("count" == metricParts[1])
      {
        metricCountIndex = i;
      } else
      {
        this.newSeries(metricParts[0], metricParts[1]).parseDatapoints(metric.datapoints);
      }
      if("raw" == metricParts[1])
      {
        this.getMetricCache(metricParts[0]).clearNonRawAggregates();
      } else if ("avg" == metricParts[1])
      {
        this.getMetricCache(metricParts[0]).clearRawAggregate();
      }
      if(undefined === distinctMetrics[metricParts[0]])
      {
        distinctMetrics[metricParts[0]] = this.getMetricCache(metricParts[0]);
      }
    }
    
    for(var curMetricBase in distinctMetrics)
    {
      distinctMetrics[curMetricBase].generateBand();
      if(undefined !== metricCountIndex)
      {
        distinctMetrics[curMetricBase].parseCountDatapoints(datapointsJSON[metricCountIndex]);
      }
    }
  }
  this.newSeries = function(metricName, metricAggregate)
  {
    var relatedMetric = this.assureMetricExists(metricName);
    if(relatedMetric.series[metricAggregate])
    {
      relatedMetric.series[metricAggregate].clear();
      return relatedMetric.series[metricAggregate];
    } else
    {
      var newSeries = new Series(metricAggregate, defaultSeriesStyling(metricName, metricAggregate));
      relatedMetric.series[metricAggregate] = newSeries;
      return newSeries;
    }
  }
  this.newBand = function(metricName)
  {
    var foundMetric = this.getMetricCache(metricName);
    if(foundMetric)
    {
      foundMetric.generateBand();
      return foundMetric.band;
    } else
    {
      return undefined;
    }
  }
  this.assureMetricExists = function(metricName)
  {
    var foundMetric = this.getMetricCache(metricName);
    if(foundMetric)
    {
      return foundMetric;
    } else
    {
      var newMetric = new MetricCache(metricName);
      this.metrics.push(newMetric);
      return newMetric;
    }
  }
  this.getMetricCache = function(metricName)
  {
    for(var i = 0; i < this.metrics.length; ++i)
    {
      if(metricName == this.metrics[i].name)
      {
        return this.metrics[i];
      }
    }
    return undefined;
  }
  this.getTimeRange = function()
  {
    var min = undefined,
        max = undefined;
    for(var i = 0; i < this.metrics.length; ++i)
    {
      for(var curAggregate in this.metrics[i].series)
      {
        if(this.metrics[i].series[curAggregate])
        {
          var curTimeRange = this.metrics[i].series[curAggregate].getTimeRange();
          if(undefined === min)
          {
            min = curTimeRange[0];
            max = curTimeRange[1];
          } else
          {
            if(min > curTimeRange[0])
            {
              min = curTimeRange[0];
            }
            if(max < curTimeRange[1])
            {
              max = curTimeRange[1];
            }
          }
        }
      }
    }
    return [min, max];
  }
  this.getValueRange = function(doGetAllTime, timeRangeStart, timeRangeEnd)
  {
    var min = undefined,
        max = undefined;
    for(var i = 0; i < this.metrics.length; ++i)
    {
      if(doGetAllTime && this.metrics[i].allTime)
      {
        if(undefined === min || min > this.metrics[i].allTime.min)
        {
          min = this.metrics[i].allTime.min;
        }
        if(undefined === max || max < this.metrics[i].allTime.max)
        {
          max = this.metrics[i].allTime.max;
        }
        continue;
      } else
      {
        for(var curAggregate in this.metrics[i].series)
        {
          if(this.metrics[i].series[curAggregate])
          {
            var curValueRange = this.metrics[i].series[curAggregate].getValueRange(timeRangeStart, timeRangeEnd);
            if(undefined !== curValueRange)
            {
              if(undefined === min)
              {
                min = curValueRange[0];
                max = curValueRange[1];
              } else
              {
                if(min > curValueRange[0])
                {
                  min = curValueRange[0];
                }
                if(max < curValueRange[1])
                {
                  max = curValueRange[1];
                }
              }
            }
          }
        }
      }
    }
    return [min, max];
  }
  this.hasSeriesToPlot = function()
  {
    for(var i = 0; i < this.metrics.length; ++i)
    {
      for(var curAggregate in this.metrics[i].series)
      {
        if(this.metrics[i].series[curAggregate] && 0 < this.metrics[i].series[curAggregate].points.length)
        {
          return true;
        }
      }
    }
    return false;
  }
  this.hasBandToPlot = function()
  {
    for(var i = 0; i < this.metrics.length; ++i)
    {
      if(this.metrics[i].band && 0 < this.metrics[i].band.points.length)
      {
        return true;
      }
    }
    return false;
  }
  this.updateStyling = function()
  {
    for(var i = 0; i < this.metrics.length; ++i)
    {
      for(var curAggregate in this.metrics[i].series)
      {
        if(this.metrics[i].series[curAggregate])
        {
          this.metrics[i].series[curAggregate].styleOptions = defaultSeriesStyling(this.metrics[i].name, curAggregate);
        }
      }
      this.metrics[i].band.styleOptions = defaultBandStyling(this.metrics[i].name);
    }
  }
  this.getAllValuesAtTime = function(timeAt)
  {
    var valueArr = new Array();
    for(var i = 0; i < this.metrics.length; ++i)
    {
      for(var curAggregate in this.metrics[i].series)
      {
        if(this.metrics[i].series[curAggregate] && 0 < this.metrics[i].series[curAggregate].points.length)
        {
          var result = this.metrics[i].series[curAggregate].getValueAtTimeAndIndex(timeAt);
          if(result)
          {
            valueArr.push([
              result[0],
              this.metrics[i].name,
              curAggregate
            ]);
          }
        }
      }
    }
    return valueArr;
  }
  this.deleteMetric = function(metricName)
  {
    for(var i = 0; i < this.metrics.length; ++i)
    {
      if(metricName == this.metrics[i].name)
      {
        this.metrics.splice(i, 1);
        return true;
      }
    }
    return false;
  }
}

function MetricCache(paramMetricName)
{
  this.name = paramMetricName;
  this.series = {"min": undefined,
                 "max": undefined,
                 "avg": undefined,
                 "raw": undefined};
  this.band = undefined;
  this.allTime = undefined;
  this.resetData = function()
  {
    delete this.series;
    delete this.bands;
    this.series = new Array();
    this.bands = new Array();
  }
  this.clearNonRawAggregates = function()
  {
    for(var curAggregate in this.series)
    {
      if("raw" != curAggregate && this.series[curAggregate])
      {
        this.series[curAggregate].clear();
      }
    }
    if(this.band)
    {
      this.band.clear();
    }
  }
  this.clearRawAggregate = function()
  {
    if(this.series["raw"])
    {
      this.series["raw"].clear();
    }
  }
  this.generateBand = function()
  {
    if(this.band)
    {
      this.band.clear();
    } else
    {
      this.band = new Band(defaultBandStyling(this.name));
    }
    if(this.series["min"] && this.series["max"])
    {
      var minSeries = this.series["min"];
      for(var i = 0; i < minSeries.points.length; ++i)
      {
        this.band.addPoint(minSeries.points[i].clone());
      }
      this.band.setSwitchOverIndex();
      var maxSeries = this.series["max"];
      for(var i = maxSeries.points.length - 1; i >= 0; --i)
      {
        this.band.addPoint(maxSeries.points[i].clone());
      }
      return this.band;
    } else
    {
      return undefined;
    }
  }
  this.clearSeries = function(seriesSpecifier)
  {
    var curSeries = this.getSeries(seriesSpecifier);
    if(curSeries)
    {
      curSeries.clear();
      return curSeries;
    }
    return undefined;
  };
  this.parseCountDatapoints = function(countDatapoints)
  {
    for(var curAggregate in this.series)
    {
      var curSeries = this.series[curAggregate];
      if(curSeries && 0 < curSeries.points.length)
      {
        if(curSeries.points.length == countDatapoints.length)
        {
          for(var j = 0; j < curSeries.points.length && j < countDatapoints.length; ++j)
          {
            curSeries.points[j].count = countDatapoints[j][0];
          }
        }
      }
    }
  }
  this.processAllTimeQuery = function(selfReference, jsonResponse)
  {
    var allTimeMin = undefined;
    var allTimeMax = undefined;
    for(var i = 0; i < jsonResponse.length; ++i)
    {
      var metricParts = jsonResponse[i].target.split("/");
      if("min" == metricParts[1])
      {
        for(var j = 0; j < jsonResponse[i].datapoints.length; ++j)
        {
          if(undefined == allTimeMin || allTimeMin > jsonResponse[i].datapoints[j][0])
          {
            allTimeMin = jsonResponse[i].datapoints[j][0];
          }
        }
      } else if("max" == metricParts[1])
      {
        for(var j = 0; j < jsonResponse[i].datapoints.length; ++j)
        {
          if(undefined == allTimeMax || allTimeMax < jsonResponse[i].datapoints[j][0])
          {
            allTimeMax = jsonResponse[i].datapoints[j][0];
          }
        }
      }
    }
    if(undefined !== allTimeMin || undefined !== allTimeMax)
    {
      selfReference.allTime = {
        "min": allTimeMin,
        "max": allTimeMax
      };
    }
  }
  this.fetchAllTimeMinMax = function()
  {
    var reqJson = {
      "range": {
        "from": (new Date("2010-01-01")).toISOString(),
        "to": (new Date()).toISOString() 
      },
      "maxDataPoints": 1,
      "targets": [
        {
          "metric": this.name,
          "functions": [ "min", "max" ]
        }
      ]
    };
    var reqAjax = new XMLHttpRequest();
    reqAjax.open("POST", METRICQ_BACKEND, true);
    reqAjax.processingFunction = function (ref) { return function (json) {ref.processAllTimeQuery(ref, json); }; }(this);
    reqAjax.addEventListener("load", function(evtObj) {
      var parsedJson = undefined;
      try {
        parsedJson = JSON.parse(evtObj.target.responseText);
      } catch(exc)
      {
      }
      if(parsedJson)
      {
        evtObj.target.processingFunction(parsedJson);
      }
    });
    reqAjax.send(JSON.stringify(reqJson));
  }
  this.getAllMinMax = function() {
    var allMin = undefined, allMax = undefined;
    for(var curAggregate in this.series)
    {
      if(this.series[curAggregate])
      {
        let curMinMax = this.series[curAggregate].getValueRange();
        if(undefined === allMin || curMinMax[0] < allMin)
        {
          allMin = curMinMax[0];
        }
        if(undefined === allMax || curMinMax[1] > allMax)
        {
          allMax = curMinMax[1];
        }
      }
    }
    return [allMin, allMax];
  }
  this.fetchAllTimeMinMax();
}


function Band(paramStyleOptions)
{
  this.points = new Array();
  this.styleOptions = paramStyleOptions;
  this.switchOverIndex = 0;
  this.addPoint = function (newPoint)
  {
    this.points.push(newPoint);
    return newPoint;
  }
  this.setSwitchOverIndex = function()
  {
    this.switchOverIndex = this.points.length;
  }
  this.getTimeRange = function()
  {
    if(0 == this.points.length)
    {
      return [0, 0];
    } else
    {
      return [this.points[0].time, this.points[this.points.length - 1].time];
    }
  }
  this.getValueRange = function()
  {
    if(0 == this.points.length)
    {
      return [0, 0];
    }
    var min = this.points[0].value, max = this.points[0].value;
    for(var i = 1; i < this.points.length; ++i)
    {
      if(this.points[i].value < min)
      {
        min = this.points[i].value;
      } else if(this.points[i].value > max)
      {
        max = this.points[i].value;
      }
    }
    return [min, max];
  }
  this.clear = function ()
  {
    delete this.points;
    this.points = new Array();
  };
}
function Series(paramAggregate, paramStyleOptions)
{
  this.points = new Array();
  this.aggregate = paramAggregate;
  this.styleOptions = paramStyleOptions;
  this.allTime = undefined;
  this.clear = function ()
  {
    delete this.points;
    this.points = new Array();
  };
  this.getValueAtTimeAndIndex = function(timeAt)
  {
    if("number" !== typeof timeAt || 0 == this.points.length)
    {
      return;
    }
    var middleIndex = undefined;
    var bottomIndex = 0
    var headIndex   = this.points.length - 1;
    while(10 < (headIndex - bottomIndex))
    {
      middleIndex = bottomIndex + Math.floor((headIndex - bottomIndex) / 2);
      if(this.points[middleIndex].time < timeAt)
      {
        bottomIndex = middleIndex;
      } else
      {
        headIndex = middleIndex;
      }
    }
    var i = bottomIndex;
    var closestIndex = bottomIndex;
    var closestDelta = 99999999999999;
    for(; i <= headIndex; ++i)
    {
      var curDelta = Math.abs(this.points[i].time - timeAt);
      if(curDelta < closestDelta)
      {
        closestDelta = curDelta;
        closestIndex = i;
      }
    }
    var closestPointIndex = closestIndex;
    if(this.points[closestPointIndex].time !== timeAt
    && this.styleOptions && this.styleOptions.connect && "none" != this.styleOptions.connect)
    {
      var betterIndex = closestPointIndex;
      if("next" == this.styleOptions.connect)
      {
        if(this.points[betterIndex].time > timeAt)
        {
          --betterIndex;
        }
      } else if ("last" == this.styleOptions.connect)
      {
        if(this.points[betterIndex].time < timeAt)
        {
          ++betterIndex;
        }
      } else if("direct" == this.styleOptions.connect)
      {
        var firstPoint, secondPoint;
        if((timeAt < this.points[betterIndex].time && 0 > betterIndex) || (betterIndex + 1) >= this.points.length)
        {
          firstPoint = this.points[betterIndex - 1];
          secondPoint = this.points[betterIndex];
        } else
        {
          firstPoint = this.points[betterIndex];
          secondPoint = this.points[betterIndex + 1]
        }
        var timeDelta = secondPoint.time - firstPoint.time;
        var valueDelta = secondPoint.value - firstPoint.value;
        return [firstPoint.value + valueDelta * ((timeAt - firstPoint.time) / timeDelta), betterIndex];
      }
      if(0 > betterIndex)
      {
        betterIndex = 0;
        return undefined;
      } else if(betterIndex >= this.points.length)
      {
        betterIndex = this.points.length - 1;
        return undefined;
      }
      return [this.points[betterIndex].value, betterIndex];
    } else
    {
      return [this.points[closestPointIndex].value, betterIndex];
    }
  };
  this.addPoint = function (newPoint, isBigger) {
    if(isBigger || 0 == this.points.length)
    {
      this.points.push(newPoint);
      return newPoint;
    } else
    {
      var middleIndex = undefined,
          bottom = 0
          head = this.points.length - 1;
      // binary search, where to insert the new point
      while(10 < (head - bottom))
      {
        middleIndex = bottom + Math.floor((head - bottom) / 2);
        if(this.points[middleIndex].time < newPoint.time)
        {
          bottom = middleIndex;
        } else
        {
          head = middleIndex;
        }
      }
      // for the remaining 10 elements binary search is too time intensive
      var i;
      for(i = bottom; i <= head; ++i)
      {
        if(this.points[i].time > newPoint.time)
        {
          this.points.splice(i, 0, [newPoint]);
          break;
        }
      }
      // if we could not insert the newPoint somewhere in between, put it at the end
      if(i == (head + 1))
      {
        this.points.push(newPoint);
      }
    }
    return newPoint;
  }
  this.parseDatapoints = function(metricDatapoints)
  {
    for(var i = 0; i < metricDatapoints.length; ++i)
    {
      this.addPoint(new Point(metricDatapoints[i][1], metricDatapoints[i][0]), true);
    }
  }
  this.getTimeRange = function()
  {
    if(0 == this.points.length)
    {
      return [0, 0];
    } else
    {
      return [this.points[0].time, this.points[this.points.length - 1].time];
    }
  }
  this.getValueRange = function(timeRangeStart, timeRangeEnd)
  {
    if(0 == this.points.length)
    {
      return undefined;
    }
    var min = this.points[0].value, max = this.points[0].value;
    if(undefined !== timeRangeStart && undefined !== timeRangeEnd)
    {
      var i = 0;
      for (i = 0; i < this.points.length; ++i)
      {
        if(this.points[i].time >= timeRangeStart)
        {
          break;
        }
      }
      if(i < this.points.length)
      {
        min = this.points[i].value;
        max = this.points[i].value;
      }
      for(; (i < this.points.length && this.points[i].time < timeRangeEnd); ++i)
      {
        if(this.points[i].value < min)
        {
          min = this.points[i].value;
        } else if(this.points[i].value > max)
        {
          max = this.points[i].value;
        }
      }
    } else {
      for(var i = 1; i < this.points.length; ++i)
      {
        if(this.points[i].value < min)
        {
          min = this.points[i].value;
        } else if(this.points[i].value > max)
        {
          max = this.points[i].value;
        }
      }
    }
    return [min, max];
  }
}
function Point(paramTime, paramValue)
{
  this.time = paramTime;
  this.value = paramValue;
  this.count = undefined;
  this.clone = function ()
  {
    return new Point(this.time, this.value);
  }
}













var timers = new Object();

var stylingOptions = {
  list: [
    {
      nameRegex: "series:[^/]+/avg",
      title: "AVG Series",
      skip: false,
      color: "default",
      connect: "next",
      width: 8,
      lineWidth: 2,
      lineDash: [5, 4],
      dots: false,
      alpha: 0.8
    },
    {
      nameRegex: "series:[^/]+/min",
      title: "Min Series",
      skip: true,
      color: "default",
      connect: "next",
      width: 2,
      lineWidth: 2,
      dots: false,
      alpha: 1
    },
    {
      nameRegex: "series:[^/]+/max",
      title: "Max Series",
      skip: true,
      color: "default",
      connect: "next",
      width: 2,
      lineWidth: 2,
      dots: false,
      alpha: 1
    },
    {
      nameRegex: "series:[^/]+/(raw)",
      title: "Raw Series",
      skip: false,
      color: "default",
      connect: "none",
      width: 8,
      dots: true,
    },
    {
      nameRegex: "band:.*",
      title: "All Bands",
      connect: "next",
      color: "default",
      alpha: 0.3
    }
  ]
};


function defaultBandStyling(metricBaseName)
{
  var options = matchStylingOptions("band:" + metricBaseName);
  if("default" === options.color)
  {
    options.color = determineColorForMetric(metricBaseName);
  }
  return options;
}
function defaultSeriesStyling(metricBaseName, aggregateName)
{
  var options = matchStylingOptions("series:" + metricBaseName + "/" + aggregateName);
  if("default" === options.color)
  {
    options.color = determineColorForMetric(metricBaseName);
  }
  return options;
}
function matchStylingOptions(fullMetricName)
{
  if(typeof fullMetricName != "string")
  {
    return undefined;
  }
  for(var i = 0; i < stylingOptions.list.length; ++i)
  {
    if(stylingOptions.list[i].nameMatch == fullMetricName
    || fullMetricName.match(new RegExp(stylingOptions.list[i].nameRegex)))
    {
      //clone the options
      return JSON.parse(JSON.stringify(stylingOptions.list[i]));
    }
  }
  return undefined;
}
function determineColorForMetric(metricBaseName)
{
  var rgb = hslToRgb((crc32(metricBaseName) >> 24 & 255) / 255.00, 1, 0.46);
  return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
}
