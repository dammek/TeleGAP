import React, { useState } from 'react';
import { AlumniProfile, TelegramUser } from '../types';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';
import {
  X,
  Sparkles,
  Send,
  CheckCircle2,
  Calendar,
  Target,
  FileText,
  Clock,
  Wand2,
  ShieldCheck,
  Building,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface MentorshipRequestModalProps {
  isOpen: boolean;
  mentorProfile: AlumniProfile | null;
  currentUser: TelegramUser;
  senderProfileId?: string;
  onClose: () => void;
  onRequestSent?: () => void;
}

const PRESET_TOPICS = [
  'Career Guidance & Tech Transition',
  'Mock Interview & Resume Review',
  'Postgraduate & Scholarship Advice',
  'Startup & Product Strategy',
  'Software Architecture & System Design',
  'Alumni Industry Networking'
];

const PRESET_GOALS = [
  'Transitioning into senior engineering / leadership role',
  'Preparing for upcoming technical interviews & system design',
  'Seeking feedback on graduate school applications / SOP',
  'Validating MVP tech stack and go-to-market plan',
  'Understanding career opportunities in global tech ecosystems'
];

const CADENCE_OPTIONS = [
  { id: 'one-off', label: 'One-off 30m Intro Chat', desc: 'Single session for focused advice' },
  { id: 'bi-weekly', label: 'Bi-weekly 1:1 Syncs', desc: 'Regular check-ins over 1-3 months' },
  { id: 'async', label: 'Async Telegram Q&A', desc: 'Direct chat messages when available' }
];

export const MentorshipRequestModal: React.FC<MentorshipRequestModalProps> = ({
  isOpen,
  mentorProfile,
  currentUser,
  senderProfileId,
  onClose,
  onRequestSent
}) => {
  const [topic, setTopic] = useState(PRESET_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [goal, setGoal] = useState(PRESET_GOALS[0]);
  const [customGoal, setCustomGoal] = useState('');
  const [note, setNote] = useState('');
  const [cadence, setCadence] = useState(CADENCE_OPTIONS[0].label);

  const [isRefining, setIsRefining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !mentorProfile) return null;

  const mentorUser = mentorProfile.user;
  const mentorName = mentorUser
    ? `${mentorUser.tgFirstName} ${mentorUser.tgLastName || ''}`.trim()
    : 'Alumni Mentor';

  const isVerified = mentorProfile.verificationStatus === 'VERIFIED';
  const effectiveTopic = customTopic.trim() || topic;
  const effectiveGoal = customGoal.trim() || goal;

  const handleRefineWithAi = async () => {
    setIsRefining(true);
    setErrorMsg('');
    TelegramSdkWrapper.haptic('medium');

    try {
      const data = await safeFetchJson<{ refinedNote: string }>('/api/ai/refine-mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorName,
          mentorRole: mentorProfile.jobTitle || 'Alumnus',
          mentorCompany: mentorProfile.company || '',
          topic: effectiveTopic,
          goal: effectiveGoal,
          rawNote: note || `Hi ${mentorName}, as a fellow alumnus, I would love to connect to discuss ${effectiveGoal}.`,
          senderName: `${currentUser.tgFirstName} ${currentUser.tgLastName || ''}`.trim()
        })
      });

      if (data.success && data.data?.refinedNote) {
        setNote(data.data.refinedNote);
        TelegramSdkWrapper.haptic('success');
      } else {
        setErrorMsg('Could not refine note automatically. You can write your custom note directly.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('AI refinement temporarily unavailable. Continuing with standard template.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorProfile) return;

    setIsSubmitting(true);
    setErrorMsg('');
    TelegramSdkWrapper.haptic('medium');

    try {
      const data = await safeFetchJson('/api/mentorship/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: mentorProfile.institutionId,
          senderProfileId: senderProfileId || currentUser.id,
          mentorProfileId: mentorProfile.id,
          topic: effectiveTopic,
          goal: effectiveGoal,
          note: note.trim() || `I would appreciate your mentorship on ${effectiveGoal}.`,
          cadence,
          senderName: `${currentUser.tgFirstName} ${currentUser.tgLastName || ''}`.trim(),
          senderTgUsername: currentUser.tgUsername,
          mentorName,
          mentorRole: `${mentorProfile.jobTitle || 'Alumnus'} ${mentorProfile.company ? '@ ' + mentorProfile.company : ''}`
        })
      });

      if (data.success) {
        setIsSuccess(true);
        TelegramSdkWrapper.haptic('success');
        if (onRequestSent) onRequestSent();
      } else {
        setErrorMsg(data.error || 'Failed to submit mentorship request. Please retry.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Network error. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTelegramDirect = () => {
    if (mentorUser?.tgUsername) {
      TelegramSdkWrapper.haptic('light');
      TelegramSdkWrapper.openLink(`https://t.me/${mentorUser.tgUsername}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm block">
                Request Alumni Mentorship
              </span>
              <span className="text-[11px] text-slate-400">
                Standardized structured outreach via Telegram
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Mentor Profile Snapshot Banner */}
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center gap-3">
            <div className="relative shrink-0">
              {mentorUser?.tgPhotoUrl ? (
                <img
                  src={mentorUser.tgPhotoUrl}
                  alt={mentorName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white font-bold text-base flex items-center justify-center">
                  {mentorName.charAt(0)}
                </div>
              )}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full text-[10px] font-bold">
                  ✓
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-100 text-xs truncate">
                  {mentorName}
                </span>
                {isVerified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
              <div className="text-[11px] text-slate-300 truncate">
                {mentorProfile.jobTitle || 'Alumnus'} {mentorProfile.company ? `@ ${mentorProfile.company}` : ''}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {mentorProfile.department} • Class of {mentorProfile.graduationYear}
              </div>
            </div>
          </div>

          {isSuccess ? (
            /* Success State */
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Mentorship Request Transmitted!
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Your structured goal and note were queued. We notified {mentorName} with your verified alumni credentials.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-left text-xs space-y-1.5">
                <div className="text-slate-400 text-[11px]">Request Summary:</div>
                <div className="font-semibold text-slate-200">🎯 Goal: {effectiveGoal}</div>
                <div className="text-slate-300 text-[11px]">⏱ Cadence: {cadence}</div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {mentorUser?.tgUsername && (
                  <button
                    onClick={handleOpenTelegramDirect}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-98"
                  >
                    <Send className="w-4 h-4" />
                    Open Chat with @{mentorUser.tgUsername}
                  </button>
                )}

                <button
                  onClick={() => {
                    TelegramSdkWrapper.haptic('light');
                    onClose();
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Mentorship Focus Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  Mentorship Focus Area
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {PRESET_TOPICS.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setTopic(item);
                        setCustomTopic('');
                        TelegramSdkWrapper.haptic('selection');
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                        topic === item && !customTopic
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or specify custom topic..."
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  className="mt-1.5 w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 2. Specific Goal */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Your Specific Goal / Objective
                </label>
                <div className="space-y-1">
                  {PRESET_GOALS.slice(0, 3).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGoal(g);
                        setCustomGoal('');
                        TelegramSdkWrapper.haptic('selection');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] border transition-all truncate ${
                        goal === g && !customGoal
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-semibold'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      • {g}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="E.g., Preparing for Tech Lead interview at fintech company..."
                  value={customGoal}
                  onChange={e => setCustomGoal(e.target.value)}
                  className="mt-1.5 w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 3. Cadence / Meeting Format */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Preferred Cadence
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {CADENCE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setCadence(opt.label);
                        TelegramSdkWrapper.haptic('selection');
                      }}
                      className={`text-left p-2 rounded-xl border transition-all ${
                        cadence === opt.label
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{opt.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Brief Note & AI Polisher */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Brief Note & Context
                  </label>
                  <button
                    type="button"
                    onClick={handleRefineWithAi}
                    disabled={isRefining}
                    className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium transition-colors disabled:opacity-50"
                  >
                    <Wand2 className="w-3 h-3" />
                    {isRefining ? 'Polishing...' : 'Polish with Gemini'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={`Hi ${mentorName}, as a fellow alumnus, I would value your perspective on ${effectiveGoal}. Looking forward to connecting!`}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Transmitting Request...' : `Send Request to ${mentorName}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
