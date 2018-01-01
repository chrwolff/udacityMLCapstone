export default {
  scrollToElement: false,
  showStepNumbers: false,
  steps: [
    {
      element: "#map",
      intro:
        "This map shows all Hubway stations in the Boston area. You can zoom and pan the map. Clicking on a marker selects the station and shows its details in the tabular view on the left."
    },
    {
      element: "#stationName",
      intro:
        "This header displays the selected station. Ff no station is selected, it displays 'Overview'. In overview mode, all numbers in the table below are the cumulative result of all stations. "
    },
    {
      element: "#stationView",
      intro:
        "The tabular view shows you the detailed predictions and historical data for the selected station. In overview mode it shows the cumulated data for all stations."
    },
    {
      element: "#datepicker",
      intro:
        "With the date picker you can navigate to a day in the period from May 2015 through November 2016."
    },
    {
      element: "#headerHour",
      intro:
        "This column displays the hours of the selected date in 24h format."
    },
    {
      element: "#headerWeatherSummary",
      intro:
        "This column displays a summary of the weather conditions as text and icon."
    },
    {
      element: "#headerTemperature",
      intro: "This column displays the apparent temperature in degrees Celsius."
    },
    {
      element: "#headerWindspeed",
      intro: "This column displays the windspeed in kilometers per hour."
    },
    {
      element: "#headerEvent",
      intro:
        "And lastly, this column displays the real historical data and the predicted values in graphical form. It also indicates critical events, which are derived from the predicted flow. The flow for a given hour is defined as critical, if its absolute value is greater than six."
    },
    {
      element: "#headerEvent",
      intro:
        "The red and green bars represent the real historical data, with arrivals in green on top and departures in red below it. The small black lines represent the predicted values. You can hover over the graphs to display the actual numbers."
    }
  ]
};
