import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Papa from 'papaparse';

interface UploadContactsModalProps {
  campaignId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CSVRow {
  Name?: string;
  name?: string;
  Phone?: string;
  phone?: string;
  Email?: string;
  email?: string;
  Company?: string;
  company?: string;
  'Profile Summary'?: string;
  profile_summary?: string;
  'Pain Points'?: string;
  pain_points?: string;
}

const UploadContactsModal = ({ campaignId, onClose, onSuccess }: UploadContactsModalProps) => {
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!csvText.trim()) {
      setError('Please paste CSV data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Parse CSV
      const result = Papa.parse<CSVRow>(csvText, {
        header: true,
        skipEmptyLines: true
      });

      if (result.errors.length > 0) {
        setError('Invalid CSV format');
        return;
      }

      const contacts = result.data.map((row: CSVRow) => ({
        name: row.Name || row.name || '',
        phone: row.Phone || row.phone || '',
        email: row.Email || row.email || '',
        company: row.Company || row.company || '',
        profile_summary: row['Profile Summary'] || row.profile_summary || null,
        pain_points: row['Pain Points'] ? row['Pain Points'].split(';').map((p: string) => p.trim()) : []
      }));

      // Insert contacts into database
      const { data: insertedContacts, error: insertError } = await supabase
        .from('contacts')
        .insert(contacts)
        .select();

      if (insertError) throw insertError;

      // Link contacts to campaign
      if (insertedContacts) {
        const campaignContacts = insertedContacts.map(contact => ({
          campaign_id: campaignId,
          contact_id: contact.id,
          status: 'pending'
        }));

        const { error: linkError } = await supabase
          .from('campaign_contacts')
          .insert(campaignContacts);

        if (linkError) throw linkError;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error uploading contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload contacts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Upload Contacts</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste CSV Data
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Name,Phone,Email,Company,Profile Summary,Pain Points&#10;John Doe,555-0100,john@example.com,Acme Inc,CEO of startup,Manual processes;High costs"
              className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Expected columns: Name, Phone, Email, Company, Profile Summary, Pain Points (semicolon-separated)
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Contacts'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadContactsModal;