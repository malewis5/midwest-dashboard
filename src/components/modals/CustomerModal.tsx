import React, { useEffect } from 'react';
import { X, Building2, Hash, FileCode } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';

const customerSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  account_number: z.string()
    .min(1, 'Account number is required')
    .regex(/^10-\d{7}$/, 'Account number must be in format "10-XXXXXXX"'),
  phocas_id: z.string().optional(),
  account_classification: z.enum(['A', 'B+', 'B', 'C']).optional().nullable()
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomer?: {
    customer_id: string;
    customer_name: string;
    account_number: string;
    phocas_id?: string | null;
    account_classification?: string | null;
  };
  onSuccess: () => void;
  defaultAccountNumber?: string | null;
}

function CustomerModal({ isOpen, onClose, existingCustomer, onSuccess, defaultAccountNumber }: CustomerModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema)
  });

  useEffect(() => {
    if (isOpen) {
      if (existingCustomer) {
        reset({
          customer_name: existingCustomer.customer_name,
          account_number: existingCustomer.account_number,
          phocas_id: existingCustomer.phocas_id || '',
          account_classification: existingCustomer.account_classification as any || null
        });
      } else {
        reset({
          customer_name: '',
          account_number: defaultAccountNumber || '10-',
          phocas_id: '',
          account_classification: null
        });
      }
    }
  }, [isOpen, existingCustomer, defaultAccountNumber, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const formattedData = {
        customer_name: data.customer_name.toUpperCase(),
        account_number: data.account_number,
        customer_code: data.account_number,
        phocas_id: data.phocas_id || null,
        account_classification: data.account_classification
      };

      if (existingCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(formattedData)
          .eq('customer_id', existingCustomer.customer_id);

        if (error) throw error;
      } else {
        // Create new customer
        const { error } = await supabase
          .from('customers')
          .insert([formattedData]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {existingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Customer Name */}
            <div className="space-y-2">
              <label htmlFor="customer_name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400" />
                Customer Name
              </label>
              <input
                type="text"
                id="customer_name"
                {...register('customer_name')}
                className={`block w-full rounded-lg border ${
                  errors.customer_name ? 'border-red-300' : 'border-gray-300'
                } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                placeholder="Enter customer name"
              />
              {errors.customer_name && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
              )}
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <label htmlFor="account_number" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Hash className="w-4 h-4 text-gray-400" />
                Account Number
              </label>
              <input
                type="text"
                id="account_number"
                {...register('account_number')}
                className={`block w-full rounded-lg border ${
                  errors.account_number ? 'border-red-300' : 'border-gray-300'
                } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                placeholder="10-XXXXXXX"
              />
              {errors.account_number && (
                <p className="mt-1 text-sm text-red-600">{errors.account_number.message}</p>
              )}
            </div>

            {/* PHOCAS ID */}
            <div className="space-y-2">
              <label htmlFor="phocas_id" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileCode className="w-4 h-4 text-gray-400" />
                PHOCAS ID
              </label>
              <input
                type="text"
                id="phocas_id"
                {...register('phocas_id')}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter PHOCAS ID (optional)"
              />
            </div>

            {/* Account Classification */}
            <div className="space-y-2">
              <label htmlFor="account_classification" className="block text-sm font-medium text-gray-700">
                Account Classification
              </label>
              <select
                id="account_classification"
                {...register('account_classification')}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select Classification</option>
                <option value="A">A</option>
                <option value="B+">B+</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerModal;