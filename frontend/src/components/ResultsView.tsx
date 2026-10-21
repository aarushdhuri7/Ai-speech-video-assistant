import { useState } from 'react';
import {
  FileText,
  CheckSquare,
  HelpCircle,
  Copy,
  Check,
  Download,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';
import type { AnalysisSession } from '../types';

import { FormattedReport } from './FormattedReport';

interface ResultsViewProps {
  session: AnalysisSession;
  onOpenChat: () => void;
}

export const ResultsView = ({ session, onOpenChat }: ResultsViewProps) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'decisions' | 'questions' | 'transcript'>('summary');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadTranscript = () => {
    if (!session.transcript) return;
    const blob = new Blob([session.transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title || 'transcript'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 sm:px-8">
      {/* Header Info Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-5 bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 text-neutral-800 uppercase tracking-wider">
              {session.source_type}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 text-neutral-800 capitalize border border-neutral-200">
              {session.language}
            </span>
            <span className="text-xs text-neutral-400 ml-1">
              {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {session.title || session.source_name || 'Meeting Analysis'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1.5 truncate max-w-2xl font-mono">
            {session.source_name}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {session.transcript && (
            <button
              onClick={handleDownloadTranscript}
              className="inline-flex items-center gap-2 py-2 px-3.5 rounded-lg border border-neutral-300 hover:border-neutral-400 bg-white text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Transcript (.txt)</span>
            </button>
          )}

          <button
            onClick={onOpenChat}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat via RAG</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200 mb-6 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'summary'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Executive Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'actions'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Action Items</span>
        </button>
        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'decisions'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Key Decisions</span>
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'questions'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Open Questions</span>
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'transcript'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <span>Full Transcript</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-7 shadow-2xs">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Summary Overview</h2>
              {session.summary && (
                <button
                  onClick={() => handleCopy(session.summary || '', 'summary')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
                >
                  {copiedKey === 'summary' ? (
                    <Check className="w-3.5 h-3.5 text-neutral-900" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'summary' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            <FormattedReport
              content={session.summary}
              fallbackText="No executive summary generated for this video."
            />
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Action Items & Deliverables</h2>
              {session.action_items && (
                <button
                  onClick={() => handleCopy(session.action_items || '', 'actions')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
                >
                  {copiedKey === 'actions' ? (
                    <Check className="w-3.5 h-3.5 text-neutral-900" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'actions' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            <FormattedReport
              content={session.action_items}
              fallbackText="No action items identified in the transcript."
            />
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Decisions Recorded</h2>
              {session.key_decisions && (
                <button
                  onClick={() => handleCopy(session.key_decisions || '', 'decisions')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
                >
                  {copiedKey === 'decisions' ? (
                    <Check className="w-3.5 h-3.5 text-neutral-900" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'decisions' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            <FormattedReport
              content={session.key_decisions}
              fallbackText="No key decisions recorded."
            />
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Open Questions</h2>
              {session.open_questions && (
                <button
                  onClick={() => handleCopy(session.open_questions || '', 'questions')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
                >
                  {copiedKey === 'questions' ? (
                    <Check className="w-3.5 h-3.5 text-neutral-900" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'questions' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            <FormattedReport
              content={session.open_questions}
              fallbackText="No open questions found."
            />
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Full Transcript</h2>
              <div className="flex items-center gap-3">
                {session.transcript && (
                  <button
                    onClick={() => handleCopy(session.transcript || '', 'transcript')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
                  >
                    {copiedKey === 'transcript' ? (
                      <Check className="w-3.5 h-3.5 text-neutral-900" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'transcript' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[550px] overflow-y-auto p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-xs leading-relaxed text-neutral-800 font-mono whitespace-pre-wrap">
              {session.transcript || 'No transcript generated.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
