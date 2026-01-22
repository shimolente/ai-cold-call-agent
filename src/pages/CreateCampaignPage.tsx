import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { USP, CampaignStatus } from '../types';

const CreateCampaignPage = () => {
  const navigate = useNavigate();
  const [usps, setUsps] = useState<USP[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    call_window_start: '09:00',
    call_window_end: '17:00',
    timezone: 'PST',
    pause_between_calls: 60,
    selected_usps: [] as string[],
    status: 'active' as CampaignStatus
  });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          name: formData.name,
          description: formData.description || null,
          call_window_start: formData.call_window_start,
          call_window_end: formData.call_window_end,
          timezone: formData.timezone,
          pause_between_calls: formData.pause_between_calls,
          selected_usps: formData.selected_usps,
          status: formData.status
        }])
        .select()
        .single();

      if (error) throw error;

      // Navigate to the new campaign detail page
      navigate(`/campaigns/${data.id}`);
    } catch (err) {
      console.error('Error creating campaign:', err);
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Campaigns
        </button>

        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Create New Campaign</h1>
        <p className="text-gray-600">Set up your AI calling campaign</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-3xl">
        <form onSubmit={handleSubmit}>
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
                placeholder="Q1 Outreach"
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
                placeholder="Target enterprise customers in tech sector..."
              />
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
              <p className="text-xs text-gray-500 mt-1">Time to wait between each call attempt (default: 60 seconds)</p>
            </div>

            {/* USP Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select USPs for this Campaign
              </label>
              {usps.length === 0 ? (
                <p className="text-sm text-gray-500">No USPs available. Create some in the USP Library first.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
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
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignPage;