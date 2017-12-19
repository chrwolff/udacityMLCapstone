const L = require("leaflet");
require("drmonty-leaflet-awesome-markers");
import config from "./config.js";
import model from "./model.js";
import { store } from "./store.js";
import { selectStation, selectOverview } from "./actions";

export default class MapView {
  static init() {
    var mapBoundaries = model.getBoundaries();

    this.map = L.map("map", {
      center: model.getMidPoint(),
      zoom: config.minimumZoom,
      minZoom: config.minimumZoom,
      maxBounds: L.latLngBounds(
        mapBoundaries.northWestCorner,
        mapBoundaries.southEastCorner
      )
    });

    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    //create station markers for the map
    this.markers = {};
    var stations = model.getStations();
    Object.getOwnPropertyNames(stations).forEach(id => {
      var station = stations[id];
      var markerIcon = L.AwesomeMarkers.icon({
        prefix: "fa",
        icon: "bicycle",
        markerColor: "darkgreen"
      });

      var marker = L.marker([station.latitude, station.longitude], {
        opacity: 1,
        riseOnHover: true,
        icon: markerIcon
      })
        .addTo(this.map)
        .bindTooltip(station.name);

      marker.on(
        "click",
        (closureId => () => {
          if (store.getState().state.selectedStationId !== closureId) {
            store.dispatch(selectStation(closureId));
          } else {
            store.dispatch(selectOverview());
          }
        })(id)
      );

      this.markers[id] = marker;
    });

    //observe station selections
    store.observeStore(
      (oldState, currentState) => {
        this.render(currentState.selectedStationId, store.getState().state.showEvents);
        this.flyTo(currentState.selectedStationId);
        if (oldState.showOverview && !currentState.showOverview) {
          this.show(false);
        }
      },
      state => {
        return {
          showOverview: state.showOverview,
          selectedStationId: state.selectedStationId
        };
      },
      this
    );

    //observe event selections
    store.observeStore(
      (oldState, currentState) => {
        this.render(store.getState().state.selectedStationId, currentState.showEvents);
        if (!oldState.showEvents && currentState.showEvents) {
          this.show(true);
        }
      },
      state => {
        return {
          showEvents: state.showEvents,
          selectedHour: state.selectedHour
        };
      },
      this
    );
  }

  static show(isShow) {
    //show map when in mobile mode
    var mapElement = document.getElementById("map");
    if (isShow) {
      mapElement.classList.add("show");
    } else {
      mapElement.classList.remove("show");
    }
  }

  static flyTo(selectedStationId = null) {
    if (selectedStationId !== null) {
      var selectedStation = model.getStation(selectedStationId);
      this.map.flyTo([selectedStation.latitude, selectedStation.longitude], 15);
    } else {
      this.map.flyTo(model.getMidPoint(), config.minimumZoom);
    }
  }

  static render(selectedStationId = null, isEventingView = false) {
    var eventingStations = {};
    if (isEventingView) {
      eventingStations = model.getEventingStations();
    }

    for (var id in this.markers) {
      var marker = this.markers[id];
      marker.closeTooltip();

      var markerColor;
      var markerOpacity;
      if (id === selectedStationId) {
        markerColor = "orange";
        markerOpacity = 1.0;
      } else {
        if (eventingStations[id]) {
          markerColor = "maroon";
          markerOpacity = 1.0;
        } else {
          markerColor = "darkgreen";
          markerOpacity = isEventingView ? 0.5 : 1;
        }
      }

      var markerIcon = L.AwesomeMarkers.icon({
        prefix: "fa",
        icon: "bicycle",
        markerColor: markerColor
      });
      marker.setIcon(markerIcon);
      marker.setOpacity(markerOpacity);
    }
  }
}
