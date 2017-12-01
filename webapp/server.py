from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import numpy as np
import json

app = Flask(__name__)
station_history_df = pd.read_csv('../data/modelInput/flowPerHourAndStation.csv')
station_history_df['date_hour'] = station_history_df['date_hour'].apply(pd.Timestamp)
station_history_df = station_history_df.set_index('date_hour')

weather_df = pd.read_csv('../data/raw/hourlyWeatherSummary_2015_2016.csv')
weather_df['timestamp'] = weather_df['timestamp'].apply(pd.Timestamp)
weather_df = weather_df.set_index('timestamp')

stations_df = pd.read_csv('../data/modelInput/stations.csv')
stations_df = stations_df.rename(columns={
    'station_name': 'name',
    'station_id': 'id',
    'first_used': 'begin_date',
    'last_used': 'end_date'
})
stations_df = stations_df.set_index('id')
stations_df['begin_date'] = stations_df['begin_date'].apply(pd.Timestamp)
stations_df['end_date'] = stations_df['end_date'].apply(pd.Timestamp)

#def cumulate_delta(stationId, timestamp_start, timestamp_end):
#    is_null_df = [([station_history_df['station_id'] == stationId]) & (station_history_df['cumulated_delta'].isnull())]
#    station_history_df[timestamp_start:timestamp_end][is_null_df] 

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

        timestamp_start = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 0)
        timestamp_end = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 23)

        slice_df = station_history_df[timestamp_start:timestamp_end]
        slice_df = slice_df[slice_df['station_id'] == stationId]
        slice_df = slice_df.reset_index()
        slice_df['hour'] = slice_df['date_hour'].dt.hour
        slice_df = slice_df.set_index('hour')

        return_json = {
            'values': slice_df.to_json(orient='index'),
            'maximum': {
                'in': int(slice_df['arrivals'].max()),
                'out': int(slice_df['departures'].max())
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

        timestamp_start = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 0)
        timestamp_end = pd.Timestamp(timestamp.year, timestamp.month, timestamp.day, 23)
        slice_df = station_history_df[timestamp_start:timestamp_end]
        slice_df = slice_df.reset_index()
        slice_df['hour'] = slice_df['date_hour'].dt.hour

        return_json = {}

        aggregated_df = slice_df.drop(['date_hour', 'station_id'], axis=1)
        aggregated_df = aggregated_df.groupby('hour').sum()
        return_json['aggregated'] = aggregated_df.to_json(orient='index')

        return_json['aggregatedMaximum'] = {
            'in': int(aggregated_df['arrivals'].max()),
            'out': int(aggregated_df['departures'].max())
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
        slice_df = weather_df[timestamp_start:timestamp_end]
        slice_df = slice_df.reset_index()
        slice_df['hour'] = slice_df['timestamp'].dt.hour
        slice_df = slice_df.set_index('hour')

        return slice_df.to_json(orient='index')
    else:
        return ""

@app.route('/stations', methods=["GET"])
def stations():
    return stations_df.to_json(orient='index')

if __name__ == '__main__':
    app.run()
