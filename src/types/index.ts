export type CampaignStatus = 'active' | 'paused' | 'completed';
export type ContactStatus = 'pending' | 'calling' | 'completed' | 'failed';
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
  created_at: string;
  updated_at: string;
}

export interface USP {
  id: string;
  title: string;
  description: string;
  pain_point_tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  campaign_id: string;
  name: string;
  phone: string;
  company: string | null;
  email: string | null;
  profile_summary: string | null;
  pain_points: string[];
  status: ContactStatus;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  contact_id: string;
  campaign_id: string;
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

// Extended types for joins
export interface ContactWithCampaign extends Contact {
  campaign?: Campaign;
}

export interface CampaignWithStats extends Campaign {
  total_contacts?: number;
  pending_contacts?: number;
  completed_contacts?: number;
  positive_calls?: number;
}