// Updated types to reflect new database structure

export type CampaignStatus = 'active' | 'paused' | 'completed';

export type IntentLabel = 'positive' | 'no-interest' | 'follow-up';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  call_window_start: string;
  call_window_end: string;
  timezone: string;
  pause_between_calls: number;
  selected_usps: string[];
  total_contacts: number;
  called_count: number;
  pending_count: number;
  created_at: string;
  updated_at: string;
}

// Contact is now independent of campaigns
export interface Contact {
  id: string;
  name: string;
  phone: string;
  company: string | null;
  email: string | null;
  profile_summary: string | null;
  pain_points: string[];
  created_at: string;
  updated_at: string;
}

// New junction table type
export interface CampaignContact {
  id: string;
  campaign_id: string;
  contact_id: string;
  status: string; // pending, calling, completed, 2nd call, third call pending
  outcome_status: string | null; // no answer, qualified, etc.
  created_at: string;
  updated_at: string;
}

// Extended type for when we need contact info with campaign status
export interface ContactWithCampaignStatus extends Contact {
  campaign_contact_id: string; // The campaign_contacts.id
  status: string;
  outcome_status: string | null;
}

export interface CallLog {
  id: string;
  contact_id: string;
  campaign_id: string;
  campaign_contact_id: string | null;
  call_date: string;
  duration: number;
  transcript: string;
  recording_url: string;
  ai_summary: string;
  intent_label: IntentLabel;
  pain_points_discussed: string[];
  usps_used: string[];
  created_at: string;
}

export interface USP {
  id: string;
  title: string;
  description: string;
  category: string | null;
  pain_point_tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}