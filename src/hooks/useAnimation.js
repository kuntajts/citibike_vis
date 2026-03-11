import { useState, useEffect, useRef, useCallback } from 'react';

const useAnimation = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(200);

  const [activeTrip, setActiveTrip] = useState(null);
  const [completedDistance, setCompletedDistance] = useState({
    outgoing: 0,
    incoming: 0,
  });
  const [completedTrips, setCompletedTrips] = useState({
    outgoing: 0,
    incoming: 0,
  });

  const requestRef = useRef();
  const previousTimeRef = useRef();
  const currentTimeRef = useRef(currentTime);
  const playbackSpeedRef = useRef(playbackSpeed);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        const step = deltaTime * playbackSpeedRef.current;

        const nextTime = currentTimeRef.current + step;
        if (nextTime >= endTime) {
          currentTimeRef.current = endTime;
          setCurrentTime(endTime);
          setIsPlaying(false);
          return;
        }
        currentTimeRef.current = nextTime;
        setCurrentTime(nextTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      previousTimeRef.current = undefined;
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, endTime]);

  const togglePlay = useCallback(() => {
    if (startTime === 0 && endTime === 0) {
      return;
    }
    const nextTime =
      currentTimeRef.current >= endTime ? startTime : currentTimeRef.current;
    currentTimeRef.current = nextTime;
    setCurrentTime(nextTime);
    setIsPlaying((prev) => !prev);
  }, [endTime, startTime, setIsPlaying]);

  const handleSeek = useCallback((time) => {
    currentTimeRef.current = time;
    setCurrentTime(time);
    setIsPlaying(false);
  }, []);

  const resetAnimation = useCallback((start, end, play = false) => {
    setIsPlaying(play);
    currentTimeRef.current = start;
    setCurrentTime(start);
    setStartTime(start);
    setEndTime(end);
    setCompletedDistance({ outgoing: 0, incoming: 0 });
    setCompletedTrips({ outgoing: 0, incoming: 0 });
    setActiveTrip(null);
  }, []);

  return {
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
  };
};

export default useAnimation;
