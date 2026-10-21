import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Video, Upload, ArrowRight, Loader2, FileAudio, AlertCircle, Check } from 'lucide-react';
import { submitYoutubeAnalysis, submitFileUploadAnalysis } from '../api';
import type { AnalysisSession } from '../types';

interface NewAnalysisProps {
  onAnalysisStarted: (session: AnalysisSession) => void;
}

export const NewAnalysis = ({ onAnalysisStarted }: NewAnalysisProps) => {
  const [tab, setTab] = useState<'youtube' | 'upload'>('youtube');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'english' | 'hinglish'>('english');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === 'youtube') {
      const cleanUrl = url.trim();
      if (!cleanUrl) {
        setError('Please enter a valid YouTube video URL.');
        return;
      }
      try {
        setLoading(true);
        const session = await submitYoutubeAnalysis(cleanUrl, language);
        onAnalysisStarted(session);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred while submitting.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!file) {
        setError('Please select an audio or video file to upload.');
        return;
      }
      try {
        setLoading(true);
        const session = await submitFileUploadAnalysis(file, language);
        onAnalysisStarted(session);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred during upload.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 sm:px-8">
      {/* Title Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
          New Analysis
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Process YouTube videos or local media files to generate transcription, structured summaries, and RAG index.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        {/* Mode Selector Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => { setTab('youtube'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'youtube'
                ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
            }`}
          >
            <Video className="w-4 h-4 text-neutral-700" />
            <span>YouTube URL</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('upload'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'upload'
                ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
            }`}
          >
            <Upload className="w-4 h-4 text-neutral-700" />
            <span>Local File Upload</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-neutral-100 border border-neutral-300 text-xs text-neutral-900">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-neutral-700" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {tab === 'youtube' ? (
            <div className="space-y-2">
              <label htmlFor="youtube-url" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                YouTube URL
              </label>
              <div className="relative">
                <input
                  id="youtube-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>
              <p className="text-xs text-neutral-400">
                Input public or unlisted YouTube video URL.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Audio / Video Source File
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border border-dashed border-neutral-300 hover:border-neutral-900 rounded-xl p-8 text-center transition bg-neutral-50/50 hover:bg-neutral-50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".mp3,.wav,.m4a,.mp4,.mov,.mkv,.webm,.aac,.flac"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2.5">
                  <div className="w-10 h-10 rounded-lg bg-neutral-200/70 flex items-center justify-center text-neutral-700">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{file.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-neutral-800">
                        Select media file from your computer
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        MP3, WAV, M4A, MP4, MOV, WEBM
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Language Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Transcription Language
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('english')}
                className={`p-3.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                  language === 'english'
                    ? 'border-neutral-900 bg-neutral-50 text-neutral-900'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-neutral-900">English</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Whisper Engine</div>
                </div>
                {language === 'english' && (
                  <Check className="w-4 h-4 text-neutral-900 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setLanguage('hinglish')}
                className={`p-3.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                  language === 'hinglish'
                    ? 'border-neutral-900 bg-neutral-50 text-neutral-900'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-neutral-900">Hinglish / Hindi</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Sarvam AI Translation</div>
                </div>
                {language === 'hinglish' && (
                  <Check className="w-4 h-4 text-neutral-900 shrink-0" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-300" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Start Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
