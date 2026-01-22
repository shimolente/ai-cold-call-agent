import { useState, useEffect } from 'react';
import { Plus, Lightbulb, Edit2, Trash2, X } from 'lucide-react';
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

  const handleEdit = (usp: USP) => {
    setEditingUSP(usp);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this USP? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('usps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchUSPs();
    } catch (err) {
      console.error('Error deleting USP:', err);
      alert('Failed to delete USP');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">USP Library</h1>
            <p className="text-gray-600">Manage your Unique Selling Propositions for AI to use during calls</p>
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
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading USPs...</div>
      ) : usps.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No USPs yet</h3>
          <p className="text-gray-500 mb-6">Create your first USP to help AI map solutions to prospect pain points</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First USP
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {usps.map(usp => (
            <div key={usp.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{usp.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{usp.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {usp.pain_point_tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-sm text-gray-500">
                    Used in {usp.usage_count} campaigns
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(usp)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(usp.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
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
          onSuccess={fetchUSPs}
        />
      )}
    </div>
  );
};

// USP Modal Component
const USPModal = ({ 
  usp, 
  onClose, 
  onSuccess 
}: { 
  usp: USP | null; 
  onClose: () => void; 
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: usp?.title || '',
    description: usp?.description || '',
    pain_point_tags: usp?.pain_point_tags || [] as string[]
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
      pain_point_tags: formData.pain_point_tags.filter(t => t !== tag)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (usp) {
        // Update existing
        const { error } = await supabase
          .from('usps')
          .update({
            title: formData.title,
            description: formData.description,
            pain_point_tags: formData.pain_point_tags
          })
          .eq('id', usp.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('usps')
          .insert([{
            title: formData.title,
            description: formData.description,
            pain_point_tags: formData.pain_point_tags
          }]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving USP:', err);
      alert('Failed to save USP');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            {usp ? 'Edit USP' : 'Add USP'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="24/7 Customer Support"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Our support team is available around the clock to help with any issues..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pain Point Tags
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g., poor support, downtime issues"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.pain_point_tags.map(tag => (
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
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : usp ? 'Update USP' : 'Add USP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default USPLibraryPage;