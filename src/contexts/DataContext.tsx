import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Campaign, Contact } from '../types';

interface DataContextType {
  campaigns: Campaign[];
  contacts: Contact[];
  loading: boolean;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => Promise<Contact | null>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addContactToCampaign: (campaignId: string, contactId: string) => Promise<void>;
  removeContactFromCampaign: (campaignContactId: string) => Promise<void>;
  fetchData: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | null>(null);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCampaign = async (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaign])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCampaigns([data, ...campaigns]);
      }
    } catch (err) {
      console.error('Error adding campaign:', err);
      throw err;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (err) {
      console.error('Error updating campaign:', err);
      throw err;
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCampaigns(campaigns.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting campaign:', err);
      throw err;
    }
  };

  const addContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact | null> => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setContacts([data, ...contacts]);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Error adding contact:', err);
      throw err;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setContacts(contacts.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (err) {
      console.error('Error updating contact:', err);
      throw err;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setContacts(contacts.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting contact:', err);
      throw err;
    }
  };

  const addContactToCampaign = async (campaignId: string, contactId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_contacts')
        .insert([{
          campaign_id: campaignId,
          contact_id: contactId,
          status: 'pending'
        }]);

      if (error) throw error;
    } catch (err) {
      console.error('Error adding contact to campaign:', err);
      throw err;
    }
  };

  const removeContactFromCampaign = async (campaignContactId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_contacts')
        .delete()
        .eq('id', campaignContactId);

      if (error) throw error;
    } catch (err) {
      console.error('Error removing contact from campaign:', err);
      throw err;
    }
  };

  const value: DataContextType = {
    campaigns,
    contacts,
    loading,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    addContact,
    updateContact,
    deleteContact,
    addContactToCampaign,
    removeContactFromCampaign,
    fetchData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;