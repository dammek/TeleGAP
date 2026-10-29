import React from 'react';
import { Institution, AlumniProfile, TelegramUser } from '../types';
import { ChevronDown, CheckCircle2, AlertCircle, Building2, Sparkles } from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';

interface TelegramHeaderProps {
  institution: Institution | null;
  activeProfile: AlumniProfile | null;
  currentUser: TelegramUser;
  onOpenSchoolSelector: () => void;
  onOpenProfile: () => void;
}

export const TelegramHeader: React.FC<TelegramHeaderProps> = ({
  institution,
  activeProfile,
  currentUser,
  onOpenSchoolSelector,
  onOpenProfile,
}) => {
  const isVerified = activeProfile?.verificationStatus === 'VERIFIED';

  const handleSwitchSchool = () => {
    TelegramSdkWrapper.haptic('selection');
    onOpenSchoolSelector();
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* University Selector Button */}
        <button
          onClick={handleSwitchSchool}
          className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 active:scale-98 transition-all px-3 py-1.5 rounded-xl border border-slate-700/60 max-w-[220px] text-left group"
        >
          {institution ? (
            <img
              src={institution.logoUrl}
              alt={institution.shortName}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-slate-100 truncate block">
                {institution?.shortName || 'Select Institution'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-slate-200 transition-colors" />
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              {isVerified ? (
                <span className="text-emerald-400 flex items-center gap-0.5 font-medium truncate">
                  <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> Verified Member
                </span>
              ) : activeProfile ? (
                <span className="text-amber-400 flex items-center gap-0.5 font-medium truncate">
                  <AlertCircle className="w-2.5 h-2.5 shrink-0" /> Unverified
                </span>
              ) : (
                <span className="text-slate-400 truncate">Tap to switch</span>
              )}
            </div>
          </div>
        </button>

        {/* Telegram Profile Avatar & Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              onOpenProfile();
            }}
            className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 pl-2 pr-1.5 py-1 rounded-full transition-all active:scale-95"
            title="My Profile & Settings"
          >
            <div className="text-right hidden xs:block">
              <div className="text-xs font-semibold text-slate-200 truncate max-w-[80px]">
                {currentUser.tgFirstName}
              </div>
              {currentUser.tgUsername && (
                <div className="text-[10px] text-slate-400">@{currentUser.tgUsername}</div>
              )}
            </div>

            <div className="relative">
              {currentUser.tgPhotoUrl ? (
                <img
                  src={currentUser.tgPhotoUrl}
                  alt={currentUser.tgFirstName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border-2 border-cyan-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white/20">
                  {currentUser.tgFirstName.charAt(0)}
                </div>
              )}
              {currentUser.isPremium && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-[8px] text-black font-bold shadow-sm">
                  ★
                </span>
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
