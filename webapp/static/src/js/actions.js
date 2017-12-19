import config from "./config.js";
import { store } from "./store.js";
import model from "./model.js";

export const SELECT_STATION = "SELECT_STATION";
export const SELECT_OVERVIEW = "SELECT_OVERVIEW";
export const SHOW_EVENTS = "SHOW_EVENTS";
export const REQUEST_OVERVIEW = "REQUEST_OVERVIEW";
export const RECEIVE_OVERVIEW = "RECEIVE_OVERVIEW";
export const REQUEST_STATION = "REQUEST_STATION";
export const RECEIVE_STATION = "RECEIVE_STATION";

export function requestStation(id) {
  return {
    type: REQUEST_STATION,
    id
  };
}

export function receiveStation(id) {
  return {
    type: RECEIVE_STATION,
    id
  };
}

export function selectOverview() {
  return {
    type: SELECT_OVERVIEW
  };
}

export function showEvents(show = false, hour = null) {
  return {
    type: SHOW_EVENTS,
    show,
    hour
  };
}

export function requestOverview(date) {
  return {
    type: REQUEST_OVERVIEW,
    date
  };
}

export function receiveOverview(date) {
  return {
    type: RECEIVE_OVERVIEW,
    date
  };
}

export function selectDate(date) {
  return function(dispatch) {
    //convert selected date to UTC timestamp
    var utcDate = new Date(
      date.getFullYear() +
        "-" +
        (date.getMonth() + 1) +
        "-" +
        date.getDate() +
        " 00:00:00 UTC"
    );

    dispatch(requestOverview(utcDate));

    var promiseArray = [];

    //if a station is selected, load its data as well
    var selectedStationId = null;
    if (!store.getState().state.showOverview) {
      selectedStationId = store.getState().state.selectedStationId;
      dispatch(requestStation(selectedStationId));
      promiseArray.push(fetchStationData(selectedStationId, utcDate));
    }

    //load weather data
    promiseArray.push(
      new Promise(function(resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onloadend = function() {
          if (this.readyState == 4 && this.status == 200) {
            model.setWeather(JSON.parse(this.responseText));
            resolve();
          } else {
            console.log("An error occured when fetching /weather");
            reject();
          }
        };
        xmlhttp.open("POST", "/weather", true);
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(
          JSON.stringify({
            timestamp: utcDate
          })
        );
      })
    );

    //load aggregated data for the overview
    promiseArray.push(
      new Promise(function(resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onloadend = function() {
          if (this.readyState == 4 && this.status == 200) {
            model.setAggregatedData(JSON.parse(this.responseText));
            resolve();
          } else {
            console.log("An error occured when fetching /aggregatedData");
            reject();
          }
        };
        xmlhttp.open("POST", "/aggregatedData", true);
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(
          JSON.stringify({
            timestamp: utcDate,
            eventThreshold: config.eventThreshold
          })
        );
      })
    );

    //resolve when all load promises are resolved
    return new Promise((resolve, reject) => {
      Promise.all(promiseArray).then(() => {
        dispatch(receiveOverview(utcDate));
        if (selectedStationId !== null) {
          dispatch(receiveStation(selectedStationId));
        }
        resolve();
      }, reject);
    });
  };
}

export function selectStation(id) {
  return function(dispatch) {
    dispatch(requestStation(id));
    var utcDate = store.getState().state.selectedDate;
    return fetchStationData(id, utcDate).then(() =>
      store.dispatch(receiveStation(id))
    );
  };
}

function fetchStationData(id, utcDate) {
  return new Promise(function(resolve, reject) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onloadend = function() {
      if (this.readyState == 4 && this.status == 200) {
        model.setStationData(JSON.parse(this.responseText));
        resolve();
      } else {
        console.log("An error occured when fetching /stationData");
        reject();
      }
    };
    xmlhttp.open("POST", "/stationData", true);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.send(
      JSON.stringify({
        stationId: id,
        timestamp: utcDate
      })
    );
  });
}
