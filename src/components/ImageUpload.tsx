import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Edit2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  customerId: string;
}

interface CustomerImage {
  image_id: string;
  customer_id: string;
  url: string;
  filename: string;
  description: string | null;
  created_at: string;
}

function ImageUpload({ customerId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<CustomerImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  const fetchImages = useCallback(async () => {
    const { data, error } = await supabase
      .from('customer_images')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      setError('Failed to fetch images');
      return;
    }

    setImages(data);
  }, [customerId]);

  React.useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!description.trim()) {
      setError('Please provide a description for the image');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const fileExtension = file.name.split('.').pop();
      const filename = `${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `customers/${customerId}/${filename}`);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const { error: dbError } = await supabase
        .from('customer_images')
        .insert([
          {
            customer_id: customerId,
            url,
            filename,
            description: description.trim()
          }
        ]);

      if (dbError) throw dbError;

      await fetchImages();
      setDescription(''); // Clear description after successful upload
    } catch (err) {
      setError('Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: CustomerImage) => {
    try {
      const storageRef = ref(storage, `customers/${customerId}/${image.filename}`);
      await deleteObject(storageRef);

      const { error: dbError } = await supabase
        .from('customer_images')
        .delete()
        .eq('image_id', image.image_id);

      if (dbError) throw dbError;

      await fetchImages();
    } catch (err) {
      setError('Failed to delete image');
      console.error('Delete error:', err);
    }
  };

  const startEditing = (image: CustomerImage) => {
    setEditingImage(image.image_id);
    setEditDescription(image.description || '');
  };

  const saveDescription = async (image: CustomerImage) => {
    try {
      const { error: updateError } = await supabase
        .from('customer_images')
        .update({ description: editDescription.trim() })
        .eq('image_id', image.image_id);

      if (updateError) throw updateError;

      await fetchImages();
      setEditingImage(null);
      setEditDescription('');
    } catch (err) {
      setError('Failed to update description');
      console.error('Update error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.image_id}
            className="relative group rounded-lg overflow-hidden border border-gray-200"
          >
            <div className="aspect-square">
              <img
                src={image.url}
                alt={image.description || "Customer image"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200">
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => startEditing(image)}
                  className="p-1 rounded-full bg-white text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(image)}
                  className="p-1 rounded-full bg-white text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {editingImage === image.image_id ? (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-75 opacity-100">
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-white rounded"
                    placeholder="Enter description"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveDescription(image);
                      } else if (e.key === 'Escape') {
                        setEditingImage(null);
                        setEditDescription('');
                      }
                    }}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setEditingImage(null);
                        setEditDescription('');
                      }}
                      className="px-2 py-1 text-xs text-white hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveDescription(image)}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                image.description && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-75 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {image.description}
                  </div>
                )
              )}
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-full">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No images uploaded yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="space-y-4">
          {/* Description Input */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Image Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for the image"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* File Upload */}
          <div className="flex justify-end">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="imageUpload"
              disabled={uploading || !description.trim()}
            />
            <label
              htmlFor="imageUpload"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                uploading || !description.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Image
                </>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageUpload;