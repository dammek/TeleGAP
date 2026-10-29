import React, { useState } from 'react';
import { LinkedInImportProfile, TelegramUser } from '../types';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';
import {
  X,
  Linkedin,
  Sparkles,
  CheckCircle2,
  Briefcase,
  Building2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProfile?: (data: LinkedInImportProfile) => void;
  onImportSuccess?: (data: LinkedInImportProfile) => void;
  currentUser?: TelegramUser;
  currentProfileSummary?: {
    jobTitle?: string;
    company?: string;
    skills?: string[];
  };
}

export const LinkedInImportModal: React.FC<LinkedInImportModalProps> = ({
  isOpen,
  onClose,
  onApplyProfile,
  onImportSuccess,
  currentUser,
  currentProfileSummary
}) => {
  const [vanityUrl, setVanityUrl] = useState('adebayo-ogundimu');
  const [authStep, setAuthStep] = useState<'CONNECT' | 'IMPORTING' | 'PREVIEW'>('CONNECT');
  const [importedData, setImportedData] = useState<LinkedInImportProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartImport = async (targetId?: string) => {
    const idToUse = targetId || vanityUrl.trim();
    if (!idToUse) {
      setErrorMsg('Please enter a LinkedIn profile vanity username or URL.');
      return;
    }

    TelegramSdkWrapper.haptic('medium');
    setErrorMsg(null);
    setAuthStep('IMPORTING');

    try {
      const json = await safeFetchJson<LinkedInImportProfile>('/api/integrations/linkedin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vanityUrl: idToUse })
      });

      if (json.success && json.data) {
        setImportedData(json.data);
        setAuthStep('PREVIEW');
        TelegramSdkWrapper.haptic('success');
      } else {
        setErrorMsg(json.error || 'Failed to retrieve LinkedIn profile.');
        setAuthStep('CONNECT');
        TelegramSdkWrapper.haptic('error');
      }
    } catch (err: any) {
      setErrorMsg('Connection error while contacting LinkedIn import service.');
      setAuthStep('CONNECT');
      TelegramSdkWrapper.haptic('error');
    }
  };

  const handleApply = () => {
    if (!importedData) return;
    TelegramSdkWrapper.haptic('success');
    if (onImportSuccess) onImportSuccess(importedData);
    if (onApplyProfile) onApplyProfile(importedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <Linkedin className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                LinkedIn Profile Import
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono font-normal">
                  OAuth2 Sync
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Auto-sync job title, company, summary bio & skills matrix
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authStep === 'CONNECT' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/70 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      Direct LinkedIn Credential Sync
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Connect your verified LinkedIn account to instantly populate your Alumni TMA profile with your latest workplace and skills.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    LinkedIn Profile URL or Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">
                      linkedin.com/in/
                    </span>
                    <input
                      type="text"
                      value={vanityUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                      onChange={e => setVanityUrl(e.target.value)}
                      placeholder="adebayo-ogundimu"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-32 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Quick Sample Profiles:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'adebayo-ogundimu', label: 'Adebayo (Cloud Architect @ Paystack)' },
                      { id: 'fatima-abdullahi', label: 'Fatima (Cybersecurity @ Standard Chartered)' },
                      { id: 'emeka-nwosu', label: 'Emeka (AI Researcher @ DeepMind)' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setVanityUrl(p.id);
                          handleStartImport(p.id);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 rounded-lg text-[11px] text-slate-300 hover:text-white transition-all text-left"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartImport()}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 active:scale-98 transition-all"
              >
                <Linkedin className="w-4 h-4 fill-current" />
                <span>Authenticate & Import from LinkedIn</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {authStep === 'IMPORTING' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">
                  Syncing with LinkedIn OAuth2 Gateway...
                </h4>
                <p className="text-xs text-slate-400">
                  Retrieving career history, headline, company and skills matrix.
                </p>
              </div>
            </div>
          )}

          {authStep === 'PREVIEW' && importedData && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>LinkedIn profile successfully extracted. Review details below:</span>
              </div>

              {/* Parsed summary card */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 font-bold text-sm">
                    in
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-100 truncate">
                      {importedData.jobTitle}
                    </h4>
                    <div className="text-xs text-blue-400 font-semibold flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{importedData.company}</span>
                      {importedData.locationCity && (
                        <span className="text-slate-400 font-normal">
                          • {importedData.locationCity}, {importedData.locationCountry}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {importedData.headline && (
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 italic">
                    "{importedData.headline}"
                  </p>
                )}

                {importedData.bio && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Summary Bio:
                    </span>
                    <p className="text-xs text-slate-300 line-clamp-3">
                      {importedData.bio}
                    </p>
                  </div>
                )}

                {/* Skills tags */}
                {importedData.skills && importedData.skills.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Skills Extracted ({importedData.skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {importedData.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-950/60 border border-blue-800/50 text-blue-300 rounded-md text-[11px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthStep('CONNECT')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose Other</span>
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 active:scale-98 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply to My Alumni Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
