import { useRef } from 'react';
import useMapInitialization from '../hooks/map/useMapInitialization';
import useStationMarkers from '../hooks/map/useStationMarkers';
import useTripAnimation from '../hooks/map/useTripAnimation';

const MapComponent = ({
  dailyData,
  routesData,
  trips,
  currentTime,
  setCompletedDistance,
  setCompletedTrips,
  setActiveTrip,
  selectedStationId,
  setSelectedStationId,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useMapInitialization(mapContainerRef);

  useStationMarkers({
    mapRef,
    dailyData,
    selectedStationId,
    trips,
    setSelectedStationId,
  });

  useTripAnimation({
    mapRef,
    trips,
    routesData,
    currentTime,
    setCompletedDistance,
    setCompletedTrips,
    setActiveTrip,
  });

  return <div id="map" ref={mapContainerRef}></div>;
};

export default MapComponent;
