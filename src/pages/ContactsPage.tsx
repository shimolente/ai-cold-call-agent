import { useState, useEffect } from 'react';
import { Search, Users, Phone, Mail, Building2, Filter, ArrowUpDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ContactDetailModal from '../components/contacts/ContactDetailModal';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  profile_summary: string | null;
  pain_points: string[] | null;
  created_at: string;
}

interface CampaignContact {
  id: string;
  contact_id: string;
  campaign_id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  campaigns?: {
    id: string;
    name: string;
  };
}

interface ContactWithCampaign extends Contact {
  campaign_contacts: CampaignContact[];
}

interface Campaign {
  id: string;
  name: string;
}

type SortField = 'name' | 'company' | 'created_at';
type SortOrder = 'asc' | 'desc';

const ContactsPage = () => {
  const [contacts, setContacts] = useState<ContactWithCampaign[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactWithCampaign | null>(null);
  
  // Filter states
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('name');
      
      setCampaigns(campaignsData || []);

      // Fetch contacts
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          campaign_contacts!inner(
            id,
            contact_id,
            campaign_id,
            status,
            created_at,
            campaigns(id, name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setShowSort(false);
  };

  // Filter contacts
  let filteredContacts = contacts.filter(contact => {
    // Search filter
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);
    
    if (!matchesSearch) return false;

    // Campaign filter
    if (selectedCampaignFilter !== 'all') {
      const matchesCampaign = contact.campaign_contacts.some(
        cc => cc.campaigns?.id === selectedCampaignFilter
      );
      if (!matchesCampaign) return false;
    }

    // Status filter
    if (selectedStatusFilter !== 'all') {
      const matchesStatus = contact.campaign_contacts.some(
        cc => cc.status === selectedStatusFilter
      );
      if (!matchesStatus) return false;
    }

    return true;
  });

  // Sort contacts
  filteredContacts = [...filteredContacts].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'company':
        aValue = (a.company || '').toLowerCase();
        bValue = (b.company || '').toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const clearFilters = () => {
    setSelectedCampaignFilter('all');
    setSelectedStatusFilter('all');
    setSearchQuery('');
  };

  const activeFiltersCount = 
    (selectedCampaignFilter !== 'all' ? 1 : 0) +
    (selectedStatusFilter !== 'all' ? 1 : 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Contacts</h1>
        <p className="text-gray-600">Manage your contact database</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts by name, company, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
                activeFiltersCount > 0
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown */}
            {showFilters && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowFilters(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Filters</h3>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-primary hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Campaign Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign
                      </label>
                      <select
                        value={selectedCampaignFilter}
                        onChange={(e) => setSelectedCampaignFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="all">All Campaigns</option>
                        {campaigns.map(campaign => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sort Button */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="px-4 py-3 border border-gray-300 bg-white rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown className="w-5 h-5" />
              <span>Sort</span>
            </button>

            {/* Sort Dropdown */}
            {showSort && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowSort(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => handleSort('name')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                      sortField === 'name' ? 'text-primary font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span>Name</span>
                    {sortField === 'name' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('company')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                      sortField === 'company' ? 'text-primary font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span>Company</span>
                    {sortField === 'company' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('created_at')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                      sortField === 'created_at' ? 'text-primary font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span>Date Added</span>
                    {sortField === 'created_at' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Active filters:</span>
            {selectedCampaignFilter !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                {campaigns.find(c => c.id === selectedCampaignFilter)?.name}
                <button
                  onClick={() => setSelectedCampaignFilter('all')}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            {selectedStatusFilter !== 'all' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                {selectedStatusFilter}
                <button
                  onClick={() => setSelectedStatusFilter('all')}
                  className="hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredContacts.length} of {contacts.length} contacts
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-500 mb-4">
              {contacts.length === 0 
                ? 'Add contacts from the Campaigns page to get started'
                : 'Try adjusting your filters or search query'
              }
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContacts.map(contact => {
                  const campaignContact = contact.campaign_contacts[0];
                  return (
                    <tr 
                      key={contact.id} 
                      onClick={() => setSelectedContact(contact)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-900">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {contact.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {campaignContact?.campaigns?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaignContact?.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : campaignContact?.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {campaignContact?.status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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

export default ContactsPage;