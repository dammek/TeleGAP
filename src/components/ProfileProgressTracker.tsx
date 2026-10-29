import React, { useState } from 'react';
import { AlumniProfile } from '../types';
import {
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Briefcase,
  Building,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  ArrowRight
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';

interface ProfileProgressTrackerProps {
  profile: AlumniProfile | null;
  onOpenVerification: () => void;
  onFocusField?: (fieldName: string) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  weight: number;
  isComplete: boolean;
  actionText?: string;
  onAction?: () => void;
}

export const ProfileProgressTracker: React.FC<ProfileProgressTrackerProps> = ({
  profile,
  onOpenVerification,
  onFocusField
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  if (!profile) return null;

  // Evaluate completeness criteria
  const isEnrolled = !!(profile.matriculationNo && profile.department && profile.graduationYear);
  const isVerified = profile.verificationStatus === 'VERIFIED';
  const hasJobTitle = !!(profile.jobTitle && profile.jobTitle.trim().length > 1);
  const hasCompany = !!(profile.company && profile.company.trim().length > 1);
  const hasBio = !!(profile.bio && profile.bio.trim().length >= 15);
  const hasSkills = !!(profile.skills && profile.skills.length > 0);
  const hasMentorPreference = typeof profile.isMentor === 'boolean';

  const checklist: ChecklistItem[] = [
    {
      id: 'academic',
      label: 'Academic Identity & Matriculation',
      description: 'Department, degree type, and graduation year enrolled',
      weight: 20,
      isComplete: isEnrolled,
    },
    {
      id: 'verification',
      label: 'Official University Verification',
      description: 'Connected with official school portal credentials',
      weight: 20,
      isComplete: isVerified,
      actionText: 'Verify Portal',
      onAction: onOpenVerification,
    },
    {
      id: 'jobTitle',
      label: 'Current Job Title / Role',
      description: 'e.g. Senior Software Engineer, Medical Doctor, Founder',
      weight: 15,
      isComplete: hasJobTitle,
      actionText: 'Add Title',
      onAction: () => onFocusField?.('jobTitle'),
    },
    {
      id: 'company',
      label: 'Current Workplace / Organization',
      description: 'e.g. Paystack, Google, Central Bank, Self-Employed',
      weight: 15,
      isComplete: hasCompany,
      actionText: 'Add Company',
      onAction: () => onFocusField?.('company'),
    },
    {
      id: 'bio',
      label: 'Alumni Bio & Career Summary',
      description: 'Share your background and how you can support peers',
      weight: 15,
      isComplete: hasBio,
      actionText: 'Write Bio',
      onAction: () => onFocusField?.('bio'),
    },
    {
      id: 'skills',
      label: 'Skills & Technical Competencies',
      description: 'Tags for searchable matching in the alumni directory',
      weight: 10,
      isComplete: hasSkills,
      actionText: 'Add Skills',
      onAction: () => onFocusField?.('skills'),
    },
    {
      id: 'mentor',
      label: 'Alumni Mentorship Availability',
      description: 'Set your readiness to mentor students and junior alumni',
      weight: 5,
      isComplete: hasMentorPreference,
      actionText: 'Set Status',
      onAction: () => onFocusField?.('mentor'),
    },
  ];

  // Calculate score
  const totalScore = checklist.reduce((acc, item) => (item.isComplete ? acc + item.weight : acc), 0);

  // Missing items
  const missingItems = checklist.filter(item => !item.isComplete);

  // Profile Tier calculation
  const getTierInfo = (score: number) => {
    if (score === 100) {
      return {
        name: 'All-Star Verified Alumnus',
        badgeColor: 'text-amber-300 bg-amber-950/70 border-amber-500/50',
        progressColor: 'from-emerald-500 to-teal-400',
        textColor: 'text-emerald-400',
        tagline: 'Your profile has 100% directory visibility and top ranking.',
      };
    }
    if (score >= 70) {
      return {
        name: 'Distinguished Alumnus',
        badgeColor: 'text-blue-300 bg-blue-950/70 border-blue-500/50',
        progressColor: 'from-blue-500 to-indigo-500',
        textColor: 'text-blue-400',
        tagline: 'Almost complete! Add remaining info for max networking opportunities.',
      };
    }
    if (score >= 40) {
      return {
        name: 'Rising Alumnus',
        badgeColor: 'text-purple-300 bg-purple-950/70 border-purple-500/50',
        progressColor: 'from-indigo-500 to-purple-500',
        textColor: 'text-indigo-400',
        tagline: 'Good start! Add your career info to get discovered by recruiters & peers.',
      };
    }
    return {
      name: 'Basic Profile',
      badgeColor: 'text-slate-300 bg-slate-800 border-slate-700',
      progressColor: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-400',
      tagline: 'Complete your profile to unlock full directory features.',
    };
  };

  const tier = getTierInfo(totalScore);

  return (
    <div className="p-4 bg-gradient-to-br from-slate-850 to-slate-900 rounded-2xl border border-slate-700/80 shadow-lg space-y-3.5">
      {/* Header & Percentage */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-100">
              Profile Completeness
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {tier.tagline}
          </p>
        </div>

        <div className="text-right">
          <span className={`text-xl font-extrabold ${tier.textColor}`}>
            {totalScore}%
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">COMPLETE</span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tier.progressColor} transition-all duration-700 shadow-sm`}
            style={{ width: `${totalScore}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${tier.badgeColor}`}>
            {tier.name}
          </span>
          <span className="text-slate-400">
            {totalScore === 100 ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 inline" /> 100% Complete
              </span>
            ) : (
              <span>{missingItems.length} suggestion{missingItems.length > 1 ? 's' : ''} to reach 100%</span>
            )}
          </span>
        </div>
      </div>

      {/* Actionable Missing Items Cards */}
      {missingItems.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-300 block">
            Recommended Actions to Reach 100%:
          </span>

          <div className="grid grid-cols-1 gap-2">
            {missingItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/70 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold">+{item.weight}%</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.actionText && (
                  <button
                    type="button"
                    onClick={() => {
                      TelegramSdkWrapper.haptic('light');
                      item.onAction?.();
                    }}
                    className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-[11px] font-bold rounded-lg shrink-0 flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand / Collapse Full Checklist Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            TelegramSdkWrapper.haptic('light');
            setIsDetailsExpanded(!isDetailsExpanded);
          }}
          className="w-full text-center text-[11px] text-slate-400 hover:text-slate-200 font-semibold flex items-center justify-center gap-1 py-1"
        >
          <span>{isDetailsExpanded ? 'Hide Full Checklist' : 'View Full Profile Breakdown'}</span>
          {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isDetailsExpanded && (
          <div className="mt-2 space-y-1.5 p-2 bg-slate-900/70 rounded-xl border border-slate-800 text-xs">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1 px-1.5 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  {item.isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className={item.isComplete ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                    {item.label}
                  </span>
                </div>
                <span className={`font-mono text-[10px] ${item.isComplete ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                  {item.isComplete ? `+${item.weight}%` : `0/${item.weight}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
