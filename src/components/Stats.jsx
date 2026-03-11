const Stats = ({ completedTrips, activeTrip, completedDistance }) => {
  const outgoing = activeTrip?.outgoing || 0;
  const incoming = activeTrip?.incoming || 0;

  return (
    <div className="stats-container">
      <div className="stat-box">
        <span className="stat-label">Active</span>
        <span className="stat-value">
          <span style={{ color: 'var(--primary-color)' }}>{outgoing}</span>
          <span style={{ margin: '0 4px', opacity: 0.3 }}>/</span>
          <span style={{ color: 'var(--secondary-color)' }}>{incoming}</span>
        </span>
      </div>
      <div className="stat-box">
        <span className="stat-label">Distance</span>
        <span className="stat-value">
          <span style={{ color: 'var(--primary-color)' }}>
            {(completedDistance.outgoing / 1609.34).toFixed(2)}
          </span>
          <span style={{ margin: '0 4px', opacity: 0.3 }}>/</span>
          <span style={{ color: 'var(--secondary-color)' }}>
            {(completedDistance.incoming / 1609.34).toFixed(2)}
          </span>
          <span style={{ fontSize: '0.7rem', marginLeft: '2px', opacity: 0.5 }}>
            mi
          </span>
        </span>
      </div>
      <div className="stat-box">
        <span className="stat-label">Trips</span>
        <span className="stat-value">
          <span style={{ color: 'var(--primary-color)' }}>
            {completedTrips.outgoing}
          </span>
          <span style={{ margin: '0 4px', opacity: 0.3 }}>/</span>
          <span style={{ color: 'var(--secondary-color)' }}>
            {completedTrips.incoming}
          </span>
        </span>
      </div>
    </div>
  );
};

export default Stats;
