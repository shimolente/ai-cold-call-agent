import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Users, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalContacts: number;
  totalCalls: number;
  pendingCalls: number;
  completedCalls: number;
}

interface CampaignWithContactStats {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  totalContacts: number;
  pendingContacts: number;
}

const OverviewPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalContacts: 0,
    totalCalls: 0,
    pendingCalls: 0,
    completedCalls: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('status');

      const totalCampaigns = campaignsData?.length || 0;
      const activeCampaigns = campaignsData?.filter(c => c.status === 'active').length || 0;

      // Fetch contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id');

      const totalContacts = contactsData?.length || 0;

      // Fetch campaign_contacts for call stats
      const { data: campaignContactsData } = await supabase
        .from('campaign_contacts')
        .select('status');

      const pendingCalls = campaignContactsData?.filter(cc => cc.status === 'pending').length || 0;
      const completedCalls = campaignContactsData?.filter(cc => cc.status === 'completed').length || 0;

      // Fetch call logs
      const { data: callLogsData } = await supabase
        .from('call_logs')
        .select('id');

      const totalCalls = callLogsData?.length || 0;

      setStats({
        totalCampaigns,
        activeCampaigns,
        totalContacts,
        totalCalls,
        pendingCalls,
        completedCalls
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Overview</h1>
        <p className="text-gray-600">Your calling campaign dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 mb-1">{stats.totalCampaigns}</div>
          <div className="text-sm text-gray-600">Total Campaigns</div>
          <div className="text-xs text-gray-500 mt-2">{stats.activeCampaigns} active</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 mb-1">{stats.totalContacts}</div>
          <div className="text-sm text-gray-600">Total Contacts</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 mb-1">{stats.totalCalls}</div>
          <div className="text-sm text-gray-600">Total Calls Made</div>
          <div className="text-xs text-gray-500 mt-2">{stats.completedCalls} completed</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 mb-1">{stats.pendingCalls}</div>
          <div className="text-sm text-gray-600">Pending Calls</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Start a New Campaign</h3>
          <p className="text-white/80 mb-4">Create a new calling campaign and add contacts to get started</p>
          <button
            onClick={() => navigate('/campaigns/create')}
            className="px-4 py-2 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Create Campaign
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Manage Contacts</h3>
          <p className="text-white/80 mb-4">View and organize all your contacts across campaigns</p>
          <button
            onClick={() => navigate('/contacts')}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            View Contacts
          </button>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Campaigns</h2>
          <button
            onClick={() => navigate('/campaigns')}
            className="text-sm text-primary hover:underline"
          >
            View All
          </button>
        </div>
        
        <RecentCampaignsList />
      </div>
    </div>
  );
};

// Recent Campaigns List Component
const RecentCampaignsList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignWithContactStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentCampaigns();
  }, []);

  const fetchRecentCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch contact counts for each campaign
      const campaignsWithStats = await Promise.all(
        (data || []).map(async (campaign) => {
          const { data: campaignContacts } = await supabase
            .from('campaign_contacts')
            .select('status')
            .eq('campaign_id', campaign.id);

          return {
            ...campaign,
            totalContacts: campaignContacts?.length || 0,
            pendingContacts: campaignContacts?.filter(cc => cc.status === 'pending').length || 0
          };
        })
      );

      setCampaigns(campaignsWithStats);
    } catch (err) {
      console.error('Error fetching recent campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading campaigns...</div>;
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No campaigns yet. Create your first campaign to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          onClick={() => navigate(`/campaigns/${campaign.id}`)}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-gray-900">{campaign.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {campaign.status}
              </span>
            </div>
            {campaign.description && (
              <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{campaign.totalContacts}</div>
              <div className="text-gray-500">Contacts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-900">{campaign.pendingContacts}</div>
              <div className="text-blue-600">Pending</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewPage;