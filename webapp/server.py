from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import numpy as np
import json
import xgboost as xgb

app = Flask(__name__)

features = ['latitude_pca', 'longitude_pca',
            'apparentTemperature', 'dewPoint', 'humidity', 'precipIntensity',
            'precipProbability', 'pressure', 'temperature',
            'visibility', 'windBearing', 'windSpeed', 'hour',
            'weekday', 'is_holiday', 'is_weekend', 'is_weekend_or_holiday']

#load stations
print("Loading Station data...")
stations_df = pd.read_csv('../data/modelInput/stations_201505_201611.csv')
stations_df = stations_df.rename(columns={
    'station_name': 'name',
    'station_id': 'id'
})
stations_df['first_used'] = stations_df['first_used'].apply(pd.Timestamp)
stations_df['last_used'] = stations_df['last_used'].apply(pd.Timestamp)
station_ids = stations_df['id'].unique()

#load models
print("Loading models...")
departures_model = xgb.Booster(model_file='../models/boosterDepartures.xgbm')
arrivals_model = xgb.Booster(model_file='../models/boosterArrivals.xgbm')

#load additional features
print("Loading additional features...")
additional_features_df = pd.read_csv('../data/modelInput/additionalFeatures.csv')
additional_features_df['date_hour'] = additional_features_df['date_hour'].apply(pd.Timestamp)
additional_features_df = additional_features_df.set_index('date_hour')
additional_features_df = additional_features_df.tz_localize(None)

#create empty dataframe to cache predictions
predictions_cache = pd.DataFrame([], columns=['date_hour',
                                              'station_id',
                                              'arrivals',
                                              'departures',
                                              'flow'])
predictions_cache = predictions_cache.set_index('date_hour')

#load the actual flow data for comparison
print("Loading historical data...")
station_history_df = pd.read_csv('../data/modelInput/flowPerHourAndStation.csv')
station_history_df['date_hour'] = station_history_df['date_hour'].apply(pd.Timestamp)
station_history_df = station_history_df.set_index('date_hour')

def get_predictions(timestamp_start, timestamp_end):
    global predictions_cache
    
    #if possible, use predictions from cache 
    trips = predictions_cache[timestamp_start:timestamp_end]
    if (trips.shape[0] > 0):
        return trips

    #create index from the Cartesian product of station ids and timestamps for the 24 hours of the requested day
    date_hours = pd.date_range(timestamp_start, timestamp_end, freq='H')
    station_time_index = pd.MultiIndex.from_product([date_hours, station_ids], names=['date_hour', 'station_id'])
    station_time_df = pd.DataFrame({'arrivals': 0, 'departures': 0}, index=station_time_index)
    station_time_df = station_time_df.reset_index()
    station_time_df = station_time_df.set_index('date_hour')

    #join weather and holiday data
    model_data = station_time_df.merge(additional_features_df, how='left', left_index=True, right_index=True)

    #join latitude and longitude from station data
    model_data = model_data.reset_index()
    model_data = model_data.merge(stations_df[['id', 'latitude_pca', 'longitude_pca']], how='left', left_on='station_id', right_on='id')
    model_data = model_data.set_index('date_hour')

    #make predictions
    x_model_data = xgb.DMatrix(model_data[features])
    model_data['departures'] = departures_model.predict(x_model_data)
    model_data['arrivals'] = arrivals_model.predict(x_model_data)
    model_data = model_data.reset_index()

    #add predicted arrivals and departures to cache and return them 
    trips = model_data[['date_hour', 'station_id', 'arrivals', 'departures']]
    trips = trips.round({'arrivals': 0, 'departures': 0})
    trips['flow'] = trips['arrivals'] - trips['departures']
    trips = trips.set_index('date_hour')

    predictions_cache = predictions_cache.append(trips)
    predictions_cache = predictions_cache.sort_index()
    return trips

@app.route("/")
def index():
    return app.send_static_file('index.html')

@app.route('/resources/<path:path>')
def send_resource(path):
    return send_from_directory('static/dist', path)

@app.route('/packages/<path:path>')
def send_package(path):
    return send_from_directory('node_modules', path)

#fetch numbers for a single station and date
@app.route('/stationData', methods=["POST"])
def station_data():
    if request.method == "POST":
        json_dict = request.get_json()

        #retrieve requested station id and date
        stationId = int(json_dict['stationId'])
        timestamp = pd.Timestamp(json_dict['timestamp'], tz='UTC')

        timestamp_start = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 0)
        timestamp_end = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 23)
        
        #real historical data
        real_df = station_history_df[timestamp_start:timestamp_end]
        real_df = real_df.reset_index()
        real_df = real_df[real_df['station_id'] == stationId]
        real_df['hour'] = real_df['date_hour'].dt.hour
        real_df = real_df.set_index('hour')

        #get predictions
        predictions_df = get_predictions(timestamp_start, timestamp_end)
        predictions_df = predictions_df.reset_index()
        predictions_df = predictions_df[predictions_df['station_id'] == stationId]
        predictions_df['hour'] = predictions_df['date_hour'].dt.hour
        predictions_df = predictions_df.set_index('hour')

        #return real and predicted data as json
        return_json = {
            'predictionValues': predictions_df.to_json(orient='index'),
            'realValues': real_df.to_json(orient='index'),
            'maximum': {
                'arrivals': int(real_df['arrivals'].append(predictions_df['arrivals']).max()),
                'departures': int(real_df['departures'].append(predictions_df['departures']).max())
            }
        }

        return json.dumps(return_json)
    else:
        return ""

#fetch aggregated numbers for all stations for a given date
@app.route('/aggregatedData', methods=["POST"])
def aggregatedData():
    if request.method == "POST":
        json_dict = request.get_json()

        #retrievethe requested date and the event threshold 
        timestamp = pd.Timestamp(json_dict['timestamp'], tz='UTC')
        event_threshold = int(json_dict['eventThreshold'])

        timestamp_start = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 0)
        timestamp_end = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 23)
        
        #real historical data
        real_df = station_history_df[timestamp_start:timestamp_end]
        real_df = real_df.reset_index()
        real_df['hour'] = real_df['date_hour'].dt.hour

        #get predicted data
        predictions_df = get_predictions(timestamp_start, timestamp_end)
        predictions_df = predictions_df.reset_index()
        predictions_df['hour'] = predictions_df['date_hour'].dt.hour

        #aggregate real and predicted data
        aggregated_real_df = real_df.drop(['date_hour', 'station_id'], axis=1)
        aggregated_real_df = aggregated_real_df.groupby('hour').sum()

        aggregated_predictions_df = predictions_df.drop(['date_hour', 'station_id'], axis=1)
        aggregated_predictions_df = aggregated_predictions_df.groupby('hour').sum()

        #get all rows with absolute flow above the event threshold
        events_df = predictions_df[abs(predictions_df['flow']) > event_threshold]

        return_json = {
            'aggregatedRealValues': aggregated_real_df.to_json(orient='index'),
            'aggregatedPredictionValues': aggregated_predictions_df.to_json(orient='index'),
            'events': events_df.to_json(orient='records'),
            'aggregatedMaximum': {
                'arrivals': int(aggregated_predictions_df['arrivals'].append(aggregated_real_df['arrivals']).max()),
                'departures': int(aggregated_predictions_df['departures'].append(aggregated_real_df['departures']).max())
            }
        }

        return json.dumps(return_json)
    else:
        return ""

@app.route('/weather', methods=["POST"])
def weather():
    if request.method == "POST":
        json_dict = request.get_json()

        timestamp = pd.Timestamp(json_dict['timestamp'], tz='UTC')

        timestamp_start = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 0)
        timestamp_end = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 23)
        slice_df = additional_features_df[timestamp_start:timestamp_end]
        slice_df = slice_df.reset_index()
        slice_df = slice_df.set_index('hour')

        return slice_df.to_json(orient='index')
    else:
        return ""

@app.route('/stations', methods=["GET"])
def stations():
    return stations_df.set_index('id').to_json(orient='index')

if __name__ == '__main__':
    app.run()
