import React, { useState, useEffect } from 'react';
import { RecentTelegramMessage, TelegramUser, AlumniProfile } from '../types';
import {
  MessageSquare,
  Send,
  Sparkles,
  ShieldCheck,
  X,
  Plus,
  Hash,
  Clock,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  Radio,
  CheckCircle2,
  Users
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson, safePostJson } from '../lib/apiClient';
import { INITIAL_RECENT_MESSAGES } from '../server/mockData';

interface RecentMessagesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TelegramUser;
  currentProfile?: AlumniProfile | null;
  onSelectAlumnusByName?: (name: string) => void;
}

export const RecentMessagesSidebar: React.FC<RecentMessagesSidebarProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentProfile,
  onSelectAlumnusByName,
}) => {
  const [messages, setMessages] = useState<RecentTelegramMessage[]>(INITIAL_RECENT_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [newSnippet, setNewSnippet] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('JobReferral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      try {
        const json = await safeFetchJson<RecentTelegramMessage[]>('/api/messages/recent');
        if (json.success && json.data && isMounted) {
          setMessages(json.data.length > 0 ? json.data : INITIAL_RECENT_MESSAGES);
        }
      } catch (e) {
        // fallback
      }
    };

    fetchRecent();
    const interval = setInterval(fetchRecent, 20000); // 20s poll for simulated lively chat
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handlePostSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnippet.trim() || isSubmitting) return;

    TelegramSdkWrapper.haptic('medium');
    setIsSubmitting(true);

    const displayName = currentUser.tgFirstName + (currentUser.tgLastName ? ` ${currentUser.tgLastName}` : '');
    const headline = currentProfile?.jobTitle
      ? `${currentProfile.jobTitle}${currentProfile.company ? ` @ ${currentProfile.company}` : ''}`
      : 'Alumnus';

    try {
      const json = await safePostJson<RecentTelegramMessage>('/api/messages/recent', {
        senderName: displayName,
        senderTgUsername: currentUser.tgUsername || 'tg_alumnus',
        senderPhotoUrl: currentUser.tgPhotoUrl,
        senderHeadline: headline,
        topic: selectedTopic,
        messageSnippet: newSnippet.trim(),
        channelName: 'Verified Alumni Supergroup',
        isVerifiedAlumnus: currentProfile?.verificationStatus === 'VERIFIED'
      });

      if (json.success && json.data) {
        setMessages(prev => [json.data!, ...prev]);
        setNewSnippet('');
        setPostedSuccess(true);
        setTimeout(() => setPostedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to post message snippet:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-700/80 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-extrabold text-white">
                  Alumni Telegram Wire
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.2 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /> Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Recent snippets & opportunities from community chats
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('selection');
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Snippets List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {postedSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Your message snippet was posted to the Alumni Telegram Wire!</span>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className="p-3.5 bg-slate-800/70 hover:bg-slate-800 rounded-2xl border border-slate-700/60 shadow-sm space-y-2.5 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {msg.senderPhotoUrl ? (
                    <img
                      src={msg.senderPhotoUrl}
                      alt={msg.senderName}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {msg.senderName.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => {
                          if (onSelectAlumnusByName) {
                            onSelectAlumnusByName(msg.senderName);
                            onClose();
                          }
                        }}
                        className="font-bold text-slate-100 text-xs truncate hover:text-blue-400 cursor-pointer"
                      >
                        {msg.senderName}
                      </span>
                      {msg.isVerifiedAlumnus && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Verified Alumnus" />
                      )}
                    </div>

                    {msg.senderHeadline && (
                      <p className="text-[10px] text-slate-400 truncate">
                        {msg.senderHeadline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[10px] font-mono text-slate-400">
                    {msg.timestamp}
                  </span>
                  {msg.topic && (
                    <span className="text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded-md">
                      #{msg.topic}
                    </span>
                  )}
                </div>
              </div>

              {/* Message text snippet */}
              <div className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                "{msg.messageSnippet}"
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <span className="text-[10px] text-slate-500">
                  Via {msg.channelName || 'Alumni Lounge'}
                </span>

                {msg.senderTgUsername && (
                  <button
                    onClick={() => {
                      TelegramSdkWrapper.haptic('light');
                      TelegramSdkWrapper.openLink(`https://t.me/${msg.senderTgUsername}`);
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>DM @{msg.senderTgUsername}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Post Snippet Form */}
        <div className="p-4 bg-slate-850 border-t border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-400" /> Share Snippet or Job Lead
            </span>
            <div className="flex items-center gap-1">
              {['JobReferral', 'Mentorship', 'TechCollab', 'Homecoming'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTopic(t)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                    selectedTopic === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePostSnippet} className="space-y-2">
            <textarea
              value={newSnippet}
              onChange={(e) => setNewSnippet(e.target.value)}
              placeholder="E.g., We are hiring 2 backend engineers at our fintech startup... or questions about homecoming?"
              rows={2}
              maxLength={240}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                {newSnippet.length}/240 characters
              </span>
              <button
                type="submit"
                disabled={!newSnippet.trim() || isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting...' : 'Post Snippet'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
