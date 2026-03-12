const Controls = ({
  trips,
  currentTime,
  startTime,
  endTime,
  isPlaying,
  onPlayPause,
  playbackSpeed,
  onSpeedChange,
}) => {
  const progress =
    startTime === endTime
      ? 0
      : (currentTime - startTime) / (endTime - startTime);
  const date = new Date(currentTime);

  return (
    <div className="controls">
      <div className="time-display">{date.toLocaleTimeString()}</div>
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        ></div>
        {trips &&
          trips.map((trip, idx) => {
            if (startTime === endTime) return null;
            const tripProgress =
              (trip.startTimeTs - startTime) / (endTime - startTime);
            if (tripProgress >= 0 && tripProgress <= 1) {
              return (
                <div
                  key={idx}
                  className="trip-start-line"
                  style={{ left: `${tripProgress * 100}%` }}
                ></div>
              );
            }
            return null;
          })}
      </div>
      <button id="play-btn" onClick={onPlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <div className="speed-control">
        <label>Speed: {playbackSpeed}x</label>
        <input
          type="range"
          min="1"
          max="5"
          value={playbackSpeed / 200}
          onChange={(e) => onSpeedChange(parseInt(e.target.value) * 200)}
        />
      </div>
    </div>
  );
};

export default Controls;
