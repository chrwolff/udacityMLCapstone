import Model from './Model.js';
import MapView from './MapView.js';
import StationView from './StationView.js';
import Sheperd from './Sheperd.js';
import ResponsiveHandler from './ResponsiveHandler.js';

var $ = require("jquery");

export default class Controller {
    
    static init () {
        this.EVENT_THRESHOLD = 0;
        this.eventingStationsHour = undefined;

        var loadPromise = Model.init(this);

        $.when($.ready).then(function() {
            ResponsiveHandler.init();
            
            loadPromise.then(function() {
                    MapView.init(Controller);
                    MapView.render();
                    StationView.init(Controller);
                    StationView.renderHeader();
                    StationView.renderWeatherTimeline();
                    StationView.renderEventsTimeline();
                    $(".container").css('opacity', 1);
                    $(".logo").css('opacity', 1);
                    $("#stationName").css('opacity', 1);

                    var overlay = $(".overlay"); 
                    overlay.animate({
                        opacity: 0,
                        }, 300, function() {
                        overlay.remove();
                    });

                    /*
                    Sheperd.init().then(
                        function () {
                            Sheperd.start();
                        }
                    );
                    */
                },
                function () {
                    alert("Something went horribly wrong!");
                }
            );
        });
    }

    static getAllStations () {
        return Model.stations;
    }

    static getCurrentStations () {
        return Model.getCurrentStations();
    }

    static getMidPoint () {
        return [Model.midLatitude, Model.midLongitude];
    }

    static getBounds() {
        var corner1 = L.latLng(Model.minLatitude, Model.minLongitude);
        var corner2 = L.latLng(Model.maxLatitude, Model.maxLongitude);
        return L.latLngBounds(corner1, corner2);
    }

    static selectStation (id) {
        if (!id || (Model.selectedStation === id)) {
            Model.selectedStation = undefined;
            StationView.renderEventsTimeline();
        } else {
            Model.setStationId(id).then(
                function() {
                    MapView.show(false);
                    StationView.renderStationTimeline();
                }
            );
        }
        MapView.render();
        MapView.flyTo();
        StationView.renderHeader();
    } 

    static getCenteredStation () {
        var id = Model.selectedStation;
        if (id) {
            return {
                stationId: id,
                stationData: Model._stations[id]
            };
        } else {
            return undefined;
        } 
    } 

    static getStationHeader () {
        var id = Model.selectedStation; 
        if (id) {
            var station = Model.stations[id];
            return station.name;
        } else {
            return undefined;
        }
    }

    static getStationHistory () {
        return Model.stationHistory;
    }

    static getStationHistoryMaximum () {
        return Model.stationHistoryMaximum;
    }

    static getWeather () {
        return Model.weather;
    }

    static getEvents () {
        return Model.events;
    }

    static getAggregatedStations () {
        return Model.aggregatedStations;
    }

    static getAggregatedStationsMaximum () {
        return Model.aggregatedStationsMaximum;
    }

    static onDateSelect (date) {
        Model.setDate(date).then(
            function() {
                Controller.eventingStationsHour = undefined;
                StationView.renderWeatherTimeline();
                if (Model.selectedStation) {
                    StationView.renderStationTimeline();
                } else {
                    StationView.renderEventsTimeline();
                }
                MapView.render();
            }
        );
    }

    static showEventingStations (hour) {
        if (this.eventingStationsHour !== hour) {
            this.eventingStationsHour = hour;
            MapView.show(true);
        } else {
            this.eventingStationsHour = undefined;
            MapView.show(false);
        }
        MapView.render();
        StationView.renderEventsTimeline();
        if (!Model.selectedStation) {
            MapView.flyTo();
        }
    }

    static getEventingStations () {
        var eventingStations = {};
        for (var index in Model.events) {
            var event = Model.events[index];
            if (event.hour === this.eventingStationsHour) {
                eventingStations[event.station_id] = event;
            }
        }
        return eventingStations;
    }

    static isEventingMode () {
        return !!this.eventingStationsHour;
    }

    static getEventingStationsHour () {
        return this.eventingStationsHour;
    }

}