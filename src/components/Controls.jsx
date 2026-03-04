const Controls = ({
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
      </div>
      <button id="play-btn" onClick={onPlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <div className="speed-control desktop-only">
        <label>Speed: {playbackSpeed}x</label>
        <input
          type="range"
          min="1"
          max="10"
          value={playbackSpeed / 200}
          onChange={(e) => onSpeedChange(parseInt(e.target.value) * 200)}
        />
      </div>
    </div>
  );
};

export default Controls;
