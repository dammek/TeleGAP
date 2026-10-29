import React, { useState, useEffect } from 'react';
import { DirectoryMatchNotification, AlumniProfile } from '../types';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';
import {
  Sparkles,
  Bell,
  Building2,
  Briefcase,
  ChevronRight,
  ChevronDown,
  X,
  Send,
  UserCheck,
  Zap,
  Users
} from 'lucide-react';

interface DirectoryMatchNotificationBannerProps {
  currentProfile?: AlumniProfile | null;
  onSelectMatchedProfile: (profile: AlumniProfile) => void;
}

export const DirectoryMatchNotificationBanner: React.FC<DirectoryMatchNotificationBannerProps> = ({
  currentProfile,
  onSelectMatchedProfile
}) => {
  const [matches, setMatches] = useState<DirectoryMatchNotification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const data = await safeFetchJson<DirectoryMatchNotification[]>(`/api/directory/matches?profileId=${currentProfile.id}`);
        if (data.success && Array.isArray(data.data)) {
          setMatches(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch directory matching notifications:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [currentProfile?.id]);

  if (isDismissed || matches.length === 0 || !currentProfile) {
    return null;
  }

  const topMatch = matches[0];

  return (
    <div className="mb-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-indigo-950/40 to-slate-900 border border-amber-500/30 shadow-lg overflow-hidden transition-all">
      {/* Collapsed Header Alert */}
      <div className="p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-100">
                Alumni Network Match Alert
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                {matches.length} {matches.length === 1 ? 'New Connection' : 'New Connections'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {topMatch.matchType === 'SHARED_COMPANY'
                ? `Alumni found with shared company background (${topMatch.sharedCompany})`
                : `Alumni found sharing your skills: ${topMatch.sharedSkills.slice(0, 2).join(', ')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('selection');
              setIsExpanded(!isExpanded);
            }}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
          >
            <span>{isExpanded ? 'Hide' : 'View Matches'}</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              setIsDismissed(true);
            }}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Match Cards List */}
      {isExpanded && (
        <div className="p-3.5 pt-0 space-y-2 border-t border-slate-800/80 bg-slate-950/40 animate-in fade-in duration-150">
          <div className="text-[11px] text-slate-400 pb-1">
            We discovered alumni with overlapping domain expertise and employment histories:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {matches.map(m => {
              const matched = m.matchedProfile;
              return (
                <div
                  key={m.id}
                  className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                      {matched.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-100 truncate">
                        {matched.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {matched.jobTitle} {matched.company ? `@ ${matched.company}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Shared tags */}
                  <div className="space-y-1">
                    {m.sharedCompany && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">Shared Company: {m.sharedCompany}</span>
                      </div>
                    )}

                    {m.sharedSkills && m.sharedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.sharedSkills.map((sk, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 px-1.5 py-0.5 rounded"
                          >
                            ✓ {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      TelegramSdkWrapper.haptic('selection');
                      onSelectMatchedProfile(matched);
                    }}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>View Full Profile & Connect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
