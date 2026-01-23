import { useState, useEffect } from 'react';
import { X, Phone, Mail, Building2, User, Clock, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  profile_summary: string | null;
  pain_points: string[] | null;
  created_at: string;
  campaign_contacts?: Array<{
    id: string;
    campaign_id: string;
    status: string;
    campaign?: {
      name: string;
    };
    campaigns?: {
      name: string;
    };
  }>;
}

interface CallLog {
  id: string;
  contact_id: string;
  campaign_id: string;
  call_date: string;
  duration: number;
  intent_label: string;
  transcript: string;
  recording_url: string;
  ai_summary: string;
  pain_points_discussed: string[] | null;
  usps_used: string[] | null;
}

interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
}

const ContactDetailModal = ({ contact, onClose }: ContactDetailModalProps) => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);

  useEffect(() => {
    fetchCallLogs();
  }, [contact.id]);

  const fetchCallLogs = async () => {
    try {
      setLoading(true);
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

  const getIntentColor = (intent: string) => {
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

  const getIntentLabel = (intent: string) => {
    switch (intent) {
      case 'positive':
        return 'Positive';
      case 'no-interest':
        return 'No Interest';
      case 'follow-up':
        return 'Follow Up';
      default:
        return intent;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{contact.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Contact Details & Call History</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{contact.phone}</p>
                  </div>
                </div>

                {contact.email && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{contact.email}</p>
                    </div>
                  </div>
                )}

                {contact.company && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-sm font-medium text-gray-900">{contact.company}</p>
                    </div>
                  </div>
                )}
              </div>

              {contact.profile_summary && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Profile Summary</p>
                  <p className="text-sm text-gray-700">{contact.profile_summary}</p>
                </div>
              )}

              {contact.pain_points && contact.pain_points.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Pain Points</p>
                  <ul className="space-y-1">
                    {contact.pain_points.map((point, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {contact.campaign_contacts && contact.campaign_contacts.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Campaign</p>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {contact.campaign_contacts[0]?.campaign?.name || contact.campaign_contacts[0]?.campaigns?.name || 'Unknown Campaign'}
                  </span>
                </div>
              )}
            </div>

            {/* Call History */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Call History ({callLogs.length})
              </h3>

              {loading ? (
                <p className="text-center py-8 text-gray-500 text-sm">Loading call history...</p>
              ) : callLogs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No calls yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callLogs.map(log => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-600">
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

                      {log.pain_points_discussed && log.pain_points_discussed.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Pain Points Discussed:</p>
                          <div className="flex flex-wrap gap-1">
                            {log.pain_points_discussed.map((point, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {log.usps_used && log.usps_used.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">USPs Used:</p>
                          <div className="flex flex-wrap gap-1">
                            {log.usps_used.map((usp, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                {usp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-sm">
                        <button
                          onClick={() => setExpandedTranscript(expandedTranscript === log.id ? null : log.id)}
                          className="text-primary hover:underline"
                        >
                          {expandedTranscript === log.id ? 'Hide' : 'View'} Transcript
                        </button>
                        <span className="text-gray-300">•</span>
                        <a
                          href={log.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Play Recording
                        </a>
                      </div>

                      {expandedTranscript === log.id && (
                        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans">{log.transcript}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
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

export default ContactDetailModal;