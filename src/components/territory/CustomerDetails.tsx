import React, { useEffect, useState, useCallback } from 'react';
import { 
  Building2, DollarSign, MapPin, MapPinned, Image as ImageIcon, 
  Phone, Mail, UserCircle, Briefcase, ChevronDown, ChevronUp,
  Edit, Plus, Trash2, StickyNote, Calendar, TrendingUp, TrendingDown,
  ArrowRight, CheckSquare, Square
} from 'lucide-react';
import { CLASSIFICATION_COLORS } from '../../constants/map';
import type { Customer } from '../../types/customer';
import ImageUpload from '../ImageUpload';
import { supabase } from '../../lib/supabase';
import ContactModal from '../modals/ContactModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import CustomerNotes from './CustomerNotes';
import AddressModal from '../modals/AddressModal';

interface CustomerDetailsProps {
  customer: Customer | null;
  onCustomerUpdate?: (updatedCustomer: Customer) => void;
}

function CustomerDetails({ customer, onCustomerUpdate }: CustomerDetailsProps) {
  const [showImages, setShowImages] = useState(false);
  const [hasImages, setHasImages] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'contact', 'notes'])
  );
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Customer['contacts'][0] | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Customer['contacts'][0] | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [updatingIntroduction, setUpdatingIntroduction] = useState(false);
  const [updatingVisit, setUpdatingVisit] = useState(false);

  useEffect(() => {
    if (customer) {
      const checkImages = async () => {
        const { count, error } = await supabase
          .from('customer_images')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customer.customer_id);
        
        if (!error && count !== null) {
          setHasImages(count > 0);
        }
      };

      checkImages();
    }
  }, [customer]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleAddContact = () => {
    setSelectedContact(undefined);
    setIsContactModalOpen(true);
  };

  const handleEditContact = (contact: Customer['contacts'][0]) => {
    setSelectedContact(contact);
    setIsContactModalOpen(true);
  };

  const handleDeleteClick = (contact: Customer['contacts'][0]) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactToDelete.contact_id);

      if (error) throw error;

      // Fetch updated customer data
      const { data: updatedCustomer, error: refreshError } = await supabase
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
            category
          ),
          contacts (
            contact_id,
            contact_name,
            role,
            phone_number,
            email
          )
        `)
        .eq('customer_id', customer?.customer_id)
        .single();

      if (refreshError) throw refreshError;

      // Update the customer data in the parent component
      if (onCustomerUpdate && updatedCustomer) {
        onCustomerUpdate(updatedCustomer);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact. Please try again.');
    }
  };

  const handleContactSuccess = async () => {
    if (!customer) return;

    try {
      // Fetch updated customer data
      const { data: updatedCustomer, error } = await supabase
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
            category
          ),
          contacts (
            contact_id,
            contact_name,
            role,
            phone_number,
            email
          )
        `)
        .eq('customer_id', customer.customer_id)
        .single();

      if (error) throw error;

      // Update the customer data in the parent component
      if (onCustomerUpdate && updatedCustomer) {
        onCustomerUpdate(updatedCustomer);
      }
    } catch (error) {
      console.error('Error updating customer data:', error);
    }

    setIsContactModalOpen(false);
    setSelectedContact(undefined);
  };

  const handleAddressSuccess = async () => {
    if (!customer) return;

    try {
      // Fetch updated customer data
      const { data: updatedCustomer, error } = await supabase
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
        .eq('customer_id', customer.customer_id)
        .single();

      if (error) throw error;

      // Update the customer data in the parent component
      if (onCustomerUpdate && updatedCustomer) {
        onCustomerUpdate(updatedCustomer);
      }
    } catch (error) {
      console.error('Error updating customer data:', error);
    }

    setIsAddressModalOpen(false);
  };

  const handleIntroductionToggle = async () => {
    if (!customer) return;

    setUpdatingIntroduction(true);
    try {
      const newIntroducedMyself = !customer.introduced_myself;
      const { data: updatedCustomer, error } = await supabase
        .from('customers')
        .update({
          introduced_myself: newIntroducedMyself,
          introduced_myself_at: newIntroducedMyself ? new Date().toISOString() : null,
          introduced_myself_by: newIntroducedMyself ? 'Current User' : null // Replace with actual user info when available
        })
        .eq('customer_id', customer.customer_id)
        .select()
        .single();

      if (error) throw error;

      if (onCustomerUpdate && updatedCustomer) {
        onCustomerUpdate(updatedCustomer);
      }
    } catch (error) {
      console.error('Error updating introduction status:', error);
      alert('Failed to update introduction status. Please try again.');
    } finally {
      setUpdatingIntroduction(false);
    }
  };

  const handleVisitToggle = async () => {
    if (!customer) return;

    setUpdatingVisit(true);
    try {
      const newVisitedAccount = !customer.visited_account;
      const { data: updatedCustomer, error } = await supabase
        .from('customers')
        .update({
          visited_account: newVisitedAccount,
          visited_account_at: newVisitedAccount ? new Date().toISOString() : null,
          visited_account_by: newVisitedAccount ? 'Current User' : null // Replace with actual user info when available
        })
        .eq('customer_id', customer.customer_id)
        .select()
        .single();

      if (error) throw error;

      if (onCustomerUpdate && updatedCustomer) {
        onCustomerUpdate(updatedCustomer);
      }
    } catch (error) {
      console.error('Error updating visit status:', error);
      alert('Failed to update visit status. Please try again.');
    } finally {
      setUpdatingVisit(false);
    }
  };

  const calculateYTDSales = (customer: Customer | null, year: number): number => {
    if (!customer?.sales) return 0;
    return customer.sales
      .filter(sale => sale.year === year && sale.comparison_type === 'YTD')
      .reduce((sum, sale) => sum + (sale.sales_amount || 0), 0);
  };

  const calculateTotalSales = (customer: Customer | null, year: number): number => {
    if (!customer?.sales) return 0;
    return customer.sales
      .filter(sale => sale.year === year && sale.comparison_type === 'FULL')
      .reduce((sum, sale) => sum + (sale.sales_amount || 0), 0);
  };

  const calculateYTDSalesByCategory = (customer: Customer | null, year: number) => {
    if (!customer?.sales) return [];
    
    const salesByCategory: Record<string, number> = {};
    
    customer.sales
      .filter(sale => sale.year === year && sale.comparison_type === 'YTD')
      .forEach(sale => {
        const category = sale.category || 'Uncategorized';
        salesByCategory[category] = (salesByCategory[category] || 0) + (sale.sales_amount || 0);
      });

    return Object.entries(salesByCategory)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, amount]) => ({
        category,
        amount
      }));
  };

  const calculateYTDChange = (current: number, previous: number) => {
    if (previous === 0) return { amount: current, percent: current === 0 ? 0 : 100 };
    const amount = current - previous;
    const percent = (amount / previous) * 100;
    return { amount, percent };
  };

  if (!customer) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5" />
          Customer Details
        </h2>
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Selected</h3>
          <p className="text-sm text-gray-500">
            Click on a marker on the map to view customer details
          </p>
        </div>
      </div>
    );
  }

  const SectionHeader = ({ title, icon: Icon, section }: { title: string; icon: any; section: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-4 px-6 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-500" />
        <h3 className="text-base font-medium text-gray-700">{title}</h3>
      </div>
      {expandedSections.has(section) ? (
        <ChevronUp className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="border rounded-lg bg-white shadow-sm">
        <SectionHeader title="Basic Information" icon={Building2} section="basic" />
        {expandedSections.has('basic') && (
          <div className="px-6 pb-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{customer.customer_name}</h3>
                  {hasImages && (
                    <ImageIcon 
                      className="w-4 h-4 text-blue-500" 
                      title="Has uploaded images"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-500">{customer.account_number}</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: CLASSIFICATION_COLORS[customer.account_classification as keyof typeof CLASSIFICATION_COLORS] || CLASSIFICATION_COLORS.default 
                  }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {customer.account_classification || 'Not Classified'}
                </span>
              </div>
            </div>

            {/* Status Checkboxes */}
            <div className="flex items-center gap-6 mt-4">
              {/* Introduced Myself */}
              <button
                onClick={handleIntroductionToggle}
                disabled={updatingIntroduction}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                {customer.introduced_myself ? (
                  <CheckSquare className="w-5 h-5 text-green-500" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                <span>Introduced Myself</span>
              </button>

              {/* Visited Account */}
              <button
                onClick={handleVisitToggle}
                disabled={updatingVisit}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                {customer.visited_account ? (
                  <CheckSquare className="w-5 h-5 text-green-500" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                <span>Visited Account</span>
              </button>
            </div>

            {/* Status Details */}
            <div className="space-y-1 text-xs text-gray-500 ml-7">
              {customer.introduced_myself && customer.introduced_myself_at && (
                <p>
                  Introduced on {new Date(customer.introduced_myself_at).toLocaleDateString()} by {customer.introduced_myself_by || 'Unknown'}
                </p>
              )}
              {customer.visited_account && customer.visited_account_at && (
                <p>
                  Visited on {new Date(customer.visited_account_at).toLocaleDateString()} by {customer.visited_account_by || 'Unknown'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="border rounded-lg bg-white shadow-sm">
        <SectionHeader title="Contact Information" icon={UserCircle} section="contact" />
        {expandedSections.has('contact') && (
          <div className="px-6 pb-6 space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleAddContact}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>
            
            {customer.contacts && customer.contacts.length > 0 ? (
              <div className="grid gap-4">
                {customer.contacts.map((contact) => (
                  <div key={contact.contact_id} className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{contact.contact_name}</span>
                          <span className="text-sm text-gray-500">({contact.role})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditContact(contact)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit contact"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(contact)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a 
                          href={`tel:${contact.phone_number}`}
                          className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600"
                        >
                          <Phone className="w-4 h-4" />
                          {contact.phone_number}
                        </a>
                        <a 
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600"
                        >
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <UserCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No contacts added yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Information */}
      <div className="border rounded-lg bg-white shadow-sm">
        <SectionHeader title="Location Information" icon={MapPin} section="location" />
        {expandedSections.has('location') && (
          <div className="px-6 pb-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <MapPinned className="w-4 h-4" />
                  Territory: {customer.territory || 'Not Assigned'}
                </div>
                {customer.addresses && customer.addresses[0] ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900">{customer.addresses[0].street}</p>
                    <p className="text-sm text-gray-900">
                      {customer.addresses[0].city}, {customer.addresses[0].state} {customer.addresses[0].zip_code}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">No address information available</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                {customer.addresses && customer.addresses[0] ? (
                  <>
                    <Edit className="w-4 h-4" />
                    Edit Address
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Address
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sales Information */}
      <div className="border rounded-lg bg-white shadow-sm">
        <SectionHeader title="Sales Information" icon={DollarSign} section="sales" />
        {expandedSections.has('sales') && (
          <div className="px-6 pb-6 space-y-6">
            {/* YTD Revenue Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2024 YTD */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-medium text-gray-700">2024 YTD Revenue</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${calculateYTDSales(customer, 2024).toLocaleString()}
                </p>
              </div>

              {/* 2025 YTD */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-medium text-blue-700">2025 YTD Revenue</h4>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-2xl font-bold text-blue-600">
                    ${calculateYTDSales(customer, 2025).toLocaleString()}
                  </p>
                  {(() => {
                    const change = calculateYTDChange(
                      calculateYTDSales(customer, 2025),
                      calculateYTDSales(customer, 2024)
                    );
                    return (
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        change.percent > 0 
                          ? 'text-green-600' 
                          : change.percent < 0 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                      }`}>
                        {change.percent > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : change.percent < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        {change.percent > 0 ? '+' : ''}{change.percent.toFixed(1)}%
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Business Unit Comparison */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                Business Unit Performance
              </h4>

              {(() => {
                const units2024 = calculateYTDSalesByCategory(customer, 2024);
                const units2025 = calculateYTDSalesByCategory(customer, 2025);
                
                // Combine all categories
                const allCategories = new Set([
                  ...units2024.map(u => u.category),
                  ...units2025.map(u => u.category)
                ]);

                // Create comparison data
                const comparisons = Array.from(allCategories).map(category => {
                  const sales2024 = units2024.find(u => u.category === category)?.amount || 0;
                  const sales2025 = units2025.find(u => u.category === category)?.amount || 0;
                  const change = calculateYTDChange(sales2025, sales2024);
                  return { category, sales2024, sales2025, change };
                }).sort((a, b) => b.sales2025 - a.sales2025);

                return (
                  <div className="space-y-3">
                    {comparisons.map(({ category, sales2024, sales2025, change }) => (
                      <div key={category} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">{category}</h5>
                            <div className="flex items-center gap-6 mt-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">2024:</span>
                                <span className="text-sm font-medium text-gray-700">
                                  ${sales2024.toLocaleString()}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">2025:</span>
                                <span className="text-sm font-medium text-gray-700">
                                  ${sales2025.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 text-sm font-medium ${
                            change.percent > 0 
                              ? 'text-green-600' 
                              : change.percent < 0 
                                ? 'text-red-600' 
                                : 'text-gray-500'
                          }`}>
                            {change.percent > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : change.percent < 0 ? (
                              <TrendingDown className="w-4 h-4" />
                            ) : null}
                            {change.percent > 0 ? '+' : ''}{change.percent.toFixed(1)}%
                          </div>
                        </div>
                        <div className="relative pt-2">
                          <div className="flex mb-1">
                            <div 
                              className="h-2 bg-gray-300 rounded-l"
                              style={{ width: `${(sales2024 / Math.max(sales2024, sales2025)) * 100}%` }}
                            />
                            <div 
                              className="h-2 bg-blue-500 rounded-r"
                              style={{ width: `${(sales2025 / Math.max(sales2024, sales2025)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="border rounded-lg bg-white shadow-sm">
        <SectionHeader title="Notes" icon={StickyNote} section="notes" />
        {expandedSections.has('notes') && (
          <div className="px-6 pb-6">
            {customer && <CustomerNotes customerId={customer.customer_id} />}
          </div>
        )}
      </div>

      {/* Images Section */}
      <div className="border rounded-lg bg-white shadow-sm">
        <SectionHeader title="Customer Images" icon={ImageIcon} section="images" />
        {expandedSections.has('images') && (
          <div className="px-6 pb-6">
            <ImageUpload customerId={customer.customer_id} />
          </div>
        )}
      </div>

      {/* Modals */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setSelectedContact(undefined);
        }}
        customerId={customer.customer_id}
        existingContact={selectedContact}
        onSuccess={handleContactSuccess}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setContactToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact"
        message={`Are you sure you want to delete the contact "${contactToDelete?.contact_name}"? This action cannot be undone.`}
      />

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        customerId={customer.customer_id}
        existingAddress={customer.addresses && customer.addresses[0]}
        onSuccess={handleAddressSuccess}
      />
    </div>
  );
}

export default CustomerDetails;