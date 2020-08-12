//adapted from https://plot.ly/python/marker-style/
// not working:
//   "cross-thin", "x-thin", "asterisk", "hash", "hash-dot", "y-up", "y-down", "y-left", "y-right",
//   "line-ew", "line-ns", "line-ne", "line-nw"
var markerSymbols = [".", "o", "v", "^", "<", ">", "s", "p", "*", "h", "+", "x", "d", "|", "_"];


function metricBaseToRgb(metricBase)
{
  var rgbArr = hslToRgb((crc32(metricBase) >> 24 & 255) / 255.00, 1, 0.46);
  return "rgb(" + rgbArr[0] + "," + rgbArr[1] + "," + rgbArr[2] + ")";
}



class Metric
{
  constructor(paramRenderer, paramName, paramColor, paramMarker, paramTraces)
  {
    this.renderer = paramRenderer;
  	this.updateName(paramName);
  	this.marker = paramMarker;
    this.color = paramColor;
  	this.traces = new Array();
    this.setTraces(paramTraces);
    this.globalMinmax = undefined;
    this.errorprone = false;
  	this.popup = false;
  }
  filterKey(paramKey)
  {
  	return paramKey.replace(/[^_a-zA-Z0-9]/g, "_").replace(/__+/g, "_");
  }
  updateName(newName)
  {
  	this.name = newName;
  	let computedKey = this.filterKey(newName);
  	this.popupKey = "popup_" + computedKey;
    if("" === newName)
    {
      this.htmlName = "<img src=\"img/icons/plus-circle.svg\" width=\"28\" height=\"28\" /> Neu ";
    } else
    {
      this.htmlName = newName;
    }
  }
  updateColor(newCssColor)
  {
  	this.color = newCssColor;
    if(this.renderer && this.renderer.graticule && this.renderer.graticule.data)
    {
      var metricCache = this.renderer.graticule.data.getMetricCache(this.name);
      if(metricCache)
      {
        metricCache.band.styleOptions.color = newCssColor;
        for(var curSeries in metricCache.series)
        {
          if(metricCache.series[curSeries])
          {
            metricCache.series[curSeries].styleOptions.color = newCssColor;
          }
        }
      }
    }
  }
  updateMarker(newMarker)
  {
  	this.marker = newMarker;
  	this.traces.forEach(function(paramValue, paramIndex, paramArray)
    {
    	if(paramValue.marker)
    	{
    	  paramValue.marker.symbol = newMarker;
    	}
    });
    if(this.renderer && this.renderer.graticule && this.renderer.graticule.data)
    {
      var metricCache = this.renderer.graticule.data.getMetricCache(this.name);
      if(metricCache)
      {
        for(var curSeries in metricCache.series)
        {
          //TODO: change this so that marker type ist being stored
          //        but it only applies marker to /raw aggregate
          if(metricCache.series[curSeries])
          {
            metricCache.series[curSeries].styleOptions.dots = newMarker;
          }
        }
      }
    }
  }
  setTraces(newTraces)
  {
    this.traces = newTraces;
    this.updateColor(this.color);
    this.updateMarker(this.marker);
  }
  getMinMax(startTime, stopTime)
  {
    var myMinMax = undefined;
    for(let i = 0; i < this.traces.length; ++i)
    {
      for(let j = 0; (j < this.traces[i].x.length && j < this.traces[i].y.length); ++j)
      {
        if(this.traces[i].x[j] >= startTime
        && this.traces[i].x[j] <= stopTime)
        {
          if(undefined == myMinMax)
          {
            myMinMax = [this.traces[i].y[j], this.traces[i].y[j]];
          } else if(myMinMax[0] > this.traces[i].y[j])
          {
            myMinMax[0] = this.traces[i].y[j];
          } else if(myMinMax[1] < this.traces[i].y[j])
          {
            myMinMax[1] = this.traces[i].y[j];
          }
        }
      }
    }
    return myMinMax;
  }
}