import csv
import json
import os
from collections import defaultdict

def ensure_dir(d):
    if not os.path.exists(d):
        os.makedirs(d)

def process_data():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    tripdata_dir = os.path.join(script_dir, 'tripdata')
    output_dir = os.path.join(script_dir, '..', 'data_source')
    
    ensure_dir(output_dir)
    
    csv_files = []
    if os.path.exists(tripdata_dir):
        for root, _, files in os.walk(tripdata_dir):
            for file in files:
                if file.endswith('.csv') and 'MACOSX' not in root:
                    csv_files.append(os.path.join(root, file))
                    
    csv_files.sort()
    
    # We will accumulate data in memory and write out at the end, or periodically.
    # Structure: daily_data["MM-DD"]["station_id"] = [trip1, trip2]
    # This keeps things straightforward.
    
    daily_data = defaultdict(lambda: defaultdict(list))
    
    for input_file in csv_files:
        print(f"Reading {input_file}...")
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    try:
                        start_time_str = row.get('started_at') or row.get('starttime')
                        stop_time_str = row.get('ended_at') or row.get('stoptime')
                        if not start_time_str or not stop_time_str: continue
                        
                        # Simple validation: ensure they look like dates and stop is after start
                        # We'll use a try-except to catch invalid formats
                        try:
                            # Try to handle both common Citibike formats
                            if '-' in start_time_str:
                                # YYYY-MM-DD HH:MM:SS
                                from datetime import datetime
                                fmt = '%Y-%m-%d %H:%M:%S'
                                if '.' in start_time_str: fmt = '%Y-%m-%d %H:%M:%S.%f'
                                start_dt = datetime.strptime(start_time_str, fmt)
                                stop_dt = datetime.strptime(stop_time_str, fmt)
                            else:
                                # M/D/YYYY HH:MM
                                from datetime import datetime
                                start_dt = datetime.strptime(start_time_str, '%m/%d/%Y %H:%M')
                                stop_dt = datetime.strptime(stop_time_str, '%m/%d/%Y %H:%M')
                            
                            if stop_dt <= start_dt:
                                continue
                        except Exception:
                            # If we can't parse it, skip it
                            continue

                        # Extract Year and MM-DD from "YYYY-MM-DD HH:MM:SS" or "M/D/YYYY HH:MM"
                        date_parts = start_time_str.split(' ')[0]
                        if '-' in date_parts:
                            parts = date_parts.split('-')
                            if len(parts) == 3:
                                y, m, d = parts
                            else:
                                continue
                        elif '/' in date_parts:
                            parts = date_parts.split('/')
                            if len(parts) == 3:
                                m, d, y = parts
                                # Zero pad
                                m = m.zfill(2)
                                d = d.zfill(2)
                            else:
                                continue
                        else:
                            continue
                            
                        # Standardize Year and MM-DD
                        year = y
                        if year != '2021':
                            continue
                            
                        mm_dd = f"{m}-{d}"
                        
                        start_station = row.get('start_station_id') or row.get('start station id')
                        end_station = row.get('end_station_id') or row.get('end station id')
                        
                        if not start_station or not end_station:
                            continue
                            
                        start_lat = float(row.get('start_lat') or row.get('start station latitude') or 0)
                        start_lng = float(row.get('start_lng') or row.get('start station longitude') or 0)
                        end_lat = float(row.get('end_lat') or row.get('end station latitude') or 0)
                        end_lng = float(row.get('end_lng') or row.get('end station longitude') or 0)
                        
                        if start_lat == 0 or end_lat == 0:
                            continue
                            
                        trip = {
                            'start': [start_lat, start_lng],
                            'end': [end_lat, end_lng],
                            'startTime': start_time_str,
                            'stopTime': stop_time_str,
                            'startStation': row.get('start_station_name') or row.get('start station name'),
                            'startStationId': start_station,
                            'endStation': row.get('end_station_name') or row.get('end station name'),
                            'endStationId': end_station
                        }
                        
                        # Add trip to daily data without any cap
                        daily_data[mm_dd][start_station].append(trip)
                            
                    except Exception:
                        continue
                        
        except Exception as e:
            print(f"Failed to process {input_file}: {e}")
            
    print(f"Finished parsing. Writing day files to {output_dir}")
    days_written = 0
    
    for mm_dd, stations_dict in daily_data.items():
        # filter out stations with very few trips to save space
        filtered_stations = {}
        for station_id, trips in stations_dict.items():
            # Demand > 5 trips for it to be an interesting origin station
            if len(trips) > 5:
                filtered_stations[station_id] = trips
                
        if not filtered_stations:
            continue
            
        day_file = os.path.join(output_dir, f"{mm_dd}.json")
        with open(day_file, 'w', encoding='utf-8') as f:
            json.dump(filtered_stations, f)
        days_written += 1
        
    print(f"Completed! Wrote {days_written} daily JSON files.")

if __name__ == "__main__":
    process_data()
