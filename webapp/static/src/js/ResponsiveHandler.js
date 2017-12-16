const $ = require("jquery");
const logoImage = require("../images/Primary-Logo-2-color.png");

const DESKTOP_BREAKPOINT = 1130;
var isDesktop;
var bannerHeight;

function init() {
  bannerHeight = $(".banner").height();
  setViewDimensions();
  changeLayout();
  $(window).resize(onResize);
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
  var logo = $(".logo").detach();
  logo.attr("src", logoImage);

  var bannerCenter = $(".bannerCenter");
  var bannerRight = $(".bannerRight");
  var stationViewTop = $(".stationViewTop");

  if (isDesktop) {
    bannerCenter.append(stationName);
    bannerCenter.append(backButton);
    bannerRight.append(logo);
  } else {
    stationViewTop.append(stationName);
    stationViewTop.append(backButton);
    bannerCenter.append(logo);
  }
}

export default {
  init
};
