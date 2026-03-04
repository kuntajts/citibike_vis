# Citi Bike Visualization

An interactive, React-based visualization tool for exploring and animating Citi Bike trip data over time. Features a dynamic map, time-based animation playback, route visualization, and real-time trip statistics.

## Features

- **Interactive Map**: Built with React and Leaflet, displaying stations and dynamically rendering bike trip routes.
- **Time-Based Animation**: Play, pause, adjust speed, and seek through daily trip data to see the flow of bikes across the city.
- **Real-Time Statistics**: See active trips, completed trips, and total distance traveled updating dynamically alongside the animation.
- **Responsive Design**: Designed to be fully usable on both desktop and mobile web views with a responsive UI overlay.
- **Route Tracking**: Tracks ongoing trips and draws animated lines between the start and end stations.
- **Data Syncing**: Built-in scripts manage daily data synchronization for dev and production builds.

## Technologies Used

- **React 19**: Frontend UI framework.
- **Vite**: Modern and fast build tool and development server.
- **Leaflet**: Interactive map rendering.
- **Chart.js**: Graphing and statistics.
- **Python**: Data processing scripts (for parsing and converting raw Citi Bike CSVs into optimized JSON).

## Project Structure

- `src/`: Main React application logic.
  - `components/`: Core UI components including `MapComponent`, `Overlay`, `Controls`, `App`, and others.
  - `hooks/`: Custom React hooks handling state, map logic, routing queues (`useStationTrips`), and data fetching (`useDailyData`).
- `scripts/`: Data syncing and background generation scripts.
  - `sync-data.js`: Automatically syncs data from `data_source` to `public/data` prior to running Vite dev or build commands.
  - `process_data.py` & `extract_stations.py`: Processing scripts to convert raw CSV dumps into usable `stations.json` and trip data models.
- `public/`: Public assets, including static processed map data (`public/data/`).
- `data_source/`: Holds the pre-computed trip JSON data sets.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Python 3.x (optional, only if you intend to reprocess the raw CSV data)

### Running the Application

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```
   This command automatically runs `scripts/sync-data.js` to copy necessary trip files into `public/data/`, then starts the Vite server. Visit the local URL provided (usually `http://localhost:5173/`) in your browser to interact with the map.

### Building for Production

To build the static files for production deployment:

```bash
npm run build
```

This runs the data sync step beforehand, then builds the application into the `dist/` folder.

## Data Processing Workflow

If you want to update the visualization with fresh data from a new `citibike-tripdata.csv` file downloaded to the `scripts/` folder:

1. **Extract Stations Data**:
   ```bash
   python3 scripts/extract_stations.py
   ```
2. **Process Trips Data**:
   ```bash
   python3 scripts/process_data.py
   ```
   _Note: This generates multiple daily `.json` trip subsets which are placed into `data_source/`._
