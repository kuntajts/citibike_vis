import { useEffect, useRef } from 'react';
import L from 'leaflet';

const PATH_COLOR = '#3b82f6';
const PATH_COLOR_OPACITY = 0.18;
const MARKER_COLOR = '#ef4444';

const useTripAnimation = ({
  mapRef,
  trips,
  routesData,
  currentTime,
  setCompletedDistance,
  setCompletedTrips,
  setActiveTrip,
}) => {
  const tripLayersRef = useRef({});
  const lastStateUpdateRef = useRef(0);

  // Clean up trips layers when trips prop changes
  useEffect(() => {
    Object.values(tripLayersRef.current).forEach((layers) => {
      if (layers.marker) layers.marker.remove();
      if (layers.polyline) layers.polyline.remove();
    });
    tripLayersRef.current = {};
  }, [trips]);

  // Animation Logic
  useEffect(() => {
    if (!mapRef.current || !trips.length) return;

    let activeTripsCount = 0;
    let completedTripsCount = 0;
    let totalDist = 0;

    trips.forEach((trip, index) => {
      const hasStarted = currentTime >= trip.startTimeTs;
      const isComplete = currentTime >= trip.stopTimeTs;

      if (hasStarted) {
        completedTripsCount++;
      }

      let routeCoords = null;
      if (routesData && trip.startStationId && trip.endStationId) {
        const pairKey = `${trip.startStationId}-${trip.endStationId}`;
        routeCoords = routesData[pairKey] || null;
      }
      const hasRoute = !!routeCoords;

      if (!trip.dist || trip.hasRoute !== hasRoute) {
        if (hasRoute) {
          let dist = 0;
          let segmentDistances = [];
          for (let i = 0; i < routeCoords.length - 1; i++) {
            const d = mapRef.current.distance(
              routeCoords[i],
              routeCoords[i + 1]
            );
            dist += d;
            segmentDistances.push(d);
          }
          trip.dist = dist;
          trip.segmentDistances = segmentDistances;
          trip.hasRoute = hasRoute;
        } else {
          trip.dist = mapRef.current.distance(trip.start, trip.end);
          trip.hasRoute = hasRoute;
        }
      }

      if (hasStarted && isComplete) {
        totalDist += trip.dist;

        let layers = tripLayersRef.current[index];
        const drawnPath = hasRoute ? routeCoords : [trip.start, trip.end];

        if (!layers) {
          layers = {
            polyline: L.polyline(drawnPath, {
              color: PATH_COLOR,
              weight: 2,
              opacity: PATH_COLOR_OPACITY,
              pane: 'routesPane',
            }).addTo(mapRef.current),
            isCompleted: true,
            hasRoute: hasRoute,
          };
          tripLayersRef.current[index] = layers;
        } else if (!layers.isCompleted || layers.hasRoute !== hasRoute) {
          layers.polyline.setLatLngs(drawnPath);
          layers.polyline.setStyle({ opacity: PATH_COLOR_OPACITY, weight: 2 });
          if (layers.marker) {
            layers.marker.remove();
            layers.marker = null;
          }
          layers.isCompleted = true;
          layers.hasRoute = hasRoute;
        }
      } else if (hasStarted && !isComplete) {
        activeTripsCount++;

        const totalDuration = trip.stopTimeTs - trip.startTimeTs;
        const elapsed = currentTime - trip.startTimeTs;
        const ratio = totalDuration > 0 ? elapsed / totalDuration : 1;

        let currentPos;
        let drawnPath;
        let distanceTraveled = 0;

        if (
          hasRoute &&
          trip.segmentDistances &&
          trip.segmentDistances.length > 0
        ) {
          let targetDist = trip.dist * ratio;
          distanceTraveled = targetDist;
          drawnPath = [routeCoords[0]];

          let i = 0;
          while (
            i < trip.segmentDistances.length &&
            targetDist > trip.segmentDistances[i]
          ) {
            targetDist -= trip.segmentDistances[i];
            drawnPath.push(routeCoords[i + 1]);
            i++;
          }

          if (i < trip.segmentDistances.length) {
            const segRatio =
              trip.segmentDistances[i] > 0
                ? targetDist / trip.segmentDistances[i]
                : 0;
            const p1 = routeCoords[i];
            const p2 = routeCoords[i + 1];
            currentPos = [
              p1[0] + (p2[0] - p1[0]) * segRatio,
              p1[1] + (p2[1] - p1[1]) * segRatio,
            ];
            drawnPath.push(currentPos);
          } else {
            currentPos = routeCoords[routeCoords.length - 1];
            drawnPath.push(currentPos);
          }
        } else {
          currentPos = [
            trip.start[0] + (trip.end[0] - trip.start[0]) * ratio,
            trip.start[1] + (trip.end[1] - trip.start[1]) * ratio,
          ];
          distanceTraveled = mapRef.current.distance(trip.start, currentPos);
          drawnPath = [trip.start, currentPos];
        }

        totalDist += distanceTraveled;

        let layers = tripLayersRef.current[index];
        const markerIconHtml = `<div style="background-color: ${MARKER_COLOR}; width: 100%; height: 100%; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${MARKER_COLOR};"></div>`;
        const renderBikeIcon = () => {
          return L.divIcon({
            className: 'custom-bike-icon',
            html: markerIconHtml,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });
        };

        if (!layers) {
          layers = {
            marker: L.marker(currentPos, { icon: renderBikeIcon() }).addTo(
              mapRef.current
            ),
            polyline: L.polyline(drawnPath, {
              color: PATH_COLOR,
              weight: 3,
              opacity: 0.5,
              pane: 'routesPane',
            }).addTo(mapRef.current),
            isCompleted: false,
            hasRoute: hasRoute,
          };
          tripLayersRef.current[index] = layers;
        } else {
          layers.isCompleted = false;
          layers.hasRoute = hasRoute;
          if (!layers.marker) {
            layers.marker = L.marker(currentPos, {
              icon: renderBikeIcon(),
            }).addTo(mapRef.current);
          } else {
            layers.marker.setLatLng(currentPos);
          }
          layers.polyline.setLatLngs(drawnPath);
          layers.polyline.setStyle({ opacity: 0.8, weight: 3 });
        }
      } else {
        let layers = tripLayersRef.current[index];
        if (layers) {
          if (layers.marker) layers.marker.remove();
          if (layers.polyline) layers.polyline.remove();
          delete tripLayersRef.current[index];
        }
      }
    });

    const message = `${activeTripsCount} active trips`;
    const now = Date.now();
    if (now - lastStateUpdateRef.current >= 150) {
      setActiveTrip((prev) => (prev?.message === message ? prev : { message }));
      setCompletedDistance((prev) => {
        const safeDist = totalDist || 0;
        return prev === safeDist ? prev : safeDist;
      });
      setCompletedTrips((prev) =>
        prev === completedTripsCount ? prev : completedTripsCount
      );
      lastStateUpdateRef.current = now;
    }
  }, [
    currentTime,
    trips,
    routesData,
    mapRef,
    setActiveTrip,
    setCompletedDistance,
    setCompletedTrips,
  ]);
};

export default useTripAnimation;
