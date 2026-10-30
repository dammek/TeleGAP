import React from 'react';
import { TelegramUser, Institution } from '../types';
import { DEMO_TELEGRAM_USERS } from '../server/mockData';
import { Smartphone, Monitor, UserCheck, Shield, Bot, Sparkles, RefreshCw } from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';

interface TelegramDevToolbarProps {
  currentUser: TelegramUser;
  onSwitchUser: (user: TelegramUser) => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  activeInstitution: Institution | null;
}

export const TelegramDevToolbar: React.FC<TelegramDevToolbarProps> = ({
  currentUser,
  onSwitchUser,
  isMobileFrame,
  onToggleMobileFrame,
  activeInstitution,
}) => {
  return (
    <div className="bg-slate-950 border-b border-slate-800 text-[11px] px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto select-none">
      {/* TMA SDK badge & User Persona switcher */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1 bg-cyan-500/20 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/30">
          <Bot className="w-3 h-3 text-cyan-400" /> TMA SDK v7.10
        </span>

        <span className="text-slate-400 font-medium hidden sm:inline">User Emulation:</span>
        <div className="flex items-center gap-1">
          {DEMO_TELEGRAM_USERS.map(u => {
            const isActive = u.tgUserId === currentUser.tgUserId;
            return (
              <button
                key={u.id}
                onClick={() => {
                  TelegramSdkWrapper.haptic('selection');
                  onSwitchUser(u);
                }}
                className={`px-2 py-0.5 rounded transition-all font-medium flex items-center gap-1 ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={`Emulate @${u.tgUsername} (tg_user_id: ${u.tgUserId}) ${u.isAdmin ? '· Admin' : '· Member'}`}
              >
                {u.isAdmin && <Shield className="w-2.5 h-2.5 text-amber-400" />}
                <span>{u.tgFirstName}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        {activeInstitution && (
          <span className="text-slate-400 hidden md:inline font-mono text-[10px]">
            Portal: {activeInstitution.portalType}
          </span>
        )}

        <button
          onClick={onToggleMobileFrame}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-0.5 rounded border border-slate-700 font-medium transition-colors"
          title="Toggle Mobile Viewport Simulation"
        >
          {isMobileFrame ? (
            <>
              <Monitor className="w-3 h-3 text-slate-400" />
              <span>Full View</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3 h-3 text-cyan-400" />
              <span>Mobile Frame</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
