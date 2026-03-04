import { useState } from 'react';

const InfoDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button className="info-btn-floating" onClick={() => setIsOpen(true)}>
        i
      </button>
    );
  }

  return (
    <div className="info-dialog-overlay" onClick={() => setIsOpen(false)}>
      <div className="info-dialog-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={() => setIsOpen(false)}>
          &times;
        </button>
        <h2>About This Project</h2>
        <p
          style={{
            marginBottom: '15px',
            color: '#94a3b8',
            fontSize: '0.95rem',
          }}
        >
          This interactive visualization explores daily Citi Bike trips across
          New York City. Select a station on the map to see its outgoing trips
          animated over time, along with station statistics and trip history.
          The data shown corresponds to the current date and time, but from the
          year 2021.
        </p>
        <p>
          <strong>Created by:</strong> Jordan Smith
        </p>
        <p>
          <strong>Data source:</strong>{' '}
          <a
            href="https://citibikenyc.com/system-data"
            target="_blank"
          >
            Citi Bike System Data
          </a>
        </p>
        <div className="tech-stack">
          <h3>Powered By:</h3>
          <ul>
            <li>React</li>
            <li>Leaflet</li>
            <li>Chart.js</li>
            <li>OpenStreetMap</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InfoDialog;
