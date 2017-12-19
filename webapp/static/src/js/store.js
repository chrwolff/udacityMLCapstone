import thunkMiddleware from "redux-thunk";
import { createStore, applyMiddleware } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import { fetchLocations, addLocation } from "./actions";
import rootReducer from "./reducers";
const _ = require("underscore");

export var store = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(thunkMiddleware))
);

var defaultQuery = state => state;

store.observeStore = function(onChange, query = defaultQuery, binding) {
  var currentState = _.clone(query(store.getState().state));

  function handleChange() {
    var nextState = _.clone(query(store.getState().state));
    if (!_.isEqual(nextState, currentState)) {
      var oldState = _.clone(currentState);
      currentState = nextState;
      onChange.call(binding, oldState, currentState);
    }
  }

  let unsubscribe = store.subscribe(handleChange);
  return unsubscribe;
};
