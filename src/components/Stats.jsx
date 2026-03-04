const Stats = ({ tripsCount, activeTrip, completedDistance }) => {
  // activeTrip is now an object like { message: "5 active trips" } or null
  const activeCount = activeTrip ? activeTrip.message : '0 active trips';

  return (
    <div className="stats-container">
      <div className="stat-box">
        <span className="stat-label">Active</span>
        <span className="stat-value">{activeCount.split(' ')[0]}</span>
      </div>
      <div className="stat-box">
        <span className="stat-label">Distance</span>
        <span className="stat-value">
          {(completedDistance / 1609.34).toFixed(2)} mi
        </span>
      </div>
      <div className="stat-box">
        <span className="stat-label">Trips</span>
        <span className="stat-value">{tripsCount}</span>
      </div>
    </div>
  );
};

export default Stats;
