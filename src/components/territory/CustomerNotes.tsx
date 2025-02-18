import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Edit2, Trash2, Clock, EyeOff, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import NoteModal from '../modals/NoteModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

interface CustomerNote {
  note_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  hidden: boolean;
}

interface CustomerNotesProps {
  customerId: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function CustomerNotes({ customerId }: CustomerNotesProps) {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CustomerNote | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<CustomerNote | null>(null);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [customerId]);

  const handleAddNote = () => {
    setSelectedNote(undefined);
    setIsNoteModalOpen(true);
  };

  const handleEditNote = (note: CustomerNote) => {
    setSelectedNote(note);
    setIsNoteModalOpen(true);
  };

  const handleDeleteClick = (note: CustomerNote) => {
    setNoteToDelete(note);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;

    try {
      const { error } = await supabase
        .from('customer_notes')
        .delete()
        .eq('note_id', noteToDelete.note_id);

      if (error) throw error;

      await fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const toggleNoteVisibility = async (note: CustomerNote) => {
    try {
      const { error } = await supabase
        .from('customer_notes')
        .update({ hidden: !note.hidden })
        .eq('note_id', note.note_id);

      if (error) throw error;

      await fetchNotes();
    } catch (error) {
      console.error('Error toggling note visibility:', error);
      alert('Failed to update note visibility. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleAddNote}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      <div className="space-y-4">
        {notes.map((note) => (
          <div 
            key={note.note_id} 
            className={`bg-gray-50 rounded-lg p-4 ${note.hidden ? 'opacity-75' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Created: {formatDate(note.created_at)}
                  </div>
                  {note.updated_at !== note.created_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Updated: {formatDate(note.updated_at)}
                    </div>
                  )}
                  {note.hidden && (
                    <span className="text-orange-600 flex items-center gap-1">
                      <EyeOff className="w-4 h-4" />
                      Hidden from all notes
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleNoteVisibility(note)}
                  className={`p-1 transition-colors ${
                    note.hidden 
                      ? 'text-gray-400 hover:text-blue-600' 
                      : 'text-gray-400 hover:text-orange-600'
                  }`}
                  title={note.hidden ? "Show in all notes" : "Hide from all notes"}
                >
                  {note.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleEditNote(note)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit note"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(note)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="text-center py-8">
            <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No notes added yet</p>
          </div>
        )}
      </div>

      {/* Note Modal */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setSelectedNote(undefined);
        }}
        customerId={customerId}
        existingNote={selectedNote}
        onSuccess={fetchNotes}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setNoteToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
      />
    </div>
  );
}

export default CustomerNotes;