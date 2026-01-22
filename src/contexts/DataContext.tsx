import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DataContext } from './DataContextDefinition';

interface AppData {
  campaigns: unknown[];
  contacts: unknown[];
  usps: unknown[];
  callLogs: unknown[];
}

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('aiCallAgentData');
    if (saved) {
      return JSON.parse(saved) as AppData;
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

  const addCampaign = (campaign: unknown) => {
    const newCampaign = {
      ...campaign as Record<string, unknown>,
      id: `camp_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setData((prev: AppData) => ({ ...prev, campaigns: [...prev.campaigns, newCampaign] }));
  };

  const updateCampaign = (id: string, updates: unknown) => {
    setData((prev: AppData) => ({
      ...prev,
      campaigns: prev.campaigns.map((c: unknown) => {
        const campaign = c as Record<string, unknown>;
        return campaign.id === id ? { ...campaign, ...updates as Record<string, unknown> } : campaign;
      })
    }));
  };

  const deleteCampaign = (id: string) => {
    setData((prev: AppData) => ({
      ...prev,
      campaigns: prev.campaigns.filter((c: unknown) => (c as Record<string, unknown>).id !== id),
      contacts: prev.contacts.map((contact: unknown) => {
        const c = contact as Record<string, unknown>;
        return {
          ...c,
          campaigns: (c.campaigns as unknown[] || []).filter((cp: unknown) => 
            (cp as Record<string, unknown>).campaignId !== id
          )
        };
      }),
      callLogs: prev.callLogs.filter((log: unknown) => 
        (log as Record<string, unknown>).campaignId !== id
      )
    }));
  };

  const addUSP = (usp: unknown) => {
    const newUSP = {
      ...usp as Record<string, unknown>,
      id: `usp_${Date.now()}`,
      usage_count: 0,
      created_at: new Date().toISOString()
    };
    setData((prev: AppData) => ({ ...prev, usps: [...prev.usps, newUSP] }));
  };

  const updateUSP = (id: string, updates: unknown) => {
    setData((prev: AppData) => ({
      ...prev,
      usps: prev.usps.map((u: unknown) => {
        const usp = u as Record<string, unknown>;
        return usp.id === id ? { ...usp, ...updates as Record<string, unknown> } : usp;
      })
    }));
  };

  const deleteUSP = (id: string) => {
    setData((prev: AppData) => ({
      ...prev,
      usps: prev.usps.filter((u: unknown) => (u as Record<string, unknown>).id !== id)
    }));
  };

  const addContacts = (contacts: unknown[], campaignId?: string) => {
    setData((prev: AppData) => {
      const updatedContacts = [...prev.contacts];
      const campaign = campaignId ? prev.campaigns.find((c: unknown) => 
        (c as Record<string, unknown>).id === campaignId
      ) as Record<string, unknown> | undefined : null;

      contacts.forEach((newContact: unknown) => {
        const nc = newContact as Record<string, unknown>;
        const existingIndex = updatedContacts.findIndex((c: unknown) => 
          (c as Record<string, unknown>).phone === nc.phone
        );
        
        if (existingIndex >= 0) {
          const existing = updatedContacts[existingIndex] as Record<string, unknown>;
          if (campaignId && campaign) {
            const campaigns = (existing.campaigns as unknown[] || []);
            const hasAssociation = campaigns.some((cp: unknown) => 
              (cp as Record<string, unknown>).campaignId === campaignId
            );
            if (!hasAssociation) {
              campaigns.push({
                campaignId,
                campaignName: campaign.name,
                status: 'pending',
                addedDate: new Date().toISOString()
              });
              existing.campaigns = campaigns;
            }
          }
        } else {
          const contact = {
            ...nc,
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

      const updatedCampaigns = prev.campaigns.map((c: unknown) => {
        const camp = c as Record<string, unknown>;
        if (camp.id === campaignId) {
          const contactsInCampaign = updatedContacts.filter((contact: unknown) => {
            const ct = contact as Record<string, unknown>;
            return (ct.campaigns as unknown[] || []).some((cp: unknown) => 
              (cp as Record<string, unknown>).campaignId === campaignId
            );
          });
          return {
            ...camp,
            total_contacts: contactsInCampaign.length,
            pending_count: contactsInCampaign.filter((contact: unknown) => {
              const ct = contact as Record<string, unknown>;
              const assoc = (ct.campaigns as unknown[] || []).find((cp: unknown) => 
                (cp as Record<string, unknown>).campaignId === campaignId
              ) as Record<string, unknown> | undefined;
              return assoc?.status === 'pending';
            }).length
          };
        }
        return camp;
      });

      return { ...prev, contacts: updatedContacts, campaigns: updatedCampaigns };
    });
  };

  const runCampaign = (campaignId: string) => {
    const campaign = data.campaigns.find((c: unknown) => 
      (c as Record<string, unknown>).id === campaignId
    ) as Record<string, unknown> | undefined;
    if (!campaign) return;

    setTimeout(() => {
      setData((prev: AppData) => {
        const newCallLogs: unknown[] = [];
        const intents = ['positive', 'no-interest', 'follow-up'];
        
        const updatedContacts = prev.contacts.map((contact: unknown) => {
          const ct = contact as Record<string, unknown>;
          const campaignAssoc = (ct.campaigns as unknown[] || []).find((cp: unknown) => 
            (cp as Record<string, unknown>).campaignId === campaignId
          ) as Record<string, unknown> | undefined;
          
          if (campaignAssoc && campaignAssoc.status === 'pending') {
            const intent = intents[Math.floor(Math.random() * intents.length)];
            const duration = Math.floor(Math.random() * 180) + 60;
            
            const callLog = {
              id: `call_${Date.now()}_${Math.random()}`,
              contact_id: ct.id,
              campaignId,
              campaignName: campaign.name,
              date: new Date().toISOString(),
              duration,
              transcript: `AI: Hi ${ct.name}, this is Alex from our company...\n\n${ct.name}: Response here...`,
              recordingUrl: '#',
              aiSummary: 'Call summary here',
              intentLabel: intent,
              painPointsDiscussed: ((ct.pain_points as unknown[] || []).slice(0, 2)),
              uspsUsed: ((campaign.selected_usps as unknown[] || []).slice(0, 2))
            };

            newCallLogs.push(callLog);

            return {
              ...ct,
              campaigns: (ct.campaigns as unknown[] || []).map((cp: unknown) => {
                const c = cp as Record<string, unknown>;
                return c.campaignId === campaignId ? { ...c, status: 'completed' } : c;
              }),
              lastCallDate: new Date().toISOString(),
              lastIntent: intent
            };
          }
          return ct;
        });

        const updatedCampaigns = prev.campaigns.map((c: unknown) => {
          const camp = c as Record<string, unknown>;
          if (camp.id === campaignId) {
            return {
              ...camp,
              called_count: camp.total_contacts,
              pending_count: 0,
              status: 'completed'
            };
          }
          return camp;
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