const $ = require("jquery");
const logoImage = require("../images/Primary-Logo-2-color.png");

const DESKTOP_BREAKPOINT = 1130;
var isDesktop;
var bannerHeight;

//toggle map view for mobile mode
var toggleMap = (mapIsShown => {
  return (forceMapIsShown = null) => {
    if (forceMapIsShown !== null) {
      mapIsShown = forceMapIsShown;
    } else {
      mapIsShown = !mapIsShown;
    }
    if (mapIsShown) {
      $("#map").addClass("show");
      $("#mapButton").addClass("bannerButtonPressed");
    } else {
      $("#map").removeClass("show");
      $("#mapButton").removeClass("bannerButtonPressed");
    }
  };
})(false);

function init() {
  bannerHeight = $(".banner").height();
  setViewDimensions();
  changeLayout();
  $(window).resize(onResize);
  $('#mapButton').click(() => toggleMap());
}

function setViewDimensions() {
  var windowHeight = $(window).height();
  var windowWidth = $(window).width();
  var itemHeight;
  var deviceSwitch = false;

  if (windowWidth > DESKTOP_BREAKPOINT) {
    itemHeight = windowHeight - bannerHeight - 40;
    if (!isDesktop) {
      isDesktop = true;
      deviceSwitch = true;
    }
  } else {
    itemHeight = windowHeight - bannerHeight;
    if (isDesktop) {
      isDesktop = false;
      deviceSwitch = true;
    }
  }

  $(".container").css("height", windowHeight - bannerHeight);
  $(".item").css("height", itemHeight);
  return deviceSwitch;
}

function onResize() {
  var deviceSwitch = setViewDimensions();
  if (deviceSwitch) {
    changeLayout();
  }
}

function changeLayout() {
  var stationName = $("#stationName").detach();
  var backButton = $("#backButton").detach();
  var introButton = $("#introButton");
  var logo = $(".logo").detach();
  logo.attr("src", logoImage);

  var bannerCenter = $(".bannerCenter");
  var bannerRight = $(".bannerRight");
  var stationViewTop = $(".stationViewTop");

  //move buttons, staion name and logo
  if (isDesktop) {
    bannerCenter.append(stationName);
    bannerCenter.append(backButton);
    bannerRight.append(logo);
    introButton.css("display", "");
  } else {
    stationViewTop.append(stationName);
    stationViewTop.append(backButton);
    bannerCenter.append(logo);
    introButton.css("display", "none");
  }

  //force map hide in moble mode
  toggleMap(false);
}

export default {
  init
};
