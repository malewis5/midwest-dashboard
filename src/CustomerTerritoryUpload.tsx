import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { supabase } from './lib/supabase';
import Papa from 'papaparse';

interface TerritoryRow {
  'Account Number': string;
  'Distance (miles)': string;
  'Territory': string;
}

function validateRow(row: TerritoryRow): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!row['Account Number']?.trim()) {
    errors.push('Account Number is required');
  }
  
  if (!row['Distance (miles)']?.trim()) {
    errors.push('Distance is required');
  } else {
    const distance = parseFloat(row['Distance (miles)']);
    if (isNaN(distance)) {
      errors.push('Distance must be a valid number');
    }
  }

  if (!row['Territory']?.trim()) {
    errors.push('Territory is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function CustomerTerritoryUpload() {
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
        const rows = results.data as TerritoryRow[];
        let successCount = 0;
        const errors: string[] = [];

        for (const [index, row] of rows.entries()) {
          try {
            console.log('Processing territory row:', row);
            
            const validation = validateRow(row);
            
            if (!validation.isValid) {
              errors.push(`Row ${index + 1} validation failed: ${validation.errors.join(', ')}`);
              continue;
            }

            // Update customer with territory and distance
            const { error: updateError } = await supabase
              .from('customers')
              .update({
                territory: row['Territory'],
                distance_from_branch: parseFloat(row['Distance (miles)'])
              })
              .eq('account_number', row['Account Number']);

            if (updateError) {
              throw updateError;
            }

            successCount++;
          } catch (error) {
            errors.push(`Row ${index + 1} (${row['Account Number'] || 'Unknown'}): ${error.message}`);
          }
        }

        setResults({
          success: successCount,
          errors: errors,
        });
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
        <Users className="w-6 h-6" />
        Customer Territory Assignment
      </h1>

      <div className="space-y-6">
        {/* Required Fields Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-blue-800 font-medium mb-2">Required Fields</h3>
          <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
            <li>Account Number</li>
            <li>Distance (miles)</li>
            <li>Territory</li>
          </ul>
          <p className="text-blue-700 text-sm mt-2">
            Note: This will update existing customer records with territory and distance information.
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
              id="territoryFile"
              disabled={uploading}
            />
            <label
              htmlFor="territoryFile"
              className="cursor-pointer inline-flex flex-col items-center space-y-2"
            >
              <Upload className="w-12 h-12 text-gray-400" />
              <span className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload territory assignments CSV file'}
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
                    Successfully updated {results.success} customer records
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

export default CustomerTerritoryUpload;