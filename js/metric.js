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


function metricBaseToRgb(metricBase)
{
  var rgbArr = hslToRgb((crc32(metricBase) >> 24 & 255) / 255.00, 1, 0.46);
  return "rgb(" + rgbArr[0] + "," + rgbArr[1] + "," + rgbArr[2] + ")";
}



class Metric
{
  constructor(paramName, paramColor, paramMarker, paramTraces)
  {
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
      this.displayName = "Metrik hinzufügen";
    } else
    {
      this.displayName = newName;
    }
  }
  updateColor(newCssColor)
  {
  	this.color = newCssColor;
  	this.traces.forEach(function(paramValue, paramIndex, paramArray)
    {
    	if(paramValue.line)
    	{
    	  paramValue.line.color = newCssColor;	
    	}
    	if(paramValue.marker)
    	{
    	  paramValue.marker.color = newCssColor;
    	}
    	
    });
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