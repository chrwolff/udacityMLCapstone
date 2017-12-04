from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import numpy as np
import json
import xgboost as xgb

app = Flask(__name__)

#load stations and cluster/station mapping
stations_df = pd.read_csv('../data/modelInput/stations.csv')
stations_df = stations_df.rename(columns={
    'station_name': 'name',
    'station_id': 'id'
})
stations_df['first_used'] = stations_df['first_used'].apply(pd.Timestamp)
stations_df['last_used'] = stations_df['last_used'].apply(pd.Timestamp)

cluster_number = 50
with open('../models/stationClusterMap.json', 'r') as f:
    cluster_station_map = json.load(f)

#load models
departures_model = xgb.Booster(model_file='../models/boosterDepartures.xgbm')
arrivals_model = xgb.Booster(model_file='../models/boosterArrivals.xgbm')

#load additional dfeatures
additional_features_df = pd.read_csv('../data/modelInput/additionalFeatures.csv')
additional_features_df['date_hour'] = additional_features_df['date_hour'].apply(pd.Timestamp)
additional_features_df = additional_features_df.set_index('date_hour')
additional_features_df = additional_features_df.tz_localize(None)

#empty dataframe to cache predictions
predictions_cache = pd.DataFrame([], columns=['date_hour',
                                              'station_id',
                                              'arrivals',
                                              'departures',
                                              'flow'])
predictions_cache = predictions_cache.set_index('date_hour')

#station_history_df = pd.read_csv('../data/modelInput/flowPerHourAndStation.csv')
#station_history_df['date_hour'] = station_history_df['date_hour'].apply(pd.Timestamp)
#station_history_df = station_history_df.set_index('date_hour')

#stations_df = pd.read_csv('../data/modelInput/stations.csv')
#stations_df = stations_df.rename(columns={
#    'station_name': 'name',
#    'station_id': 'id',
#    'first_used': 'begin_date',
#    'last_used': 'end_date'
#})
#stations_df = stations_df.set_index('id')
#stations_df['begin_date'] = stations_df['begin_date'].apply(pd.Timestamp)
#stations_df['end_date'] = stations_df['end_date'].apply(pd.Timestamp)

#def cumulate_delta(stationId, timestamp_start, timestamp_end):
#    is_null_df = [([station_history_df['station_id'] == stationId]) & (station_history_df['cumulated_delta'].isnull())]
#    station_history_df[timestamp_start:timestamp_end][is_null_df] 

def get_predictions(timestamp):
    timestamp_start = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 0)
    timestamp_end = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 23)

    print(timestamp_start)

    global predictions_cache
    trips = predictions_cache[timestamp_start:timestamp_end]
    if (trips.shape[0] > 0):
        return trips

    clusters = np.arange(0, cluster_number)
    date_hours = pd.date_range(timestamp_start, timestamp_end, freq='H')
    cluster_time_index = pd.MultiIndex.from_product([date_hours, clusters], names=['date_hour', 'cluster_id'])
    cluster_time_df = pd.DataFrame({'arrivals': 0, 'departures': 0}, index=cluster_time_index)
    cluster_time_df = cluster_time_df.reset_index()
    cluster_time_df = cluster_time_df.set_index('date_hour')

    model_data = cluster_time_df.merge(additional_features_df, how='left', left_index=True, right_index=True)
    model_data = model_data.drop(['icon', 'precipType', 'summary', 'date', 'holiday_description'], axis=1)

    #make predictions
    x_model_data = xgb.DMatrix(model_data)
    model_data['departures'] = departures_model.predict(x_model_data)
    model_data['arrivals'] = arrivals_model.predict(x_model_data)
    model_data = model_data.reset_index()

    if (False):
        active_stations = stations_df[(stations_df['first_used'] < timestamp) & (stations_df['last_used'] > timestamp)]['id'].unique()
        weight_matrix = np.matlib.zeros((cluster_number, active_stations.size))
        for cluster_index in range(0, cluster_number):
            cluster_stations = cluster_station_map[str(cluster_index)]
            station_index = 0
            for station_id in active_stations:
                if (str(station_id) in cluster_stations):
                    weight_matrix[cluster_index, station_index] = cluster_stations[str(station_id)]
                station_index += 1

        weight_threshold = 1e-3
        inv_weight_matrix = weight_matrix.I
        trips = pd.DataFrame([], columns=['date_hour', 'station_id', 'arrivals', 'departures'])
        for cluster_index in range(0, cluster_number):
            station_index = 0
            for station_id in active_stations:
                weight = inv_weight_matrix[station_index, cluster_index]
                if(weight > weight_threshold):
                    weighted_trips = model_data[model_data['cluster_id'] == cluster_index][['date_hour', 'arrivals', 'departures']]
                    weighted_trips['arrivals'] = weighted_trips['arrivals'] * weight
                    weighted_trips['departures'] = weighted_trips['departures'] * weight
                    weighted_trips['station_id'] = station_id
                    trips = trips.append(weighted_trips)
                station_index += 1

    trips = model_data
    trips['station_id'] = 0

    #trips = trips.groupby(['date_hour', 'station_id']).sum()
    trips = trips.round()
    trips = trips.reset_index()
    trips = trips.set_index('date_hour')
    trips['flow'] = trips['arrivals'] - trips['departures']

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

@app.route('/stationHistory', methods=["POST"])
def station_history():
    if request.method == "POST":
        json_dict = request.get_json()

        stationId = int(json_dict['stationId'])
        timestamp = pd.Timestamp(json_dict['timestamp'], tz='UTC')

        #timestamp_start = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 0)
        #timestamp_end = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 23)
        #station_history_df[timestamp_start:timestamp_end]

        slice_df = get_predictions(timestamp)
        slice_df = slice_df.reset_index()
        slice_df = slice_df[slice_df['station_id'] == stationId]
        slice_df['hour'] = slice_df['date_hour'].dt.hour
        slice_df = slice_df.set_index('hour')
        print(slice_df)
        return_json = {
            'values': slice_df.to_json(orient='index'),
            'maximum': {
                'arrivals': int(slice_df['arrivals'].max()),
                'departures': int(slice_df['departures'].max())
            }
        }

        return json.dumps(return_json)
    else:
        return ""

@app.route('/events', methods=["POST"])
def events():
    if request.method == "POST":
        json_dict = request.get_json()

        timestamp = pd.Timestamp(json_dict['timestamp'], tz='UTC')
        event_threshold = int(json_dict['eventThreshold'])

        #timestamp_start = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 0)
        #timestamp_end = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 23)
        #slice_df = station_history_df[timestamp_start:timestamp_end]

        slice_df = get_predictions(timestamp)
        slice_df = slice_df.reset_index()
        slice_df['hour'] = slice_df['date_hour'].dt.hour

        return_json = {}

        aggregated_df = slice_df.drop(['date_hour', 'station_id'], axis=1)
        aggregated_df = aggregated_df.groupby('hour').sum()
        return_json['aggregated'] = aggregated_df.to_json(orient='index')

        return_json['aggregatedMaximum'] = {
            'arrivals': int(aggregated_df['arrivals'].max()),
            'departures': int(aggregated_df['departures'].max())
        }

        slice_df = slice_df[(slice_df['flow'] > event_threshold) | (slice_df['flow'] < -event_threshold)]
        return_json['events'] = slice_df.to_json(orient='records')

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
    return stations_df.to_json(orient='index')

if __name__ == '__main__':
    app.run()
