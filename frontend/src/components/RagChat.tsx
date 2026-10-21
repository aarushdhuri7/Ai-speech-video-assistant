import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import type { AnalysisSession, ChatMessage } from '../types';
import { askQuestionApi } from '../api';

import { FormattedReport } from './FormattedReport';

interface RagChatProps {
  session: AnalysisSession;
}

export const RagChat = ({ session }: RagChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Context loaded for "${session.title || 'this session'}". You can ask questions grounded in the transcript.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedQuestions = [
    'What were the key takeaways?',
    'What action items were assigned and to whom?',
    'Were any deadlines or dates specified?',
    'What unresolved questions remain?',
  ];

  const handleSend = async (questionText?: string) => {
    const query = (questionText || input).trim();
    if (!query || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askQuestionApi(session.id, query);
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve response from assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 sm:px-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Chat header */}
      <div className="pb-4 border-b border-neutral-200 mb-4 shrink-0 bg-white p-4 rounded-xl border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-neutral-900 tracking-tight">
                RAG Transcript Chat
              </h1>
              <p className="text-xs text-neutral-500 truncate max-w-lg mt-0.5">
                Session: <span className="font-medium text-neutral-800">{session.title || session.source_name}</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-200 rounded">
            Vector Search Active
          </span>
        </div>
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="mb-4 shrink-0 bg-neutral-50 border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
            Suggested Queries
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(sq)}
                className="text-xs font-medium bg-white hover:bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-lg border border-neutral-300 transition text-left cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                msg.sender === 'user'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-200 text-neutral-800'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`p-3.5 rounded-xl text-sm max-w-[80%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-800'
              }`}
            >
              {msg.sender === 'assistant' ? (
                <FormattedReport content={msg.text} />
              ) : (
                <div className="whitespace-pre-wrap">{msg.text}</div>
              )}
              <div
                className={`text-[10px] mt-1.5 text-right ${
                  msg.sender === 'user' ? 'text-neutral-400' : 'text-neutral-400'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-neutral-200 text-neutral-800 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-600 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-700" />
              <span>Searching transcript vectors...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg bg-neutral-100 border border-neutral-300 text-xs text-neutral-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-neutral-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="shrink-0 pt-2 border-t border-neutral-200">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-full pl-4 pr-12 py-3 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="absolute right-2 p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white transition disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-neutral-400 text-center mt-2">
          Grounded directly in the transcript using local RAG embeddings.
        </p>
      </div>
    </div>
  );
};
