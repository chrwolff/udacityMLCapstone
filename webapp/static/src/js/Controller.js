import Model from "./model.js";
import MapView from "./mapView.js";
import StationView from "./stationView.js";
import Sheperd from "./sheperd.js";
import ResponsiveHandler from "./responsiveHandler.js";
import config from "./config.js";

const $ = require("jquery");

var setShowOverlay = (function(isVisible) {
  return function(show) {
    if (show !== isVisible) {
      var overlay = $(".overlay");
      if (overlay) {
        isVisible = show;
        if (show) {
          overlay.removeClass("overlay-hidden");
          overlay.animate(
            {
              opacity: config.overlayOpacity
            },
            300
          );
        } else {
          overlay.animate(
            {
              opacity: 0
            },
            300,
            function() {
              overlay.addClass("overlay-hidden");
            }
          );
        }
      }
    }
  };
})(true);

export default class Controller {
  static init() {
    this.eventingStationsHour = null;

    var loadPromise = Model.init(this);

    $.when($.ready).then(function() {
      ResponsiveHandler.init();

      loadPromise.then(
        function() {
          MapView.init(Controller);
          MapView.render();
          StationView.init(Controller);
          StationView.renderHeader();
          StationView.renderWeatherTimeline();
          StationView.renderEventsTimeline();
          $(".container").css("opacity", 1);
          $(".logo").css("opacity", 1);
          $("#stationName").css("opacity", 1);

          setShowOverlay(false);

          /*
            Sheperd.init().then(
                function () {
                    Sheperd.start();
                }
            );
        */
        },
        function() {
          alert("Something went horribly wrong!");
        }
      );
    });
  }

  static getAllStations() {
    return Model.stations;
  }

  static getCurrentStations() {
    return Model.getCurrentStations();
  }

  static getMidPoint() {
    return [Model.midLatitude, Model.midLongitude];
  }

  static getBounds() {
    var corner1 = L.latLng(Model.minLatitude, Model.minLongitude);
    var corner2 = L.latLng(Model.maxLatitude, Model.maxLongitude);
    return L.latLngBounds(corner1, corner2);
  }

  static selectStation(id) {
    if (!id || Model.selectedStation === id) {
      Model.selectedStation = null;
      StationView.renderEventsTimeline();
    } else {
      Model.setStationId(id).then(function() {
        MapView.show(false);
        StationView.renderStationTimeline();
      });
    }
    MapView.render();
    MapView.flyTo();
    StationView.renderHeader();
  }

  static getCenteredStation() {
    var id = Model.selectedStation;
    if (id) {
      return {
        stationId: id,
        stationData: Model._stations[id]
      };
    } else {
      return null;
    }
  }

  static getStationHeader() {
    var id = Model.selectedStation;
    if (id) {
      var station = Model.stations[id];
      return station.name;
    } else {
      return null;
    }
  }

  static getStationPredictions() {
    return Model.stationData.predictedValues;
  }

  static getStationRealValues() {
    return Model.stationData.realValues;
  }

  static getStationMaximum() {
    return Model.stationData.maximumValue;
  }

  static getWeather() {
    return Model.weather;
  }

  static getEvents() {
    return Model.events;
  }

  static getAggregatedPredictions() {
    return Model.aggregatedData.predictedValues;
  }

  static getAggregatedRealValues() {
    return Model.aggregatedData.realValues;
  }

  static getAggregatedMaximum() {
    return Model.aggregatedData.maximumValue;
  }

  static onDateSelect(date) {
    setShowOverlay(true);
    Model.setDate(date).then(function() {
      Controller.eventingStationsHour = null;
      StationView.renderWeatherTimeline();
      if (Model.selectedStation) {
        StationView.renderStationTimeline();
      } else {
        StationView.renderEventsTimeline();
      }
      MapView.render();
      setShowOverlay(false);
    });
  }

  static showEventingStations(hour) {
    if (this.eventingStationsHour !== hour) {
      this.eventingStationsHour = hour;
      MapView.show(true);
    } else {
      this.eventingStationsHour = null;
      MapView.show(false);
    }
    MapView.render();
    StationView.renderEventsTimeline();
    if (!Model.selectedStation) {
      MapView.flyTo();
    }
  }

  static getEventingStations() {
    var eventingStations = {};
    for (var index in Model.events) {
      var event = Model.events[index];
      if (event.hour === this.eventingStationsHour) {
        eventingStations[event.station_id] = event;
      }
    }
    return eventingStations;
  }

  static isEventingMode() {
    return !!this.eventingStationsHour;
  }

  static getEventingStationsHour() {
    return this.eventingStationsHour;
  }
}
