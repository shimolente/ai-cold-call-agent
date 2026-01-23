import { createContext } from 'react';
import type { Campaign, Contact } from '../types';

export interface DataContextType {
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