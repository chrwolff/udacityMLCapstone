import config from "./config.js";

export default class Model {
  static init(controller) {
    this.Controller = controller;

    this.midLatitude = 0;
    this.midLongitude = 0;
    this.minLatitude = Infinity;
    this.minLongitude = Infinity;
    this.maxLatitude = -Infinity;
    this.maxLongitude = -Infinity;

    this.stationHistory = null;
    this.stationHistoryMaximum = null;
    this.weather = null;
    this.events = null;
    this.aggregatedStations = null;
    this.aggregatedStationsMaximum = null;

    this._stations = {};
    this.selectedDate = null;
    this.selectedStation = null;

    //fetch initial data: stations, weather and overview
    var promiseArray = [];
    promiseArray.push(
      new Promise(function(resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onloadend = function() {
          if (this.readyState == 4 && this.status == 200) {
            Model._stations = JSON.parse(this.responseText);
            Model.computeBounds();
            resolve();
          } else {
            reject();
          }
        };
        xmlhttp.open("GET", "/stations", true);
        xmlhttp.send();
      })
    );

    promiseArray.push(this.setDate(config.firstDate));

    return new Promise(function(resolve, reject) {
      Promise.all(promiseArray).then(resolve, reject);
    });
  }

  static get stations() {
    return this._stations;
  }

  //compute boundaries for the map view
  static computeBounds() {
    var numberOfStations = 0;
    for (var id in this._stations) {
      numberOfStations++;

      var latitude = this._stations[id].latitude;
      var longitude = this._stations[id].longitude;

      this.midLatitude += latitude;
      this.midLongitude += longitude;

      this.minLatitude = Math.min(this.minLatitude, latitude);
      this.minLongitude = Math.min(this.minLongitude, longitude);
      this.maxLatitude = Math.max(this.maxLatitude, latitude);
      this.maxLongitude = Math.max(this.maxLongitude, longitude);
    }
    this.midLatitude /= numberOfStations;
    this.midLongitude /= numberOfStations;

    var deltaLatitude = Math.abs(this.maxLatitude - this.minLatitude);
    var deltaLongitude = Math.abs(this.maxLongitude - this.minLongitude);
    this.minLatitude -= deltaLatitude;
    this.minLongitude -= deltaLongitude;
    this.maxLatitude += deltaLatitude;
    this.maxLongitude += deltaLongitude;
  }

  static loadStationData() {
    var promise = new Promise(function(resolve, reject) {
      if (Model.selectedStation && Model.selectedDate) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onloadend = function() {
          if (this.readyState == 4 && this.status == 200) {
            var responseJSON = JSON.parse(this.responseText);
            Model.stationData = {
              realValues: JSON.parse(responseJSON.realValues),
              predictedValues: JSON.parse(responseJSON.predictionValues),
              maximumValue: responseJSON.maximum
            };
            resolve();
          } else {
            reject();
          }
        };
        xmlhttp.open("POST", "/stationData", true);
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(
          JSON.stringify({
            stationId: Model.selectedStation,
            timestamp: Model.selectedDate
          })
        );
      } else {
        Model.stationHistory = null;
        resolve();
      }
    });
    return promise;
  }

  static loadWeather() {
    var promise = new Promise(function(resolve, reject) {
      if (Model.selectedDate) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onloadend = function() {
          if (this.readyState == 4 && this.status == 200) {
            Model.weather = JSON.parse(this.responseText);
            resolve();
          } else {
            reject();
          }
        };
        xmlhttp.open("POST", "/weather", true);
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(
          JSON.stringify({
            timestamp: Model.selectedDate
          })
        );
      } else {
        Model.weather = null;
        resolve();
      }
    });
    return promise;
  }

  static loadEvents() {
    var promise = new Promise(function(resolve, reject) {
      if (Model.selectedDate) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onloadend = function() {
          if (this.readyState == 4 && this.status == 200) {
            var responseJSON = JSON.parse(this.responseText);
            Model.events = JSON.parse(responseJSON.events);
            Model.aggregatedData = {
              realValues: JSON.parse(responseJSON.aggregatedRealValues),
              predictedValues: JSON.parse(
                responseJSON.aggregatedPredictionValues
              ),
              maximumValue: responseJSON.aggregatedMaximum
            };
            resolve();
          } else {
            reject();
          }
        };
        xmlhttp.open("POST", "/aggregatedData", true);
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(
          JSON.stringify({
            timestamp: Model.selectedDate,
            eventThreshold: config.eventThreshold
          })
        );
      } else {
        Model.events = null;
        resolve();
      }
    });
    return promise;
  }

  static setStationId(id) {
    this.selectedStation = id;
    return this.loadStationData();
  }

  static setDate(date) {
    this.selectedDate = new Date(
      date.getFullYear() +
        "-" +
        (date.getMonth() + 1) +
        "-" +
        date.getDate() +
        " 00:00:00 UTC"
    );
    var promiseArray = [];
    promiseArray.push(this.loadWeather());
    promiseArray.push(this.loadStationData());
    promiseArray.push(this.loadEvents());
    return new Promise(function(resolve, reject) {
      Promise.all(promiseArray).then(resolve, reject);
    });
  }

  static getCurrentStations() {
    var current_stations = {};
    for (var id in this._stations) {
      id = parseInt(id);
      var station = this._stations[id];
      if (
        station.first_used <= this.selectedDate.valueOf() &&
        station.last_used >= this.selectedDate.valueOf()
      ) {
        current_stations[id] = station;
      }
    }
    return current_stations;
  }
}
