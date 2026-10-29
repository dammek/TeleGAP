import React from 'react';
import { Institution, AlumniProfile } from '../types';
import { Check, Plus, ShieldCheck, X, Building2, ExternalLink, Sparkles } from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';

interface SchoolSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutions: Institution[];
  userProfiles: AlumniProfile[];
  activeInstitutionId: string;
  onSelectInstitution: (institutionId: string) => void;
  onStartOnboarding: (institution?: Institution) => void;
}

export const SchoolSelectorModal: React.FC<SchoolSelectorModalProps> = ({
  isOpen,
  onClose,
  institutions,
  userProfiles,
  activeInstitutionId,
  onSelectInstitution,
  onStartOnboarding,
}) => {
  if (!isOpen) return null;

  const enrolledInstIds = new Set(userProfiles.map(p => p.institutionId));

  const handleSelect = (instId: string) => {
    TelegramSdkWrapper.haptic('selection');
    onSelectInstitution(instId);
    onClose();
  };

  const handleJoinNew = (inst: Institution) => {
    TelegramSdkWrapper.haptic('medium');
    onClose();
    onStartOnboarding(inst);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Alumni Institutions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Switch tenant workspace or connect another alma mater
            </p>
          </div>
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto p-4 space-y-4 divide-y divide-slate-800/60">
          {/* Active / Enrolled Section */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">
              Your Memberships ({userProfiles.length})
            </div>
            <div className="space-y-2">
              {userProfiles.map(profile => {
                const inst = institutions.find(i => i.id === profile.institutionId);
                if (!inst) return null;
                const isActive = inst.id === activeInstitutionId;
                const isVerified = profile.verificationStatus === 'VERIFIED';

                return (
                  <button
                    key={profile.id}
                    onClick={() => handleSelect(inst.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all active:scale-98 ${
                      isActive
                        ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-950/30'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={inst.logoUrl}
                        alt={inst.shortName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 truncate text-sm">
                            {inst.name}
                          </span>
                          {isActive && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {profile.department} • Class of {profile.graduationYear}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {isVerified ? (
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Portal Verified
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-400 font-medium">
                              ⚠️ Pending Portal Verification
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {profile.matriculationNo}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pl-2 shrink-0">
                      {isActive ? (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-blue-400 hover:underline">
                          Switch
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discover & Join Other Universities Section */}
          <div className="pt-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">
              Available Multi-Tenant Institutions
            </div>
            <div className="space-y-2">
              {institutions
                .filter(inst => !enrolledInstIds.has(inst.id))
                .map(inst => (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={inst.logoUrl}
                        alt={inst.shortName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 text-sm truncate">
                          {inst.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {inst.shortName} • Est. {inst.establishedYear}
                        </div>
                        <div className="text-[11px] text-cyan-400/90 mt-0.5">
                          {inst.stats?.verifiedAlumni?.toLocaleString()} verified alumni
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinNew(inst)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-blue-600 active:scale-95 text-xs font-semibold text-white transition-all shrink-0 ml-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Enroll
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('medium');
              onClose();
              onStartOnboarding();
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Add Another Alma Mater
          </button>
        </div>
      </div>
    </div>
  );
};
