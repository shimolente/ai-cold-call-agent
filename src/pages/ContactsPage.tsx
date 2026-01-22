import { useState, useEffect } from 'react';
import { Users, Search, Phone, Mail, Building2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Contact, CallLog, IntentLabel } from '../types';

interface ContactWithCampaignData extends Contact {
  campaigns?: {
    name: string;
  };
}

interface ContactWithCampaign extends Contact {
  campaign_name?: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  call_window_start: string;
  call_window_end: string;
  timezone: string;
  pause_between_calls: number;
  selected_usps: string[];
  created_at: string;
  updated_at: string;
}

const ContactsPage = () => {
  const [contacts, setContacts] = useState<ContactWithCampaign[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<ContactWithCampaign | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .order('name');

      setCampaigns(campaignsData || []);

      // Fetch contacts with campaign names
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select(`
          *,
          campaigns!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include campaign_name
      const transformedContacts: ContactWithCampaign[] = (contactsData || []).map((contact: ContactWithCampaignData) => ({
        ...contact,
        campaign_name: contact.campaigns?.name || 'Unknown'
      }));

      setContacts(transformedContacts);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);

    const matchesCampaign = filterCampaign === 'all' || contact.campaign_id === filterCampaign;
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;

    return matchesSearch && matchesCampaign && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: contacts.length,
    called: contacts.filter(c => c.status === 'completed').length,
    pending: contacts.filter(c => c.status === 'pending').length,
    failed: contacts.filter(c => c.status === 'failed').length
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Contacts</h1>
            <p className="text-gray-600">Master database of all contacts across campaigns</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-600 text-sm">Total Contacts</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-600 text-sm">Called</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.called}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-600 text-sm">Pending</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.pending}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-gray-600 text-sm">Failed</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.failed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, company, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <select
          value={filterCampaign}
          onChange={(e) => setFilterCampaign(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="all">All Campaigns</option>
          {campaigns.map(campaign => (
            <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="calling">Calling</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-500">
              {contacts.length === 0 
                ? 'Add contacts from the Campaigns page to get started'
                : 'Try adjusting your filters'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      {contact.email && (
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {contact.company || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{contact.phone}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {contact.campaign_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contact.status === 'completed' ? 'bg-green-100 text-green-800' :
                        contact.status === 'calling' ? 'bg-yellow-100 text-yellow-800' :
                        contact.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedContact(contact)}
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
};

// Contact Detail Modal Component
interface ContactDetailModalProps {
  contact: ContactWithCampaign;
  onClose: () => void;
}

const ContactDetailModal = ({ contact, onClose }: ContactDetailModalProps) => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCallLogs();
  }, []);

  const fetchCallLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('contact_id', contact.id)
        .order('call_date', { ascending: false });

      if (error) throw error;
      setCallLogs(data || []);
    } catch (err) {
      console.error('Error fetching call logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIntentColor = (intent: IntentLabel): string => {
    switch (intent) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'no-interest':
        return 'bg-red-100 text-red-800';
      case 'follow-up':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntentLabel = (intent: IntentLabel): string => {
    switch (intent) {
      case 'positive':
        return 'Positive';
      case 'no-interest':
        return 'No Interest';
      case 'follow-up':
        return 'Follow-up';
      default:
        return intent;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{contact.name}</h2>
            <p className="text-gray-600 mt-1">{contact.company}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p className="text-gray-900 mt-1">{contact.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900 mt-1">{contact.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Campaign</label>
              <p className="text-gray-900 mt-1">{contact.campaign_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-gray-900 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  contact.status === 'completed' ? 'bg-green-100 text-green-800' :
                  contact.status === 'calling' ? 'bg-yellow-100 text-yellow-800' :
                  contact.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {contact.status}
                </span>
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-600">Profile Summary</label>
              <p className="text-gray-900 mt-1">{contact.profile_summary || 'No summary available'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-600">Pain Points</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {contact.pain_points.length > 0 ? (
                  contact.pain_points.map((point, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                      {point}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No pain points identified</p>
                )}
              </div>
            </div>
          </div>

          {/* Call History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Call History
            </h3>
            {loading ? (
              <p className="text-center py-8 text-gray-500 text-sm">Loading call history...</p>
            ) : callLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No calls yet</p>
            ) : (
              <div className="space-y-4">
                {callLogs.map(log => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(log.call_date).toLocaleString()} • {Math.floor(log.duration / 60)}m {log.duration % 60}s
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getIntentColor(log.intent_label)}`}>
                        {getIntentLabel(log.intent_label)}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">AI Summary:</p>
                      <p className="text-sm text-gray-600">{log.ai_summary}</p>
                    </div>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-primary hover:underline">View Transcript</summary>
                      <pre className="mt-2 p-3 bg-gray-50 rounded text-xs whitespace-pre-wrap">{log.transcript}</pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;