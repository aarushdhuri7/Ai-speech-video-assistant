import { useEffect, useState, useRef } from 'react';
import {
  PlusCircle,
  FileText,
  MessageSquare,
  History,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Video,
} from 'lucide-react';
import type { AnalysisSession } from './types';
import { fetchAnalysisStatus } from './api';
import { NewAnalysis } from './components/NewAnalysis';
import { ResultsView } from './components/ResultsView';
import { RagChat } from './components/RagChat';
import { HistoryView } from './components/HistoryView';

export function App() {
  const [currentView, setCurrentView] = useState<'new' | 'results' | 'chat' | 'history'>('new');
  const [activeSession, setActiveSession] = useState<AnalysisSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);

  // Poll analysis status when active session is pending or processing
  useEffect(() => {
    if (!activeSession) return;

    if (activeSession.status === 'pending' || activeSession.status === 'processing') {
      const checkStatus = async () => {
        try {
          const updated = await fetchAnalysisStatus(activeSession.id);
          setActiveSession(updated);
          if (updated.status === 'completed' || updated.status === 'error') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        } catch (e) {
          console.error('Polling error', e);
        }
      };

      const intervalId = window.setInterval(checkStatus, 2500);
      pollIntervalRef.current = intervalId;

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [activeSession?.id, activeSession?.status]);

  const handleAnalysisStarted = (session: AnalysisSession) => {
    setActiveSession(session);
    setCurrentView('results');
  };

  const handleSelectHistorySession = (session: AnalysisSession) => {
    setActiveSession(session);
    setCurrentView('results');
  };

  return (
    <div className="flex h-screen w-full bg-[#fbfbfb] text-neutral-900 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-neutral-200 bg-white select-none">
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-neutral-200">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-sm">
            VA
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-900 tracking-tight">Video Assistant</div>
            <div className="text-[11px] text-neutral-500">Internal AI Platform</div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 py-4 px-3 space-y-1">
          <button
            onClick={() => setCurrentView('new')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              currentView === 'new'
                ? 'bg-neutral-100 text-neutral-900 font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-neutral-500" />
            <span>New Analysis</span>
          </button>

          <button
            onClick={() => setCurrentView('results')}
            disabled={!activeSession}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              currentView === 'results'
                ? 'bg-neutral-100 text-neutral-900 font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-neutral-500" />
              <span>Results & Insights</span>
            </div>
            {activeSession && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSession.status === 'completed'
                    ? 'bg-neutral-900'
                    : activeSession.status === 'processing'
                    ? 'bg-neutral-400 animate-pulse'
                    : activeSession.status === 'error'
                    ? 'bg-neutral-400'
                    : 'bg-neutral-300'
                }`}
              />
            )}
          </button>

          <button
            onClick={() => setCurrentView('chat')}
            disabled={!activeSession || activeSession.status !== 'completed'}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              currentView === 'chat'
                ? 'bg-neutral-100 text-neutral-900 font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-neutral-500" />
            <span>RAG Chat</span>
          </button>

          <button
            onClick={() => setCurrentView('history')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              currentView === 'history'
                ? 'bg-neutral-100 text-neutral-900 font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <History className="w-4 h-4 text-neutral-500" />
            <span>History</span>
          </button>
        </div>

        {/* Current Active Session Widget in Sidebar */}
        {activeSession && (
          <div className="p-3 m-3 border border-neutral-200 rounded-lg bg-neutral-50">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
              Active Session
            </div>
            <div className="text-xs font-medium text-neutral-900 truncate">
              {activeSession.title || activeSession.source_name}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-600">
              {activeSession.status === 'completed' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-800" />
                  <span>Ready</span>
                </>
              ) : activeSession.status === 'processing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-600" />
                  <span>Processing...</span>
                </>
              ) : activeSession.status === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Failed</span>
                </>
              ) : (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                  <span>Queued</span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-neutral-200 text-xs text-neutral-400 text-center">
          v1.0 &middot; Video Assistant Core
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-14 bg-white border-b border-neutral-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">
              VA
            </div>
            <span className="text-sm font-semibold text-neutral-900">Video Assistant</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-neutral-200 p-3 space-y-1 z-50">
            <button
              onClick={() => { setCurrentView('new'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-neutral-700"
            >
              New Analysis
            </button>
            <button
              onClick={() => { setCurrentView('results'); setMobileMenuOpen(false); }}
              disabled={!activeSession}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 disabled:opacity-40"
            >
              Results & Insights
            </button>
            <button
              onClick={() => { setCurrentView('chat'); setMobileMenuOpen(false); }}
              disabled={!activeSession || activeSession.status !== 'completed'}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 disabled:opacity-40"
            >
              RAG Chat
            </button>
            <button
              onClick={() => { setCurrentView('history'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-neutral-700"
            >
              History
            </button>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'new' && (
            <NewAnalysis onAnalysisStarted={handleAnalysisStarted} />
          )}

          {currentView === 'results' && (
            <>
              {!activeSession ? (
                <div className="max-w-lg mx-auto text-center py-24 px-6">
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center mx-auto mb-4">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-1.5">No Active Analysis</h3>
                  <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                    Submit a YouTube URL or audio/video file to view transcripts and extracted insights.
                  </p>
                  <button
                    onClick={() => setCurrentView('new')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <span>Start New Analysis</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : activeSession.status === 'pending' || activeSession.status === 'processing' ? (
                <div className="max-w-lg mx-auto text-center py-28 px-6">
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-900 flex items-center justify-center mx-auto mb-5">
                    <Loader2 className="w-7 h-7 animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Processing Media & Speech
                  </h3>
                  <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6 leading-relaxed">
                    Downloading media, transcribing audio, generating summary, and indexing vectors.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 font-mono">
                    <span className="w-2 h-2 rounded-full bg-neutral-800 animate-pulse" />
                    <span className="capitalize">Status: {activeSession.status}</span>
                  </div>
                </div>
              ) : activeSession.status === 'error' ? (
                <div className="max-w-lg mx-auto text-center py-24 px-6">
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-900 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Analysis Error</h3>
                  <p className="text-xs text-neutral-700 bg-neutral-100 p-4 rounded-lg border border-neutral-200 mb-6 text-left whitespace-pre-wrap leading-relaxed font-mono">
                    {activeSession.error || 'An unexpected error occurred during execution.'}
                  </p>
                  <button
                    onClick={() => setCurrentView('new')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <span>Try Another File</span>
                  </button>
                </div>
              ) : (
                <ResultsView
                  session={activeSession}
                  onOpenChat={() => setCurrentView('chat')}
                />
              )}
            </>
          )}

          {currentView === 'chat' && (
            <>
              {activeSession && activeSession.status === 'completed' ? (
                <RagChat session={activeSession} />
              ) : (
                <div className="max-w-lg mx-auto text-center py-24 px-6">
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-1.5">No Active Chat Session</h3>
                  <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                    Complete an analysis first to enable RAG chat with its meeting transcript.
                  </p>
                  <button
                    onClick={() => setCurrentView('new')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <span>Analyze a Video</span>
                  </button>
                </div>
              )}
            </>
          )}

          {currentView === 'history' && (
            <HistoryView onSelectSession={handleSelectHistorySession} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
