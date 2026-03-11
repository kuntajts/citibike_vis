import { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import Overlay from './Overlay';
import useDailyData from '../hooks/useDailyData';
import useAnimation from '../hooks/useAnimation';
import useStationTrips from '../hooks/useStationTrips';
import DebugWindow from './DebugWindow';
import InfoDialog from './InfoDialog';

const App = () => {
  const [selectedStationId, setSelectedStationId] = useState(null);

  const { dailyData, isLoading } = useDailyData();

  const {
    currentTime,
    startTime,
    endTime,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    activeTrip,
    setActiveTrip,
    completedDistance,
    setCompletedDistance,
    completedTrips,
    setCompletedTrips,
    togglePlay,
    handleSeek,
    resetAnimation,
  } = useAnimation();

  const {
    trips,
    routesData,
    fetchRoutesUpTo,
    getPendingRequests,
    getQueueDetails,
  } = useStationTrips(dailyData, selectedStationId, resetAnimation);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        // Prevent toggling if the user is typing in an input
        const isInput =
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) ||
          event.target.isContentEditable;

        if (!isInput) {
          event.preventDefault();
          togglePlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  if (isLoading) {
    return (
      <div style={{ color: 'white', padding: '20px' }}>
        Loading Daily Trips Data...
      </div>
    );
  }

  return (
    <div>
      <MapComponent
        dailyData={dailyData}
        routesData={routesData}
        trips={trips}
        currentTime={currentTime}
        setCompletedDistance={setCompletedDistance}
        setCompletedTrips={setCompletedTrips}
        setActiveTrip={setActiveTrip}
        selectedStationId={selectedStationId}
        setSelectedStationId={setSelectedStationId}
      />
      <Overlay
        trips={trips}
        routesData={routesData}
        fetchRoutesUpTo={fetchRoutesUpTo}
        activeTrip={activeTrip}
        currentTime={currentTime}
        startTime={startTime}
        endTime={endTime}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
        onSeek={handleSeek}
        playbackSpeed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        completedDistance={completedDistance}
        completedTrips={completedTrips}
        selectedStationId={selectedStationId}
        hasData={!!dailyData}
      />

      {import.meta.env.DEV && selectedStationId && (
        <DebugWindow
          getPendingRequests={getPendingRequests}
          getQueueDetails={getQueueDetails}
          trips={trips}
          routesData={routesData}
          currentTime={currentTime}
        />
      )}

      <InfoDialog />
    </div>
  );
};

export default App;
