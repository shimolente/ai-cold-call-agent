import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Campaign, Contact, USP, CallLog, AppData, CallStatus, IntentLabel } from '../types';
import { DataContext } from './DataContextDefinition';

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('aiCallAgentData');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      campaigns: [],
      contacts: [],
      usps: [],
      callLogs: []
    };
  });

  useEffect(() => {
    localStorage.setItem('aiCallAgentData', JSON.stringify(data));
  }, [data]);

  const addCampaign = (campaign: Omit<Campaign, 'id' | 'createdAt'>) => {
    const newCampaign: Campaign = {
      ...campaign,
      id: `camp_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setData(prev => ({ ...prev, campaigns: [...prev.campaigns, newCampaign] }));
  };

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    setData(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const deleteCampaign = (id: string) => {
    setData(prev => ({
      ...prev,
      campaigns: prev.campaigns.filter(c => c.id !== id),
      contacts: prev.contacts.map(contact => ({
        ...contact,
        campaigns: contact.campaigns.filter(cp => cp.campaignId !== id)
      })),
      callLogs: prev.callLogs.filter(log => log.campaignId !== id)
    }));
  };

  const addUSP = (usp: Omit<USP, 'id' | 'usageCount' | 'createdAt'>) => {
    const newUSP: USP = {
      ...usp,
      id: `usp_${Date.now()}`,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };
    setData(prev => ({ ...prev, usps: [...prev.usps, newUSP] }));
  };

  const updateUSP = (id: string, updates: Partial<USP>) => {
    setData(prev => ({
      ...prev,
      usps: prev.usps.map(u => u.id === id ? { ...u, ...updates } : u)
    }));
  };

  const deleteUSP = (id: string) => {
    setData(prev => ({
      ...prev,
      usps: prev.usps.filter(u => u.id !== id)
    }));
  };

  const addContacts = (contacts: Omit<Contact, 'id' | 'campaigns'>[], campaignId?: string) => {
    setData(prev => {
      const updatedContacts = [...prev.contacts];
      const campaign = campaignId ? prev.campaigns.find(c => c.id === campaignId) : null;

      contacts.forEach(newContact => {
        const existingIndex = updatedContacts.findIndex(c => c.phone === newContact.phone);
        
        if (existingIndex >= 0) {
          // Merge with existing contact
          const existing = updatedContacts[existingIndex];
          if (campaignId && campaign) {
            const hasAssociation = existing.campaigns.some(cp => cp.campaignId === campaignId);
            if (!hasAssociation) {
              existing.campaigns.push({
                campaignId,
                campaignName: campaign.name,
                status: 'pending',
                addedDate: new Date().toISOString()
              });
            }
          }
        } else {
          // Add new contact
          const contact: Contact = {
            ...newContact,
            id: `contact_${Date.now()}_${Math.random()}`,
            campaigns: campaignId && campaign ? [{
              campaignId,
              campaignName: campaign.name,
              status: 'pending',
              addedDate: new Date().toISOString()
            }] : []
          };
          updatedContacts.push(contact);
        }
      });

      // Update campaign counts
      const updatedCampaigns = prev.campaigns.map(c => {
        if (c.id === campaignId) {
          const contactsInCampaign = updatedContacts.filter(contact =>
            contact.campaigns.some(cp => cp.campaignId === campaignId)
          );
          return {
            ...c,
            totalContacts: contactsInCampaign.length,
            pendingCount: contactsInCampaign.filter(contact =>
              contact.campaigns.find(cp => cp.campaignId === campaignId)?.status === 'pending'
            ).length
          };
        }
        return c;
      });

      return { ...prev, contacts: updatedContacts, campaigns: updatedCampaigns };
    });
  };

  const runCampaign = (campaignId: string) => {
    const campaign = data.campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Simulate calls after 10 seconds
    setTimeout(() => {
      setData(prev => {
        const newCallLogs: CallLog[] = [];
        const intents: IntentLabel[] = ['positive', 'no-interest', 'follow-up'];
        
        const updatedContacts = prev.contacts.map(contact => {
          const campaignAssoc = contact.campaigns.find(cp => cp.campaignId === campaignId);
          if (campaignAssoc && campaignAssoc.status === 'pending') {
            const intent = intents[Math.floor(Math.random() * intents.length)];
            const duration = Math.floor(Math.random() * 180) + 60; // 1-4 minutes
            
            const callLog: CallLog = {
              id: `call_${Date.now()}_${Math.random()}`,
              contactId: contact.id,
              campaignId,
              campaignName: campaign.name,
              date: new Date().toISOString(),
              duration,
              transcript: `AI: Hi ${contact.name}, this is Alex from our company calling about ${contact.painPoints[0] || 'your business needs'}...\n\n${contact.name}: ${intent === 'positive' ? 'Yes, I\'m interested! Tell me more.' : intent === 'no-interest' ? 'Not interested, thanks.' : 'Can you call back next week? We\'re busy right now.'}\n\nAI: ${intent === 'positive' ? 'Great! Let me share how we can help...' : intent === 'no-interest' ? 'I understand. Thank you for your time.' : 'Absolutely! I\'ll follow up next week.'}`,
              recordingUrl: '#',
              aiSummary: intent === 'positive' 
                ? `Prospect showed strong interest. Mentioned challenges with ${contact.painPoints[0] || 'their current solution'}. Ready for next steps.`
                : intent === 'no-interest'
                ? `Prospect declined. Not the right time. No clear pain points identified.`
                : `Prospect interested but needs more time. Requested follow-up next week.`,
              intentLabel: intent,
              painPointsDiscussed: contact.painPoints.slice(0, 2),
              uspsUsed: campaign.selectedUSPs.slice(0, 2)
            };

            newCallLogs.push(callLog);

            return {
              ...contact,
              campaigns: contact.campaigns.map(cp =>
                cp.campaignId === campaignId ? { ...cp, status: 'completed' as CallStatus } : cp
              ),
              lastCallDate: new Date().toISOString(),
              lastIntent: intent
            };
          }
          return contact;
        });

        const updatedCampaigns = prev.campaigns.map(c => {
          if (c.id === campaignId) {
            return {
              ...c,
              calledCount: c.totalContacts,
              pendingCount: 0,
              status: 'completed' as const
            };
          }
          return c;
        });

        return {
          ...prev,
          contacts: updatedContacts,
          campaigns: updatedCampaigns,
          callLogs: [...prev.callLogs, ...newCallLogs]
        };
      });
    }, 10000);
  };

  return (
    <DataContext.Provider value={{ 
      data, 
      addCampaign, 
      updateCampaign, 
      deleteCampaign, 
      addUSP, 
      updateUSP, 
      deleteUSP, 
      addContacts, 
      runCampaign 
    }}>
      {children}
    </DataContext.Provider>
  );
};