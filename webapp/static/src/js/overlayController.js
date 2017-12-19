const $ = require("jquery");
import { store } from "./store.js";
import config from "./config.js";

//show overlay when fetching data
store.observeStore(
  (oldState, currentState) => {
    setShowOverlay(
      currentState.isFetchingOverviewData || currentState.isFetchingStationData
    );
  },
  state => {
    return {
      isFetchingOverviewData: state.isFetchingOverviewData,
      isFetchingStationData: state.isFetchingStationData
    };
  },
  this
);

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
