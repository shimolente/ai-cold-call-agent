import { createContext } from 'react';

export interface DataContextType {
  data: {
    campaigns: unknown[];
    contacts: unknown[];
    usps: unknown[];
    callLogs: unknown[];
  };
  addCampaign: (campaign: unknown) => void;
  updateCampaign: (id: string, updates: unknown) => void;
  deleteCampaign: (id: string) => void;
  addUSP: (usp: unknown) => void;
  updateUSP: (id: string, updates: unknown) => void;
  deleteUSP: (id: string) => void;
  addContacts: (contacts: unknown[], campaignId?: string) => void;
  runCampaign: (campaignId: string) => void;
}

export const DataContext = createContext<DataContextType | null>(null);