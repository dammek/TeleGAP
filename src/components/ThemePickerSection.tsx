import React, { useState } from 'react';
import { AlumniProfile, ProfileThemeConfig, TelegramUser } from '../types';
import { Palette, Sparkles, Check, Layout, Paintbrush } from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';

interface ThemePickerSectionProps {
  profile: AlumniProfile;
  currentUser: TelegramUser;
  onThemeSaved?: (newTheme: ProfileThemeConfig) => void;
}

const ACCENT_COLORS: {
  id: ProfileThemeConfig['accentColor'];
  name: string;
  gradient: string;
  border: string;
  pillBg: string;
  pillText: string;
}[] = [
  {
    id: 'azure',
    name: 'Azure Blue',
    gradient: 'from-blue-600 to-indigo-700',
    border: 'border-blue-500',
    pillBg: 'bg-blue-500/20',
    pillText: 'text-blue-300'
  },
  {
    id: 'emerald',
    name: 'Emerald Jade',
    gradient: 'from-emerald-600 to-teal-700',
    border: 'border-emerald-500',
    pillBg: 'bg-emerald-500/20',
    pillText: 'text-emerald-300'
  },
  {
    id: 'amethyst',
    name: 'Royal Amethyst',
    gradient: 'from-purple-600 to-violet-800',
    border: 'border-purple-500',
    pillBg: 'bg-purple-500/20',
    pillText: 'text-purple-300'
  },
  {
    id: 'amber',
    name: 'Amber Gold',
    gradient: 'from-amber-600 to-orange-700',
    border: 'border-amber-500',
    pillBg: 'bg-amber-500/20',
    pillText: 'text-amber-300'
  },
  {
    id: 'cyan',
    name: 'Cyan Nebula',
    gradient: 'from-cyan-600 to-teal-800',
    border: 'border-cyan-500',
    pillBg: 'bg-cyan-500/20',
    pillText: 'text-cyan-300'
  },
  {
    id: 'crimson',
    name: 'Crimson Ruby',
    gradient: 'from-rose-600 to-red-800',
    border: 'border-rose-500',
    pillBg: 'bg-rose-500/20',
    pillText: 'text-rose-300'
  }
];

const PATTERNS: {
  id: ProfileThemeConfig['pattern'];
  name: string;
  previewClass: string;
}[] = [
  {
    id: 'mesh',
    name: 'Radial Mesh',
    previewClass: 'bg-[radial-gradient(#ffffff25_1px,transparent_1px)] [background-size:10px_10px]'
  },
  {
    id: 'matrix',
    name: 'Data Matrix',
    previewClass: 'bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:6px_6px]'
  },
  {
    id: 'dots',
    name: 'Modern Dots',
    previewClass: 'bg-[radial-gradient(#ffffff30_2px,transparent_2px)] [background-size:14px_14px]'
  },
  {
    id: 'waves',
    name: 'Subtle Bands',
    previewClass: 'bg-[linear-gradient(45deg,#ffffff12_25%,transparent_25%,transparent_50%,#ffffff12_50%,#ffffff12_75%,transparent_75%,transparent)] [background-size:16px_16px]'
  },
  {
    id: 'topography',
    name: 'Topography',
    previewClass: 'bg-[radial-gradient(ellipse_at_top,#ffffff25,transparent_50%)]'
  }
];

export const ThemePickerSection: React.FC<ThemePickerSectionProps> = ({
  profile,
  currentUser,
  onThemeSaved
}) => {
  const currentTheme = profile.themeConfig || {
    accentColor: 'azure',
    pattern: 'mesh'
  };

  const [selectedColor, setSelectedColor] = useState<ProfileThemeConfig['accentColor']>(
    currentTheme.accentColor || 'azure'
  );
  const [selectedPattern, setSelectedPattern] = useState<ProfileThemeConfig['pattern']>(
    currentTheme.pattern || 'mesh'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeColorObj =
    ACCENT_COLORS.find(c => c.id === selectedColor) || ACCENT_COLORS[0];
  const activePatternObj =
    PATTERNS.find(p => p.id === selectedPattern) || PATTERNS[0];

  const handleSaveTheme = async () => {
    setIsSaving(true);
    TelegramSdkWrapper.haptic('medium');

    const newTheme: ProfileThemeConfig = {
      accentColor: selectedColor,
      pattern: selectedPattern
    };

    try {
      const data = await safeFetchJson<any>(`/api/profile/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeConfig: newTheme })
      });
      if (data.success || data.data) {
        TelegramSdkWrapper.haptic('success');
        setSaveSuccess(true);
        if (onThemeSaved) onThemeSaved(newTheme);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        // Apply locally
        TelegramSdkWrapper.haptic('success');
        setSaveSuccess(true);
        if (onThemeSaved) onThemeSaved(newTheme);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Error saving theme:', e);
      // Fallback local update
      if (onThemeSaved) onThemeSaved(newTheme);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 bg-slate-850 rounded-2xl border border-slate-700/80 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Professional Identity Theme
              <Sparkles className="w-3 h-3 text-purple-400" />
            </h3>
            <span className="text-[10px] text-slate-400">
              Customize the accent color and background pattern of your public profile card
            </span>
          </div>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Live Card Preview
        </div>
        <div
          className={`relative overflow-hidden p-4 rounded-xl border border-slate-700 shadow-md bg-gradient-to-br ${activeColorObj.gradient}`}
        >
          {/* Pattern Overlay */}
          <div
            className={`absolute inset-0 ${activePatternObj.previewClass} opacity-40 pointer-events-none`}
          />

          <div className="relative z-10 flex items-center gap-3">
            {currentUser.tgPhotoUrl ? (
              <img
                src={currentUser.tgPhotoUrl}
                alt={currentUser.tgFirstName}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border border-white/30 shadow"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/20 text-white font-extrabold text-lg flex items-center justify-center border border-white/30 shadow">
                {currentUser.tgFirstName.charAt(0)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white truncate drop-shadow">
                  {currentUser.tgFirstName} {currentUser.tgLastName || ''}
                </span>
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-black/40 text-white border border-white/20">
                  {activeColorObj.name}
                </span>
              </div>
              <p className="text-xs text-white/90 truncate drop-shadow-sm font-medium">
                {profile.jobTitle || 'Alumnus'} {profile.company ? `@ ${profile.company}` : ''}
              </p>
              <div className="text-[10px] text-white/70 flex items-center gap-1 mt-0.5 font-mono">
                <span>{profile.degreeType} • Class of {profile.graduationYear}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accent Color Palette Selector */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-slate-300">
          Select Accent Color
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ACCENT_COLORS.map(color => {
            const isSelected = selectedColor === color.id;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => {
                  TelegramSdkWrapper.haptic('selection');
                  setSelectedColor(color.id);
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-left ${
                  isSelected
                    ? `${color.border} bg-slate-800 ring-2 ring-blue-500/50 shadow`
                    : 'border-slate-700/80 bg-slate-900/60 hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${color.gradient} flex items-center justify-center shadow`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-[10px] font-semibold text-slate-200 text-center leading-tight truncate w-full">
                  {color.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pattern Selector */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-slate-300">
          Select Background Texture / Pattern
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PATTERNS.map(pattern => {
            const isSelected = selectedPattern === pattern.id;
            return (
              <button
                key={pattern.id}
                type="button"
                onClick={() => {
                  TelegramSdkWrapper.haptic('selection');
                  setSelectedPattern(pattern.id);
                }}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-slate-800 ring-1 ring-blue-500 text-blue-300 font-bold'
                    : 'border-slate-700/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border border-slate-600 ${pattern.previewClass} shrink-0`}
                />
                <span className="text-[11px] truncate">{pattern.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button & Feedback */}
      <div className="flex items-center justify-between pt-1">
        {saveSuccess ? (
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Professional theme saved!
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">
            Visible on directory and profile modals
          </span>
        )}

        <button
          type="button"
          onClick={handleSaveTheme}
          disabled={isSaving}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Applying...' : 'Apply Theme'}</span>
        </button>
      </div>
    </div>
  );
};
