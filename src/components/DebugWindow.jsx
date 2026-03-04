import { useState, useEffect, useMemo } from 'react';

const DebugWindow = ({
  getPendingRequests,
  getQueueDetails,
  trips,
  routesData,
  currentTime,
}) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [queueDetails, setQueueDetails] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (getPendingRequests) setPendingCount(getPendingRequests());
      if (getQueueDetails) setQueueDetails([...getQueueDetails()]); // Clone to trigger render
    }, 100);
    return () => clearInterval(interval);
  }, [getPendingRequests, getQueueDetails]);

  let latestActiveIndex = -1;

  if (trips.length > 0) {
    for (let i = trips.length - 1; i >= 0; i--) {
      const trip = trips[i];
      if (currentTime >= trip.startTimeTs && currentTime <= trip.stopTimeTs) {
        latestActiveIndex = i;
        break;
      }
    }

    if (latestActiveIndex === -1) {
      for (let i = 0; i < trips.length; i++) {
        if (currentTime < trips[i].startTimeTs) {
          latestActiveIndex = i;
          break;
        }
      }
    }
  }

  // Calculate unique routes for the current station
  const uniqueRoutes = useMemo(() => {
    const pairsMap = new Map();
    trips.forEach((t) => {
      if (!t.startStationId || !t.endStationId) return;
      const key = `${t.startStationId}-${t.endStationId}`;
      if (!pairsMap.has(key)) {
        pairsMap.set(key, {
          key,
          start: t.startStationId,
          end: t.endStationId,
        });
      }
    });
    return Array.from(pairsMap.values());
  }, [trips]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        zIndex: 1000,
        pointerEvents: 'auto',
        fontSize: '13px',
        border: '1px solid #444',
        backdropFilter: 'blur(4px)',
        width: '320px',
        maxHeight: isOpen ? '400px' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isOpen ? '1px solid #444' : 'none',
          paddingBottom: isOpen ? '4px' : '0',
          marginBottom: isOpen ? '8px' : '0',
        }}
      >
        <h4
          style={{
            margin: '0',
            fontSize: '14px',
            color: '#7dd3fc',
            flexShrink: 0,
          }}
        >
          Debug View
        </h4>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>

      {isOpen && (
        <>
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                margin: '4px 0',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: '#aaa' }}>Pending Route Regs:</span>
              <strong
                style={{ color: pendingCount > 0 ? '#fbbf24' : '#a3e635' }}
              >
                {pendingCount}
              </strong>
            </div>
            <div
              style={{
                margin: '4px 0',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: '#aaa' }}>Current Trip Idx:</span>
              <strong>
                {latestActiveIndex !== -1 ? latestActiveIndex : 'None'}{' '}
                <span style={{ color: '#666' }}>/ {trips.length}</span>
              </strong>
            </div>

            {latestActiveIndex !== -1 && trips[latestActiveIndex] && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '6px',
                  backgroundColor: '#1f2937',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginBottom: '8px',
                }}
              >
                <div>
                  <strong>Active:</strong>{' '}
                  {trips[latestActiveIndex].startStationId} &rarr;{' '}
                  {trips[latestActiveIndex].endStationId}
                </div>
                <div style={{ marginTop: '2px' }}>
                  Time:{' '}
                  {new Date(
                    trips[latestActiveIndex].startTimeTs
                  ).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: '4px',
              flexShrink: 0,
              paddingBottom: '4px',
              borderBottom: '1px solid #444',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#aaa',
            }}
          >
            <span>Route</span>
            <span>Status</span>
          </div>

          <div
            style={{
              overflowY: 'auto',
              flexGrow: 1,
              marginTop: '4px',
              paddingRight: '4px',
              fontSize: '11px',
            }}
          >
            {uniqueRoutes.map((route) => {
              let statusLabel = 'Unfetched';
              let statusColor = '#6b7280'; // gray-500

              if (routesData && routesData[route.key]) {
                statusLabel = 'Completed';
                statusColor = '#10b981'; // emerald-500
              } else {
                const queuedItem = queueDetails.find(
                  (q) => q.key === route.key
                );
                if (queuedItem) {
                  if (queuedItem.priority === 'high') {
                    statusLabel = 'Pending (High)';
                    statusColor = '#ef4444'; // red-500
                  } else {
                    statusLabel = 'Pending (Low)';
                    statusColor = '#f59e0b'; // amber-500
                  }
                }
              }

              return (
                <div
                  key={route.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    borderBottom: '1px solid #333',
                  }}
                >
                  <span
                    style={{
                      color: '#d1d5db',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      maxWidth: '140px',
                    }}
                    title={`${route.start} -> ${route.end}`}
                  >
                    {route.start} &rarr; {route.end}
                  </span>
                  <span style={{ color: statusColor, fontWeight: 'bold' }}>
                    {statusLabel}
                  </span>
                </div>
              );
            })}
            {uniqueRoutes.length === 0 && (
              <div
                style={{
                  color: '#6b7280',
                  textAlign: 'center',
                  padding: '8px 0',
                }}
              >
                No routes needed
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DebugWindow;
