import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { USP } from '../types';

const USPLibraryPage = () => {
  const [usps, setUsps] = useState<USP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUSP, setEditingUSP] = useState<USP | null>(null);

  useEffect(() => {
    fetchUSPs();
  }, []);

  const fetchUSPs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsps(data || []);
    } catch (err) {
      console.error('Error fetching USPs:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUSP = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this USP?')) return;

    try {
      const { error } = await supabase
        .from('usps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchUSPs();
    } catch (err) {
      console.error('Error deleting USP:', err);
      alert('Error deleting USP');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading USPs...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">USP Library</h1>
          <p className="text-gray-600">Manage your unique selling propositions</p>
        </div>
        <button
          onClick={() => {
            setEditingUSP(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add USP
        </button>
      </div>

      {usps.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No USPs yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-primary hover:underline"
          >
            Create your first USP
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usps.map((usp) => (
            <div key={usp.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{usp.title}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingUSP(usp);
                      setShowModal(true);
                    }}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteUSP(usp.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{usp.description}</p>

              {usp.category && (
                <div className="mb-3">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                    {usp.category}
                  </span>
                </div>
              )}

              {usp.pain_point_tags && usp.pain_point_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {usp.pain_point_tags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-500">
                Used in {usp.usage_count || 0} campaigns
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <USPModal
          usp={editingUSP}
          onClose={() => {
            setShowModal(false);
            setEditingUSP(null);
          }}
          onSave={() => {
            fetchUSPs();
            setShowModal(false);
            setEditingUSP(null);
          }}
        />
      )}
    </div>
  );
};

// USP Modal Component
interface USPModalProps {
  usp: USP | null;
  onClose: () => void;
  onSave: () => void;
}

const USPModal = ({ usp, onClose, onSave }: USPModalProps) => {
  const [formData, setFormData] = useState({
    title: usp?.title || '',
    description: usp?.description || '',
    category: usp?.category || '',
    pain_point_tags: (usp?.pain_point_tags || []) as string[]
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.pain_point_tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        pain_point_tags: [...formData.pain_point_tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      pain_point_tags: formData.pain_point_tags.filter((t: string) => t !== tag)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      alert('Title and description are required');
      return;
    }

    try {
      setSaving(true);

      if (usp) {
        // Update existing USP
        const { error } = await supabase
          .from('usps')
          .update({
            title: formData.title,
            description: formData.description,
            category: formData.category || null,
            pain_point_tags: formData.pain_point_tags
          })
          .eq('id', usp.id);

        if (error) throw error;
      } else {
        // Create new USP
        const { error } = await supabase
          .from('usps')
          .insert([{
            title: formData.title,
            description: formData.description,
            category: formData.category || null,
            pain_point_tags: formData.pain_point_tags,
            usage_count: 0
          }]);

        if (error) throw error;
      }

      onSave();
    } catch (err) {
      console.error('Error saving USP:', err);
      alert('Error saving USP. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {usp ? 'Edit USP' : 'Create New USP'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Cost Savings, Efficiency, Security"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pain Point Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a pain point tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.pain_point_tags.map((tag: string) => (
                <span 
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : usp ? 'Update USP' : 'Create USP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default USPLibraryPage;