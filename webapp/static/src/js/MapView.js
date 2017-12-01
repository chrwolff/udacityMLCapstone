var L = require("leaflet");
require("drmonty-leaflet-awesome-markers");

export default class MapView {
        
    static init (controller) {
        this.Controller = controller;

        this.map = L.map('map', {
            center: this.Controller.getMidPoint(),
            zoom: 12,
            minZoom: 12,
            maxBounds: this.Controller.getBounds()
        });
        
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.markers = {};

        var stations = this.Controller.getAllStations();
        for (var id in stations) {
            id = parseInt(id);
            var station = stations[id];
            var markerIcon = L.AwesomeMarkers.icon({
                prefix: 'fa',
                icon: 'bicycle',
                markerColor: 'darkgreen'
            });

            var marker = L.marker([station.latitude, station.longitude],{
                opacity: 1,
                riseOnHover: true,
                icon: markerIcon
            })
            .addTo(this.map)
            .bindTooltip(station.name);

            marker.on('click', (id => {
                return () => MapView.Controller.selectStation(id);
            })(id));

            this.markers[id] = marker;
        }
    }

    static show (isShow) {
        var mapElement = document.getElementById("map");
        if (isShow) {
            mapElement.className += " show";
        } else {
            mapElement.classList.remove("show");
        }
    }

    static flyTo () {
        var centeredStation = this.Controller.getCenteredStation();
        if (centeredStation) {
            this.map.flyTo([centeredStation.stationData.latitude, centeredStation.stationData.longitude], 15);
        } else {
            this.map.flyTo(this.Controller.getMidPoint(), 12);
        }
    }

    static render () {
        var centeredStation = this.Controller.getCenteredStation();
        var centeredStationId = undefined;
        var currentStations = this.Controller.getCurrentStations();
        var isEventingMode = this.Controller.isEventingMode();
        var eventingStations = {};

        if (isEventingMode) {
            eventingStations = this.Controller.getEventingStations();
        }

        if (centeredStation) {
            centeredStationId = centeredStation.stationId;
        } 
        
        for (var id in this.markers) {
            id = parseInt(id);
            var marker = this.markers[id];
            marker.closeTooltip();

            var markerColor;
            var markerIcon;
            var markerOpacity;
            if (id === centeredStationId) {
                markerColor = 'orange';
                markerIcon = 'bicycle';
                markerOpacity = 1.0;
            } else if (currentStations[id]) {
                markerIcon = 'bicycle';
                if (eventingStations[id]) {
                    markerColor = 'maroon';
                    markerOpacity = 1.0; 
                } else {
                    markerColor = 'darkgreen';
                    markerOpacity = isEventingMode ? 0.5 : 1.0; 
                }
            } else {
                markerColor = 'gray';
                markerIcon = 'ban';
                markerOpacity = 0.5;
            }

            var markerIcon = L.AwesomeMarkers.icon({
                prefix: 'fa',
                icon: markerIcon,
                markerColor: markerColor
            });
            marker.setIcon(markerIcon);
            marker.setOpacity(markerOpacity);
        }
    } 
}