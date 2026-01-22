import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import type { Campaign, USP } from '../../types';

interface CampaignSettingsModalProps {
  campaign: Campaign;
  onClose: () => void;
  onUpdate: () => void;
}

const CampaignSettingsModal = ({ campaign, onClose, onUpdate }: CampaignSettingsModalProps) => {
  const navigate = useNavigate();
  const [usps, setUsps] = useState<USP[]>([]);
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description || '',
    call_window_start: campaign.call_window_start,
    call_window_end: campaign.call_window_end,
    timezone: campaign.timezone,
    pause_between_calls: campaign.pause_between_calls,
    selected_usps: campaign.selected_usps,
    status: campaign.status
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUSPs();
  }, []);

  const fetchUSPs = async () => {
    const { data } = await supabase
      .from('usps')
      .select('*')
      .order('title');
    
    setUsps(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: formData.name,
          description: formData.description || null,
          call_window_start: formData.call_window_start,
          call_window_end: formData.call_window_end,
          timezone: formData.timezone,
          pause_between_calls: formData.pause_between_calls,
          selected_usps: formData.selected_usps,
          status: formData.status
        })
        .eq('id', campaign.id);

      if (error) throw error;

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating campaign:', err);
      alert('Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this campaign? This will also delete all contacts and call logs. This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id);

      if (error) throw error;

      navigate('/campaigns');
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert('Failed to delete campaign');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Campaign Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Call Window */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.call_window_start}
                  onChange={e => setFormData({ ...formData, call_window_start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.call_window_end}
                  onChange={e => setFormData({ ...formData, call_window_end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="PST">PST</option>
                  <option value="MST">MST</option>
                  <option value="CST">CST</option>
                  <option value="EST">EST</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            {/* Pause Between Calls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pause Between Calls (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={formData.pause_between_calls}
                onChange={e => setFormData({ ...formData, pause_between_calls: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Time to wait between each call attempt</p>
            </div>

            {/* USP Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selected USPs
              </label>
              {usps.length === 0 ? (
                <p className="text-sm text-gray-500">No USPs available. Create some in the USP Library first.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {usps.map(usp => (
                    <label key={usp.id} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.selected_usps.includes(usp.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData({ ...formData, selected_usps: [...formData.selected_usps, usp.id] });
                          } else {
                            setFormData({ ...formData, selected_usps: formData.selected_usps.filter(id => id !== usp.id) });
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{usp.title}</div>
                        <div className="text-xs text-gray-500">{usp.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete Campaign'}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || deleting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || deleting}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignSettingsModal;