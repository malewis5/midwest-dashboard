import React, { useState, useEffect } from 'react';
import { 
  Upload, AlertCircle, CheckCircle2, DollarSign, Search, Building2, 
  ArrowUpDown, Calendar, Plus, TrendingUp, TrendingDown 
} from 'lucide-react';
import { supabase, withRetry } from './lib/supabase';
import Papa from 'papaparse';
import CustomerModal from './components/modals/CustomerModal';
import type { Customer } from './types/customer';

const CLASSIFICATION_COLORS = {
  'A': '#4F46E5', // Indigo
  'B': '#059669', // Emerald
  'C': '#DC2626', // Red
  'D': '#D97706', // Amber
  'default': '#6B7280' // Gray
} as const;

interface SalesRow {
  'Account Number': string;
  'Business Unit Name': string;
  'Total Current': string;
  'Total Previous': string;
}

interface SalesData {
  customer: any;
  totalRevenue2025YTD: number;
  totalRevenue2024YTD: number;
  totalRevenue2024: number;
  changePercent: number;
  businessUnits: Array<{
    category: string;
    amount: number;
  }>;
}

function validateSalesRow(row: SalesRow): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!row['Account Number']?.trim()) {
    errors.push('Account Number is required');
  }
  
  if (!row['Business Unit Name']?.trim()) {
    errors.push('Business Unit Name is required');
  }

  // Validate Total Current
  if (!row['Total Current']?.trim()) {
    errors.push('Total Current is required');
  } else {
    const value = parseFloat(row['Total Current'].replace(/[^0-9.-]+/g, ''));
    if (isNaN(value)) {
      errors.push('Total Current must be a valid number');
    }
  }

  // Validate Total Previous
  if (!row['Total Previous']?.trim()) {
    errors.push('Total Previous is required');
  } else {
    const value = parseFloat(row['Total Previous'].replace(/[^0-9.-]+/g, ''));
    if (isNaN(value)) {
      errors.push('Total Previous must be a valid number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function cleanSalesRow(row: SalesRow): SalesRow {
  return {
    'Account Number': row['Account Number']?.trim() || '',
    'Business Unit Name': row['Business Unit Name']?.trim().toUpperCase() || '',
    'Total Current': row['Total Current']?.trim() || '0',
    'Total Previous': row['Total Previous']?.trim() || '0'
  };
}

function SalesUpload() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] }>({
    success: 0,
    errors: [],
  });
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [pendingAccountNumber, setPendingAccountNumber] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, []);

  // Calculate current week number
  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.ceil(diff / oneWeek);
    return weekNumber;
  };

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const { data: salesRecords, error } = await supabase
        .from('sales')
        .select(`
          category,
          sales_amount,
          year,
          period,
          comparison_type,
          customers (
            customer_id,
            customer_name,
            account_number,
            account_classification
          )
        `)
        .or('year.eq.2025,and(year.eq.2024)');

      if (error) throw error;

      const customerMap = new Map<string, {
        customer: any;
        totalRevenue2025YTD: number;
        totalRevenue2024YTD: number;
        totalRevenue2024: number;
        businessUnits: Map<string, number>;
      }>();

      salesRecords.forEach(record => {
        if (!record.customers) return;

        const customerId = record.customers.customer_id;
        const existing = customerMap.get(customerId);

        if (existing) {
          if (record.year === 2025 && record.comparison_type === 'YTD') {
            existing.totalRevenue2025YTD += record.sales_amount;
          } else if (record.year === 2024) {
            if (record.comparison_type === 'YTD') {
              existing.totalRevenue2024YTD += record.sales_amount;
            } else if (record.comparison_type === 'FULL') {
              existing.totalRevenue2024 += record.sales_amount;
              const unitAmount = existing.businessUnits.get(record.category) || 0;
              existing.businessUnits.set(record.category, unitAmount + record.sales_amount);
            }
          }
        } else {
          const businessUnits = new Map<string, number>();
          let totalRevenue2025YTD = 0;
          let totalRevenue2024YTD = 0;
          let totalRevenue2024 = 0;

          if (record.year === 2025 && record.comparison_type === 'YTD') {
            totalRevenue2025YTD = record.sales_amount;
          } else if (record.year === 2024) {
            if (record.comparison_type === 'YTD') {
              totalRevenue2024YTD = record.sales_amount;
            } else if (record.comparison_type === 'FULL') {
              totalRevenue2024 = record.sales_amount;
              businessUnits.set(record.category, record.sales_amount);
            }
          }
          
          customerMap.set(customerId, {
            customer: record.customers,
            totalRevenue2025YTD,
            totalRevenue2024YTD,
            totalRevenue2024,
            businessUnits
          });
        }
      });

      const sortedData = Array.from(customerMap.values())
        .map(({ customer, totalRevenue2025YTD, totalRevenue2024YTD, totalRevenue2024, businessUnits }) => ({
          customer,
          totalRevenue2025YTD,
          totalRevenue2024YTD,
          totalRevenue2024,
          changePercent: totalRevenue2024YTD > 0 
            ? ((totalRevenue2025YTD - totalRevenue2024YTD) / totalRevenue2024YTD) * 100 
            : 0,
          businessUnits: Array.from(businessUnits.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
        }))
        .sort((a, b) => b.totalRevenue2025YTD - a.totalRevenue2025YTD);

      setSalesData(sortedData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchCustomers = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await withRetry(() => 
      supabase
        .from('customers')
        .select(`
          customer_id,
          customer_name,
          account_number,
          territory,
          account_classification,
          phocis_id,
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
          sales (
            sales_amount,
            category,
            sale_date,
            year,
            comparison_type,
            period
          ),
          contacts (
            contact_id,
            contact_name,
            role,
            phone_number,
            email
          )
        `)
        .or(`customer_name.ilike.%${term}%,account_number.ilike.%${term}%`)
        .limit(10)
    );

    if (error) {
      console.error('Error searching customers:', error);
      return;
    }

    setSearchResults(data);
  };

  const processFile = async (file: File) => {
    setUploading(true);
    setResults({ success: 0, errors: [] });

    const currentMonth = new Date().getMonth() + 1;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
      complete: async (results) => {
        const rows = results.data as SalesRow[];
        let successCount = 0;
        const errors: string[] = [];
        const missingCustomers = new Set<string>();

        for (const [index, rawRow] of rows.entries()) {
          try {
            const row = cleanSalesRow(rawRow);
            console.log('Processing sales row:', row);
            
            const validation = validateSalesRow(row);
            
            if (!validation.isValid) {
              errors.push(`Row ${index + 1} validation failed: ${validation.errors.join(', ')}`);
              continue;
            }

            const { data: customerData, error: customerError } = await withRetry(() => 
              supabase
                .from('customers')
                .select('customer_id')
                .eq('account_number', row['Account Number'])
                .single()
            );

            if (customerError) {
              missingCustomers.add(row['Account Number']);
              errors.push(`Row ${index + 1}: Customer with Account Number ${row['Account Number']} not found`);
              continue;
            }

            const { error: sales2025Error } = await withRetry(() => 
              supabase
                .from('sales')
                .insert([{
                  customer_id: customerData.customer_id,
                  category: row['Business Unit Name'],
                  sales_amount: parseFloat(row['Total Current'].replace(/[^0-9.-]+/g, '')),
                  sale_date: '2025-01-01',
                  year: 2025,
                  comparison_type: 'YTD',
                  period: currentMonth
                }])
            );

            if (sales2025Error) throw sales2025Error;

            const { error: sales2024Error } = await withRetry(() => 
              supabase
                .from('sales')
                .insert([{
                  customer_id: customerData.customer_id,
                  category: row['Business Unit Name'],
                  sales_amount: parseFloat(row['Total Previous'].replace(/[^0-9.-]+/g, '')),
                  sale_date: '2024-01-01',
                  year: 2024,
                  comparison_type: 'YTD',
                  period: currentMonth
                }])
            );

            if (sales2024Error) throw sales2024Error;

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
        
        if (missingCustomers.size > 0) {
          const firstMissingAccount = Array.from(missingCustomers)[0];
          setPendingAccountNumber(firstMissingAccount);
          setIsNewCustomerModalOpen(true);
        }
        
        await fetchSalesData();
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

  const handleNewCustomerSuccess = () => {
    setIsNewCustomerModalOpen(false);
    setPendingAccountNumber(null);
    fetchSalesData();
  };

  const getClassificationIcon = (classification: string | null) => {
    const color = CLASSIFICATION_COLORS[classification as keyof typeof CLASSIFICATION_COLORS] || CLASSIFICATION_COLORS.default;
    return (
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <span className="text-white font-bold">
          {classification || '?'}
        </span>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          2025 Year-to-Date Revenue by Account (YTD through Week {getCurrentWeek()})
        </h1>
        <button
          onClick={() => setIsNewCustomerModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchCustomers(e.target.value);
              }}
              placeholder="Search customers by name or account number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-200">
            {searchResults.map(customer => (
              <button
                key={customer.customer_id}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{customer.customer_name}</p>
                    <p className="text-sm text-gray-500">{customer.account_number}</p>
                  </div>
                </div>
                <span className="text-sm text-blue-600 opacity-0 group-hover:opacity-100">
                  View Details
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-blue-800 font-medium mb-2">Required Fields</h3>
          <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
            <li>Account Number</li>
            <li>Business Unit Name</li>
            <li>Total Current</li>
            <li>Total Previous</li>
          </ul>
          <p className="text-blue-700 text-sm mt-2">
            Note: This will upload year-to-date sales comparison data for both 2024 and 2025.
            The data will be marked as YTD data for the current month.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="salesFile"
              disabled={uploading}
            />
            <label
              htmlFor="salesFile"
              className="cursor-pointer inline-flex flex-col items-center space-y-2"
            >
              <Upload className="w-12 h-12 text-gray-400" />
              <span className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload sales CSV file'}
              </span>
            </label>
          </div>
        </div>

        {(results.success > 0 || results.errors.length > 0) && (
          <div className="space-y-4">
            {results.success > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-green-800 font-medium">Success</h3>
                  <p className="text-green-700 text-sm">
                    Successfully processed {results.success} sales records
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

        <div className="mt-8">
          <div className="mt-4 border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Number
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      2025 YTD Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      2024 YTD Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      YTD Change
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      2024 Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Units
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <DollarSign className="w-5 h-5 text-blue-500 animate-spin" />
                          Loading sales data...
                        </div>
                      </td>
                    </tr>
                  ) : salesData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No sales data available
                      </td>
                    </tr>
                  ) : (
                    salesData.map(({ 
                      customer, 
                      totalRevenue2025YTD, 
                      totalRevenue2024YTD,
                      totalRevenue2024,
                      changePercent, 
                      businessUnits 
                    }) => (
                      <tr 
                        key={customer.customer_id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          {getClassificationIcon(customer.account_classification)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {customer.customer_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {customer.account_number}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-semibold text-gray-900">
                            ${totalRevenue2025YTD.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-semibold text-gray-700">
                            ${totalRevenue2024YTD.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                            changePercent > 0 
                              ? 'text-green-600' 
                              : changePercent < 0 
                                ? 'text-red-600' 
                                : 'text-gray-500'
                          }`}>
                            {changePercent > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : changePercent < 0 ? (
                              <TrendingDown className="w-4 h-4" />
                            ) : null}
                            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-semibold text-blue-600">
                            ${totalRevenue2024.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {businessUnits.map(({ category, amount }) => (
                              <div 
                                key={category}
                                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-1"
                              >
                                <span className="font-medium">{category}:</span>
                                <span>${amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <CustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => {
          setIsNewCustomerModalOpen(false);
          setPendingAccountNumber(null);
        }}
        onSuccess={handleNewCustomerSuccess}
        defaultAccountNumber={pendingAccountNumber}
      />
    </div>
  );
}

export default SalesUpload;