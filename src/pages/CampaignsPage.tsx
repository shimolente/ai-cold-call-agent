import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Trash2, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Campaign } from '../types';
import CreateCampaignModal from '../components/common/CreateCampaignModal';

interface CampaignWithStats extends Campaign {
  total_contacts: number;
  pending_contacts: number;
  completed_contacts: number;
}

const CampaignsPage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      const { data: campaignsData, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch contact counts for each campaign
      const campaignsWithStats = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { data: campaignContacts } = await supabase
            .from('campaign_contacts')
            .select('status')
            .eq('campaign_id', campaign.id);

          const total = campaignContacts?.length || 0;
          const pending = campaignContacts?.filter(cc => cc.status === 'pending').length || 0;
          const completed = campaignContacts?.filter(cc => cc.status === 'completed').length || 0;

          return {
            ...campaign,
            total_contacts: total,
            pending_contacts: pending,
            completed_contacts: completed
          };
        })
      );

      setCampaigns(campaignsWithStats);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      await fetchCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert('Error deleting campaign. Please try again.');
    }
  };

  const runCampaign = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Campaigns</h1>
          <p className="text-gray-600">Manage your calling campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No campaigns yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-primary hover:underline"
          >
            Create your first campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/campaigns/${campaign.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                  {campaign.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{campaign.total_contacts}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-blue-900">{campaign.pending_contacts}</div>
                  <div className="text-xs text-blue-600">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-green-900">{campaign.completed_contacts}</div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Clock className="w-4 h-4" />
                <span>{campaign.call_window_start} - {campaign.call_window_end} {campaign.timezone}</span>
              </div>

              <div className="flex items-center gap-2">
                {campaign.pending_contacts > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runCampaign(campaign.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Run Campaign
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCampaign(campaign.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => {
            setShowCreateModal(false);
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
};

export default CampaignsPage;