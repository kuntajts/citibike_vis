import { useEffect, useRef } from 'react';
import L from 'leaflet';

const useStationMarkers = ({
  mapRef,
  dailyData,
  selectedStationId,
  trips,
  setSelectedStationId,
}) => {
  const stationMarkersRef = useRef({});

  useEffect(() => {
    if (!mapRef.current || !dailyData) return;

    // Clear existing station markers
    Object.values(stationMarkersRef.current).forEach((marker) =>
      marker.remove()
    );
    stationMarkersRef.current = {};

    let stationsToRender = {};

    if (!selectedStationId) {
      // If no station is selected, show all available origins
      Object.entries(dailyData).forEach(([stationId, tripsArray]) => {
        if (!tripsArray || tripsArray.length === 0) return;

        const firstTrip = tripsArray[0];
        stationsToRender[stationId] = {
          lat: firstTrip.start[0],
          lng: firstTrip.start[1],
          name: firstTrip.startStation,
          isDestination: false,
        };
      });
    } else {
      // Add the origin station
      const tripsArray = dailyData[selectedStationId];
      if (tripsArray && tripsArray.length > 0) {
        const firstTrip = tripsArray[0];
        stationsToRender[selectedStationId] = {
          lat: firstTrip.start[0],
          lng: firstTrip.start[1],
          name: firstTrip.startStation,
          isDestination: false,
        };
      }

      // Add destination stations from current trips
      trips.forEach((trip) => {
        const endId = trip.endStationId
          ? String(trip.endStationId)
          : `dest-${trip.endStation}`;
        if (!stationsToRender[endId] && endId !== String(selectedStationId)) {
          stationsToRender[endId] = {
            lat: trip.end[0],
            lng: trip.end[1],
            name: trip.endStation,
            isDestination: true,
          };
        }
      });
    }

    Object.entries(stationsToRender).forEach(([stationId, data]) => {
      const isSelected = String(stationId) === String(selectedStationId);

      const style = isSelected
        ? {
            fillColor: '#ef4444',
            color: '#b91c1c',
            radius: 6,
            fillOpacity: 1,
            weight: 2,
            pane: 'stationsPane',
          }
        : {
            fillColor: '#fff',
            color: '#666',
            radius: 3,
            fillOpacity: 0.2,
            weight: 1,
            pane: 'stationsPane',
          };

      const marker = L.circleMarker([data.lat, data.lng], style)
        .addTo(mapRef.current)
        .bindTooltip(data.name);

      if (isSelected) {
        if (marker.bringToFront) marker.bringToFront();
        mapRef.current.panTo(marker.getLatLng());
      }

      // Allow clicking on any marker that is a valid origin in dailyData
      const originalId = stationId.startsWith('dest-') ? null : stationId;
      if (originalId && dailyData[originalId]) {
        marker.on('click', () => {
          setSelectedStationId(String(originalId));
        });
      }

      stationMarkersRef.current[stationId] = marker;
    });
  }, [dailyData, selectedStationId, trips, setSelectedStationId, mapRef]);
};

export default useStationMarkers;
