import React from 'react';
import { X } from 'lucide-react';
import CustomerDetails from '../territory/CustomerDetails';
import type { Customer } from '../../types/customer';

interface SalesCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onCustomerUpdate: (customer: Customer) => void;
}

function SalesCustomerModal({ isOpen, onClose, customer, onCustomerUpdate }: SalesCustomerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-stretch">
      <div className="bg-white w-full max-w-6xl h-screen shadow-2xl flex flex-col mx-auto">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {customer?.customer_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="h-full p-8">
            <CustomerDetails 
              customer={customer} 
              onCustomerUpdate={onCustomerUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesCustomerModal;