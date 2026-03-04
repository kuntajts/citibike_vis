import { useRef, useEffect } from 'react';

const TripItem = ({ id, trip, isActive, isCompleted, hasRoute, onClick }) => {
  let statusClass = '';
  if (isActive) statusClass = 'active';
  else if (isCompleted) statusClass = 'completed';

  return (
    <div
      id={id}
      className={`trip-item ${statusClass}`}
      onClick={onClick}
      title={`${trip.startStation} -> ${trip.endStation}`}
    >
      <div className="trip-time">
        {new Date(trip.startTimeTs).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
        {(isActive || isCompleted) &&
          ` - ${new Date(trip.stopTimeTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
      </div>
      <div className="trip-details">
        <div className="trip-route">
          <span className="station end">
            {trip.endStation}{' '}
            {hasRoute && (
              <span className="route-indicator" title="Route loaded">
                🚲
              </span>
            )}
          </span>
        </div>
        <div className="trip-duration">
          {Math.round((trip.stopTimeTs - trip.startTimeTs) / 60000)} min
        </div>
      </div>
    </div>
  );
};

const TripList = ({
  trips,
  routesData,
  fetchRoutesUpTo,
  currentTime,
  onTripClick,
  isPlaying,
}) => {
  const listRef = useRef(null);
  const lastScrolledIndexRef = useRef(-1);

  // Find the latest active trip index
  let latestActiveIndex = -1;
  for (let i = trips.length - 1; i >= 0; i--) {
    const trip = trips[i];
    if (currentTime >= trip.startTimeTs && currentTime <= trip.stopTimeTs) {
      latestActiveIndex = i;
      break;
    }
  }

  // If no trip is currently active, find the closest upcoming trip
  if (latestActiveIndex === -1 && trips.length > 0) {
    for (let i = 0; i < trips.length; i++) {
      if (currentTime < trips[i].startTimeTs) {
        latestActiveIndex = i;
        break;
      }
    }
  }

  useEffect(() => {
    if (latestActiveIndex !== -1 && fetchRoutesUpTo) {
      fetchRoutesUpTo(latestActiveIndex);
    }
  }, [latestActiveIndex, fetchRoutesUpTo]);

  useEffect(() => {
    if (
      isPlaying &&
      latestActiveIndex !== -1 &&
      latestActiveIndex !== lastScrolledIndexRef.current
    ) {
      const element = document.getElementById(`trip-item-${latestActiveIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        lastScrolledIndexRef.current = latestActiveIndex;
      }
    } else if (!isPlaying) {
      lastScrolledIndexRef.current = -1;
    }
  }, [latestActiveIndex, isPlaying]);

  if (trips.length === 0) {
    return <div className="trip-list-empty">No trips</div>;
  }

  return (
    <div className="trip-list-container" ref={listRef}>
      <h3>Departing Trips</h3>
      <div className="trip-list">
        {trips.map((trip, index) => {
          const isActive =
            currentTime >= trip.startTimeTs && currentTime <= trip.stopTimeTs;
          const isCompleted = trip.stopTimeTs < currentTime;

          let hasRoute = false;
          if (trip.startStationId && trip.endStationId) {
            hasRoute =
              !!routesData[`${trip.startStationId}-${trip.endStationId}`];
          }

          return (
            <TripItem
              key={index}
              id={`trip-item-${index}`}
              trip={trip}
              isActive={isActive}
              isCompleted={isCompleted}
              hasRoute={hasRoute}
              onClick={() => {
                if (fetchRoutesUpTo) fetchRoutesUpTo(index);
                if (onTripClick) onTripClick(trip.startTimeTs);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TripList;
