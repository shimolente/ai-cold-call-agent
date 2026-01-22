import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Play, Trash2, Edit2, Check, X, Phone, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CampaignSettingsModal from '../components/campaigns/CampaignSettingsModal';
import type { Campaign, Contact, CallLog, IntentLabel } from '../types';

const CampaignDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ contactId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [addingRow, setAddingRow] = useState(false);
  const [running, setRunning] = useState(false);
  const [selectedContactForTranscript, setSelectedContactForTranscript] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    company: '',
    email: '',
    profile_summary: '',
    pain_points: ''
  });

  useEffect(() => {
    if (id) {
      fetchCampaignData();
    }
  }, [id]);

  const fetchCampaignData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);
    } catch (err) {
      console.error('Error fetching campaign data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (contactId: string, field: string, currentValue: string | string[]) => {
    setEditingCell({ contactId, field });
    if (field === 'pain_points') {
      setEditValue(Array.isArray(currentValue) ? currentValue.join('; ') : '');
    } else {
      setEditValue(currentValue as string || '');
    }
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    const { contactId, field } = editingCell;
    let valueToSave: string | string[] = editValue;

    if (field === 'pain_points') {
      valueToSave = editValue.split(';').map(p => p.trim()).filter(p => p);
    }

    const { error } = await supabase
      .from('contacts')
      .update({ [field]: valueToSave })
      .eq('id', contactId);

    if (!error) {
      await fetchCampaignData();
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleAddContact = async () => {
    if (!id || !newContact.name || !newContact.phone) {
      alert('Name and Phone are required');
      return;
    }

    const { error } = await supabase
      .from('contacts')
      .insert([{
        campaign_id: id,
        name: newContact.name,
        phone: newContact.phone,
        company: newContact.company || null,
        email: newContact.email || null,
        profile_summary: newContact.profile_summary || null,
        pain_points: newContact.pain_points 
          ? newContact.pain_points.split(';').map(p => p.trim()).filter(p => p)
          : []
      }]);

    if (!error) {
      setNewContact({ name: '', phone: '', company: '', email: '', profile_summary: '', pain_points: '' });
      setAddingRow(false);
      await fetchCampaignData();
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Delete this contact?')) return;

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (!error) {
      await fetchCampaignData();
    }
  };

  const runCampaign = async () => {
    if (!id || !campaign) return;
    
    const pendingContacts = contacts.filter(c => c.status === 'pending');
    
    if (pendingContacts.length === 0) {
      alert('No pending contacts to call');
      return;
    }

    if (!window.confirm(`Start calling ${pendingContacts.length} pending contacts? (Simulated for 10 seconds)`)) {
      return;
    }

    setRunning(true);

    // Update all pending contacts to 'calling' status
    for (const contact of pendingContacts) {
      await supabase
        .from('contacts')
        .update({ status: 'calling' })
        .eq('id', contact.id);
    }

    await fetchCampaignData();

    // Simulate calls after 10 seconds
    setTimeout(async () => {
      const intents: IntentLabel[] = ['positive', 'no-interest', 'follow-up'];
      
      for (const contact of pendingContacts) {
        // Random intent
        const intent = intents[Math.floor(Math.random() * intents.length)];
        
        // Random duration between 60-240 seconds (1-4 minutes)
        const duration = Math.floor(Math.random() * 180) + 60;
        
        // Generate transcript
        const transcript = generateTranscript(contact, intent);
        
        // Generate AI summary
        const aiSummary = generateAISummary(contact, intent);
        
        // Create call log
        await supabase
          .from('call_logs')
          .insert([{
            contact_id: contact.id,
            campaign_id: id,
            call_date: new Date().toISOString(),
            duration,
            transcript,
            recording_url: `https://example.com/recordings/${contact.id}-${Date.now()}.mp3`,
            ai_summary: aiSummary,
            intent_label: intent,
            pain_points_discussed: contact.pain_points.slice(0, 2),
            usps_used: campaign.selected_usps.slice(0, 2)
          }]);
        
        // Update contact status to completed
        await supabase
          .from('contacts')
          .update({ status: 'completed' })
          .eq('id', contact.id);
      }

      setRunning(false);
      await fetchCampaignData();
      alert(`Campaign completed! Called ${pendingContacts.length} contacts.`);
    }, 10000);
  };

  const generateTranscript = (contact: Contact, intent: IntentLabel): string => {
    const painPoint = contact.pain_points[0] || 'your business needs';
    
    const intros = [
      `AI: Hi ${contact.name}, this is Alex calling from our company. How are you today?`,
      `AI: Good morning ${contact.name}, my name is Alex. I hope I'm not catching you at a bad time?`,
      `AI: Hello ${contact.name}, this is Alex. Do you have a quick moment to chat?`
    ];
    
    const intro = intros[Math.floor(Math.random() * intros.length)];
    
    if (intent === 'positive') {
      return `${intro}

${contact.name}: I'm doing well, thanks. What's this about?

AI: I'm reaching out because I noticed you might be experiencing challenges with ${painPoint}. We've helped companies like ${contact.company || 'yours'} solve similar issues. Would you be interested in learning more?

${contact.name}: Yes, actually! We've been struggling with that. Tell me more.

AI: Great! Let me share how we've helped other clients improve their ${painPoint}. We have a solution that typically reduces these issues by 40-60% within the first month.

${contact.name}: That sounds interesting. Can we schedule a demo?

AI: Absolutely! I'd love to show you how it works. Let me get that set up for you right away.`;
    } else if (intent === 'no-interest') {
      return `${intro}

${contact.name}: I'm busy right now. What is this regarding?

AI: I understand you're busy. I'm calling about ${painPoint} solutions. We've worked with companies like ${contact.company || 'yours'} to help improve their operations.

${contact.name}: We're not interested right now. We have other priorities.

AI: I completely understand. Would it be helpful if I sent you some information you could review when you have time?

${contact.name}: No thanks, we're all set for now.

AI: No problem at all. Thank you for your time, ${contact.name}. Have a great day!`;
    } else { // follow-up
      return `${intro}

${contact.name}: Hi, I'm actually in the middle of something right now.

AI: I completely understand. I'm calling about solutions for ${painPoint}. Does this sound like something that might be relevant to you?

${contact.name}: Potentially, but this week is really hectic. Can you call back next week?

AI: Absolutely! I'll make a note to follow up with you next week. What day works best for you?

${contact.name}: Tuesday afternoon would be better.

AI: Perfect! I'll reach out Tuesday afternoon. Thanks for your time, ${contact.name}!`;
    }
  };

  const generateAISummary = (contact: Contact, intent: IntentLabel): string => {
    const painPoint = contact.pain_points[0] || 'operational challenges';
    
    if (intent === 'positive') {
      return `Positive conversation with ${contact.name}. Strong interest in our solution for ${painPoint}. Contact mentioned they've been actively looking for solutions. Ready to schedule demo. High potential lead.`;
    } else if (intent === 'no-interest') {
      return `Spoke with ${contact.name}. Currently not interested in solutions for ${painPoint}. Cited other priorities. Polite but firm. Not the right time. Recommend follow-up in 6 months.`;
    } else {
      return `Brief conversation with ${contact.name}. Interested but timing is not ideal. Currently dealing with busy period. Agreed to follow-up call next Tuesday afternoon. Moderate potential.`;
    }
  };

  const stats = {
    total: contacts.length,
    pending: contacts.filter(c => c.status === 'pending').length,
    calling: contacts.filter(c => c.status === 'calling').length,
    completed: contacts.filter(c => c.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-gray-500 mb-4">Campaign not found</div>
        <button
          onClick={() => navigate('/campaigns')}
          className="text-primary hover:underline"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Campaigns
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-gray-600">{campaign.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
            {stats.pending > 0 && (
              <button
                onClick={runCampaign}
                disabled={running}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                {running ? 'Running...' : 'Run Campaign'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Contacts</div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="text-2xl font-semibold text-blue-900">{stats.pending}</div>
          <div className="text-sm text-blue-600">Pending</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
          <div className="text-2xl font-semibold text-yellow-900">{stats.calling}</div>
          <div className="text-sm text-yellow-600">Calling</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-6">
          <div className="text-2xl font-semibold text-green-900">{stats.completed}</div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
          <button
            onClick={() => setAddingRow(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Profile Summary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pain Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Call Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Add New Row */}
              {addingRow && (
                <tr className="bg-blue-50">
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="Name *"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="Phone *"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={newContact.company}
                      onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                      placeholder="Company"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="Email"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={newContact.profile_summary}
                      onChange={(e) => setNewContact({ ...newContact, profile_summary: e.target.value })}
                      placeholder="Profile Summary"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={newContact.pain_points}
                      onChange={(e) => setNewContact({ ...newContact, pain_points: e.target.value })}
                      placeholder="Pain points (use ; to separate)"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs text-gray-500">pending</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs text-gray-400">-</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleAddContact}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setAddingRow(false);
                          setNewContact({ name: '', phone: '', company: '', email: '', profile_summary: '', pain_points: '' });
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Existing Contacts */}
              {contacts.length === 0 && !addingRow ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No contacts yet. Add your first contact to get started.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      {editingCell?.contactId === contact.id && editingCell.field === 'name' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                            className="w-full px-2 py-1 border border-primary rounded text-sm"
                            autoFocus
                          />
                          <button onClick={handleCellSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingCell(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleCellClick(contact.id, 'name', contact.name)}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm group flex items-center gap-2"
                        >
                          <span>{contact.name}</span>
                          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-3">
                      {editingCell?.contactId === contact.id && editingCell.field === 'phone' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                            className="w-full px-2 py-1 border border-primary rounded text-sm"
                            autoFocus
                          />
                          <button onClick={handleCellSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingCell(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleCellClick(contact.id, 'phone', contact.phone)}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm group flex items-center gap-2"
                        >
                          <span>{contact.phone}</span>
                          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-3">
                      {editingCell?.contactId === contact.id && editingCell.field === 'company' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                            className="w-full px-2 py-1 border border-primary rounded text-sm"
                            autoFocus
                          />
                          <button onClick={handleCellSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingCell(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleCellClick(contact.id, 'company', contact.company || '')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm group flex items-center gap-2"
                        >
                          <span>{contact.company || '-'}</span>
                          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-3">
                      {editingCell?.contactId === contact.id && editingCell.field === 'email' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="email"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                            className="w-full px-2 py-1 border border-primary rounded text-sm"
                            autoFocus
                          />
                          <button onClick={handleCellSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingCell(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleCellClick(contact.id, 'email', contact.email || '')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm group flex items-center gap-2"
                        >
                          <span>{contact.email || '-'}</span>
                          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-3 relative group">
      {editingCell?.contactId === contact.id && editingCell.field === 'profile_summary' ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border border-primary rounded text-sm"
            autoFocus
          />
          <button onClick={handleCellSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setEditingCell(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div
            onClick={() => handleCellClick(contact.id, 'profile_summary', contact.profile_summary || '')}
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-2"
          >
            <span className="truncate max-w-[200px]">
              {contact.profile_summary || '-'}
            </span>
            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400 flex-shrink-0" />
          </div>
          {contact.profile_summary && contact.profile_summary.length > 40 && (
            <div className="absolute left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10 max-w-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
              {contact.profile_summary}
            </div>
          )}
        </>
      )}
    </td>

                    {/* Pain Points */}
<td className="px-6 py-3 relative group">
  {editingCell?.contactId === contact.id && editingCell.field === 'pain_points' ? (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
        placeholder="Use ; to separate"
        className="w-full px-2 py-1 border border-primary rounded text-sm"
        autoFocus
      />
      <button onClick={handleCellSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => setEditingCell(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <>
      <div
        onClick={() => handleCellClick(contact.id, 'pain_points', contact.pain_points)}
        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-2"
      >
        <span className="truncate max-w-[200px] text-red-700">
          {contact.pain_points.length > 0 ? contact.pain_points.join(' • ') : '-'}
        </span>
        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400 flex-shrink-0" />
      </div>
      {contact.pain_points.length > 0 && (
        <div className="absolute left-0 top-full mt-1 bg-white text-gray-900 text-xs rounded-lg p-3 shadow-lg border border-gray-200 z-10 max-w-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
          <div className="flex flex-wrap gap-2">
            {contact.pain_points.map((point: string, idx: number) => (
              <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded">
                {point}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  )}
</td>

                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        contact.status === 'completed' ? 'bg-green-100 text-green-800' :
                        contact.status === 'calling' ? 'bg-yellow-100 text-yellow-800' :
                        contact.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {contact.status}
                      </span>
                    </td>

                    <td className="px-6 py-3">
                      {contact.status === 'completed' ? (
                        <button
                          onClick={() => setSelectedContactForTranscript(contact)}
                          className="flex items-center gap-1 text-primary hover:underline text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          View Call
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>

                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <CampaignSettingsModal
          campaign={campaign}
          onClose={() => setShowSettings(false)}
          onUpdate={fetchCampaignData}
        />
      )}

      {/* Transcript Modal */}
      {selectedContactForTranscript && (
        <TranscriptModal
          contact={selectedContactForTranscript}
          campaignId={id!}
          onClose={() => setSelectedContactForTranscript(null)}
        />
      )}
    </div>
  );
};

// Transcript Modal Component
interface TranscriptModalProps {
  contact: Contact;
  campaignId: string;
  onClose: () => void;
}

const TranscriptModal = ({ contact, campaignId, onClose }: TranscriptModalProps) => {
  const [callLog, setCallLog] = useState<CallLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCallLog();
  }, []);

  const fetchCallLog = async () => {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('contact_id', contact.id)
        .eq('campaign_id', campaignId)
        .order('call_date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setCallLog(data);
    } catch (err) {
      console.error('Error fetching call log:', err);
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
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading call details...</p>
          ) : !callLog ? (
            <p className="text-center py-8 text-gray-500">No call log found</p>
          ) : (
            <div className="space-y-6">
              {/* Call Metadata */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {new Date(callLog.call_date).toLocaleString()} • {Math.floor(callLog.duration / 60)}m {callLog.duration % 60}s
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getIntentColor(callLog.intent_label)}`}>
                  {getIntentLabel(callLog.intent_label)}
                </span>
              </div>

              {/* Recording */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Call Recording</h3>
                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Recording Available</p>
                      <p className="text-xs text-gray-500">Duration: {Math.floor(callLog.duration / 60)}:{String(callLog.duration % 60).padStart(2, '0')}</p>
                    </div>
                  </div>
                  <a
                    href={callLog.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Play Recording
                  </a>
                </div>
              </div>

              {/* AI Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Summary</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-800">{callLog.ai_summary}</p>
                </div>
              </div>

              {/* Pain Points Discussed */}
              {callLog.pain_points_discussed.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Pain Points Discussed</h3>
                  <div className="flex flex-wrap gap-2">
                    {callLog.pain_points_discussed.map((point, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Full Transcript</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{callLog.transcript}</pre>
                </div>
              </div>
            </div>
          )}
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

export default CampaignDetailPage;