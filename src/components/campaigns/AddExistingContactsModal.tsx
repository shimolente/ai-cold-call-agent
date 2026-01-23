import { useState, useEffect } from 'react';
import { X, Search, Users, Phone, Mail, Building2, Filter, ArrowUpDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  profile_summary: string | null;
  created_at: string;
}

interface AddExistingContactsModalProps {
  campaignId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type SortField = 'name' | 'company' | 'created_at';
type SortOrder = 'asc' | 'desc';

const AddExistingContactsModal = ({ campaignId, onClose, onSuccess }: AddExistingContactsModalProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  // Filter states
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sort states
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showSort, setShowSort] = useState(false);

  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailableContacts();
  }, [campaignId]);

  const fetchAvailableContacts = async () => {
    try {
      setLoading(true);

      // First, get contacts already in this campaign
      const { data: campaignContacts } = await supabase
        .from('campaign_contacts')
        .select('contact_id')
        .eq('campaign_id', campaignId);

      const existingContactIds = campaignContacts?.map(cc => cc.contact_id) || [];

      // Then, get all contacts not in this campaign
      let query = supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (existingContactIds.length > 0) {
        query = query.not('id', 'in', `(${existingContactIds.join(',')})`);
      }

      const { data: allContacts, error } = await query;

      if (error) throw error;
      
      setContacts(allContacts || []);

      // Extract unique companies for filter
      const uniqueCompanies = [...new Set(
        (allContacts || [])
          .map(c => c.company)
          .filter((c): c is string => c !== null && c !== '')
      )].sort();
      setCompanies(uniqueCompanies);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContacts = async () => {
    if (selectedContactIds.length === 0) return;

    try {
      setAdding(true);

      const campaignContactsToInsert = selectedContactIds.map(contactId => ({
        campaign_id: campaignId,
        contact_id: contactId,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('campaign_contacts')
        .insert(campaignContactsToInsert);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding contacts:', err);
      alert('Failed to add contacts. Please try again.');
    } finally {
      setAdding(false);
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

  const handleSelectAll = () => {
    if (selectedContactIds.length === filteredAndSortedContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredAndSortedContacts.map(c => c.id));
    }
  };

  const handleToggleContact = (contactId: string) => {
    if (selectedContactIds.includes(contactId)) {
      setSelectedContactIds(selectedContactIds.filter(id => id !== contactId));
    } else {
      setSelectedContactIds([...selectedContactIds, contactId]);
    }
  };

  const clearFilters = () => {
    setCompanyFilter('all');
    setSearchQuery('');
  };

  // Filter contacts
  let filteredAndSortedContacts = contacts.filter(contact => {
    // Search filter
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);
    
    if (!matchesSearch) return false;

    // Company filter
    if (companyFilter !== 'all') {
      if (contact.company !== companyFilter) return false;
    }

    return true;
  });

  // Sort contacts
  filteredAndSortedContacts = [...filteredAndSortedContacts].sort((a, b) => {
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

  const activeFiltersCount = (companyFilter !== 'all' ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Add from Existing Contacts</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select contacts to add to this campaign
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-gray-200 space-y-4">
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

                      {/* Company Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <select
                          value={companyFilter}
                          onChange={(e) => setCompanyFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="all">All Companies</option>
                          {companies.map(company => (
                            <option key={company} value={company}>
                              {company}
                            </option>
                          ))}
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
              {companyFilter !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                  {companyFilter}
                  <button
                    onClick={() => setCompanyFilter('all')}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Selected Count */}
        {selectedContactIds.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-700">
              {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Results Count */}
        <div className="px-6 py-3 border-b border-gray-200 text-sm text-gray-600">
          Showing {filteredAndSortedContacts.length} of {contacts.length} contacts
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading contacts...</div>
          ) : filteredAndSortedContacts.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts available</h3>
              <p className="text-gray-500 mb-4">
                {contacts.length === 0
                  ? 'All contacts are already in this campaign'
                  : 'Try adjusting your filters or search query'}
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
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.length === filteredAndSortedContacts.length && filteredAndSortedContacts.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedContacts.map(contact => (
                  <tr
                    key={contact.id}
                    onClick={() => handleToggleContact(contact.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedContactIds.includes(contact.id)}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            {filteredAndSortedContacts.length} contact{filteredAndSortedContacts.length !== 1 ? 's' : ''} available
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddContacts}
              disabled={selectedContactIds.length === 0 || adding}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding...' : `Add ${selectedContactIds.length > 0 ? `${selectedContactIds.length} ` : ''}Contact${selectedContactIds.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExistingContactsModal;