import React, { useState, useCallback, useEffect } from 'react';
import { useGoogleMaps } from './hooks/useGoogleMaps';
import { useTerritory } from './hooks/useTerritory';
import { useMarkers } from './hooks/useMarkers';
import { useTerritoryBoundaries } from './hooks/useTerritoryBoundaries';
import GoogleMapsLoader from './components/GoogleMapsLoader';
import CustomerDetails from './components/territory/CustomerDetails';
import TerritoryGoogleMap from './components/territory/TerritoryGoogleMap';
import MapFilters from './components/territory/MapFilters';
import LoadingProgress from './components/territory/LoadingProgress';
import TopAccounts from './components/territory/TopAccounts';
import type { Customer } from './types/customer';
import { CLASSIFICATION_COLORS } from './constants/map';

function TerritoryMap() {
  const { map, setMap } = useGoogleMaps();
  const { 
    customers, 
    territories,
    loading: dataLoading,
    setLoading: setDataLoading,
    error: dataError,
    fetchCustomersData,
    updateCustomer
  } = useTerritory();

  const {
    boundaries: territoryBoundaries,
    loading: boundariesLoading,
    error: boundariesError,
    fetchBoundaries
  } = useTerritoryBoundaries();

  const {
    markers,
    processedAccounts,
    totalAccounts,
    processCustomers
  } = useMarkers();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string>('');
  const [territoryColors] = useState<Record<string, string>>({});
  const [selectedClassifications, setSelectedClassifications] = useState<Set<string>>(new Set(['A']));
  const [initialLoad, setInitialLoad] = useState(true);
  const [processingMarkers, setProcessingMarkers] = useState(false);
  const [needsProcessing, setNeedsProcessing] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(true);

  const handleMapLoad = useCallback((newMap: google.maps.Map) => {
    setMap(newMap);
  }, [setMap]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        await Promise.all([
          fetchCustomersData(),
          fetchBoundaries()
        ]);
        setNeedsProcessing(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setDataLoading(false);
    };

    fetchData();
  }, []); // Only run once on mount

  // Process markers when needed
  useEffect(() => {
    const processData = async () => {
      if (!needsProcessing || processingMarkers || dataLoading || !customers.length) {
        return;
      }

      setProcessingMarkers(true);
      try {
        await processCustomers(
          customers,
          selectedTerritory,
          selectedClassifications
        );

        setInitialLoad(false);

        // Update map bounds
        if (map && markers.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          
          markers.forEach(marker => {
            bounds.extend({ lat: marker.lat, lng: marker.lng });
          });
          
          territoryBoundaries.forEach(territory => {
            territory.points.forEach(point => {
              bounds.extend(point);
            });
          });
          
          map.fitBounds(bounds);
        }
      } catch (error) {
        console.error('Error processing markers:', error);
      }
      setProcessingMarkers(false);
      setNeedsProcessing(false);
    };

    processData();
  }, [
    needsProcessing,
    processingMarkers,
    dataLoading,
    customers,
    selectedTerritory,
    selectedClassifications,
    map,
    markers.length,
    territoryBoundaries,
    processCustomers
  ]);

  const getMarkerIcon = useCallback((classification: string | null) => {
    const color = classification ? CLASSIFICATION_COLORS[classification] : CLASSIFICATION_COLORS.default;
    
    return {
      path: "M12 0C7.802 0 4 3.403 4 7.602 4 11.8 7.469 16.812 12 24c4.531-7.188 8-12.2 8-16.398C20 3.403 16.199 0 12 0zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z",
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 1.5,
      strokeColor: '#FFFFFF',
      scale: 1.5,
      anchor: new google.maps.Point(12, 24),
    };
  }, []);

  const handleClassificationToggle = useCallback((classification: string) => {
    setSelectedClassifications(prev => {
      const next = new Set(prev);
      if (next.has(classification)) {
        next.delete(classification);
      } else {
        next.add(classification);
      }
      return next;
    });
    setNeedsProcessing(true);
  }, []);

  const handleTerritoryChange = useCallback((territory: string) => {
    setSelectedTerritory(territory);
    setNeedsProcessing(true);
  }, []);

  const handleCustomerUpdate = async (updatedCustomer: Customer) => {
    const result = await updateCustomer(updatedCustomer.customer_id, updatedCustomer);
    if (result) {
      setSelectedCustomer(result);
    }
  };

  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    
    const location = customer.addresses[0]?.geocoded_locations?.[0];
    if (location && map) {
      map.panTo({ lat: Number(location.latitude), lng: Number(location.longitude) });
      map.setZoom(12);
    }
  }, [map]);

  const error = dataError || boundariesError;
  const loading = dataLoading || boundariesLoading;

  return (
    <div className="p-6">
      <MapFilters
        territories={territories}
        selectedTerritory={selectedTerritory}
        selectedClassifications={selectedClassifications}
        markerCount={markers.length}
        onTerritoryChange={handleTerritoryChange}
        onClassificationToggle={handleClassificationToggle}
        initialLoad={initialLoad}
        showBoundaries={showBoundaries}
        onToggleBoundaries={() => setShowBoundaries(!showBoundaries)}
      />

      {(loading || processingMarkers) && (
        <LoadingProgress
          processedAccounts={processedAccounts}
          totalAccounts={totalAccounts}
          loadingProgress={(processedAccounts / totalAccounts) * 100}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="w-full relative rounded-lg overflow-hidden">
          <GoogleMapsLoader>
            <TerritoryGoogleMap
              markers={markers}
              territoryBoundaries={territoryBoundaries}
              territoryColors={territoryColors}
              onMarkerClick={setSelectedCustomer}
              onMapLoad={handleMapLoad}
              getMarkerIcon={getMarkerIcon}
              showBoundaries={showBoundaries}
            />
          </GoogleMapsLoader>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CustomerDetails 
            customer={selectedCustomer} 
            onCustomerUpdate={handleCustomerUpdate}
          />
          <TopAccounts
            customers={customers}
            selectedClassifications={selectedClassifications}
            selectedTerritory={selectedTerritory}
            onCustomerSelect={handleCustomerSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default TerritoryMap;