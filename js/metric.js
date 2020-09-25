//adapted from https://plot.ly/python/marker-style/
// not working:
//   "cross-thin", "x-thin", "asterisk", "hash", "hash-dot", "y-up", "y-down", "y-left", "y-right",
//   "line-ew", "line-ns", "line-ne", "line-nw"
var markerSymbols = [".", "o", "v", "^", "<", ">", "s", "p", "*", "h", "+", "x", "d", "|", "_"];



class Metric
{
  constructor(paramRenderer, paramName, paramColor, paramMarker, paramTraces)
  {
    this.renderer = paramRenderer;
  	this.updateName(paramName);
  	this.marker = paramMarker;
    if(undefined === paramColor)
    {
      this.color = Metric.metricBaseToRgb(paramName);
    } else
    {
      this.color = paramColor;      
    }
  	this.traces = new Array();
    this.setTraces(paramTraces);
    this.globalMinmax = undefined;
    this.errorprone = false;
  	this.popup = false;
    this.updateColor(this.color);
    //this.autocompleteList = new Array();
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
    var htmlText = "";
    if("" === newName)
    {
      htmlText += "<img src=\"img/icons/plus-circle.svg\" width=\"28\" height=\"28\" /> Neu ";
    } else
    {
      htmlText += newName;
    }
    // NOPE this does not work :(
    //if(this.errorprone)
    //{
    //  htmlText += "⚠";
    //}
    this.htmlName = htmlText;
  }
  error()
  {
    this.errorprone = true;
    this.updateName(this.name);
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
  static metricBaseToRgb(metricBase)
  {
    var rgbArr = hslToRgb((crc32(metricBase) >> 24 & 255) / 255.00, 1, 0.46);
    return "rgb(" + rgbArr[0] + "," + rgbArr[1] + "," + rgbArr[2] + ")";
  }
}