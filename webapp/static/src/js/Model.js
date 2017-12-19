import { store } from "./store.js";

var stations;
var weather;
var events;
var aggregatedData;
var stationData;
var midPoint;
var northWestCorner;
var southEastCorner;

var model = {
  fetchStations: () =>
    new Promise(function(resolve, reject) {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onloadend = function() {
        if (this.readyState == 4 && this.status == 200) {
          stations = JSON.parse(this.responseText);
          model.computeBoundaries();
          resolve();
        } else {
          console.log("An error occured when fetching /stations");
          reject();
        }
      };
      xmlhttp.open("GET", "/stations", true);
      xmlhttp.send();
    }),

  getStations: () => stations,

  getStation: id => stations[id],

  //compute boundaries for the map view
  computeBoundaries: () => {
    var numberOfStations = 0;
    var midLatitude = 0;
    var midLongitude = 0;
    var minLatitude = Infinity;
    var minLongitude = Infinity;
    var maxLatitude = -Infinity;
    var maxLongitude = -Infinity;

    for (var id in stations) {
      numberOfStations++;

      var latitude = stations[id].latitude;
      var longitude = stations[id].longitude;

      midLatitude += latitude;
      midLongitude += longitude;

      minLatitude = Math.min(minLatitude, latitude);
      minLongitude = Math.min(minLongitude, longitude);
      maxLatitude = Math.max(maxLatitude, latitude);
      maxLongitude = Math.max(maxLongitude, longitude);
    }
    midLatitude /= numberOfStations;
    midLongitude /= numberOfStations;

    var deltaLatitude = Math.abs(maxLatitude - minLatitude);
    var deltaLongitude = Math.abs(maxLongitude - minLongitude);
    minLatitude -= deltaLatitude;
    minLongitude -= deltaLongitude;
    maxLatitude += deltaLatitude;
    maxLongitude += deltaLongitude;

    midPoint = [midLatitude, midLongitude];
    northWestCorner = [minLatitude, minLongitude];
    southEastCorner = [maxLatitude, maxLongitude];
  },

  getMidPoint: () => midPoint,

  getBoundaries: () => {
    return {
      northWestCorner,
      southEastCorner
    };
  },

  setWeather: json => {
    weather = json;
  },

  getWeather: () => weather,

  setAggregatedData: json => {
    events = JSON.parse(json.events);
    aggregatedData = {
      realValues: JSON.parse(json.aggregatedRealValues),
      predictedValues: JSON.parse(json.aggregatedPredictionValues),
      maximumValues: json.aggregatedMaximum
    };
  },

  getAggregatedData: () => aggregatedData,

  setStationData: json => {
    stationData = {
      realValues: JSON.parse(json.realValues),
      predictedValues: JSON.parse(json.predictionValues),
      maximumValues: json.maximum
    };
  },

  getStationData: () => stationData,

  getEvents: () => events,

  getEventingStations: () => {
    var eventingStations = {};
    var selectedHour = store.getState().state.selectedHour;
    events.forEach(event => {
      if (event.hour === selectedHour) {
        eventingStations[event.station_id] = event;
      }
    });
    return eventingStations;
  }
};

export default model;
