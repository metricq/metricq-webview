class MetricQWebView {
  constructor(paramParentEle, paramMetricNamesArr, paramStartTime, paramStopTime)
  {
  	this.id = "metricqwebview_" + (new Date()).getTime();
    if(!window["MetricQWebView"])
    {
      window.MetricQWebView = {
      	instances: new Array()
      };
    }
    window.MetricQWebView.instances.push(this);

    this.ele = paramParentEle;
    this.handler = new MetricHandler(this, paramMetricNamesArr, paramStartTime, paramStopTime);
    this.postRender = undefined;
    this.countTraces = 0;
    this.plotlyLayout = {
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
    this.plotlyOptions = {
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

    this.handler.doRequest(400);
  }
  renderMetrics()
  {
    let allTraces = new Array();

    for(var metricBase in this.handler.allMetrics)
    {
      let curMetric = this.handler.allMetrics[metricBase];
      if(curMetric.traces) {
        allTraces = allTraces.concat(curMetric.traces);
      }
    }

    this.updateMetricUrl();
    //console.log("Render " + Math.round((globalEnd - globalStart)/1000) + " seconds delta");
    if(undefined === globalMainPlot)
    {
      let allMinMax = this.queryAllMinMax();
      this.plotlyLayout.xaxis.range = [this.handler.startTime, this.handler.stopTime];
      this.plotlyLayout.yaxis.range = allMinMax;
      globalMainPlot = Plotly.newPlot(this.ele, 
        allTraces, this.plotlyLayout, this.plotlyOptions);
      this.countTraces = allTraces.length;
      this.ele.on("plotly_relayout", function(selfReference) { return function(eventdata) {
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
            if(selfReference.handler.startTime != startTime
            || selfReference.handler.stopTime != endTime)
            {
              let oldDelta = selfReference.handler.stopTime - selfReference.handler.startTime;
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
                selfReference.handler.startTime = startTime;
                selfReference.handler.stopTime = endTime;
                //console.log("Zoom " + Math.round((globalEnd - globalStart)/1000) + " seconds delta");
                selfReference.handler.reload();
                selfReference.updateMetricUrl();
              }
            }
          }
        }
      }}(this));
      //some plotly events: plotly_redraw, plotly_update, plotly_react,
      // plotly_relayouting, plotly_selecting, plotly_deselect, plotly_selected,
      // plotly_beforeexport, plotly_afterexport, plotly_autosize
      this.ele.on("plotly_autosize", function(selfReference) { return function(evt) {
        var gearEle = document.getElementById("gear_xaxis");
        selfReference.positionXAxisGear(selfReference.ele, gearEle);
      };}(this));
    } else
    {
      // don't rerender everything
      var oldTraces = new Array();
      for(var i = 0; i < this.countTraces; ++i)
      {
        oldTraces.push(i);
      }
      Plotly.deleteTraces(this.ele, oldTraces);
      if("local" == globalYRangeType)
      {
        this.setPlotRanges(false, true);
      }
      Plotly.addTraces(this.ele, allTraces);
      this.countTraces = allTraces.length;
    }
    /* TODO: externalize gear stuff */
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
    this.positionXAxisGear(this.ele, gears[0]);
    gears[0].addEventListener("click", function() {
      globalPopup.xaxis = ! globalPopup.xaxis;
    });
    gears[1].setAttribute("id", "gear_yaxis");
    this.positionYAxisGear(this.ele, gears[1]);
    gears[1].addEventListener("click", function() {
      globalPopup.yaxis = ! globalPopup.yaxis;
    });
    if(this.postRender)
    {
    	this.postRender();
    }
  }
	positionXAxisGear(rowBodyEle, gearEle) {
	  gearEle.style.position = "absolute";
	  var posGear = this.getTopLeft(rowBodyEle);
	  posGear[0] += parseInt(rowBodyEle.offsetWidth) - parseInt(gearEle.offsetWidth);
	  posGear[1] += parseInt(rowBodyEle.offsetHeight) - parseInt(gearEle.offsetHeight);
	  posGear[0] += -35;
	  posGear[1] += -30;
	  gearEle.style.left = posGear[0] + "px";
	  gearEle.style.top = posGear[1] + "px";  
	}
	positionYAxisGear(rowBodyEle, gearEle) {
	  gearEle.style.position = "absolute";
	  var posGear = this.getTopLeft(rowBodyEle);
	  posGear[0] += 20;
	  posGear[1] += 70;
	  gearEle.style.left = posGear[0] + "px";
	  gearEle.style.top = posGear[1] + "px";    
	}
	getTopLeft(ele) {
	  var topLeft = [0, 0];
	  var curEle = ele;
	  while(!curEle.tagName || (curEle.tagName && curEle.tagName.toLowerCase() != "html")) {
	    topLeft[0] += parseInt(curEle.offsetLeft);
	    topLeft[1] += parseInt(curEle.offsetTop);
	    curEle = curEle.parentNode;
	  }
	  return topLeft;
	}
	updateMetricUrl()
	{
	  let encodedStr = "";
	  //old style: 
	  if(false)
	  {
	    let jsurlObj = {
	      "cntr": new Array(),
	      "start": this.handler.startTime,
	      "stop": this.handler.stopTime,
	    };
	    for(var metricBase in this.handler.allMetrics)
	    {
	      jsurlObj.cntr.push(this.handler.allMetrics[metricBase].name);
	    }
	    encodedStr = encodeURIComponent(window.JSURL.stringify(jsurlObj));
	  } else
	  {
	    encodedStr = "." + this.handler.startTime + "_" + this.handler.stopTime;
	    for(var metricBase in this.handler.allMetrics)
	    {
	      encodedStr += "_" + this.handler.allMetrics[metricBase].name;
	    }
	    encodedStr = encodeURIComponent(encodedStr);
	  }
	  window.location.href =
	     parseLocationHref()[0]
	   + "#"
	   + encodedStr;
	}
	queryAllMinMax() {
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
	  for(var metricBase in this.handler.allMetrics)
	  {
	    let curMetric = this.handler.allMetrics[metricBase];
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
	setPlotRanges(updateXAxis, updateYAxis)
	{
	  if(!updateXAxis && !updateYAxis)
	  {
	    return;
	  }
	  var relayoutObj = new Object();
	  if(updateXAxis) {
	    relayoutObj["xaxis.range[0]"] = this.handler.startTime;
	    relayoutObj["xaxis.range[1]"] = this.handler.stopTime;
	  }
	  if(updateYAxis) {
	    let allMinMax = this.queryAllMinMax();
	    relayoutObj["yaxis.range[0]"] = allMinMax[0];
	    relayoutObj["yaxis.range[1]"] = allMinMax[1];
	  }
	  Plotly.relayout(this.ele, relayoutObj );
	}
	reload()
	{
		this.handler.reload();
	}
	getMetric(metricName)
	{
		for(var metricBase in this.handler.allMetrics)
		{
			if(this.handler.allMetrics[metricBase].name == metricName)
			{
				return this.handler.allMetrics[metricBase];
			}
		}
		return undefined;
	}
	newEmptyMetric()
	{
		if(!this.handler.allMetrics["empty"])
		{
			this.handler.allMetrics["empty"] = new Metric("", metricBaseToRgb(""), markerSymbols[0], new Array(), [undefined, undefined]);
		}
	}
	deleteMetric(metricBase)
	{
		delete this.handler.allMetrics[metricBase];
	}
	deleteTraces(tracesArr)
	{
		Plotly.deleteTraces(this.ele, tracesArr);
		this.countTraces -= tracesArr.length;
	}
	changeMetricName(metricReference, newName, oldName)
	{
		metricReference.updateName(newName);
        if("" == oldName)
        {
            this.handler.allMetrics["empty"] = new Metric("", metricBaseToRgb(""), markerSymbols[0], new Array(), [undefined, undefined]);
            this.handler.allMetrics[newName] = metricReference;
        } else
        {
        	delete this.handler.allMetrics[oldName];
        	this.handler.allMetrics[newName] = metricReference;
        }
        /* TODO: reject metric names that already exist */
        this.reload();
	}
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
      initializeMetrics(metricsObj.cntr, parseInt(metricsObj.start), parseInt(metricsObj.stop));
      return true;
    } else if("." == jsurlStr.charAt(0))
    {
      const splitted = jsurlStr.split("_");
      if(1 < splitted.length)
      {
        initializeMetrics(splitted.slice(2), parseInt(splitted[0].substring(1)), parseInt(splitted[1]));
        return true;
      }
    }
  }
  return false;
}

function initializeMetrics(metricNamesArr, timeStart, timeStop)
{
  globalMetricHandle = new MetricQWebView(document.querySelector(".row_body"), metricNamesArr, timeStart, timeStop);
  globalMetricHandle.postRender = function() {
    legendApp.$forceUpdate();
  };
  /*
  for(var i = 0; i < metricNamesArr.length; ++i)
  {
    //TODO: move color initialization into class Metric
    //legendApp.metricsList.push(new Metric(metricNamesArr[i], metricBaseToRgb(metricNamesArr[i]), markerSymbols[i * 4], new Array(), [undefined, undefined]));
  }
  */
}