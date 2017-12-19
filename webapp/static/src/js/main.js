require("intro.js/introjs.css");
require("font-awesome/css/font-awesome.min.css");
require("drmonty-leaflet-awesome-markers/css/leaflet.awesome-markers.css");
require("pikaday/css/pikaday.css");
require("weathericons/css/weather-icons.min.css");
require("leaflet/dist/leaflet.css");
require("../less/main.less");
import MapView from "./mapView.js";
import StationView from "./stationView.js";
import ResponsiveHandler from "./responsiveHandler.js";
import config from "./config.js";
import model from "./model.js";
import "./overlayController.js";
import { selectDate } from "./actions";
import { store } from "./store.js";
const $ = require("jquery");

$.when($.ready).then(function() {
  ResponsiveHandler.init();
  StationView.init();
  store.dispatch(selectDate(config.firstDate));
  
  model.fetchStations().then(
    function() {
      MapView.init();

      //show all DOM elements when ready
      $(".container").css("opacity", 1);
      $(".logo").css("opacity", 1);
      $("#stationName").css("opacity", 1);
    }
  );
});
