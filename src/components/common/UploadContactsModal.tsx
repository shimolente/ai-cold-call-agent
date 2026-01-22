import { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { useData } from '../../hooks/useData';

interface UploadContactsModalProps {
  campaignId: string;
  onClose: () => void;
}

interface ParsedContact {
  name: string;
  phone: string;
  company: string;
  email: string;
  profileSummary: string;
  painPoints: string[];
}

const UploadContactsModal = ({ campaignId, onClose }: UploadContactsModalProps) => {
  const { addContacts } = useData();
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Parse CSV
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setError('CSV must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Check required fields
      const requiredFields = ['name', 'phone'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      const contacts: ParsedContact[] = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const contactData: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          contactData[header] = values[index] || '';
        });

        // Handle pain points (could be comma-separated or single)
        const painPoints = contactData.painpoints || contactData['pain points'] || '';
        const painPointsArray = painPoints ? painPoints.split(';').map(p => p.trim()) : [];

        return {
          name: contactData.name,
          phone: contactData.phone,
          company: contactData.company || '',
          email: contactData.email || '',
          profileSummary: contactData.profilesummary || contactData['profile summary'] || '',
          painPoints: painPointsArray
        };
      });

      addContacts(contacts, campaignId);
      onClose();
    } catch (err) {
      console.error('CSV parsing error:', err);
      setError('Failed to parse CSV. Please check the format.');
    }
  };

  const downloadTemplate = () => {
    const template = 'name,phone,company,email,profileSummary,painPoints\nJohn Doe,555-1234,Acme Corp,john@acme.com,VP of Sales,slow support;high costs\nJane Smith,555-5678,Tech Inc,jane@tech.com,CTO,downtime issues;poor integration';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact-template.csv';
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Upload Contacts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Upload CSV File
              </label>
              <button
                type="button"
                onClick={downloadTemplate}
                className="text-sm text-primary hover:underline"
              >
                Download Template
              </button>
            </div>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            
            <p className="mt-2 text-xs text-gray-500">
              Required columns: name, phone. Optional: company, email, profileSummary, painPoints (use semicolon to separate multiple pain points)
            </p>
          </div>

          {csvText && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV Preview
              </label>
              <textarea
                value={csvText.split('\n').slice(0, 6).join('\n')}
                readOnly
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                Showing first 5 rows
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!csvText}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Upload Contacts
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadContactsModal;