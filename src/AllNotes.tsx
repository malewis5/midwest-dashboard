import React, { useState, useEffect } from 'react';
import { StickyNote, Search, Building2, Clock, ChevronDown, ChevronUp, EyeOff, Eye, Edit2, Trash2, Filter } from 'lucide-react';
import { supabase } from './lib/supabase';
import NoteModal from './components/modals/NoteModal';
import DeleteConfirmationModal from './components/modals/DeleteConfirmationModal';

interface CustomerNote {
  note_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  hidden: boolean;
  customers: {
    customer_id: string;
    customer_name: string;
    account_number: string;
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function getPreviewText(content: string, maxLength: number = 280) {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}

function AllNotes() {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CustomerNote | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<CustomerNote | null>(null);
  const [showHiddenNotes, setShowHiddenNotes] = useState(false);

  const fetchNotes = async () => {
    try {
      let query = supabase
        .from('customer_notes')
        .select(`
          note_id,
          content,
          created_at,
          updated_at,
          hidden,
          customers (
            customer_id,
            customer_name,
            account_number
          )
        `)
        .order('created_at', { ascending: false });

      // Only apply hidden filter if not showing all notes
      if (!showHiddenNotes) {
        query = query.eq('hidden', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [showHiddenNotes]); // Refetch when visibility toggle changes

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
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

  const filteredNotes = notes.filter(note => {
    const searchLower = searchTerm.toLowerCase();
    return (
      note.content.toLowerCase().includes(searchLower) ||
      note.customers.customer_name.toLowerCase().includes(searchLower) ||
      note.customers.account_number.toLowerCase().includes(searchLower)
    );
  });

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
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <StickyNote className="w-6 h-6" />
            All Customer Notes
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHiddenNotes(!showHiddenNotes)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                showHiddenNotes
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              {showHiddenNotes ? 'Showing All Notes' : 'Hidden Notes Filtered'}
            </button>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes or customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                {searchTerm ? 'No notes found matching your search.' : 'No notes have been added yet.'}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div 
                key={note.note_id} 
                className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${
                  note.hidden ? 'opacity-75' : ''
                }`}
              >
                {/* Note Header */}
                <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {note.customers.customer_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {note.customers.account_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {note.hidden && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <EyeOff className="w-4 h-4" />
                          Hidden Note
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(note.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note Content */}
                <div className="px-6 py-4">
                  <div className="relative">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {expandedNotes.has(note.note_id) 
                        ? note.content 
                        : getPreviewText(note.content)}
                    </p>
                    {note.content.length > 280 && (
                      <button
                        onClick={() => toggleNoteExpansion(note.note_id)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        {expandedNotes.has(note.note_id) ? (
                          <>
                            Show Less
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Read More
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4 justify-end">
                    <button
                      onClick={() => toggleNoteVisibility(note)}
                      className={`p-1.5 rounded-md transition-colors ${
                        note.hidden 
                          ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' 
                          : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                      }`}
                      title={note.hidden ? "Show in all notes" : "Hide from all notes"}
                    >
                      {note.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit note"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(note)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Note Modal */}
        <NoteModal
          isOpen={isNoteModalOpen}
          onClose={() => {
            setIsNoteModalOpen(false);
            setSelectedNote(undefined);
          }}
          customerId={selectedNote?.customers.customer_id || ''}
          existingNote={selectedNote ? {
            note_id: selectedNote.note_id,
            content: selectedNote.content
          } : undefined}
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
    </div>
  );
}

export default AllNotes;