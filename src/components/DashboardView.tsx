import React from 'react';
import { Institution, AlumniProfile, TelegramUser } from '../types';
import {
  ShieldCheck,
  Send,
  Users,
  Sparkles,
  Calendar,
  Compass,
  ArrowRight,
  ExternalLink,
  Lock,
  Building,
  GraduationCap,
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Bot,
  MessageSquareCode,
  Wallet,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { AlumniLocationsHeatmap } from './AlumniLocationsHeatmap';
import { UniversityNewsFeed } from './UniversityNewsFeed';

interface DashboardViewProps {
  institution?: Institution | null;
  profile: AlumniProfile | null;
  currentUser: TelegramUser;
  onOpenVerification: () => void;
  onOpenOnboarding: () => void;
  onNavigateTab: (tab: 'dashboard' | 'directory' | 'chapters' | 'profile') => void;
  onOpenAiChatbot?: () => void;
  onOpenCareerRoadmap?: () => void;
  onOpenWallet?: () => void;
  onExploreLocation?: (city: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  institution,
  profile,
  currentUser,
  onOpenVerification,
  onOpenOnboarding,
  onNavigateTab,
  onOpenAiChatbot,
  onOpenCareerRoadmap,
  onOpenWallet,
  onExploreLocation,
}) => {
  const isVerified = profile?.verificationStatus === 'VERIFIED';
  const stats = institution?.stats || {
    totalAlumni: 14200,
    verifiedAlumni: 8900,
    mentorsCount: 420,
    chaptersCount: 4
  };


  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* 1. Alumni Membership Hero Card */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 border border-slate-700/60 shadow-xl transition-all"
        style={{
          background: `linear-gradient(135deg, ${institution.primaryColor}dd 0%, #0f172a 100%)`
        }}
      >
        {/* Ambient background glow */}
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: institution.accentColor }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={institution.logoUrl}
                alt={institution.name}
                referrerPolicy="no-referrer"
                className="w-13 h-13 rounded-xl object-cover border-2 border-white/20 shadow-md shrink-0"
              />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold block">
                  {institution.name}
                </span>
                <h1 className="text-lg font-extrabold text-white leading-tight">
                  {currentUser.tgFirstName} {currentUser.tgLastName || ''}
                </h1>
                {profile && (
                  <p className="text-xs text-slate-200/90 mt-0.5">
                    {profile.department} • Class of {profile.graduationYear}
                  </p>
                )}
              </div>
            </div>

            {/* Status Pill */}
            {isVerified ? (
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            ) : profile ? (
              <button
                onClick={onOpenVerification}
                className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Verify Now
              </button>
            ) : (
              <button
                onClick={onOpenOnboarding}
                className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
              >
                Enroll Alma Mater
              </button>
            )}
          </div>

          {/* Academic & Career Metadata row */}
          {profile ? (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs text-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">MATRIC NO</span>
                <span className="font-mono font-bold">{profile.matriculationNo}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">CURRENT ROLE</span>
                <span className="font-medium truncate block">
                  {profile.jobTitle || 'Alumnus'} {profile.company ? `@ ${profile.company}` : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-black/40 backdrop-blur-sm rounded-xl border border-white/15 text-xs text-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-white block">Ready to join your alumni chapter?</span>
                <span className="text-[11px] text-slate-300">Enroll your {institution.shortName} credentials to access the verified directory.</span>
              </div>
              <button
                onClick={onOpenOnboarding}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shrink-0 active:scale-95 transition-all"
              >
                Enroll Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New User Welcome & Quick Setup Banner */}
      {!profile && (
        <div className="p-4 bg-gradient-to-br from-blue-950/60 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white">Welcome, {currentUser.tgFirstName}!</h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Connect with graduates from <span className="font-semibold text-cyan-300">{institution.name}</span>. Enrolling takes under 60 seconds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
            <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-white block">1. Profile</span>
              <span className="text-[10px] text-slate-400">Class & Dept</span>
            </div>
            <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-white block">2. Verify</span>
              <span className="text-[10px] text-slate-400">School Portal</span>
            </div>
            <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-white block">3. Connect</span>
              <span className="text-[10px] text-slate-400">TG Supergroup</span>
            </div>
          </div>

          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('selection');
              onOpenOnboarding();
            }}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/40 transition-all active:scale-98"
          >
            <span>Complete Alumni Enrollment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Verification Required Alert Banner (if unverified) */}
      {profile && !isVerified && (
        <div className="p-4 bg-gradient-to-r from-amber-950/50 to-slate-900 border border-amber-500/40 rounded-2xl flex items-start gap-3 shadow-lg shadow-amber-950/20">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-bold text-amber-300">
              Official University Verification Required
            </h2>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Verify your matriculation number <span className="font-mono font-bold text-white">{profile.matriculationNo}</span> via the {institution.shortName} portal gateway to unlock exclusive Telegram supergroup access and verified networking.
            </p>
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('medium');
                onOpenVerification();
              }}
              className="mt-2.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify via School Portal Now
            </button>
          </div>
        </div>
      )}

      {/* 3. Verified Alumni Supergroup Lounge Card */}
      <div className="p-4 bg-gradient-to-b from-slate-800/90 to-slate-850 rounded-2xl border border-slate-700/80 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100">
                Verified Alumni Supergroup Lounge
              </h2>
              <span className="text-[10px] text-slate-400">
                {institution.shortName} Official Telegram Channel & Group
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            {isVerified ? 'Active Access' : 'Locked'}
          </span>
        </div>

        {isVerified ? (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect with thousands of verified alumni, access job referrals, participate in executive AMAs, and join regional breakout chats.
            </p>
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('heavy');
                onOpenVerification();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-all active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              Generate / Open Single-Use Supergroup Link
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        ) : (
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Single-use invite link is generated upon portal verification.
            </span>
          </div>
        )}
      </div>

      {/* 4. Quick Network Metrics Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-center">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
            Verified Alumni
          </span>
          <span className="text-base font-extrabold text-slate-100 mt-0.5 block">
            {stats.verifiedAlumni.toLocaleString()}+
          </span>
        </div>
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-center">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
            Active Mentors
          </span>
          <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
            {stats.mentorsCount.toLocaleString()}+
          </span>
        </div>
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-center">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
            Chapters
          </span>
          <span className="text-base font-extrabold text-cyan-400 mt-0.5 block">
            {stats.chaptersCount}
          </span>
        </div>
      </div>

      {/* 5. Alumni Career Locations & Global Radar Heatmap */}
      <AlumniLocationsHeatmap
        institution={institution}
        onExploreLocation={(city) => {
          if (onExploreLocation) {
            onExploreLocation(city);
          } else {
            onNavigateTab('directory');
          }
        }}
      />

      {/* 6. Gemini AI Advisor & Career Roadmap Spotlight Banner */}
      {(onOpenAiChatbot || onOpenCareerRoadmap) && (
        <div className="p-4 bg-gradient-to-r from-blue-950/60 via-indigo-950/50 to-slate-900 border border-blue-500/30 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-100">
                  Gemini Alumni Intelligence & Career Architect
                </span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  AI 3.7
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Personalized 3-phase career progression roadmaps, mock interview coaching, and postgraduate scholarship strategy powered by Gemini.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {onOpenCareerRoadmap && (
              <button
                onClick={() => {
                  TelegramSdkWrapper.haptic('medium');
                  onOpenCareerRoadmap();
                }}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Career Roadmap</span>
              </button>
            )}

            {onOpenAiChatbot && (
              <button
                onClick={() => {
                  TelegramSdkWrapper.haptic('medium');
                  onOpenAiChatbot();
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Alumni Advisor Chat</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 7. Official University News & Campus Press Releases */}
      <UniversityNewsFeed institution={institution} />

      {/* 8. Navigation Hub Grid */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Explore Network & Services
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('selection');
              onNavigateTab('directory');
            }}
            className="p-3.5 bg-slate-800/60 hover:bg-slate-800 active:scale-98 transition-all rounded-xl border border-slate-700/60 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 group-hover:bg-blue-500/30 transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-100 flex items-center justify-between">
              Directory & Mentors
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Connect with mentors, tech leads & classmates
            </p>
          </button>

          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('selection');
              onNavigateTab('chapters');
            }}
            className="p-3.5 bg-slate-800/60 hover:bg-slate-800 active:scale-98 transition-all rounded-xl border border-slate-700/60 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:bg-emerald-500/30 transition-colors">
              <Compass className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-100 flex items-center justify-between">
              Chapters & Events
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Regional groups in Lagos, London, Abuja & reunions
            </p>
          </button>

          {onOpenWallet && (
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                onOpenWallet();
              }}
              className="p-3.5 bg-slate-800/60 hover:bg-slate-800 active:scale-98 transition-all rounded-xl border border-slate-700/60 text-left group col-span-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                      ZebraWallet & Alumni Dues
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-mono font-bold">
                        zebrawallet.org
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Pay statutory dues, student scholarships, faculty levies & view digital clearance receipts.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5 shrink-0 mt-2" />
              </div>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
