import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Building2, CheckSquare, Calendar, 
  MapPin, ChevronDown, ChevronUp, ArrowUpDown, Filter 
} from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Customer } from './types/customer';

type SortField = 'name' | 'date' | 'territory';

function ContactProgress() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTerritory, setSelectedTerritory] = useState<string>('');
  const [territories, setTerritories] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'introduced' | 'visited'>('all');
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
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
          contacts (
            contact_id,
            contact_name,
            role,
            phone_number,
            email
          )
        `)
        .or('introduced_myself.eq.true,visited_account.eq.true')
        .order('customer_name');

      if (error) throw error;

      if (data) {
        setCustomers(data);
        const uniqueTerritories = Array.from(
          new Set(data.map(c => c.territory).filter(Boolean))
        ).sort();
        setTerritories(uniqueTerritories);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(current => current === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleCustomerExpansion = (customerId: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  const filteredAndSortedCustomers = React.useMemo(() => {
    let filtered = [...customers];

    // Apply territory filter
    if (selectedTerritory) {
      filtered = filtered.filter(c => c.territory === selectedTerritory);
    }

    // Apply contact status filter
    if (filter === 'introduced') {
      filtered = filtered.filter(c => c.introduced_myself);
    } else if (filter === 'visited') {
      filtered = filtered.filter(c => c.visited_account);
    }

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.customer_name.toLowerCase().includes(search) ||
        c.account_number.toLowerCase().includes(search)
      );
    }

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.customer_name.localeCompare(b.customer_name);
          break;
        case 'date':
          const aDate = a.introduced_myself_at || a.visited_account_at || '';
          const bDate = b.introduced_myself_at || b.visited_account_at || '';
          comparison = aDate.localeCompare(bDate);
          break;
        case 'territory':
          comparison = (a.territory || '').localeCompare(b.territory || '');
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [customers, selectedTerritory, filter, searchTerm, sortField, sortDirection]);

  const stats = React.useMemo(() => {
    const total = customers.length;
    const introduced = customers.filter(c => c.introduced_myself).length;
    const visited = customers.filter(c => c.visited_account).length;
    return { total, introduced, visited };
  }, [customers]);

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

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Contact Progress
        </h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Total Accounts</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-green-700">Introduced</h3>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.introduced}</p>
          <p className="text-sm text-green-600 mt-1">
            {((stats.introduced / stats.total) * 100).toFixed(1)}% of accounts
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-700">Visited</h3>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.visited}</p>
          <p className="text-sm text-blue-600 mt-1">
            {((stats.visited / stats.total) * 100).toFixed(1)}% of accounts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search accounts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Territories</option>
              {territories.map((territory) => (
                <option key={territory} value={territory}>
                  {territory}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'introduced' | 'visited')}
            className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Contacts</option>
            <option value="introduced">Introduced Only</option>
            <option value="visited">Visited Only</option>
          </select>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Sort by:</span>
        <button
          onClick={() => toggleSort('name')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
            sortField === 'name'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Name
          <ArrowUpDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleSort('date')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
            sortField === 'date'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Date
          <ArrowUpDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleSort('territory')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
            sortField === 'territory'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Territory
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Customer List */}
      <div className="space-y-4">
        {filteredAndSortedCustomers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Accounts Found</h3>
            <p className="text-gray-500">
              {searchTerm
                ? "No accounts match your search criteria"
                : "No accounts have been contacted yet"}
            </p>
          </div>
        ) : (
          filteredAndSortedCustomers.map((customer) => (
            <div
              key={customer.customer_id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleCustomerExpansion(customer.customer_id)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {customer.customer_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {customer.account_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {customer.territory && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        {customer.territory}
                      </div>
                    )}
                    {expandedCustomers.has(customer.customer_id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              {expandedCustomers.has(customer.customer_id) && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Introduction Status */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Introduction Status</h4>
                      {customer.introduced_myself ? (
                        <div className="bg-green-50 text-green-700 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4" />
                            <span className="font-medium">Introduced</span>
                          </div>
                          {customer.introduced_myself_at && (
                            <div className="flex items-center gap-1 mt-1 text-sm">
                              <Calendar className="w-4 h-4" />
                              {new Date(customer.introduced_myself_at).toLocaleDateString()}
                            </div>
                          )}
                          {customer.introduced_myself_by && (
                            <p className="text-sm mt-1">By: {customer.introduced_myself_by}</p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-600 rounded-lg p-3">
                          Not yet introduced
                        </div>
                      )}
                    </div>

                    {/* Visit Status */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Visit Status</h4>
                      {customer.visited_account ? (
                        <div className="bg-blue-50 text-blue-700 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4" />
                            <span className="font-medium">Visited</span>
                          </div>
                          {customer.visited_account_at && (
                            <div className="flex items-center gap-1 mt-1 text-sm">
                              <Calendar className="w-4 h-4" />
                              {new Date(customer.visited_account_at).toLocaleDateString()}
                            </div>
                          )}
                          {customer.visited_account_by && (
                            <p className="text-sm mt-1">By: {customer.visited_account_by}</p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-600 rounded-lg p-3">
                          Not yet visited
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contacts */}
                  {customer.contacts && customer.contacts.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Contacts</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customer.contacts.map((contact) => (
                          <div
                            key={contact.contact_id}
                            className="bg-white rounded-lg border border-gray-200 p-3"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {contact.contact_name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{contact.role}</p>
                            <div className="mt-2 space-y-1 text-sm">
                              <p className="text-gray-600">{contact.phone_number}</p>
                              <p className="text-gray-600">{contact.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
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

export default ContactProgress;