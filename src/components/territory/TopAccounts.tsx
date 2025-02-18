import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Building2, DollarSign, MapPin, Tag, Filter, Search, 
  ArrowUpDown, TrendingDown, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';
import type { Customer } from '../../types/customer';
import { CLASSIFICATION_COLORS } from '../../constants/map';
import { supabase, withRetry } from '../../lib/supabase';

interface TopAccountsProps {
  customers: Customer[];
  selectedClassifications: Set<string>;
  selectedTerritory?: string;
  onCustomerSelect?: (customer: Customer) => void;
}

type SortField = 'name' | 'revenue' | 'account' | 'territory' | 'change';

function TopAccounts({ 
  customers, 
  selectedClassifications, 
  selectedTerritory,
  onCustomerSelect 
}: TopAccountsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountsWithImages, setAccountsWithImages] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBusinessUnits, setShowBusinessUnits] = useState(true);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchImageCounts = async () => {
      try {
        const { data, error } = await withRetry(() => 
          supabase
            .from('customer_images')
            .select('customer_id')
            .order('customer_id')
        );

        if (error) throw error;

        if (data) {
          const customersWithImages = new Set(data.map(item => item.customer_id));
          setAccountsWithImages(customersWithImages);
        }
      } catch (error) {
        console.error('Error fetching image data:', error);
        setError('Failed to load image data');
      } finally {
        setLoading(false);
      }
    };

    fetchImageCounts();
  }, []);

  const getBusinessUnitName = (code: string): string => {
    const businessUnits: Record<string, string> = {
      'HVAC': 'HVAC Equipment & Parts',
      'PLUMB': 'Plumbing Supplies',
      'PIPE': 'Piping & Fittings',
      'TOOL': 'Tools & Equipment',
      'WELD': 'Welding Supplies',
      'ELEC': 'Electrical Supplies',
      'SAFE': 'Safety Equipment',
      'CHEM': 'Chemical Products',
      'REFR': 'Refrigeration',
      'CTRL': 'Controls & Automation'
    };

    return businessUnits[code] || code;
  };

  // Calculate current week number
  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.ceil(diff / oneWeek);
    return weekNumber;
  };

  const processedAccounts = React.useMemo(() => {
    if (!customers || customers.length === 0) {
      return [];
    }

    // Filter customers by selected classifications and territory
    const filteredCustomers = customers.filter(customer => {
      const matchesClassification = customer.account_classification && 
                                selectedClassifications.has(customer.account_classification);
      const matchesTerritory = !selectedTerritory || customer.territory === selectedTerritory;
      const matchesSearch = !searchTerm || 
        customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.account_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesClassification && matchesTerritory && matchesSearch;
    });

    // Calculate revenue for each customer
    const accountsWithRevenue = filteredCustomers.map(customer => {
      // Get 2025 YTD sales
      const ytdSales2025 = (customer.sales || []).filter(sale => 
        sale.year === 2025 && sale.comparison_type === 'YTD'
      );

      // Get 2024 YTD sales for comparison
      const ytdSales2024 = (customer.sales || []).filter(sale => 
        sale.year === 2024 && sale.comparison_type === 'YTD'
      );

      // Get 2024 total sales for business units
      const totalSales2024 = (customer.sales || []).filter(sale => 
        sale.year === 2024 && sale.comparison_type === 'FULL'
      );

      // Calculate totals
      const businessUnits: Record<string, number> = {};
      let totalRevenue2025YTD = 0;
      let totalRevenue2024YTD = 0;

      ytdSales2025.forEach(sale => {
        if (sale.sales_amount) {
          totalRevenue2025YTD += sale.sales_amount;
        }
      });

      ytdSales2024.forEach(sale => {
        if (sale.sales_amount) {
          totalRevenue2024YTD += sale.sales_amount;
        }
      });

      // Calculate business units from total 2024 sales
      totalSales2024.forEach(sale => {
        if (sale.sales_amount) {
          const category = sale.category || 'Uncategorized';
          businessUnits[category] = (businessUnits[category] || 0) + sale.sales_amount;
        }
      });

      // Calculate YTD change
      const change = totalRevenue2025YTD - totalRevenue2024YTD;
      const changePercent = totalRevenue2024YTD !== 0 
        ? (change / totalRevenue2024YTD) * 100 
        : 0;

      return {
        customer,
        totalRevenue: totalRevenue2025YTD,
        previousRevenue: totalRevenue2024YTD,
        change,
        changePercent,
        hasImages: accountsWithImages.has(customer.customer_id),
        businessUnits: Object.entries(businessUnits)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
      };
    });

    // Sort accounts
    const sortedAccounts = accountsWithRevenue.sort((a, b) => {
      switch (sortField) {
        case 'name':
          return sortDirection === 'asc'
            ? a.customer.customer_name.localeCompare(b.customer.customer_name)
            : b.customer.customer_name.localeCompare(a.customer.customer_name);
        case 'revenue':
          return sortDirection === 'asc'
            ? a.totalRevenue - b.totalRevenue
            : b.totalRevenue - a.totalRevenue;
        case 'change':
          return sortDirection === 'asc'
            ? a.changePercent - b.changePercent
            : b.changePercent - a.changePercent;
        case 'account':
          return sortDirection === 'asc'
            ? a.customer.account_number.localeCompare(b.customer.account_number)
            : b.customer.account_number.localeCompare(a.customer.account_number);
        case 'territory':
          const territoryA = a.customer.territory || '';
          const territoryB = b.customer.territory || '';
          return sortDirection === 'asc'
            ? territoryA.localeCompare(territoryB)
            : territoryB.localeCompare(territoryA);
        default:
          return 0;
      }
    });

    // Take top 20 accounts
    return sortedAccounts.slice(0, 20);
  }, [customers, selectedClassifications, selectedTerritory, accountsWithImages, sortField, sortDirection, searchTerm]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(current => current === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleAccountExpansion = (accountId: string) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
        sortField === field
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
      <ArrowUpDown className="w-4 h-4" />
    </button>
  );

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          2025 Year-to-Date Revenue by Account (YTD through Week {getCurrentWeek()})
          {selectedTerritory && (
            <span className="text-sm font-normal text-gray-500">
              ({selectedTerritory})
            </span>
          )}
        </h2>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name or account number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <SortButton field="revenue" label="Revenue" />
            <SortButton field="change" label="YTD Change" />
            <SortButton field="name" label="Name" />
            <SortButton field="account" label="Account" />
            <SortButton field="territory" label="Territory" />
          </div>
          <button
            onClick={() => setShowBusinessUnits(!showBusinessUnits)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showBusinessUnits ? 'Hide Business Units' : 'Show Business Units'}
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-500">
        Showing top {processedAccounts.length} accounts
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {processedAccounts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              No accounts found for the selected filters
            </p>
          </div>
        ) : (
          processedAccounts.map(({ customer, totalRevenue, previousRevenue, change, changePercent, businessUnits, hasImages }, index) => (
            <div
              key={customer.customer_id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
            >
              {/* Main Account Info */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => onCustomerSelect?.(customer)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {customer.customer_name}
                        </h3>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: CLASSIFICATION_COLORS[customer.account_classification as keyof typeof CLASSIFICATION_COLORS] || CLASSIFICATION_COLORS.default
                          }}
                          title={`Classification: ${customer.account_classification || 'Not Classified'}`}
                        />
                      </div>
                      <p className="text-sm text-gray-500">{customer.account_number}</p>
                      {customer.territory && (
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <p className="text-xs text-gray-500">{customer.territory}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <DollarSign className="w-4 h-4" />
                      {totalRevenue.toLocaleString()}
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Units Toggle */}
              {businessUnits.length > 0 && (
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => toggleAccountExpansion(customer.customer_id)}
                    className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>2024 Company Sales Details</span>
                    </div>
                    {expandedAccounts.has(customer.customer_id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Business Units Details */}
                  {expandedAccounts.has(customer.customer_id) && (
                    <div className="px-4 py-3 bg-gray-50 space-y-2">
                      <div className="text-sm text-gray-500 mb-2 px-3">
                        Total 2024 YTD Revenue: ${previousRevenue.toLocaleString()}
                      </div>
                      {businessUnits.map(({ category, amount }) => (
                        <div
                          key={category}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-1"
                        >
                          <span className="font-medium">{getBusinessUnitName(category)}:</span>
                          <span>${amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TopAccounts;