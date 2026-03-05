import { useState } from 'react';
import Stats from './Stats';
import Controls from './Controls';
import TripsChart from './TripsChart';
import TripList from './TripList';

const Overlay = ({
  trips,
  routesData,
  fetchRoutesUpTo,
  activeTrip,
  currentTime,
  startTime,
  endTime,
  isPlaying,
  onPlayPause,
  onSeek,
  playbackSpeed,
  onSpeedChange,
  completedDistance,
  completedTrips,
  selectedStationId,
  hasData,
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  return (
    <div id="overlay">
      <header>
        <div className="header-text">
          <h1>
            Origin Station {selectedStationId ? `#${selectedStationId}` : ''}
          </h1>
          <p>
            {selectedStationId && trips.length > 0
              ? trips[0].startStation
              : hasData
                ? 'Select a station on the map'
                : 'Loading daily dataset...'}
          </p>
        </div>
        {selectedStationId && (
          <button
            className="mobile-toggle-btn"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          >
            {isMobileExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}
      </header>

      {selectedStationId && (
        <>
          <div
            className={`collapsible-content stats-section ${isMobileExpanded ? 'expanded' : ''}`}
          >
            <Stats
              tripsCount={completedTrips}
              activeTrip={activeTrip}
              completedDistance={completedDistance}
            />
          </div>

          <Controls
            trips={trips}
            currentTime={currentTime}
            startTime={startTime}
            endTime={endTime}
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            playbackSpeed={playbackSpeed}
            onSpeedChange={onSpeedChange}
          />

          <div className="desktop-content desktop-only">
            <TripsChart trips={trips} currentTime={currentTime} />

            <TripList
              trips={trips}
              routesData={routesData}
              fetchRoutesUpTo={fetchRoutesUpTo}
              currentTime={currentTime}
              onTripClick={onSeek}
              isPlaying={isPlaying}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Overlay;
