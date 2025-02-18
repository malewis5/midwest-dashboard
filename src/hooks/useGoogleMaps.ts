import { useState, useCallback, useEffect, useRef } from 'react';

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: Error | null;
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map | null) => void;
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [map, setMapInstance] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      setLoadError(null);
    } else {
      setLoadError(new Error('Google Maps not loaded'));
      setIsLoaded(false);
    }
  }, []);

  const handleMapSet = useCallback((newMap: google.maps.Map | null) => {
    if (!newMap || !window.google?.maps) {
      if (mapRef.current) {
        try {
          google.maps.event.clearInstanceListeners(mapRef.current);
        } catch (error) {
          console.warn('Error clearing map listeners:', error);
        }
      }
      mapRef.current = null;
      if (mountedRef.current) {
        setMapInstance(null);
      }
      return;
    }

    try {
      // Configure map options
      newMap.setOptions({
        gestureHandling: 'cooperative',
        maxZoom: 20,
        minZoom: 3,
        restriction: {
          latLngBounds: {
            north: 49.384358,
            south: 24.396308,
            east: -66.934570,
            west: -125.000000
          },
          strictBounds: true
        }
      });

      mapRef.current = newMap;
      
      if (mountedRef.current) {
        setMapInstance(newMap);
        setIsLoaded(true);
        setLoadError(null);
      }
    } catch (error) {
      console.error('Error configuring map:', error);
      if (mountedRef.current) {
        setLoadError(new Error('Failed to configure map'));
        setMapInstance(null);
      }
      mapRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current && window.google?.maps) {
        try {
          google.maps.event.clearInstanceListeners(mapRef.current);
          mapRef.current = null;
          if (mountedRef.current) {
            setMapInstance(null);
          }
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
      }
    };
  }, []);

  return {
    isLoaded,
    loadError,
    map,
    setMap: handleMapSet
  };
}