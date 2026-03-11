import { useState, useEffect, useRef, useCallback } from 'react';

// Constants
const FETCH_LOOKAHEAD_LIMIT = 10;
const RATE_LIMIT_MS = 100;
const PADDING_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Hook to manage trips and routes for a selected station.
 */
const useStationTrips = (dailyData, selectedStationId, resetAnimation) => {
  const [trips, setTrips] = useState([]);
  const [routesData, setRoutesData] = useState({});

  // Refs for data and state that don't trigger re-renders
  const routesDataRef = useRef({});
  const queuesRef = useRef({}); // Maps stationId -> [fetch items]
  const isQueueProcessingRef = useRef({}); // Maps stationId -> boolean
  const activeFetchesRef = useRef(new Set()); // Track what is currently active
  const currentStationRef = useRef(selectedStationId);

  // Helper to reset station-specific state
  const clearStationState = useCallback(() => {
    setTrips([]);
    setRoutesData({});
    routesDataRef.current = {};
    activeFetchesRef.current = new Set();
  }, []);

  // Effect to handle station changes and data loading
  useEffect(() => {
    const isFirstSelection = !currentStationRef.current;
    currentStationRef.current = selectedStationId;

    if (!dailyData || !selectedStationId || !dailyData[selectedStationId]) {
      clearStationState();
      resetAnimation(0, 0);
      return;
    }

    const stationTripsOut = dailyData[selectedStationId]
      ? dailyData[selectedStationId].map((trip) => ({
          ...trip,
          type: 'outgoing',
        }))
      : [];

    let stationTripsIn = [];
    Object.keys(dailyData).forEach((stationId) => {
      const tripsFromStation = dailyData[stationId];
      const incomingFromStation = tripsFromStation.filter(
        (trip) => String(trip.endStationId) === String(selectedStationId)
      );
      stationTripsIn = stationTripsIn.concat(
        incomingFromStation.map((trip) => ({ ...trip, type: 'incoming' }))
      );
    });

    const stationTrips = [...stationTripsOut, ...stationTripsIn];

    if (stationTrips.length > 0) {
      // Process trip timestamps
      stationTrips.forEach((trip) => {
        trip.startTimeTs = new Date(trip.startTime).getTime();
        trip.stopTimeTs = new Date(trip.stopTime).getTime();
      });

      // Sort by start time
      stationTrips.sort((a, b) => a.startTimeTs - b.startTimeTs);

      // Calculate animation range
      const firstTripStart = stationTrips[0].startTimeTs;
      const lastTripStop = stationTrips[stationTrips.length - 1].stopTimeTs;

      const dayStart = new Date(firstTripStart).setHours(0, 0, 0, 0);
      const animationStart = Math.max(firstTripStart - PADDING_MS, dayStart);
      const animationEnd = lastTripStop + PADDING_MS;

      // If it's the first station selected, start playing animation
      isFirstSelection
        ? resetAnimation(animationStart, animationEnd, true)
        : resetAnimation(animationStart, animationEnd);
    } else {
      resetAnimation(0, 0);
    }

    setTrips(stationTrips);
    setRoutesData({});
    routesDataRef.current = {};
    activeFetchesRef.current = new Set();
  }, [dailyData, selectedStationId, resetAnimation, clearStationState]);

  /**
   * Processes the fetch queue for a specific station.
   */
  const processFetchQueue = useCallback(async (stationId) => {
    if (
      isQueueProcessingRef.current[stationId] ||
      !queuesRef.current[stationId]?.length
    ) {
      return;
    }

    isQueueProcessingRef.current[stationId] = true;

    while (queuesRef.current[stationId]?.length > 0) {
      // Check if we should still be processing for this station
      if (stationId !== currentStationRef.current) break;

      const item = queuesRef.current[stationId].shift();
      if (!item) continue;

      const { key, coords } = item;
      const parts = key.split('-');
      const reverseKey = `${parts[1]}-${parts[0]}`;

      // Skip if already completed or in-flight (check both directions)
      if (routesDataRef.current[key] || routesDataRef.current[reverseKey])
        continue;

      activeFetchesRef.current.add(key);

      const url = `https://router.project-osrm.org/route/v1/bicycle/${coords.start[1]},${coords.start[0]};${coords.end[1]},${coords.end[0]}?geometries=geojson&overview=full`;

      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.code === 'Ok' && data.routes.length > 0) {
            const geometry = data.routes[0].geometry.coordinates;
            const leafletCoords = geometry.map((c) => [c[1], c[0]]);

            setRoutesData((prev) => {
              const updated = { ...prev, [key]: leafletCoords };
              routesDataRef.current = updated;
              return updated;
            });
          }
        }
      } catch (error) {
        console.error(
          'Route fetch failed for',
          key,
          'at station',
          stationId,
          error
        );
      } finally {
        activeFetchesRef.current.delete(key);
      }

      // Delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
    }

    isQueueProcessingRef.current[stationId] = false;
  }, []);

  /**
   * Refreshes the queue with priority based on the active index.
   */
  const fetchRoutesUpTo = useCallback(
    (activeIndex) => {
      if (trips.length === 0) return;

      const currentIndex = Math.max(0, activeIndex);
      const highPriority = [];
      const lowPriority = [];
      const seenKeysInBatch = new Set();

      let uniqueUpcomingCount = 0;

      // 1. High Priority: Upcoming trips (forward from current index)
      for (let i = currentIndex; i < trips.length; i++) {
        const trip = trips[i];
        if (!trip.startStationId || !trip.endStationId) continue;
        if (trip.start[0] === 0 || trip.end[0] === 0) continue;

        const pairKey = `${trip.startStationId}-${trip.endStationId}`;
        const reverseKey = `${trip.endStationId}-${trip.startStationId}`;

        if (!seenKeysInBatch.has(pairKey) && !seenKeysInBatch.has(reverseKey)) {
          seenKeysInBatch.add(pairKey);
          uniqueUpcomingCount++;

          const isAlreadyCached =
            !!routesDataRef.current[pairKey] ||
            !!routesDataRef.current[reverseKey];
          const isCurrentlyFetching =
            activeFetchesRef.current.has(pairKey) ||
            activeFetchesRef.current.has(reverseKey);

          if (!isAlreadyCached && !isCurrentlyFetching) {
            highPriority.push({
              key: pairKey,
              coords: { start: trip.start, end: trip.end },
              priority: 'high',
            });
          }
        }

        if (uniqueUpcomingCount >= FETCH_LOOKAHEAD_LIMIT) break;
      }

      // 2. Low Priority: Previous trips (backward from current index)
      for (let i = currentIndex - 1; i >= 0; i--) {
        const trip = trips[i];
        if (!trip.startStationId || !trip.endStationId) continue;
        if (trip.start[0] === 0 || trip.end[0] === 0) continue;

        const pairKey = `${trip.startStationId}-${trip.endStationId}`;
        const reverseKey = `${trip.endStationId}-${trip.startStationId}`;

        if (!seenKeysInBatch.has(pairKey) && !seenKeysInBatch.has(reverseKey)) {
          seenKeysInBatch.add(pairKey);

          const isAlreadyCached =
            !!routesDataRef.current[pairKey] ||
            !!routesDataRef.current[reverseKey];
          const isCurrentlyFetching =
            activeFetchesRef.current.has(pairKey) ||
            activeFetchesRef.current.has(reverseKey);

          if (!isAlreadyCached && !isCurrentlyFetching) {
            lowPriority.unshift({
              key: pairKey,
              coords: { start: trip.start, end: trip.end },
              priority: 'low',
            });
          }
        }
      }

      // Update queue and start processing if needed
      if (highPriority.length > 0 || lowPriority.length > 0) {
        queuesRef.current[selectedStationId] = [
          ...highPriority,
          ...lowPriority,
        ];
        processFetchQueue(selectedStationId);
      }
    },
    [trips, processFetchQueue, selectedStationId]
  );

  const getPendingRequests = useCallback(() => {
    return queuesRef.current[selectedStationId]?.length || 0;
  }, [selectedStationId]);

  const getQueueDetails = useCallback(() => {
    const queue = queuesRef.current[selectedStationId] || [];
    const inFlightItems = Array.from(activeFetchesRef.current).map((key) => ({
      key,
      priority: 'high',
    }));
    return [...inFlightItems, ...queue];
  }, [selectedStationId]);

  return {
    trips,
    routesData,
    fetchRoutesUpTo,
    getPendingRequests,
    getQueueDetails,
  };
};

export default useStationTrips;
