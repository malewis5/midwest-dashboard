import React, { useEffect } from 'react';
import { X, MapPin, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';

const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2, 'Use 2-letter state code'),
  zip_code: z.string().min(5, 'ZIP code must be at least 5 digits')
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  existingAddress?: {
    address_id: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
  onSuccess: () => void;
}

function AddressModal({ isOpen, onClose, customerId, existingAddress, onSuccess }: AddressModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema)
  });

  useEffect(() => {
    if (isOpen) {
      if (existingAddress) {
        reset({
          street: existingAddress.street,
          city: existingAddress.city,
          state: existingAddress.state,
          zip_code: existingAddress.zip_code
        });
      } else {
        reset({
          street: '',
          city: '',
          state: '',
          zip_code: ''
        });
      }
    }
  }, [isOpen, existingAddress, reset]);

  const onSubmit = async (data: AddressFormData) => {
    try {
      // Convert to uppercase
      const formattedData = {
        street: data.street.toUpperCase(),
        city: data.city.toUpperCase(),
        state: data.state.toUpperCase(),
        zip_code: data.zip_code
      };

      if (existingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update(formattedData)
          .eq('address_id', existingAddress.address_id);

        if (error) throw error;

        // Delete existing geocoded location to force re-geocoding
        await supabase
          .from('geocoded_locations')
          .delete()
          .eq('address_id', existingAddress.address_id);
      } else {
        // Create new address
        const { error } = await supabase
          .from('addresses')
          .insert([{
            customer_id: customerId,
            ...formattedData
          }]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {existingAddress ? 'Edit Address' : 'Add New Address'}
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
            {/* Street Address */}
            <div className="space-y-2">
              <label htmlFor="street" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400" />
                Street Address
              </label>
              <input
                type="text"
                id="street"
                {...register('street')}
                className={`block w-full rounded-lg border ${
                  errors.street ? 'border-red-300' : 'border-gray-300'
                } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                placeholder="Enter street address"
              />
              {errors.street && (
                <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* City */}
              <div className="space-y-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  {...register('city')}
                  className={`block w-full rounded-lg border ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              {/* State */}
              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  {...register('state')}
                  className={`block w-full rounded-lg border ${
                    errors.state ? 'border-red-300' : 'border-gray-300'
                  } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors uppercase`}
                  placeholder="CA"
                  maxLength={2}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>

              {/* ZIP Code */}
              <div className="space-y-2">
                <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="zip_code"
                  {...register('zip_code')}
                  className={`block w-full rounded-lg border ${
                    errors.zip_code ? 'border-red-300' : 'border-gray-300'
                  } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Enter ZIP code"
                />
                {errors.zip_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.zip_code.message}</p>
                )}
              </div>
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
              {isSubmitting ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddressModal;