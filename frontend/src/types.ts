export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface AnalysisSession {
  id: string;
  status: AnalysisStatus;
  error?: string | null;
  source_type: 'youtube' | 'file';
  source_name: string;
  language: string;
  title?: string | null;
  summary?: string | null;
  action_items?: string | null;
  key_decisions?: string | null;
  open_questions?: string | null;
  transcript?: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
