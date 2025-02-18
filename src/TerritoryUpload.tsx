import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Map } from 'lucide-react';
import { supabase } from './lib/supabase';
import Papa from 'papaparse';

interface TerritoryBoundary {
  'Territory': string;
  'Latitude': string;
  'Longitude': string;
}

function validateRow(row: TerritoryBoundary): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!row['Territory']?.trim()) {
    errors.push('Territory name is required');
  }
  
  if (!row['Latitude']?.trim()) {
    errors.push('Latitude is required');
  } else {
    const lat = parseFloat(row['Latitude']);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be a valid number between -90 and 90');
    }
  }

  if (!row['Longitude']?.trim()) {
    errors.push('Longitude is required');
  } else {
    const lng = parseFloat(row['Longitude']);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be a valid number between -180 and 180');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function TerritoryUpload() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] }>({
    success: 0,
    errors: [],
  });

  const processFile = async (file: File) => {
    setUploading(true);
    setResults({ success: 0, errors: [] });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
      complete: async (results) => {
        const rows = results.data as TerritoryBoundary[];
        let successCount = 0;
        const errors: string[] = [];

        try {
          // Group points by territory using a regular object
          const territoriesMap: Record<string, Array<{ lat: number; lng: number }>> = {};
          
          // Validate and group points
          rows.forEach((row, index) => {
            const validation = validateRow(row);
            if (!validation.isValid) {
              errors.push(`Row ${index + 1} validation failed: ${validation.errors.join(', ')}`);
              return;
            }

            const territory = row['Territory'].trim();
            const point = {
              lat: parseFloat(row['Latitude']),
              lng: parseFloat(row['Longitude'])
            };

            if (!territoriesMap[territory]) {
              territoriesMap[territory] = [];
            }
            territoriesMap[territory].push(point);
          });

          // Process each territory
          for (const territory of Object.keys(territoriesMap)) {
            const points = territoriesMap[territory];

            // Delete existing boundaries for this territory
            await supabase
              .from('territory_boundaries')
              .delete()
              .eq('territory_name', territory);

            // Insert new boundaries
            const { error: insertError } = await supabase
              .from('territory_boundaries')
              .insert(
                points.map((point, index) => ({
                  territory_name: territory,
                  latitude: point.lat,
                  longitude: point.lng,
                  sequence: index
                }))
              );

            if (insertError) {
              throw insertError;
            }

            successCount += points.length;
          }

          setResults({
            success: successCount,
            errors: errors,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`Error processing territories: ${message}`);
          setResults({
            success: successCount,
            errors: errors,
          });
        }

        setUploading(false);
      },
      error: (error) => {
        setResults(prev => ({
          ...prev,
          errors: [...prev.errors, `CSV parsing error: ${error.message}`]
        }));
        setUploading(false);
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <Map className="w-6 h-6" />
        Territory Boundaries Upload
      </h1>

      <div className="space-y-6">
        {/* Required Fields Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-blue-800 font-medium mb-2">Required Fields</h3>
          <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
            <li>Territory (name of the territory)</li>
            <li>Latitude (decimal degrees)</li>
            <li>Longitude (decimal degrees)</li>
          </ul>
          <p className="text-blue-700 text-sm mt-2">
            Note: Each row represents a point in the territory boundary. Points for the same territory
            will be connected in the order they appear in the file to create the boundary.
          </p>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="boundaryFile"
              disabled={uploading}
            />
            <label
              htmlFor="boundaryFile"
              className="cursor-pointer inline-flex flex-col items-center space-y-2"
            >
              <Upload className="w-12 h-12 text-gray-400" />
              <span className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload territory boundaries CSV file'}
              </span>
            </label>
          </div>
        </div>

        {/* Results Section */}
        {(results.success > 0 || results.errors.length > 0) && (
          <div className="space-y-4">
            {results.success > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-green-800 font-medium">Success</h3>
                  <p className="text-green-700 text-sm">
                    Successfully processed {results.success} boundary points
                  </p>
                </div>
              </div>
            )}

            {results.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-800 font-medium">Errors</h3>
                  <ul className="text-red-700 text-sm list-disc list-inside space-y-1 mt-2">
                    {results.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TerritoryUpload;