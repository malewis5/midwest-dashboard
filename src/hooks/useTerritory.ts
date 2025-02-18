import { useState, useCallback } from 'react';
import { supabase, withRetry } from '../lib/supabase';
import type { Customer } from '../types/customer';
import type { TerritoryBoundary } from '../types/territory';

export function useTerritory() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [territories, setTerritories] = useState<string[]>([]);
  const [territoryBoundaries, setTerritoryBoundaries] = useState<TerritoryBoundary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTerritoryBoundaries = useCallback(async () => {
    try {
      const { data, error } = await withRetry(() => 
        supabase
          .from('territory_boundaries')
          .select('*')
          .order('territory_name, sequence')
      );

      if (error) throw error;

      if (!data || data.length === 0) {
        setTerritoryBoundaries([]);
        return [];
      }

      // Group points by territory and validate coordinates
      const boundariesMap: Record<string, Array<{ lat: number; lng: number }>> = {};
      
      data.forEach(boundary => {
        const lat = Number(boundary.latitude);
        const lng = Number(boundary.longitude);
        
        // Skip invalid coordinates silently
        if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
          return;
        }

        if (!boundariesMap[boundary.territory_name]) {
          boundariesMap[boundary.territory_name] = [];
        }
        
        boundariesMap[boundary.territory_name].push({ lat, lng });
      });

      // Convert to array of territory boundaries and validate polygon points
      const boundaries = Object.entries(boundariesMap)
        .filter(([_, points]) => points.length >= 3) // Filter out territories with insufficient points
        .map(([territory_name, points]) => ({
          territory_name,
          points
        }));

      setTerritoryBoundaries(boundaries);
      return boundaries;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch territory boundaries: ${message}`);
      return [];
    }
  }, []);

  const fetchCustomersData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          customer_id,
          customer_name,
          account_number,
          territory,
          account_classification,
          introduced_myself,
          introduced_myself_at,
          introduced_myself_by,
          visited_account,
          visited_account_at,
          visited_account_by,
          sales (
            category,
            sales_amount,
            sale_date,
            year,
            comparison_type,
            period
          ),
          addresses (
            address_id,
            street,
            city,
            state,
            zip_code,
            geocoded_locations (
              latitude,
              longitude
            )
          ),
          contacts (
            contact_id,
            contact_name,
            role,
            phone_number,
            email
          )
        `);

      if (error) throw error;

      if (!data || data.length === 0) {
        setCustomers([]);
        setTerritories([]);
        return [];
      }

      const uniqueTerritories = Array.from(new Set(data.map(customer => customer.territory).filter(Boolean)));
      setTerritories(uniqueTerritories.sort());
      setCustomers(data);

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch customers: ${message}`);
      return [];
    }
  }, []);

  const updateCustomer = useCallback(async (customerId: string, updates: Partial<Customer>) => {
    try {
      const { data, error } = await supabase.rpc('update_customer_safely', {
        p_customer_id: customerId,
        p_customer_data: updates
      });

      if (error) throw error;

      // Update the customers array with the new data
      setCustomers(prev => 
        prev.map(customer => 
          customer.customer_id === customerId 
            ? { ...customer, ...data }
            : customer
        )
      );

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to update customer: ${message}`);
      return null;
    }
  }, []);

  return {
    customers,
    setCustomers,
    territories,
    territoryBoundaries,
    loading,
    setLoading,
    error,
    setError,
    fetchTerritoryBoundaries,
    fetchCustomersData,
    updateCustomer
  };
}