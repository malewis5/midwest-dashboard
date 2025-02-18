import React, { useCallback, useMemo } from 'react';
import { GoogleMap, Marker, Polygon } from '@react-google-maps/api';
import { TERRITORY_COLORS, TERRITORY_POLYGON_OPTIONS } from '../../constants/map';
import type { Customer } from '../../types/customer';
import type { TerritoryBoundary } from '../../types/territory';

interface TerritoryGoogleMapProps {
  markers: Array<{ lat: number; lng: number; customer: Customer }>;
  territoryBoundaries: TerritoryBoundary[];
  territoryColors: Record<string, string>;
  onMarkerClick: (customer: Customer) => void;
  onMapLoad: (map: google.maps.Map) => void;
  getMarkerIcon: (classification: string | null) => google.maps.Symbol;
}

const mapContainerStyle = {
  width: '100%',
  height: '700px',
  borderRadius: '0.5rem'
};

const defaultMapOptions: google.maps.MapOptions = {
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  zoomControl: true,
  minZoom: 3,
  maxZoom: 20,
  gestureHandling: 'cooperative',
  restriction: {
    latLngBounds: {
      north: 49.384358,
      south: 24.396308,
      east: -66.934570,
      west: -125.000000
    },
    strictBounds: true
  },
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const center = {
  lat: 39.7392,
  lng: -104.9903
};

function TerritoryGoogleMap({
  markers,
  territoryBoundaries,
  territoryColors,
  onMarkerClick,
  onMapLoad,
  getMarkerIcon
}: TerritoryGoogleMapProps) {
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    if (!map) return;
    
    try {
      // Set initial bounds based on markers and territory boundaries
      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;
      
      // Add territory points to bounds first
      territoryBoundaries.forEach(territory => {
        if (territory.points && territory.points.length >= 3) {
          territory.points.forEach(point => {
            bounds.extend(point);
            hasPoints = true;
          });
        }
      });
      
      // Then add markers
      markers.forEach(marker => {
        bounds.extend({ lat: marker.lat, lng: marker.lng });
        hasPoints = true;
      });
      
      // Only fit bounds if we have points to fit
      if (hasPoints) {
        map.fitBounds(bounds);
        // Add some padding to the bounds
        const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          map.setZoom(Math.min(map.getZoom() || 7, 10));
        });
      } else {
        map.setCenter(center);
        map.setZoom(7);
      }

      onMapLoad(map);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [markers, territoryBoundaries, onMapLoad]);

  // Memoize polygon options
  const polygonOptions = useMemo(() => 
    territoryBoundaries.map(territory => ({
      ...TERRITORY_POLYGON_OPTIONS,
      fillColor: TERRITORY_COLORS[territory.territory_name as keyof typeof TERRITORY_COLORS] || TERRITORY_COLORS.default,
      strokeColor: TERRITORY_COLORS[territory.territory_name as keyof typeof TERRITORY_COLORS] || TERRITORY_COLORS.default
    })),
    [territoryBoundaries]
  );

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      options={defaultMapOptions}
      onLoad={handleMapLoad}
    >
      {/* Render Territory Polygons */}
      {territoryBoundaries.map((territory, index) => {
        if (!territory.points || territory.points.length < 3) {
          console.warn(`Territory ${territory.territory_name} has insufficient points: ${territory.points?.length || 0}`);
          return null;
        }

        return (
          <Polygon
            key={`${territory.territory_name}-${index}`}
            paths={territory.points}
            options={polygonOptions[index]}
          />
        );
      })}

      {/* Render Customer Markers */}
      {markers.map((marker, index) => (
        <Marker
          key={`${marker.customer.customer_id}-${index}`}
          position={{ lat: marker.lat, lng: marker.lng }}
          icon={getMarkerIcon(marker.customer.account_classification)}
          onClick={() => onMarkerClick(marker.customer)}
          options={{
            optimized: true,
            visible: true,
            clickable: true,
            title: marker.customer.customer_name,
            zIndex: 2
          }}
        />
      ))}
    </GoogleMap>
  );
}

export default React.memo(TerritoryGoogleMap);