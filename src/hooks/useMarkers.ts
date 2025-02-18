import { useState, useCallback } from 'react';
import type { Customer } from '../types/customer';
import { useGeocoding } from './useGeocoding';
import { useMarkerCache } from './useMarkerCache';
import { supabase } from '../lib/supabase';

interface Marker {
  lat: number;
  lng: number;
  customer: Customer;
}

const BATCH_SIZE = 50; // Process more customers per batch since we're using cache
const GEOCODING_DELAY = 500; // Reduced delay since we'll hit cache more often

export function useMarkers() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [processedAccounts, setProcessedAccounts] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const { geocodeAddress } = useGeocoding();
  const { getCachedMarker, cacheMarker } = useMarkerCache();

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const geocodeAndStoreAddress = useCallback(async (address: Customer['addresses'][0], customer: Customer) => {
    if (!window.google?.maps) {
      return null;
    }

    // Skip if address is missing required fields
    if (!address.street || !address.city || !address.state || !address.zip_code) {
      return null;
    }

    try {
      // First check cache
      const cached = getCachedMarker(address.address_id);
      if (cached) {
        return cached;
      }

      // Then check database
      if (address.geocoded_locations?.[0]) {
        const lat = Number(address.geocoded_locations[0].latitude);
        const lng = Number(address.geocoded_locations[0].longitude);
        
        // Validate coordinates
        if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
          // Cache the valid coordinates
          cacheMarker(address.address_id, lat, lng, customer);
          return { lat, lng, customer };
        }
      }

      // If not found in cache or database, geocode the address
      const addressString = `${address.street}, ${address.city}, ${address.state} ${address.zip_code}`;
      const location = await geocodeAddress(addressString);
      
      if (!location) return null;

      const { lat, lng } = location;

      // Store in database
      const { error } = await supabase.rpc('upsert_geocoded_location', {
        p_address_id: address.address_id,
        p_latitude: lat,
        p_longitude: lng
      });

      if (error) {
        console.warn('Error storing coordinates:', error);
        return null;
      }

      // Cache the new coordinates
      cacheMarker(address.address_id, lat, lng, customer);
      
      // Add delay only for newly geocoded addresses
      await delay(GEOCODING_DELAY);
      
      return { lat, lng, customer };
    } catch (error) {
      console.warn('Error processing address:', error);
      return null;
    }
  }, [geocodeAddress, getCachedMarker, cacheMarker, delay]);

  const processCustomers = useCallback(async (
    customers: Customer[],
    selectedTerritory: string,
    selectedClassifications: Set<string>
  ) => {
    if (!customers.length) return [];

    // Filter customers first to avoid unnecessary processing
    const filteredCustomers = customers.filter(customer => 
      customer.account_classification && 
      selectedClassifications.has(customer.account_classification) &&
      (!selectedTerritory || customer.territory === selectedTerritory)
    );

    setTotalAccounts(filteredCustomers.length);
    setProcessedAccounts(0);
    setMarkers([]); // Clear existing markers

    const newMarkers: Marker[] = [];
    const batches = Math.ceil(filteredCustomers.length / BATCH_SIZE);

    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, filteredCustomers.length);
      const batch = filteredCustomers.slice(start, end);

      // Process all addresses in the batch concurrently
      const batchPromises = batch.flatMap(customer =>
        customer.addresses.map(address =>
          geocodeAndStoreAddress(address, customer)
        )
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        const validMarkers = batchResults.filter((m): m is Marker => m !== null);
        
        if (validMarkers.length > 0) {
          newMarkers.push(...validMarkers);
          setMarkers(prev => [...prev, ...validMarkers]);
        }

        setProcessedAccounts(end);
      } catch (error) {
        console.warn(`Error processing batch ${i + 1}/${batches}:`, error);
        continue;
      }
    }

    return newMarkers;
  }, [geocodeAndStoreAddress]);

  return {
    markers,
    setMarkers,
    processedAccounts,
    totalAccounts,
    processCustomers
  };
}