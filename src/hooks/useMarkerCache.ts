import { useState, useCallback } from 'react';
import type { Customer } from '../types/customer';

interface CachedMarker {
  lat: number;
  lng: number;
  customer: Customer;
  lastUpdated: number;
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function useMarkerCache() {
  const [cache, setCache] = useState<Map<string, CachedMarker>>(new Map());

  const getCachedMarker = useCallback((addressId: string) => {
    const marker = cache.get(addressId);
    if (!marker) return null;

    // Check if cache has expired
    if (Date.now() - marker.lastUpdated > CACHE_EXPIRY) {
      cache.delete(addressId);
      return null;
    }

    return marker;
  }, [cache]);

  const cacheMarker = useCallback((addressId: string, lat: number, lng: number, customer: Customer) => {
    setCache(prev => {
      const next = new Map(prev);
      next.set(addressId, {
        lat,
        lng,
        customer,
        lastUpdated: Date.now()
      });
      return next;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    getCachedMarker,
    cacheMarker,
    clearCache
  };
}