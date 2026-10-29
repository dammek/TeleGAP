import React, { useState } from 'react';
import { Settings, Vibrate, Check, Smartphone, BellRing, Sparkles } from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';

interface SettingsSectionProps {
  onHapticsToggled?: (enabled: boolean) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ onHapticsToggled }) => {
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(
    TelegramSdkWrapper.isHapticsEnabled()
  );
  const [testFeedbackText, setTestFeedbackText] = useState<string | null>(null);

  const handleToggleHaptics = (enabled: boolean) => {
    setHapticsEnabled(enabled);
    TelegramSdkWrapper.setHapticsEnabled(enabled);
    if (enabled) {
      TelegramSdkWrapper.haptic('medium');
      setTestFeedbackText('Haptics enabled! (Vibration triggered)');
    } else {
      setTestFeedbackText('Haptics disabled (vibrations muted)');
    }
    if (onHapticsToggled) onHapticsToggled(enabled);
    setTimeout(() => setTestFeedbackText(null), 3000);
  };

  const handleTestHaptic = (style: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => {
    TelegramSdkWrapper.haptic(style);
    setTestFeedbackText(`Tested '${style}' vibration pulse`);
    setTimeout(() => setTestFeedbackText(null), 2500);
  };

  return (
    <div className="p-4 bg-slate-850 rounded-2xl border border-slate-700/80 shadow-lg space-y-3.5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-slate-700/60 text-slate-300 flex items-center justify-center">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-100">
            Mini App Settings & Preferences
          </h3>
          <span className="text-[10px] text-slate-400">
            Control tactile feedback, vibration responses, and device interactions
          </span>
        </div>
      </div>

      {/* Haptics Toggle Row */}
      <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/70 flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl border shrink-0 transition-colors ${
            hapticsEnabled
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              : 'bg-slate-700/40 text-slate-500 border-slate-700'
          }`}>
            <Vibrate className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100">
                Haptic Feedback (Vibrations)
              </span>
              <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                hapticsEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-700/60 text-slate-400 border-slate-600'
              }`}>
                {hapticsEnabled ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Provides tactile vibration pulses when tapping filters, confirming RSVPs, navigation tabs, and actions.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={hapticsEnabled}
            onChange={e => handleToggleHaptics(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Test Vibration Pulses */}
      {hapticsEnabled && (
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 animate-in fade-in duration-150">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Test Vibration Feedback</span>
            {testFeedbackText && (
              <span className="text-blue-400 font-sans font-semibold">
                {testFeedbackText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleTestHaptic('light')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-semibold text-slate-300 rounded-lg active:scale-95 transition-all"
            >
              Light Tap
            </button>
            <button
              type="button"
              onClick={() => handleTestHaptic('medium')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-semibold text-slate-300 rounded-lg active:scale-95 transition-all"
            >
              Medium Pulse
            </button>
            <button
              type="button"
              onClick={() => handleTestHaptic('heavy')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-semibold text-slate-300 rounded-lg active:scale-95 transition-all"
            >
              Heavy Click
            </button>
            <button
              type="button"
              onClick={() => handleTestHaptic('success')}
              className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-[10px] font-semibold text-emerald-300 rounded-lg active:scale-95 transition-all flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Success Pulse
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
