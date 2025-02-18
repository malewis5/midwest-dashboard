import { useCallback } from 'react';

interface GeocodeResult {
  lat: number;
  lng: number;
}

const US_BOUNDS = {
  north: 49.384358,
  south: 24.396308,
  east: -66.934570,
  west: -125.000000
};

const GEOCODING_ERRORS = {
  ZERO_RESULTS: 'No results found for address',
  OVER_QUERY_LIMIT: 'Rate limit exceeded, retrying...',
  REQUEST_DENIED: 'Geocoding request denied',
  INVALID_REQUEST: 'Invalid geocoding request',
  NOT_IN_US: 'Address must be in the United States',
  OUTSIDE_BOUNDS: 'Address coordinates outside US bounds',
  NO_GEOMETRY: 'No geometry returned from geocoder',
  INVALID_COORDS: 'Invalid coordinates returned',
  MAPS_NOT_LOADED: 'Google Maps not loaded',
  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT: 'Request timed out',
  UNKNOWN: 'Unknown geocoding error occurred'
} as const;

export function useGeocoding() {
  const geocodeAddress = useCallback(async (address: string): Promise<GeocodeResult | null> => {
    if (!window.google?.maps) {
      return null;
    }

    // Skip empty addresses
    if (!address?.trim()) {
      return null;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    // Try up to 2 times with exponential backoff
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(GEOCODING_ERRORS.TIMEOUT));
          }, 5000); // 5 second timeout

          geocoder.geocode(
            { 
              address,
              region: 'us',
              bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(US_BOUNDS.south, US_BOUNDS.west),
                new google.maps.LatLng(US_BOUNDS.north, US_BOUNDS.east)
              )
            }, 
            (results, status) => {
              clearTimeout(timeoutId);

              if (status === 'OK' && results?.[0]) {
                // Verify the result is in the US
                const isUS = results[0].address_components.some(component => 
                  component.types.includes('country') && 
                  (component.short_name === 'US' || component.short_name === 'USA')
                );

                if (!isUS) {
                  reject(new Error(GEOCODING_ERRORS.NOT_IN_US));
                  return;
                }

                resolve(results[0]);
              } else {
                reject(new Error(status));
              }
            }
          );
        });

        if (!result.geometry?.location) {
          throw new Error(GEOCODING_ERRORS.NO_GEOMETRY);
        }

        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        
        if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
          throw new Error(GEOCODING_ERRORS.INVALID_COORDS);
        }

        if (lat < US_BOUNDS.south || lat > US_BOUNDS.north || 
            lng < US_BOUNDS.west || lng > US_BOUNDS.east) {
          throw new Error(GEOCODING_ERRORS.OUTSIDE_BOUNDS);
        }

        return { lat, lng };

      } catch (error) {
        // Don't retry for permanent errors
        if (
          error.message === 'ZERO_RESULTS' ||
          error.message.includes(GEOCODING_ERRORS.NOT_IN_US) ||
          error.message.includes(GEOCODING_ERRORS.OUTSIDE_BOUNDS) ||
          error.message === 'INVALID_REQUEST'
        ) {
          return null;
        }

        // On last attempt, return null
        if (attempt === 1) {
          return null;
        }

        // For rate limits and timeouts, wait before retrying
        if (
          error.message === 'OVER_QUERY_LIMIT' ||
          error.message.includes(GEOCODING_ERRORS.TIMEOUT)
        ) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        return null;
      }
    }

    return null;
  }, []);

  return { geocodeAddress };
}