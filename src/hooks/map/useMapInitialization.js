import { useEffect, useRef } from 'react';
import L from 'leaflet';

const TILE_LAYER_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO';

const useMapInitialization = (mapContainerRef) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current).setView([40.73, -73.99], 13);

    // Create custom panes for strict z-index layering
    map.createPane('routesPane');
    map.getPane('routesPane').style.zIndex = 410;

    map.createPane('stationsPane');
    map.getPane('stationsPane').style.zIndex = 420;

    L.tileLayer(TILE_LAYER_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapContainerRef]);

  return mapRef;
};

export default useMapInitialization;
