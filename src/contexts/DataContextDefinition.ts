import { createContext } from 'react';
import type { Campaign, Contact, USP, CallLog, AppData } from '../types';

export interface DataContextType {
  data: AppData;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  addUSP: (usp: Omit<USP, 'id' | 'usageCount' | 'createdAt'>) => void;
  updateUSP: (id: string, updates: Partial<USP>) => void;
  deleteUSP: (id: string) => void;
  addContacts: (contacts: Omit<Contact, 'id' | 'campaigns'>[], campaignId?: string) => void;
  runCampaign: (campaignId: string) => void;
}

export const DataContext = createContext<DataContextType | null>(null);