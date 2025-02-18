import React, { useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';

const noteSchema = z.object({
  content: z.string().min(1, 'Note content is required')
});

type NoteFormData = z.infer<typeof noteSchema>;

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  existingNote?: {
    note_id: string;
    content: string;
  };
  onSuccess: () => void;
}

function NoteModal({ isOpen, onClose, customerId, existingNote, onSuccess }: NoteModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema)
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        content: existingNote?.content || ''
      });
    }
  }, [isOpen, existingNote, reset]);

  const onSubmit = async (data: NoteFormData) => {
    try {
      if (existingNote) {
        const { error: updateError } = await supabase
          .from('customer_notes')
          .update({
            content: data.content
          })
          .eq('note_id', existingNote.note_id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('customer_notes')
          .insert([{
            customer_id: customerId,
            content: data.content
          }]);

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {existingNote ? 'Edit Note' : 'Add New Note'}
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
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Note Content
            </label>
            <textarea
              id="content"
              rows={4}
              {...register('content')}
              className={`block w-full rounded-lg border ${
                errors.content ? 'border-red-300' : 'border-gray-300'
              } px-4 py-3 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="Enter note content..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
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
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoteModal;