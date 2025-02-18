import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Building2, Plus } from 'lucide-react';
import { supabase } from './lib/supabase';
import Papa from 'papaparse';
import CustomerModal from './components/modals/CustomerModal';

interface CsvRow {
  'Account Number': string;
  'PHOCAS ID'?: string;
  'Customer Name'?: string;
  'Address'?: string;
  'City'?: string;
  'State'?: string;
  'Zip Code'?: string;
  'CONTACTS'?: string;
  'Title'?: string;
  'PHONE #'?: string;
  'EMAIL'?: string;
  'Account Classifications'?: string;
}

function validateAccountNumber(accountNumber: string): boolean {
  return /^10-\d{7}$/.test(accountNumber.trim());
}

function validateClassification(classification?: string): boolean {
  if (!classification) return true; // Optional field
  return ['A', 'B', 'B+', 'C'].includes(classification.trim().toUpperCase());
}

function validateRow(row: CsvRow, headers: string[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Account Number is always required
  if (!row['Account Number']?.trim()) {
    errors.push('Account Number is required');
  } else if (!validateAccountNumber(row['Account Number'])) {
    errors.push('Account Number must be in format "10-XXXXXXX" where X is a digit');
  }

  // Only validate fields that are present in the CSV
  if (headers.includes('Customer Name') && !row['Customer Name']?.trim()) {
    errors.push('Customer Name is required');
  }
  if (headers.includes('Address') && !row['Address']?.trim()) {
    errors.push('Address is required');
  }
  if (headers.includes('City') && !row['City']?.trim()) {
    errors.push('City is required');
  }
  if (headers.includes('State') && !row['State']?.trim()) {
    errors.push('State is required');
  }
  if (headers.includes('Zip Code') && !row['Zip Code']?.trim()) {
    errors.push('Zip Code is required');
  }

  if (headers.includes('Account Classifications') && 
      row['Account Classifications'] && 
      !validateClassification(row['Account Classifications'])) {
    errors.push('Account Classification must be A, B, B+, or C');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function cleanRow(row: CsvRow): CsvRow {
  return {
    'Account Number': row['Account Number']?.trim() || '',
    'PHOCAS ID': row['PHOCAS ID']?.trim() || '',
    'Customer Name': row['Customer Name']?.trim()?.toUpperCase(),
    'Address': row['Address']?.trim()?.toUpperCase(),
    'City': row['City']?.trim()?.toUpperCase(),
    'State': row['State']?.trim()?.toUpperCase(),
    'Zip Code': row['Zip Code']?.trim(),
    'CONTACTS': row['CONTACTS']?.trim(),
    'Title': row['Title']?.trim() || 'N/A',
    'PHONE #': row['PHONE #']?.trim(),
    'EMAIL': row['EMAIL']?.trim(),
    'Account Classifications': row['Account Classifications']?.trim()?.toUpperCase()
  };
}

function CsvUpload() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] }>({
    success: 0,
    errors: [],
  });
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const processFile = async (file: File) => {
    setUploading(true);
    setResults({ success: 0, errors: [] });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
      complete: async (results) => {
        const rows = results.data as CsvRow[];
        const headers = results.meta.fields || [];
        let successCount = 0;
        const errors: string[] = [];

        for (const [index, rawRow] of rows.entries()) {
          try {
            const row = cleanRow(rawRow);
            console.log('Processing row:', row);
            
            const validation = validateRow(row, headers);
            
            if (!validation.isValid) {
              errors.push(`Row ${index + 1} validation failed: ${validation.errors.join(', ')}`);
              continue;
            }

            // Check if customer exists
            const { data: existingCustomer, error: lookupError } = await supabase
              .from('customers')
              .select('customer_id')
              .eq('account_number', row['Account Number'])
              .single();

            if (lookupError && lookupError.code !== 'PGRST116') { // PGRST116 is "not found"
              throw lookupError;
            }

            if (existingCustomer) {
              // Update existing customer
              const updateData: any = {};
              
              // Only include fields that are present in the CSV
              if (headers.includes('Customer Name') && row['Customer Name']) {
                updateData.customer_name = row['Customer Name'];
              }
              if (headers.includes('Account Classifications')) {
                updateData.account_classification = row['Account Classifications'] || null;
              }
              if (headers.includes('PHOCAS ID')) {
                updateData.phocas_id = row['PHOCAS ID'] || null;
              }

              const { error: updateError } = await supabase
                .from('customers')
                .update(updateData)
                .eq('customer_id', existingCustomer.customer_id);

              if (updateError) throw updateError;

              // Only update address if address fields are present
              if (headers.includes('Address') && headers.includes('City') && 
                  headers.includes('State') && headers.includes('Zip Code')) {
                const { error: addressError } = await supabase
                  .from('addresses')
                  .update({
                    street: row['Address'],
                    city: row['City'],
                    state: row['State'],
                    zip_code: row['Zip Code']
                  })
                  .eq('customer_id', existingCustomer.customer_id);

                if (addressError) throw addressError;
              }

              // Only update contact if contact fields are present
              if ((headers.includes('CONTACTS') && row['CONTACTS']) || 
                  (headers.includes('EMAIL') && row['EMAIL']) || 
                  (headers.includes('PHONE #') && row['PHONE #'])) {
                const { error: contactError } = await supabase
                  .from('contacts')
                  .update({
                    contact_name: row['CONTACTS'] || 'Unknown',
                    role: row['Title'] || 'N/A',
                    phone_number: row['PHONE #'] || 'N/A',
                    email: row['EMAIL'] || `${row['Account Number']}@placeholder.com`
                  })
                  .eq('customer_id', existingCustomer.customer_id);

                if (contactError) throw contactError;
              }
            } else if (headers.includes('Customer Name')) {
              // Only create new customer if all required fields are present
              const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .insert([{
                  customer_name: row['Customer Name'],
                  customer_code: row['Account Number'],
                  account_number: row['Account Number'],
                  account_classification: row['Account Classifications'] || null,
                  phocas_id: row['PHOCAS ID'] || null
                }])
                .select()
                .single();

              if (customerError) throw customerError;

              // Insert address if address fields are present
              if (headers.includes('Address') && headers.includes('City') && 
                  headers.includes('State') && headers.includes('Zip Code')) {
                const { error: addressError } = await supabase
                  .from('addresses')
                  .insert([{
                    customer_id: customerData.customer_id,
                    street: row['Address'],
                    city: row['City'],
                    state: row['State'],
                    zip_code: row['Zip Code']
                  }]);

                if (addressError) throw addressError;
              }

              // Insert contact if contact fields are present
              if ((headers.includes('CONTACTS') && row['CONTACTS']) || 
                  (headers.includes('EMAIL') && row['EMAIL']) || 
                  (headers.includes('PHONE #') && row['PHONE #'])) {
                const { error: contactError } = await supabase
                  .from('contacts')
                  .insert([{
                    customer_id: customerData.customer_id,
                    contact_name: row['CONTACTS'] || 'Unknown',
                    role: row['Title'] || 'N/A',
                    phone_number: row['PHONE #'] || 'N/A',
                    email: row['EMAIL'] || `${row['Account Number']}@placeholder.com`
                  }]);

                if (contactError) throw contactError;
              }
            } else {
              errors.push(`Row ${index + 1}: Cannot create new customer without Customer Name`);
              continue;
            }

            successCount++;
          } catch (error) {
            errors.push(`Row ${index + 1} (${rawRow['Account Number'] || 'Unknown'}): ${error.message}`);
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Customer Data Upload
        </h1>
        <button
          onClick={() => setIsCustomerModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="space-y-6">
        {/* Required Fields Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-blue-800 font-medium mb-2">Required Fields</h3>
          <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
            <li>Account Number (format: 10-XXXXXXX)</li>
          </ul>
          <h3 className="text-blue-800 font-medium mt-4 mb-2">Optional Fields</h3>
          <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
            <li>PHOCAS ID</li>
            <li>Account Classifications (A, B, B+, or C)</li>
            <li>Customer Name (required for new customers)</li>
            <li>Address</li>
            <li>City</li>
            <li>State</li>
            <li>Zip Code</li>
            <li>CONTACTS</li>
            <li>Title</li>
            <li>PHONE #</li>
            <li>EMAIL</li>
          </ul>
          <p className="text-blue-700 text-sm mt-2">
            Note: All text will be automatically converted to uppercase. You can upload partial data
            to update specific fields for existing customers.
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
              id="csvFile"
              disabled={uploading}
            />
            <label
              htmlFor="csvFile"
              className="cursor-pointer inline-flex flex-col items-center space-y-2"
            >
              <Upload className="w-12 h-12 text-gray-400" />
              <span className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload CSV file'}
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
                    Successfully processed {results.success} records
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

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={() => {
          setIsCustomerModalOpen(false);
          setResults(prev => ({
            ...prev,
            success: prev.success + 1
          }));
        }}
      />
    </div>
  );
}

export default CsvUpload;