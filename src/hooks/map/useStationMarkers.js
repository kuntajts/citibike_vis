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

      // Add destination/origin stations from current trips
      trips.forEach((trip) => {
        const isIncoming = trip.type === 'incoming';
        const tripStationId = isIncoming
          ? trip.startStationId
          : trip.endStationId;
        const tripStationName = isIncoming
          ? trip.startStation
          : trip.endStation;
        const tripStationCoords = isIncoming ? trip.start : trip.end;

        const stringId = tripStationId
          ? String(tripStationId)
          : `station-${tripStationName}`;

        if (
          !stationsToRender[stringId] &&
          stringId !== String(selectedStationId)
        ) {
          stationsToRender[stringId] = {
            lat: tripStationCoords[0],
            lng: tripStationCoords[1],
            name: tripStationName,
            isDestination: !isIncoming,
            isOrigin: isIncoming,
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
            interactive: false,
          }
        : {
            fillColor: '#fff',
            color: '#666',
            radius: 3,
            fillOpacity: 0.2,
            weight: 1,
            pane: 'stationsPane',
            interactive: false,
          };

      const marker = L.circleMarker([data.lat, data.lng], style);

      const hitbox = L.circleMarker([data.lat, data.lng], {
        radius: 10,
        color: 'transparent',
        fillColor: 'transparent',
        pane: 'stationsPane',
      }).bindTooltip(data.name);

      const layerGroup = L.layerGroup([marker, hitbox]).addTo(mapRef.current);

      if (isSelected) {
        if (marker.bringToFront) marker.bringToFront();
        if (hitbox.bringToFront) hitbox.bringToFront();
        mapRef.current.panTo(marker.getLatLng());
      }

      // Allow clicking on any marker that is a valid origin in dailyData
      const originalId = stationId.startsWith('station-') ? null : stationId;
      if (originalId && dailyData[originalId]) {
        hitbox.on('click', () => {
          setSelectedStationId(String(originalId));
        });
      }

      stationMarkersRef.current[stationId] = layerGroup;
    });
  }, [dailyData, selectedStationId, trips, setSelectedStationId, mapRef]);
};

export default useStationMarkers;
