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
    this.hasPlot = false;
    this.configuration = new Configuration(2, 4)
    /* TODO: old globals
    var globalYRangeOverride = undefined;
    var globalYRangeType = 'local';
    */
    this.yRangeOverride = undefined;
    this.yRangeType = 'local';

      // accelerate zooming with scroll wheel
    this.ele.addEventListener("wheel", function (configParam) { return function (evt) {
      evt.stopPropagation();
      var dataObj = {
        time: (new Date()).getTime(),
        clientX: evt.clientX,
        clientY: evt.clientY,
        deltaY: evt.deltaY * configParam.zoomSpeed
      }
      var newEvent = new WheelEvent("wheel", dataObj );
      configParam.lastWheelEvent = dataObj;
      evt.target.dispatchEvent(newEvent);
    };}(this.configuration));
    this.plotlyLayout = {
	  xaxis: {
	    type: 'date',
	    showticklabels: true,
	    ticks: "outside", //TODO: figure out how to show ticklabels but no ticks within the graph
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
    if(0 < paramMetricNamesArr.length)
    {
      this.handler.doRequest(400);
    }
  }
  reinitialize(metricsArr, startTime, stopTime)
  {
    this.handler.initializeMetrics(metricsArr);
    this.handler.startTime = startTime;
    this.handler.stopTime = stopTime;
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

    if(!this.hasPlot)
    {
      let allMinMax = this.handler.queryAllMinMax();
      this.plotlyLayout.xaxis.range = [this.handler.startTime, this.handler.stopTime];
      this.plotlyLayout.yaxis.range = allMinMax;
      Plotly.newPlot(this.ele, 
        allTraces, this.plotlyLayout, this.plotlyOptions);
      this.hasPlot = true;
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
              if(selfReference.configuration.lastWheelEvent)
              {
                let deltaWheelEvent = (new Date()).getTime() - selfReference.configuration.lastWheelEvent.time;
                if(1500 > deltaWheelEvent)
                {
                  wheelEventString = " (deltaY: " + selfReference.configuration.lastWheelEvent.deltaY + ")";
                  if((selfReference.configuration.lastWheelEvent.deltaY < 0 && newDelta > oldDelta)
                  || (selfReference.configuration.lastWheelEvent.deltaY > 0 && newDelta < oldDelta))
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
	  var gearImages = [undefined, undefined, undefined, undefined];
	  var gearSrc = ["img/icons/gear.svg",
	  			     "img/icons/arrow-left-right.svg",
	  			     "img/icons/gear.svg",
	  			     "img/icons/arrow-up-down.svg"];
	  for(var i = 0; i < 4; ++i)
	  {
	    gearImages[i] = document.createElement("img");
	    var img = new Image();
	    img.src = gearSrc[i];
	    gearImages[i].src = img.src;
	    if(-1 < gearSrc[i].indexOf("gear"))
	    {
	      gearImages[i].setAttribute("class", "gear_axis");
	    }
	    gearImages[i].setAttribute("width", "28");
	    gearImages[i].setAttribute("height", "28");
	  }
	  var gearWrapper = [undefined, undefined];
	  var gearIds = ["gear_xaxis", "gear_yaxis"];
	  for(var i = 0; i < 2; ++i)
	  {
	    gearWrapper[i] = document.createElement("div");
	    gearWrapper[i].setAttribute("id", gearIds[i]);
	    gearWrapper[i].appendChild(gearImages[i * 2]);
	    gearWrapper[i].appendChild(document.createElement("br"));
	    gearWrapper[i].appendChild(gearImages[i * 2 + 1]);
	    gearWrapper[i] = BODY.appendChild(gearWrapper[i]);
	  }
	  this.positionXAxisGear(this.ele, gearWrapper[0]);
	  gearWrapper[0].addEventListener("click", function() {
	    globalPopup.xaxis = ! globalPopup.xaxis;
	  });
	  this.positionYAxisGear(this.ele, gearWrapper[1]);
	  gearWrapper[1].addEventListener("click", function() {
	    globalPopup.yaxis = ! globalPopup.yaxis;
	  });

    } else
    {
      // don't rerender everything
      var oldTraces = new Array();
      for(var i = 0; i < this.countTraces; ++i)
      {
        oldTraces.push(i);
      }
      Plotly.deleteTraces(this.ele, oldTraces);
      if("local" == this.yRangeType)
      {
        this.setPlotRanges(false, true);
      }
      Plotly.addTraces(this.ele, allTraces);
      this.countTraces = allTraces.length;
      gearEle = document.getElementById("gear_xaxis");
      if(gearEle)
      {
        this.positionXAxisGear(this.ele, gearEle);
        gearEle = document.getElementById("gear_yaxis");
        this.positionYAxisGear(this.ele, gearEle);
      }
    }

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
	    let allMinMax = this.handler.queryAllMinMax();
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
			this.handler.allMetrics["empty"] = new Metric("", metricBaseToRgb(""), markerSymbols[0], new Array());
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
            this.handler.allMetrics["empty"] = new Metric("", metricBaseToRgb(""), markerSymbols[0], new Array());
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
/* TODO: generalize this for cases where is no "legendApp" */
function initializeMetrics(metricNamesArr, timeStart, timeStop)
{
  let newManager = undefined;
  if(window.MetricQWebView)
  {
    newManager = window.MetricQWebView.instances[0];
    newManager.reinitialize(metricNamesArr, timeStart, timeStop);
    newManager.postRender = function() {
      legendApp.$forceUpdate();
    };
  } else 
  {
    newManager = new MetricQWebView(document.querySelector(".row_body"), metricNamesArr, timeStart, timeStop);
    newManager.postRender = function() {
      legendApp.$forceUpdate();
    };
  }
}