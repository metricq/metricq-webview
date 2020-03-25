class Metric
{
  constructor(paramName, paramColor, paramMarker, paramTraces, paramMinMax)
  {
  	this.updateName(paramName);
  	this.color = paramColor;
  	this.marker = paramMarker;
  	this.traces = paramTraces;
    this.minmax = paramMinMax;
    this.globalMinmax = undefined;
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
}