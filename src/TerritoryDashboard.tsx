import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Building2, DollarSign, TrendingUp, TrendingDown, 
  ArrowUpDown, Filter, Search, MapPin, Users, ChevronDown, ChevronUp,
  StickyNote, Clock, Building, Image as ImageIcon, CheckSquare
} from 'lucide-react';
import { supabase } from './lib/supabase';

interface TerritoryData {
  territory: string;
  revenue2024YTD: number;
  revenue2025YTD: number;
  changePercent: number;
  customerCount: number;
  businessUnits: {
    [key: string]: {
      revenue2024YTD: number;
      revenue2025YTD: number;
      changePercent: number;
    }
  };
}

interface CustomerNote {
  note_id: string;
  content: string;
  created_at: string;
  customers: {
    customer_name: string;
    account_number: string;
  };
}

interface CustomerImage {
  image_id: string;
  url: string;
  description: string | null;
  created_at: string;
  customers: {
    customer_name: string;
    account_number: string;
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function getPreviewText(content: string, maxLength: number = 200) {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}

function TerritoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [territoryData, setTerritoryData] = useState<TerritoryData[]>([]);
  const [recentNotes, setRecentNotes] = useState<CustomerNote[]>([]);
  const [recentImages, setRecentImages] = useState<CustomerImage[]>([]);
  const [sortField, setSortField] = useState<'revenue' | 'change' | 'customers'>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTerritories, setExpandedTerritories] = useState<Set<string>>(new Set());
  const [accountStats, setAccountStats] = useState({
    total: 0,
    introduced: 0,
    visited: 0
  });

  const fetchAccountStats = async () => {
    try {
      const { count: total } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      const { count: introduced } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('introduced_myself', true);

      const { count: visited } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('visited_account', true);

      setAccountStats({
        total: total || 0,
        introduced: introduced || 0,
        visited: visited || 0
      });
    } catch (error) {
      console.error('Error fetching account stats:', error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchTerritoryData(),
      fetchRecentNotes(),
      fetchRecentImages(),
      fetchAccountStats()
    ]);
  }, []);

  const fetchRecentImages = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_images')
        .select(`
          image_id,
          url,
          description,
          created_at,
          customers (
            customer_name,
            account_number
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentImages(data || []);
    } catch (error) {
      console.error('Error fetching recent images:', error);
    }
  };

  const fetchRecentNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .select(`
          note_id,
          content,
          created_at,
          customers (
            customer_name,
            account_number
          )
        `)
        .eq('hidden', false)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      setRecentNotes(data || []);
    } catch (error) {
      console.error('Error fetching recent notes:', error);
    }
  };

  const fetchTerritoryData = async () => {
    setLoading(true);
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          category,
          sales_amount,
          year,
          comparison_type,
          customers (
            customer_id,
            customer_name,
            territory
          )
        `)
        .or('year.eq.2025,and(year.eq.2024)')
        .eq('comparison_type', 'YTD');

      if (salesError) throw salesError;

      const territoryMap = new Map<string, TerritoryData>();

      salesData.forEach(sale => {
        if (!sale.customers?.territory) return;
        const territory = sale.customers.territory;

        if (!territoryMap.has(territory)) {
          territoryMap.set(territory, {
            territory,
            revenue2024YTD: 0,
            revenue2025YTD: 0,
            changePercent: 0,
            customerCount: 0,
            businessUnits: {}
          });
        }

        const territoryInfo = territoryMap.get(territory)!;
        const category = sale.category;

        if (!territoryInfo.businessUnits[category]) {
          territoryInfo.businessUnits[category] = {
            revenue2024YTD: 0,
            revenue2025YTD: 0,
            changePercent: 0
          };
        }

        if (sale.year === 2024) {
          territoryInfo.revenue2024YTD += sale.sales_amount;
          territoryInfo.businessUnits[category].revenue2024YTD += sale.sales_amount;
        } else if (sale.year === 2025) {
          territoryInfo.revenue2025YTD += sale.sales_amount;
          territoryInfo.businessUnits[category].revenue2025YTD += sale.sales_amount;
        }
      });

      for (const territory of territoryMap.values()) {
        territory.changePercent = territory.revenue2024YTD > 0
          ? ((territory.revenue2025YTD - territory.revenue2024YTD) / territory.revenue2024YTD) * 100
          : 0;

        for (const unit of Object.values(territory.businessUnits)) {
          unit.changePercent = unit.revenue2024YTD > 0
            ? ((unit.revenue2025YTD - unit.revenue2024YTD) / unit.revenue2024YTD) * 100
            : 0;
        }

        const { count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('territory', territory.territory);

        territory.customerCount = count || 0;
      }

      setTerritoryData(Array.from(territoryMap.values()));
    } catch (error) {
      console.error('Error fetching territory data:', error);
      setError('Failed to load territory data');
    } finally {
      setLoading(false);
    }
  };

  const sortedTerritories = React.useMemo(() => {
    let sorted = [...territoryData];
    
    if (searchTerm) {
      sorted = sorted.filter(territory => 
        territory.territory.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'revenue':
          comparison = b.revenue2025YTD - a.revenue2025YTD;
          break;
        case 'change':
          comparison = b.changePercent - a.changePercent;
          break;
        case 'customers':
          comparison = b.customerCount - a.customerCount;
          break;
      }
      return sortDirection === 'desc' ? comparison : -comparison;
    });

    return sorted;
  }, [territoryData, sortField, sortDirection, searchTerm]);

  const totals = React.useMemo(() => {
    const total = territoryData.reduce((acc, territory) => ({
      revenue2024YTD: acc.revenue2024YTD + territory.revenue2024YTD,
      revenue2025YTD: acc.revenue2025YTD + territory.revenue2025YTD,
      customerCount: acc.customerCount + territory.customerCount,
      territoryCount: acc.territoryCount + 1
    }), {
      revenue2024YTD: 0,
      revenue2025YTD: 0,
      customerCount: 0,
      territoryCount: 0
    });

    const changePercent = total.revenue2024YTD > 0
      ? ((total.revenue2025YTD - total.revenue2024YTD) / total.revenue2024YTD) * 100
      : 0;

    return { ...total, changePercent };
  }, [territoryData]);

  const toggleSort = (field: 'revenue' | 'change' | 'customers') => {
    if (sortField === field) {
      setSortDirection(current => current === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleTerritory = (territory: string) => {
    setExpandedTerritories(prev => {
      const next = new Set(prev);
      if (next.has(territory)) {
        next.delete(territory);
      } else {
        next.add(territory);
      }
      return next;
    });
  };

  const SortButton = ({ field, label }: { field: 'revenue' | 'change' | 'customers'; label: string }) => (
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
      <div className="p-8">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Territory Performance Dashboard
        </h1>
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Overall Performance Summary</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Account Status - Takes up 2 columns */}
            <div className="md:col-span-2 bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-medium text-green-700">Account Status</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-green-600 mb-1">Introduced Myself</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-green-700">{accountStats.introduced}</p>
                    <p className="text-sm text-green-600">of {accountStats.total}</p>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {((accountStats.introduced / accountStats.total) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600 mb-1">Visited Account</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-green-700">{accountStats.visited}</p>
                    <p className="text-sm text-green-600">of {accountStats.total}</p>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {((accountStats.visited / accountStats.total) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Total Territories */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-700">Territories</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totals.territoryCount}</p>
            </div>

            {/* Total Customers */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-700">Customers</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totals.customerCount}</p>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="mt-4 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-700">2025 YTD Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              ${totals.revenue2025YTD.toLocaleString()}
            </p>
            <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${
              totals.changePercent > 0 
                ? 'text-green-600' 
                : totals.changePercent < 0 
                  ? 'text-red-600' 
                  : 'text-gray-500'
            }`}>
              {totals.changePercent > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : totals.changePercent < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              {totals.changePercent > 0 ? '+' : ''}{totals.changePercent.toFixed(1)}% vs 2024
            </div>
          </div>
        </div>
      </div>

      {/* Territory Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search territories..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <SortButton field="revenue" label="Revenue" />
            <SortButton field="change" label="YTD Change" />
            <SortButton field="customers" label="Customers" />
          </div>
        </div>
      </div>

      {/* Territory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedTerritories.map(territory => (
          <div
            key={territory.territory}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
          >
            {/* Territory Header */}
            <button
              onClick={() => toggleTerritory(territory.territory)}
              className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">
                  {territory.territory}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">{territory.customerCount} customers</span>
                </div>
                {expandedTerritories.has(territory.territory) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Revenue Summary */}
            {expandedTerritories.has(territory.territory) && (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* 2024 YTD */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">2024 YTD Revenue</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${territory.revenue2024YTD.toLocaleString()}
                    </p>
                  </div>

                  {/* 2025 YTD */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-blue-600">2025 YTD Revenue</p>
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        territory.changePercent > 0 
                          ? 'text-green-600' 
                          : territory.changePercent < 0 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                      }`}>
                        {territory.changePercent > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : territory.changePercent < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        {territory.changePercent > 0 ? '+' : ''}{territory.changePercent.toFixed(1)}%
                      </div>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      ${territory.revenue2025YTD.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Business Units */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Business Unit Performance</h4>
                  {Object.entries(territory.businessUnits)
                    .sort((a, b) => b[1].revenue2025YTD - a[1].revenue2025YTD)
                    .map(([unit, data]) => (
                      <div key={unit} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{unit}</span>
                          <div className={`flex items-center gap-1 text-sm font-medium ${
                            data.changePercent > 0 
                              ? 'text-green-600' 
                              : data.changePercent < 0 
                                ? 'text-red-600' 
                                : 'text-gray-500'
                          }`}>
                            {data.changePercent > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : data.changePercent < 0 ? (
                              <TrendingDown className="w-4 h-4" />
                            ) : null}
                            {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">2024:</span>
                            <span className="font-medium text-gray-700">
                              ${data.revenue2024YTD.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">2025:</span>
                            <span className="font-medium text-gray-700">
                              ${data.revenue2025YTD.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 relative">
                          <div className="flex mb-1">
                            <div 
                              className="h-1.5 bg-gray-300 rounded-l"
                              style={{ 
                                width: `${(data.revenue2024YTD / Math.max(data.revenue2024YTD, data.revenue2025YTD)) * 100}%` 
                              }}
                            />
                            <div 
                              className="h-1.5 bg-blue-500 rounded-r"
                              style={{ 
                                width: `${(data.revenue2025YTD / Math.max(data.revenue2024YTD, data.revenue2025YTD)) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notes */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              Recent Notes
            </h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {recentNotes.length === 0 ? (
              <div className="p-6 text-center">
                <StickyNote className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No notes available</p>
              </div>
            ) : (
              recentNotes.map(note => (
                <div key={note.note_id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3 mb-2">
                    <Building className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {note.customers.customer_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {note.customers.account_number}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap mb-2">
                    {getPreviewText(note.content)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatDate(note.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Newest Customer Display Images */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Newest Customer Display Images
            </h2>
          </div>
          <div className="p-4">
            {recentImages.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No images available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {recentImages.map(image => (
                  <div key={image.image_id} className="space-y-3">
                    {/* Image */}
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={image.url}
                        alt={image.description || 'Customer image'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm leading-tight">
                            {image.customers.customer_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {image.customers.account_number}
                          </p>
                        </div>
                      </div>
                      {image.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(image.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TerritoryDashboard;