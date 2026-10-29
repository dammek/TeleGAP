import React, { useState, useEffect } from 'react';
import { AlumniProfile, TelegramUser, Institution, SkillEndorsement, EndorsementRelationship } from '../types';
import {
  X,
  ShieldCheck,
  Send,
  Sparkles,
  Building,
  GraduationCap,
  Briefcase,
  MapPin,
  Linkedin,
  Github,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MessageSquareQuote,
  FileDown,
  ThumbsUp,
  Award,
  PlusCircle,
  Users,
  QrCode,
  Share2,
  Copy,
  Check,
  Link,
  Eye,
  Lock,
  Download
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { generateAlumniCvPdf } from '../lib/cvGenerator';
import { safeFetchJson } from '../lib/apiClient';
import { downloadVCard } from '../lib/vcard';
import { CareerMilestonesTimeline } from './CareerMilestonesTimeline';
import { ProfileQrModal } from './ProfileQrModal';

interface ProfileModalProps {
  profile: AlumniProfile | null;
  currentUser: TelegramUser;
  institution?: Institution;
  onClose: () => void;
  onRequestMentorship?: (profile: AlumniProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  currentUser,
  institution,
  onClose,
  onRequestMentorship
}) => {
  const [mentorshipTopic, setMentorshipTopic] = useState('Career Guidance & Tech Transition');
  const [mentorshipNote, setMentorshipNote] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedProfileLink, setCopiedProfileLink] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [profileViewsCount, setProfileViewsCount] = useState<number>(profile?.profileViews || 0);

  // Endorsements & Testimonials State
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
  const [isLoadingEndorsements, setIsLoadingEndorsements] = useState(false);
  const [isAddingEndorsement, setIsAddingEndorsement] = useState(false);
  const [newEndorsementSkill, setNewEndorsementSkill] = useState('');
  const [newEndorsementRelationship, setNewEndorsementRelationship] = useState<EndorsementRelationship>('ALUMNI_PEER');
  const [newEndorsementMessage, setNewEndorsementMessage] = useState('');
  const [isSubmittingEndorsement, setIsSubmittingEndorsement] = useState(false);
  const [endorsementSuccessMsg, setEndorsementSuccessMsg] = useState(false);

  // Record profile view on mount
  useEffect(() => {
    if (!profile?.id) return;

    safeFetchJson<{ profileViews: number }>(`/api/profile/${profile.id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewerUserId: currentUser.id })
    }).then(res => {
      if (res.success && res.data && typeof res.data.profileViews === 'number') {
        setProfileViewsCount(res.data.profileViews);
      }
    }).catch(() => {});
  }, [profile?.id, currentUser?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    let isMounted = true;
    setIsLoadingEndorsements(true);

    safeFetchJson<SkillEndorsement[]>(`/api/endorsements?profileId=${profile.id}`)
      .then(data => {
        if (data.success && data.data && isMounted) {
          setEndorsements(data.data);
        }
      })
      .catch(err => console.error('Failed to load endorsements:', err))
      .finally(() => {
        if (isMounted) setIsLoadingEndorsements(false);
      });

    if (profile.skills && profile.skills.length > 0) {
      setNewEndorsementSkill(profile.skills[0]);
    }

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  if (!profile) return null;

  const isVerified = profile.verificationStatus === 'VERIFIED';
  const user = profile.user || currentUser;
  const displayName = user
    ? `${user.tgFirstName} ${user.tgLastName || ''}`
    : 'Alumnus';

  // Professional Identity Theme Resolution
  const theme = profile.themeConfig || {
    accentColor: 'azure',
    pattern: 'mesh'
  };

  const getThemeHeaderGradient = () => {
    switch (theme.accentColor) {
      case 'emerald':
        return 'from-emerald-900/70 via-teal-950/80 to-slate-900';
      case 'amethyst':
        return 'from-purple-900/70 via-indigo-950/80 to-slate-900';
      case 'amber':
        return 'from-amber-900/70 via-orange-950/80 to-slate-900';
      case 'cyan':
        return 'from-cyan-900/70 via-blue-950/80 to-slate-900';
      case 'crimson':
        return 'from-rose-900/70 via-red-950/80 to-slate-900';
      case 'azure':
      default:
        return 'from-blue-900/70 via-indigo-950/80 to-slate-900';
    }
  };

  const getThemePatternOverlay = () => {
    switch (theme.pattern) {
      case 'matrix':
        return 'bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:12px_12px]';
      case 'dots':
        return 'bg-[radial-gradient(#ffffff20_2px,transparent_2px)] [background-size:18px_18px]';
      case 'waves':
        return 'bg-[linear-gradient(45deg,#ffffff08_25%,transparent_25%,transparent_50%,#ffffff08_50%,#ffffff08_75%,transparent_75%,transparent)] [background-size:24px_24px]';
      case 'topography':
        return 'bg-[radial-gradient(ellipse_at_top,#ffffff15,transparent_50%)]';
      case 'mesh':
      default:
        return 'bg-[radial-gradient(#38bdf820_1px,transparent_1px)] [background-size:16px_16px]';
    }
  };

  const getAccentBadgeColor = () => {
    switch (theme.accentColor) {
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'amethyst':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'cyan':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'crimson':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'azure':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const handleDownloadCv = () => {
    TelegramSdkWrapper.haptic('medium');
    setIsGeneratingPdf(true);
    try {
      const targetInst: Institution = institution || {
        id: profile.institutionId,
        name: 'Alumni Network',
        shortName: 'Alumni',
        slug: 'network',
        primaryColor: '#1e3a8a',
        accentColor: '#3b82f6',
        portalType: 'PORTAL_API',
        portalName: 'Alumni Portal',
        logoUrl: '',
        supergroupId: '-1001234567890',
        supergroupName: 'Alumni Supergroup'
      };
      generateAlumniCvPdf(profile, targetInst, user);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 800);
    }
  };

  const handleSendMentorship = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingRequest(true);
    TelegramSdkWrapper.haptic('medium');

    try {
      const res = await fetch('/api/mentorship/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: profile.institutionId,
          senderProfileId: currentUser.id,
          mentorProfileId: profile.id,
          senderName: `${currentUser.tgFirstName} ${currentUser.tgLastName || ''}`,
          senderTgUsername: currentUser.tgUsername,
          topic: mentorshipTopic,
          note: mentorshipNote
        })
      });

      const data = await res.json();
      if (data.success) {
        setRequestSent(true);
        TelegramSdkWrapper.haptic('success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleOpenTelegramChat = () => {
    if (user?.tgUsername) {
      TelegramSdkWrapper.haptic('light');
      TelegramSdkWrapper.openLink(`https://t.me/${user.tgUsername}`);
    }
  };

  const handleCopyProfileLink = () => {
    TelegramSdkWrapper.haptic('success');
    const profileUrl = `${window.location.origin}?profileId=${profile.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setCopiedProfileLink(true);
      setTimeout(() => setCopiedProfileLink(false), 3000);
    }
  };

  const handleVoteEndorsement = async (endorsementId: string) => {
    TelegramSdkWrapper.haptic('light');
    try {
      const json = await safeFetchJson<SkillEndorsement>(`/api/endorsements/${endorsementId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (json.success && json.data) {
        setEndorsements(prev =>
          prev.map(item => (item.id === endorsementId ? json.data! : item))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitEndorsement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndorsementSkill || !newEndorsementMessage.trim()) return;

    setIsSubmittingEndorsement(true);
    TelegramSdkWrapper.haptic('medium');

    try {
      const json = await safeFetchJson<SkillEndorsement>('/api/endorsements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetProfileId: profile.id,
          authorUserId: currentUser.id,
          authorName: `${currentUser.tgFirstName} ${currentUser.tgLastName || ''}`,
          authorHeadline: 'Alumni Network Member',
          authorGradYear: profile.graduationYear,
          authorPhotoUrl: currentUser.tgPhotoUrl,
          skill: newEndorsementSkill,
          message: newEndorsementMessage.trim(),
          relationship: newEndorsementRelationship
        })
      });

      if (json.success && json.data) {
        TelegramSdkWrapper.haptic('success');
        setEndorsements(prev => [json.data!, ...prev]);
        setNewEndorsementMessage('');
        setIsAddingEndorsement(false);
        setEndorsementSuccessMsg(true);
        setTimeout(() => setEndorsementSuccessMsg(false), 4000);
      }
    } catch (e) {
      console.error(e);
      TelegramSdkWrapper.haptic('error');
    } finally {
      setIsSubmittingEndorsement(false);
    }
  };

  const getRelationshipLabel = (rel: EndorsementRelationship) => {
    switch (rel) {
      case 'COLLEAGUE':
        return 'Work Colleague';
      case 'MENTOR':
        return 'Mentored Alum';
      case 'STUDY_PARTNER':
        return 'Class Study Partner';
      case 'PROJECT_COLLABORATOR':
        return 'Project Collaborator';
      case 'ALUMNI_PEER':
      default:
        return 'Alumni Peer';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-slate-100 text-sm">
              Alumni Member Profile
            </span>
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Avatar & Header Card with Theme Backdrop */}
          <div className={`relative overflow-hidden p-4 rounded-2xl border border-slate-700/80 bg-gradient-to-br ${getThemeHeaderGradient()} shadow-lg`}>
            {/* Pattern Overlay */}
            <div className={`absolute inset-0 ${getThemePatternOverlay()} opacity-40 pointer-events-none`} />

            <div className="relative z-10 flex items-start gap-4">
              <div className="relative shrink-0">
                {user?.tgPhotoUrl ? (
                  <img
                    src={user.tgPhotoUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                    {displayName.charAt(0)}
                  </div>
                )}
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full shadow-md text-xs font-bold" title="Verified Member">
                    ✓
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white text-base truncate drop-shadow-sm">
                    {displayName}
                  </h3>
                  {profile.themeConfig && (
                    <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${getAccentBadgeColor()}`}>
                      {theme.accentColor}
                    </span>
                  )}
                  {profile.privacyMode && (
                    <span className="text-[10px] font-semibold bg-slate-900/80 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Privacy Mode
                    </span>
                  )}
                </div>

                {user?.tgUsername && (
                  <div className="text-xs text-cyan-300 font-mono mt-0.5">
                    @{user.tgUsername}
                  </div>
                )}

                <div className="text-xs text-slate-200 font-medium mt-1">
                  {profile.jobTitle || 'Alumnus'} {profile.company ? `@ ${profile.company}` : ''}
                </div>

                {profile.locationCity && (
                  <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {profile.locationCity} {profile.locationCountry ? `, ${profile.locationCountry}` : ''}
                  </div>
                )}

                {/* Profile Views Counter Badge */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] font-mono text-cyan-300 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-cyan-400" />
                    <span>{profileViewsCount} Profile Views</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      TelegramSdkWrapper.haptic('light');
                      setIsQrModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-slate-200 bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1 transition-all active:scale-95"
                    title="View and share QR code for this profile"
                  >
                    <QrCode className="w-3 h-3 text-blue-300" />
                    <span>QR Code</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Badge Bar */}
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Institutional Standing:</span>
              {isVerified ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Official Registry Verified
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">Unverified Alumnus</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50 text-[11px]">
              <div>
                <span className="text-slate-400 block font-mono">DEPARTMENT</span>
                <span className="font-semibold text-slate-200">{profile.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono">CLASS & DEGREE</span>
                <span className="font-semibold text-slate-200">
                  {profile.degreeType} • Class of {profile.graduationYear}
                </span>
              </div>
            </div>
          </div>

          {/* Bio (Masked if Privacy Mode and viewer is not owner) */}
          {profile.privacyMode && currentUser.id !== profile.userId ? (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                About
              </span>
              <div className="text-xs text-slate-400 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Public bio and direct contact details hidden by alumnus in Privacy Mode.</span>
              </div>
            </div>
          ) : profile.bio ? (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                About
              </span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                {profile.bio}
              </p>
            </div>
          ) : null}

          {/* Core Skills */}
          {profile.skills.length > 0 && (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                Core Competencies & Skills
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {profile.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 font-mono"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Career Milestones & Professional Achievements Timeline */}
          <CareerMilestonesTimeline
            profile={profile}
            isEditable={currentUser.id === profile.userId}
          />

          {/* ========================================================= */}
          {/* Testimonials & Skill Endorsements Section */}
          {/* ========================================================= */}
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-100">
                  Testimonials & Endorsements ({endorsements.length})
                </h4>
              </div>

              <button
                onClick={() => {
                  TelegramSdkWrapper.haptic('light');
                  setIsAddingEndorsement(!isAddingEndorsement);
                }}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAddingEndorsement ? 'Cancel' : 'Endorse Skill'}</span>
              </button>
            </div>

            {endorsementSuccessMsg && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Your endorsement has been added to {displayName}'s profile!</span>
              </div>
            )}

            {/* Expandable Endorse Skill Form */}
            {isAddingEndorsement && (
              <form onSubmit={handleSubmitEndorsement} className="p-3 bg-slate-900/90 rounded-xl border border-blue-500/40 space-y-2.5 animate-in fade-in duration-150">
                <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Leave a Public Endorsement for {displayName}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Skill to Endorse
                    </label>
                    {profile.skills.length > 0 ? (
                      <select
                        value={newEndorsementSkill}
                        onChange={e => setNewEndorsementSkill(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        {profile.skills.map((s, idx) => (
                          <option key={idx} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={newEndorsementSkill}
                        onChange={e => setNewEndorsementSkill(e.target.value)}
                        placeholder="e.g. Leadership"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Your Relationship
                    </label>
                    <select
                      value={newEndorsementRelationship}
                      onChange={e => setNewEndorsementRelationship(e.target.value as EndorsementRelationship)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="ALUMNI_PEER">Alumni Peer</option>
                      <option value="COLLEAGUE">Work Colleague</option>
                      <option value="MENTOR">Mentored Alum</option>
                      <option value="STUDY_PARTNER">Class Study Partner</option>
                      <option value="PROJECT_COLLABORATOR">Project Collaborator</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                    Testimonial / Endorsement Note
                  </label>
                  <textarea
                    rows={2}
                    value={newEndorsementMessage}
                    onChange={e => setNewEndorsementMessage(e.target.value)}
                    placeholder="Share specific examples of working together or their technical depth..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingEndorsement(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEndorsement || !newEndorsementMessage.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
                  >
                    <Send className="w-3 h-3" />
                    {isSubmittingEndorsement ? 'Publishing...' : 'Publish Endorsement'}
                  </button>
                </div>
              </form>
            )}

            {/* Endorsements List */}
            {isLoadingEndorsements ? (
              <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                Loading peer skill endorsements...
              </div>
            ) : endorsements.length === 0 ? (
              <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/40 text-center space-y-1">
                <p className="text-xs text-slate-400">
                  No peer endorsements yet. Be the first alumnus to endorse {displayName}'s skills!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {endorsements.map((end) => {
                  const hasVoted = end.votedUserIds?.includes(currentUser.id);
                  return (
                    <div
                      key={end.id}
                      className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {end.authorPhotoUrl ? (
                            <img
                              src={end.authorPhotoUrl}
                              alt={end.authorName}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center shrink-0">
                              {end.authorName.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate">
                              {end.authorName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {end.authorHeadline || 'Alumnus'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] bg-blue-950/70 text-blue-300 font-mono font-bold px-2 py-0.5 rounded-md border border-blue-800/50">
                            {end.skill}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed italic pl-1 border-l-2 border-slate-700">
                        "{end.message}"
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-700/40">
                        <span className="bg-slate-700/40 px-1.5 py-0.5 rounded text-slate-300">
                          {getRelationshipLabel(end.relationship)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleVoteEndorsement(end.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all active:scale-95 ${
                            hasVoted
                              ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Helpful endorsement vote"
                        >
                          <ThumbsUp className="w-2.5 h-2.5" />
                          <span>Helpful ({end.helpfulVotes || 0})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mentorship Section */}
          {profile.isMentor && (
            <div className="p-4 bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-amber-300">
                  Open for Alumni Mentorship
                </h4>
              </div>

              {profile.mentoringTopics.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block">Mentoring Focus Areas:</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.mentoringTopics.map((topic, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md"
                      >
                        • {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentorship Request Action */}
              {requestSent ? (
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-300 space-y-1">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-400" />
                  <div className="font-bold">Mentorship Request Transmitted!</div>
                  <p className="text-[11px] text-slate-300">
                    A notification was dispatched to {displayName} on Telegram.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {onRequestMentorship ? (
                    <button
                      type="button"
                      onClick={() => {
                        TelegramSdkWrapper.haptic('medium');
                        onRequestMentorship(profile);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Request Mentorship (Goals & AI Polish)
                    </button>
                  ) : (
                    <form onSubmit={handleSendMentorship} className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Briefly introduce yourself and what advice you are looking for..."
                        value={mentorshipNote}
                        onChange={e => setMentorshipNote(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        disabled={isSendingRequest}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50"
                      >
                        {isSendingRequest ? 'Sending Request...' : 'Send Mentorship Request'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-wrap gap-2">
          {/* Add to Contacts button */}
          <button
            type="button"
            onClick={() => {
              TelegramSdkWrapper.haptic('medium');
              downloadVCard(profile);
            }}
            className="px-3 py-2.5 text-xs font-semibold rounded-xl border bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            title="Download .vcf contact card to phone contacts"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add to Contacts</span>
          </button>

          {/* Show QR Code button */}
          <button
            type="button"
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              setIsQrModalOpen(true);
            }}
            className="px-3 py-2.5 text-xs font-semibold rounded-xl border bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            title="Show QR Code for this alumni profile"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Show QR</span>
          </button>

          <button
            onClick={handleCopyProfileLink}
            className={`px-3 py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              copiedProfileLink
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Copy deep link to this alumni profile"
          >
            {copiedProfileLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Link className="w-3.5 h-3.5 text-blue-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {user?.tgUsername && (
            profile.privacyMode && currentUser.id !== profile.userId ? (
              <span className="flex-1 min-w-[130px] py-2.5 bg-slate-800/80 text-slate-500 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-700/60">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Direct Connects Disabled</span>
              </span>
            ) : (
              <button
                onClick={handleOpenTelegramChat}
                className="flex-1 min-w-[130px] py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                Message
              </button>
            )
          )}

          <button
            onClick={handleDownloadCv}
            disabled={isGeneratingPdf}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            title="Download Alumni CV as PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-400" />
            <span>{isGeneratingPdf ? '...' : 'Download CV'}</span>
          </button>

          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              onClose();
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>

      {/* QR Code Modal for Profile */}
      <ProfileQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        profile={profile}
        institution={institution}
      />
    </div>
  );
};
