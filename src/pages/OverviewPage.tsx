import { useState, useEffect } from 'react';
import { Phone, Users, TrendingUp, Calendar, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Campaign, Contact, CallLog } from '../types';

interface CampaignStats {
  total: number;
  active: number;
  paused: number;
  completed: number;
}

interface ContactStats {
  total: number;
  called: number;
  pending: number;
}

interface CallStats {
  total: number;
  positive: number;
  noInterest: number;
  followUp: number;
  conversionRate: number;
}

const OverviewPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [campaignsRes, contactsRes, callLogsRes] = await Promise.all([
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('contacts').select('*'),
        supabase.from('call_logs').select('*').order('call_date', { ascending: false }).limit(5)
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (contactsRes.error) throw contactsRes.error;
      if (callLogsRes.error) throw callLogsRes.error;

      setCampaigns(campaignsRes.data || []);
      setContacts(contactsRes.data || []);
      setCallLogs(callLogsRes.data || []);
    } catch (err) {
      console.error('Error fetching overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate campaign stats
  const campaignStats: CampaignStats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    completed: campaigns.filter(c => c.status === 'completed').length
  };

  // Calculate contact stats
  const contactStats: ContactStats = {
    total: contacts.length,
    called: contacts.filter(c => c.status === 'completed').length,
    pending: contacts.filter(c => c.status === 'pending').length
  };

  // Calculate call stats
  const allCallLogs = callLogs;
  const callStats: CallStats = {
    total: allCallLogs.length,
    positive: allCallLogs.filter(log => log.intent_label === 'positive').length,
    noInterest: allCallLogs.filter(log => log.intent_label === 'no-interest').length,
    followUp: allCallLogs.filter(log => log.intent_label === 'follow-up').length,
    conversionRate: allCallLogs.length > 0 
      ? Math.round((allCallLogs.filter(log => log.intent_label === 'positive').length / allCallLogs.length) * 100)
      : 0
  };

  // Intent distribution
  const intentCounts = {
    positive: callStats.positive,
    'no-interest': callStats.noInterest,
    'follow-up': callStats.followUp
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'no-interest': return 'text-red-600 bg-red-100';
      case 'follow-up': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getIntentLabel = (intent: string) => {
    switch (intent) {
      case 'positive': return 'Positive';
      case 'no-interest': return 'No Interest';
      case 'follow-up': return 'Follow-up';
      default: return intent;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading overview...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Overview</h1>
        <p className="text-gray-600">Real-time performance metrics and activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-600 text-sm">Total Campaigns</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{campaignStats.total}</p>
          <p className="text-sm text-gray-500 mt-2">{campaignStats.active} active</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-600 text-sm">Total Contacts</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{contactStats.total}</p>
          <p className="text-sm text-gray-500 mt-2">{contactStats.called} contacted</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-600 text-sm">Total Calls</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{callStats.total}</p>
          <p className="text-sm text-gray-500 mt-2">{callStats.positive} positive</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-gray-600 text-sm">Conversion Rate</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{callStats.conversionRate}%</p>
          <p className="text-sm text-gray-500 mt-2">{callStats.followUp} follow-ups</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Intent Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Intent Distribution
          </h3>
          {callStats.total === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">No calls yet</p>
          ) : (
            <div className="space-y-4">
              {/* Positive */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Positive</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {intentCounts.positive} ({Math.round((intentCounts.positive / callStats.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(intentCounts.positive / callStats.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* No Interest */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">No Interest</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {intentCounts['no-interest']} ({Math.round((intentCounts['no-interest'] / callStats.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${(intentCounts['no-interest'] / callStats.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Follow-up */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Follow-up</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {intentCounts['follow-up']} ({Math.round((intentCounts['follow-up'] / callStats.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${(intentCounts['follow-up'] / callStats.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Campaign Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Campaigns Overview
          </h3>
          {campaigns.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">No campaigns yet</p>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map(campaign => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {campaign.call_window_start} - {campaign.call_window_end} {campaign.timezone}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </h3>
        {callLogs.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400 mt-2">Start a campaign to see call activity here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {callLogs.map(call => {
              const contact = contacts.find(c => c.id === call.contact_id);
              return (
                <div key={call.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    call.intent_label === 'positive' ? 'bg-green-100' :
                    call.intent_label === 'no-interest' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {call.intent_label === 'positive' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Phone className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{contact?.name || 'Unknown Contact'}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getIntentColor(call.intent_label)}`}>
                        {getIntentLabel(call.intent_label)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{call.ai_summary}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(call.call_date).toLocaleString()}</span>
                      <span>•</span>
                      <span>{Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewPage;