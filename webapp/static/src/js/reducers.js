import { combineReducers } from "redux";
import {
  REQUEST_STATION,
  RECEIVE_STATION,
  SELECT_OVERVIEW,
  SHOW_EVENTS,
  REQUEST_OVERVIEW,
  RECEIVE_OVERVIEW
} from "./actions";

function state(
  state = {
    selectedStationId: null,
    showOverview: true,
    isFetchingOverviewData: false,
    isFetchingStationData: false,
    selectedDate: null,
    showEvents: false,
    selectedHour: null
  },
  action
) {
  switch (action.type) {
    case REQUEST_STATION:
      return Object.assign({}, state, {
        isFetchingStationData: true,
        showOverview: false,
        selectedStationId: action.id
      });
    case RECEIVE_STATION:
      return Object.assign({}, state, {
        isFetchingStationData: false,
        showOverview: false,
        selectedStationId: action.id
      });
    case SELECT_OVERVIEW:
      return Object.assign({}, state, {
        selectedStationId: null,
        showOverview: true
      });
    case SHOW_EVENTS:
      return Object.assign({}, state, {
        showEvents: action.show,
        selectedHour: action.show ? action.hour : null
      });
    case REQUEST_OVERVIEW:
      return Object.assign({}, state, {
        isFetchingOverviewData: true,
        selectedDate: action.date,
        showEvents: false
      });
    case RECEIVE_OVERVIEW:
      return Object.assign({}, state, {
        isFetchingOverviewData: false,
        selectedDate: action.date,
        showEvents: false
      });
    default:
      return state;
  }
}

export default combineReducers({
  state
});
