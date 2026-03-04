import csv
import json
import os

def extract_stations():
    stations = {}
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, 'citibike-tripdata.csv')
    output_file = os.path.join(script_dir, '..', 'src', 'stations.json')
    
    print(f"Reading {input_file}...")
    try:
        with open(input_file, 'r') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Process start station
                start_id = row['start station id']
                if start_id not in stations:
                    try:
                        stations[start_id] = {
                            "id": start_id,
                            "name": row['start station name'],
                            "lat": float(row['start station latitude']),
                            "lng": float(row['start station longitude'])
                        }
                    except ValueError:
                        continue # Skip invalid data

                # Process end station
                end_id = row['end station id']
                if end_id not in stations:
                    try:
                        stations[end_id] = {
                            "id": end_id,
                            "name": row['end station name'],
                            "lat": float(row['end station latitude']),
                            "lng": float(row['end station longitude'])
                        }
                    except ValueError:
                        continue # Skip invalid data

    except FileNotFoundError:
        print(f"Error: {input_file} not found.")
        return

    # Convert to list and sort by id (numerical)
    station_list = list(stations.values())
    station_list.sort(key=lambda x: int(x['id']))
    
    print(f"Found {len(station_list)} unique stations.")
    
    with open(output_file, 'w') as jsonfile:
        json.dump(station_list, jsonfile, indent=2)
        
    print(f"Successfully wrote to {output_file}")

if __name__ == "__main__":
    extract_stations()
