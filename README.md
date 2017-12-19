# Udacity Machine Learning Capstone Project

## Summary
In this project, we will take a closer look at [Hubway](https://www.thehubway.com), Boston's regional bike sharing system. As of September 2017, it gives members access to more than 1,700 bikes at 170 stations.

All bike sharing programs share a common problem, which limits customer satisfaction: Rebalancing the bikes at the rental stations, so that the stations do not run empty or overflow. Predicting the number of arrivals and departures at each station can help to alleviate this problem. To train a predictive model, we take historical trip data, weather and public holidays into account. 

This project follows the classical data science steps:
- Aquire data
- Cleanse data
- Explore/Visualize data
- Train a model
- Evaluate predictions
- Give end-user access to predictions 

## Webapp

### Prerequisites
- pandas, https://pandas.pydata.org/
- xgboost, https://xgboost.readthedocs.io/en/latest/
- flask, http://flask.pocoo.org/
- Unzip files in folder `models`

### Starting the server
1. Open python console
1. Change to the `webapp` directory 
1. Execute `set FLASK_APP=server.py`
1. Optional debug mode: `set FLASK_DEBUG=1`
1. Execute `flask run`
1. Open browser `localhost:5000`

## Data License
The author is not associated with the operator of Hubway, [Motivate International, Inc.](https://www.motivateco.com/)

All data related to Hubway has to be published according to their [Hubway Data License Agreement](https://www.thehubway.com/data-license-agreement).

Historical Weather data was aquired from [Darksky](https://darksky.net/poweredby/).

## Software License
All software of this project is published under MIT license.
