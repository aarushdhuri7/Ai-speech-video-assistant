import type { AnalysisSession } from './types';

// Read API base URL from Vite environment variable.
// In development, if not provided, default to empty string so it leverages Vite's dev proxy.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  : '';

export async function submitYoutubeAnalysis(
  url: string,
  language: string = 'english'
): Promise<AnalysisSession> {
  const formData = new FormData();
  formData.append('url', url);
  formData.append('language', language);

  const res = await fetch(`${API_BASE_URL}/api/analyses/youtube`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to start YouTube analysis' }));
    throw new Error(errorData.detail || 'Failed to start YouTube analysis');
  }

  return res.json();
}

export async function submitFileUploadAnalysis(
  file: File,
  language: string = 'english'
): Promise<AnalysisSession> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', language);

  const res = await fetch(`${API_BASE_URL}/api/analyses/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to upload media file' }));
    throw new Error(errorData.detail || 'Failed to upload media file');
  }

  return res.json();
}

export async function fetchAnalysisStatus(analysisId: string): Promise<AnalysisSession> {
  const res = await fetch(`${API_BASE_URL}/api/analyses/${analysisId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to retrieve analysis status' }));
    throw new Error(errorData.detail || 'Failed to retrieve analysis status');
  }
  return res.json();
}

export async function fetchAnalysesHistory(): Promise<AnalysisSession[]> {
  const res = await fetch(`${API_BASE_URL}/api/analyses`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to retrieve history' }));
    throw new Error(errorData.detail || 'Failed to retrieve history');
  }
  const data = await res.json();
  return data.analyses || [];
}

export async function askQuestionApi(
  analysisId: string,
  question: string
): Promise<{ analysis_id: string; question: string; answer: string }> {
  const res = await fetch(`${API_BASE_URL}/api/analyses/${analysisId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to get answer from assistant' }));
    throw new Error(errorData.detail || 'Failed to get answer from assistant');
  }

  return res.json();
}
