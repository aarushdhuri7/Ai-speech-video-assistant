import { useEffect, useState } from 'react';
import { History as HistoryIcon, Clock, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import type { AnalysisSession } from '../types';
import { fetchAnalysesHistory } from '../api';

interface HistoryViewProps {
  onSelectSession: (session: AnalysisSession) => void;
}

export const HistoryView = ({ onSelectSession }: HistoryViewProps) => {
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAnalysesHistory();
      setSessions(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-zinc-700" />
            <span>Analysis History</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real analyses stored in the current backend runtime session.
          </p>
        </div>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white text-xs font-medium text-zinc-700 hover:text-zinc-900 transition shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-zinc-200/80 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs text-zinc-500">Loading analysis sessions...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center p-12 bg-white border border-zinc-200/80 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-zinc-900 mb-1">No past analyses yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Run your first YouTube or audio analysis to view it and chat with it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectSession(item)}
              className="bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-xl p-4 transition cursor-pointer shadow-xs flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 capitalize">
                    {item.source_type}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 capitalize">
                    {item.language}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                      item.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.status === 'processing'
                        ? 'bg-amber-50 text-amber-700'
                        : item.status === 'error'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-zinc-900 truncate">
                  {item.title || item.source_name}
                </h3>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>

              <div className="shrink-0 flex items-center text-zinc-400 hover:text-zinc-700">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
