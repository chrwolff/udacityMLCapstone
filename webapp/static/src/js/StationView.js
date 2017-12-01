import WeatherIcons from './WeatherIcons.js';
var d3 =  require("d3");
var Pikaday = require('pikaday');

export default class StationView {
    
    static init (controller) {
        this.Controller = controller;

        this.stationName = document.getElementById("stationName");
        
        this.datePicker = new Pikaday({
            field: document.getElementById('datepicker'),
            onSelect: this.Controller.onDateSelect.bind(this.Controller),
            minDate: new Date(2015, 4, 1),
            maxDate: new Date(2016, 10, 30),
            defaultDate: new Date(2015, 4, 1),
            setDefaultDate: true
        });

        var timelineElement = document.getElementById("timeline");
        this.timeline = {};
        for (var hour = 0; hour < 24; ++hour) {
            var timelineItem = document.createElement("div");
            timelineItem.className += "table-row";
            
            var hourData = document.createElement("div");
            hourData.innerHTML = hour;
            hourData.className += "table-column hourCell";
            timelineItem.appendChild(hourData); 

            var weatherSummaryData = document.createElement("div");
            weatherSummaryData.className += "table-column weatherSummaryCell";
            var weatherItem = document.createElement("i");
            weatherSummaryData.appendChild(weatherItem);
            var weatherSummaryText = document.createElement("div");
            weatherSummaryData.appendChild(weatherSummaryText);
            timelineItem.appendChild(weatherSummaryData);
            
            var apparentTempData = document.createElement("div");
            apparentTempData.className += "table-column temperatureCell";
            timelineItem.appendChild(apparentTempData);

            var windSpeedData = document.createElement("div");
            windSpeedData.className += "table-column windSpeedCell";
            timelineItem.appendChild(windSpeedData);

            var stationEventData = document.createElement("div");
            stationEventData.className += "table-column stationEventCell";
            stationEventData.id = "stationEvent" + hour;
            timelineItem.appendChild(stationEventData);

            var stationCriticalData = document.createElement("div");
            stationCriticalData.className += "table-column stationCriticalCell";
            timelineItem.appendChild(stationCriticalData);
            
            timelineElement.appendChild(timelineItem);

            this.timeline[hour] = {
                weatherIcon: weatherItem,
                apparentTemperature: apparentTempData,
                windSpeed: windSpeedData,
                weatherSummaryText: weatherSummaryText,
                stationEvent: stationEventData,
                stationCritical: stationCriticalData
            }
        }

        this.backButton = document.getElementById("backButton");
        this.backButton.onclick = () => this.Controller.selectStation();

        this.d3TooltipDiv = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
    }

    static renderHeader () {
        var header = this.Controller.getStationHeader();
        if (header) {
            this.stationName.innerHTML = header;
            this.backButton.classList.add("show");
        } else {
            this.stationName.innerHTML = "Station Overview";
            this.backButton.classList.remove("show");
        }
    }

    static renderWeatherTimeline () {
        var weather = this.Controller.getWeather();
        for (var hour in this.timeline) {
            var timelineItem = this.timeline[hour];
            var weatherItem = weather[hour];

            WeatherIcons.map(weatherItem.icon, timelineItem.weatherIcon);
            timelineItem.apparentTemperature.innerHTML = weatherItem.apparentTemperature;
            timelineItem.windSpeed.innerHTML = weatherItem.windSpeed;
            timelineItem.weatherSummaryText.innerHTML = weatherItem.summary;
        }
    }

    static renderEventsTimeline () {    
        //clear entries
        for (var hour in this.timeline) {
            var timelineItem = this.timeline[hour];
            while (timelineItem.stationEvent.firstChild) {
                timelineItem.stationEvent.removeChild(timelineItem.stationEvent.firstChild);
            }
            while (timelineItem.stationCritical.firstChild) {
                timelineItem.stationCritical.removeChild(timelineItem.stationCritical.firstChild);
            }
        }

        //render in/out bars
        var aggregatedStations = this.Controller.getAggregatedStations();
        var aggregatedStationsMaximum = this.Controller.getAggregatedStationsMaximum();
        for (var hour in aggregatedStations) {
            var timelineItem = this.timeline[hour];
            var aggregated = aggregatedStations[hour];

            this.renderBars(hour, aggregated.in, aggregated.out, aggregatedStationsMaximum.in, aggregatedStationsMaximum.out);
        }
        
        //collect hours with critcal events
        var eventingStationsHour = this.Controller.getEventingStationsHour();
        var stationEvents = this.Controller.getEvents();
        var criticalHours = new Set();
        for (var index in stationEvents) {
            criticalHours.add(stationEvents[index].hour);
        }

        //loop critical hours and set button with icon
        criticalHours.forEach((hour) => {
            var timelineItem = this.timeline[hour];

            var eventButton = document.createElement("a");
            if (hour === eventingStationsHour) {
                eventButton.className += "fa fa-exclamation-triangle fa-2x fa-inverse eventButtonPressed";
            } else {
                eventButton.className += "fa fa-exclamation-triangle fa-2x eventButton";
            }    

            eventButton.onclick = ((hour) => {
                return () => this.Controller.showEventingStations(hour);
            })(hour);
            
            timelineItem.stationCritical.appendChild(eventButton);
        });

        this.backButton.disabled = true;
    }

    static renderStationTimeline () {
        var history = this.Controller.getStationHistory();
        var historyMaximum = this.Controller.getStationHistoryMaximum();
        var eventingStationsHour = this.Controller.getEventingStationsHour();

        for (var hour in this.timeline) {
            var hour = parseInt(hour);
            var timelineItem = this.timeline[hour];
            var historyItem = history[hour];
            
            //remove entries
            while (timelineItem.stationEvent.firstChild) {
                timelineItem.stationEvent.removeChild(timelineItem.stationEvent.firstChild);
            }

            while (timelineItem.stationCritical.firstChild) {
                timelineItem.stationCritical.removeChild(timelineItem.stationCritical.firstChild);
            }

            this.renderBars(hour, historyItem.in, historyItem.out, historyMaximum.in, historyMaximum.out);       
            
            if (Math.abs(historyItem.delta) > this.Controller.EVENT_THRESHOLD) {
                var eventIcon = document.createElement("i");
                eventIcon.className += "fa fa-exclamation-triangle fa-2x";
                eventIcon.style.color = "darkred";
                timelineItem.stationCritical.appendChild(eventIcon);
            }
        }

        this.backButton.disabled = false;
    }

    static renderBars (hour, numberIn, numberOut, numberMaxIn, numberMaxOut) {

        var inOutMax = Math.max(numberMaxIn, numberMaxOut);
        var scaledIn = (inOutMax > 0) ? numberIn/inOutMax : 0;
        var scaledOut = (inOutMax > 0) ? numberOut/inOutMax : 0;

        var width = 188;
        if ((numberIn + numberOut) > 0) {
            var chart = d3.select("#stationEvent" + hour)
            .append("svg")
            .attr("width", "100%")
            .attr("height", 30);
            
            /*
            //array [0, inOutMax+1]
            var data = [...Array(inOutMax + 1).keys()];
            chart.selectAll("line")
            .data(data)			
            .enter()
            .append("line")
            .attr("x1",function(d, i){
                var x = width * d / inOutMax; 
                return x;
            })
            .attr("y1", 5)
            .attr("x2",function(d, i){
                var x = width * d / inOutMax;
                return x;
            })
            .attr("y2", 24)
            .attr("stroke-width", 1)
            .attr("stroke", "gray");
            */

            chart.append("line")
            .attr("x1", 1)
            .attr("y1", 1)
            .attr("x2", 1)
            .attr("y2", 29)
            .attr("stroke-width", 1)
            .attr("stroke", "gray");

            chart.append("line")
            .attr("x1", 1)
            .attr("y1", 14)
            .attr("x2", "100%")
            .attr("y2", 14)
            .attr("stroke-width", 1)
            .attr("stroke", "gray");

            chart.append("rect")
            .attr("x", 1)
            .attr("y", 4)
            .attr("width", scaledIn * 100 + "%")
            .attr("height", 9)
            .style("fill", "darkgreen");

            chart.append("rect")
            .attr("x", 1)
            .attr("y", 15)
            .attr("width", scaledOut * 100 + "%")
            .attr("height", 9)
            .style("fill", "firebrick");

            chart.on("mouseover", ((numberIn, numberOut) => {		
                return () => {
                    StationView.d3TooltipDiv.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                    StationView.d3TooltipDiv.html("<b>Arrivals: </b>" + numberIn + "</br><b>Departures: </b>" + numberOut)	
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px");
                }
            })(numberIn, numberOut));
            
            chart.on("mouseout", function() {		
                StationView.d3TooltipDiv.transition()		
                    .duration(500)		
                    .style("opacity", 0);	
            });
        }
    }

}