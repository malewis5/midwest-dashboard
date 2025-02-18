import React, { useEffect } from 'react';
import { X, User, Briefcase, Phone, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';

const contactSchema = z.object({
  contact_name: z.string().min(1, 'Contact name is required'),
  role: z.string().min(1, 'Role is required'),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address')
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  existingContact?: {
    contact_id: string;
    contact_name: string;
    role: string;
    phone_number: string;
    email: string;
  };
  onSuccess: () => void;
}

function ContactModal({ isOpen, onClose, customerId, existingContact, onSuccess }: ContactModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  });

  // Reset form when modal opens or existingContact changes
  useEffect(() => {
    if (isOpen) {
      if (existingContact) {
        reset({
          contact_name: existingContact.contact_name,
          role: existingContact.role,
          phone_number: existingContact.phone_number,
          email: existingContact.email
        });
      } else {
        reset({
          contact_name: '',
          role: '',
          phone_number: '',
          email: ''
        });
      }
    }
  }, [isOpen, existingContact, reset]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (existingContact) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            contact_name: data.contact_name,
            role: data.role,
            phone_number: data.phone_number,
            email: data.email
          })
          .eq('contact_id', existingContact.contact_id);

        if (error) throw error;
      } else {
        // Create new contact
        const { error } = await supabase
          .from('contacts')
          .insert([{
            customer_id: customerId,
            contact_name: data.contact_name,
            role: data.role,
            phone_number: data.phone_number,
            email: data.email
          }]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {existingContact ? 'Edit Contact' : 'Add New Contact'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Name */}
            <div className="space-y-2">
              <label htmlFor="contact_name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                Contact Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="contact_name"
                  {...register('contact_name')}
                  className={`block w-full rounded-lg border ${
                    errors.contact_name ? 'border-red-300' : 'border-gray-300'
                  } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Enter contact name"
                />
                {errors.contact_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_name.message}</p>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label htmlFor="role" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Briefcase className="w-4 h-4 text-gray-400" />
                Role
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="role"
                  {...register('role')}
                  className={`block w-full rounded-lg border ${
                    errors.role ? 'border-red-300' : 'border-gray-300'
                  } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Enter role or title"
                />
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label htmlFor="phone_number" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone_number"
                  {...register('phone_number')}
                  className={`block w-full rounded-lg border ${
                    errors.phone_number ? 'border-red-300' : 'border-gray-300'
                  } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Enter phone number"
                />
                {errors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" />
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className={`block w-full rounded-lg border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
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
              {isSubmitting ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactModal;