import { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../hooks/useData';
import type { CampaignStatus } from '../../types';
import type { Campaign } from '../../types';


interface CreateCampaignModalProps {
  onClose: () => void;
}

const CreateCampaignModal = ({ onClose }: CreateCampaignModalProps) => {
  const { data, addCampaign } = useData();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as CampaignStatus,
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'PST',
    selectedUSPs: [] as string[]
  });

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  addCampaign({
    name: formData.name,
    description: formData.description,
    status: formData.status,
    timezone: formData.timezone,
    call_window_start: formData.startTime,
    call_window_end: formData.endTime,
    pause_between_calls: 30,
    selected_usps: formData.selectedUSPs,
    total_contacts: 0,
    called_count: 0,
    pending_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as Omit<Campaign, 'id' | 'createdAt'>);
  onClose();
};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Create Campaign</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select USPs for this Campaign
              </label>
              {data.usps.length === 0 ? (
                <p className="text-sm text-gray-500">No USPs available. Create some in the USP Library first.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                 {data.usps.map((usp: unknown) => {
  const u = usp as { id: string; title: string; description: string };
  return (
    <label key={u.id} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
      <input
        type="checkbox"
        checked={formData.selectedUSPs.includes(u.id)}
        onChange={e => {
          if (e.target.checked) {
            setFormData({ ...formData, selectedUSPs: [...formData.selectedUSPs, u.id] });
          } else {
            setFormData({ ...formData, selectedUSPs: formData.selectedUSPs.filter(id => id !== u.id) });
          }
        }}
        className="mt-1"
      />
      <div>
        <div className="font-medium text-gray-900 text-sm">{u.title}</div>
        <div className="text-xs text-gray-500">{u.description}</div>
      </div>
    </label>
  );
})}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignModal;