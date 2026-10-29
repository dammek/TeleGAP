import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Institution,
  AlumniProfile,
  TelegramUser,
  AiAdvisorRole
} from './types';
import { DEMO_TELEGRAM_USERS } from './server/mockData';
import { TelegramSdkWrapper } from './lib/telegramSdk';
import { safeFetchJson, getFallbackInstitutions, getFallbackUserProfiles } from './lib/apiClient';
import { TelegramHeader } from './components/TelegramHeader';
import { SchoolSelectorModal } from './components/SchoolSelectorModal';
import { DashboardView } from './components/DashboardView';
import { VerificationModal } from './components/VerificationModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { DirectoryView } from './components/DirectoryView';
import { ChaptersEventsView } from './components/ChaptersEventsView';
import { ProfileModal } from './components/ProfileModal';
import { MentorshipRequestModal } from './components/MentorshipRequestModal';
import { AlumniAiChatbot } from './components/AlumniAiChatbot';
import { LinkedInImportModal } from './components/LinkedInImportModal';
import { AlumniWalletModal } from './components/AlumniWalletModal';
import { TelegramDevToolbar } from './components/TelegramDevToolbar';
import { ProfileProgressTracker } from './components/ProfileProgressTracker';
import { ThemePickerSection } from './components/ThemePickerSection';
import { SettingsSection } from './components/SettingsSection';
import { CareerMilestonesTimeline } from './components/CareerMilestonesTimeline';
import { generateAlumniCvPdf } from './lib/cvGenerator';
import {
  Home,
  Users,
  Compass,
  User,
  ShieldCheck,
  Building2,
  Sparkles,
  Lock,
  Save,
  CheckCircle2,
  Briefcase,
  MapPin,
  Bot,
  FileDown,
  ArrowRight,
  Download,
  Wallet,
  CreditCard,
  Linkedin,
  Eye,
  EyeOff,
  Edit3,
  Link,
  Copy,
  Check
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<TelegramUser>(DEMO_TELEGRAM_USERS[0]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [activeInstitutionId, setActiveInstitutionId] = useState<string>('inst-futminna');
  const [userProfiles, setUserProfiles] = useState<AlumniProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'chapters' | 'profile'>('dashboard');
  const [isProfilePreviewMode, setIsProfilePreviewMode] = useState<boolean>(false);

  // Directory filter initial state from Dashboard exploration
  const [directoryInitialQuery, setDirectoryInitialQuery] = useState<string>('');
  const [directoryInitialSkill, setDirectoryInitialSkill] = useState<string>('');

  // Modals
  const [isSchoolSelectorOpen, setIsSchoolSelectorOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingTargetInst, setOnboardingTargetInst] = useState<Institution | undefined>(undefined);
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<AlumniProfile | null>(null);
  const [isMentorshipModalOpen, setIsMentorshipModalOpen] = useState(false);
  const [mentorshipMentor, setMentorshipMentor] = useState<AlumniProfile | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiAdvisorRole, setAiAdvisorRole] = useState<AiAdvisorRole>('CAREER_STRATEGIST');
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);

  // Integrations Modals
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Dev toolbar / frame options
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [isLoading, setIsLoading] = useState(true);


  // Profile Edit State
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editIsMentor, setEditIsMentor] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedProfileLink, setCopiedProfileLink] = useState(false);

  const handleCopyProfileLink = (profileId: string) => {
    TelegramSdkWrapper.haptic('success');
    const profileUrl = `${window.location.origin}?profileId=${profileId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setCopiedProfileLink(true);
      setTimeout(() => setCopiedProfileLink(false), 3000);
    }
  };

  // Form input refs for quick focus
  const jobTitleInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLTextAreaElement>(null);
  const skillsInputRef = useRef<HTMLInputElement>(null);

  // Initialize Telegram WebApp SDK
  useEffect(() => {
    TelegramSdkWrapper.init();
    const realUser = TelegramSdkWrapper.getTelegramUser();
    if (realUser) {
      setCurrentUser(realUser);
    }
  }, []);

  // Fetch institutions and user profiles
  const loadUserData = useCallback(async (user: TelegramUser) => {
    setIsLoading(true);
    try {
      // 1. Fetch institutions
      const instData = await safeFetchJson<Institution[]>('/api/institutions');
      if (instData.success && instData.data && instData.data.length > 0) {
        setInstitutions(instData.data);
      } else {
        // Fallback to initial local institutions if server is booting
        setInstitutions(getFallbackInstitutions());
      }

      // 2. Fetch profiles for current user
      const profData = await safeFetchJson<AlumniProfile[]>(`/api/user/profiles?tgUserId=${user.tgUserId}`);
      if (profData.success && profData.data) {
        setUserProfiles(profData.data);
        if (profData.data.length > 0) {
          const hasCurrent = profData.data.some((p: AlumniProfile) => p.institutionId === activeInstitutionId);
          if (!hasCurrent) {
            setActiveInstitutionId(profData.data[0].institutionId);
          }
        }
      } else {
        // Fallback to local profile matching user
        const fallbackProfiles = getFallbackUserProfiles(user.tgUserId);
        if (fallbackProfiles.length > 0) {
          setUserProfiles(fallbackProfiles);
        }
      }
    } catch (err) {
      console.warn('Network issue loading initial data, using local state:', err);
      setInstitutions(getFallbackInstitutions());
      setUserProfiles(getFallbackUserProfiles(user.tgUserId));
    } finally {
      setIsLoading(false);
    }
  }, [activeInstitutionId]);

  useEffect(() => {
    loadUserData(currentUser);
  }, [currentUser, loadUserData]);

  // Current active institution and profile
  const activeInstitution = institutions.find(i => i.id === activeInstitutionId) || institutions[0] || null;
  const activeProfile = userProfiles.find(p => p.institutionId === activeInstitutionId) || null;

  // Sync edit form fields when activeProfile changes
  useEffect(() => {
    if (activeProfile) {
      setEditJobTitle(activeProfile.jobTitle || '');
      setEditCompany(activeProfile.company || '');
      setEditBio(activeProfile.bio || '');
      setEditSkills((activeProfile.skills || []).join(', '));
      setEditIsMentor(activeProfile.isMentor || false);
    } else {
      setEditJobTitle('');
      setEditCompany('');
      setEditBio('');
      setEditSkills('');
      setEditIsMentor(false);
    }
  }, [activeProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    setIsSavingProfile(true);
    TelegramSdkWrapper.haptic('medium');

    const skillsArray = editSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const data = await safeFetchJson<AlumniProfile>(`/api/profile/${activeProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: editJobTitle,
          company: editCompany,
          bio: editBio,
          skills: skillsArray,
          isMentor: editIsMentor
        })
      });

      if (data.success && data.data) {
        setUserProfiles(prev =>
          prev.map(p => p.id === activeProfile.id ? data.data! : p)
        );
        setSaveSuccessMsg(true);
        TelegramSdkWrapper.haptic('success');
        setTimeout(() => setSaveSuccessMsg(false), 2500);
      } else {
        // Update locally if offline
        const updated: AlumniProfile = {
          ...activeProfile,
          jobTitle: editJobTitle,
          company: editCompany,
          bio: editBio,
          skills: skillsArray,
          isMentor: editIsMentor
        };
        setUserProfiles(prev =>
          prev.map(p => p.id === activeProfile.id ? updated : p)
        );
        setSaveSuccessMsg(true);
        TelegramSdkWrapper.haptic('success');
        setTimeout(() => setSaveSuccessMsg(false), 2500);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDownloadUserCv = () => {
    if (!activeProfile || !activeInstitution) return;
    TelegramSdkWrapper.haptic('medium');
    setIsGeneratingPdf(true);

    try {
      generateAlumniCvPdf(activeProfile, activeInstitution, currentUser);
      TelegramSdkWrapper.haptic('success');
    } catch (e) {
      console.error('Error downloading CV PDF:', e);
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 700);
    }
  };

  const handleFocusField = (fieldName: string) => {
    TelegramSdkWrapper.haptic('light');
    if (fieldName === 'jobTitle') {
      jobTitleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      jobTitleInputRef.current?.focus();
    } else if (fieldName === 'company') {
      companyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      companyInputRef.current?.focus();
    } else if (fieldName === 'bio') {
      bioInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      bioInputRef.current?.focus();
    } else if (fieldName === 'skills') {
      skillsInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      skillsInputRef.current?.focus();
    } else if (fieldName === 'mentor') {
      setEditIsMentor(true);
    }
  };

  const handleVerificationComplete = (updatedProfile: AlumniProfile) => {
    setUserProfiles(prev => {
      const exists = prev.some(p => p.id === updatedProfile.id);
      if (exists) {
        return prev.map(p => p.id === updatedProfile.id ? updatedProfile : p);
      }
      return [...prev, updatedProfile];
    });
  };

  const handleEnrollSuccess = (newProfile: AlumniProfile) => {
    setUserProfiles(prev => [...prev.filter(p => p.id !== newProfile.id), newProfile]);
    setActiveInstitutionId(newProfile.institutionId);
    setIsVerificationOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Dev Simulator Toolbar (for testing Telegram personas & frame view) */}
      <TelegramDevToolbar
        currentUser={currentUser}
        onSwitchUser={user => {
          setCurrentUser(user);
        }}
        isMobileFrame={isMobileFrame}
        onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
        activeInstitution={activeInstitution}
      />

      {/* Main App Container */}
      <div className={`flex-1 flex justify-center ${isMobileFrame ? 'p-0 sm:py-6 bg-slate-950' : ''}`}>
        <div
          className={`w-full bg-slate-900 flex flex-col min-h-screen sm:min-h-[780px] ${
            isMobileFrame
              ? 'max-w-[460px] sm:rounded-[32px] sm:border sm:border-slate-800 sm:shadow-2xl overflow-hidden relative'
              : 'max-w-4xl'
          }`}
        >
          {/* Telegram App Header */}
          <TelegramHeader
            institution={activeInstitution}
            activeProfile={activeProfile}
            currentUser={currentUser}
            onOpenSchoolSelector={() => setIsSchoolSelectorOpen(true)}
            onOpenProfile={() => setActiveTab('profile')}
          />

          {/* Main Scrollable Content */}
          <main className="flex-1 p-4 overflow-y-auto">
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading Telegram Alumni Platform...</p>
              </div>
            ) : (
              <>
                {/* TAB 1: DASHBOARD */}
                {activeTab === 'dashboard' && activeInstitution && (
                  <DashboardView
                    institution={activeInstitution}
                    profile={activeProfile}
                    currentUser={currentUser}
                    onOpenVerification={() => setIsVerificationOpen(true)}
                    onOpenOnboarding={() => {
                      setOnboardingTargetInst(activeInstitution);
                      setIsOnboardingOpen(true);
                    }}
                    onNavigateTab={setActiveTab}
                    onOpenAiChatbot={() => {
                      setAiAdvisorRole('CAREER_STRATEGIST');
                      setAiInitialPrompt(undefined);
                      setIsAiChatOpen(true);
                    }}
                    onOpenCareerRoadmap={() => {
                      setAiAdvisorRole('CAREER_ROADMAP');
                      setAiInitialPrompt('Generate a personalized 3-phase career development roadmap based on my alumni profile data.');
                      setIsAiChatOpen(true);
                    }}
                    onOpenWallet={() => setIsWalletModalOpen(true)}
                    onExploreLocation={(city) => {
                      setDirectoryInitialQuery(city);
                      setDirectoryInitialSkill('');
                      setActiveTab('directory');
                    }}
                  />
                )}


                {/* TAB 2: SEARCHABLE DIRECTORY */}
                {activeTab === 'directory' && activeInstitution && (
                  <DirectoryView
                    institution={activeInstitution}
                    currentProfile={activeProfile}
                    initialSearchQuery={directoryInitialQuery}
                    initialSkill={directoryInitialSkill}
                    onSelectProfile={profile => setSelectedProfileForModal(profile)}
                    onRequestMentorship={mentor => {
                      setMentorshipMentor(mentor);
                      setIsMentorshipModalOpen(true);
                    }}
                  />
                )}

                {/* TAB 3: CHAPTERS & EVENTS */}
                {activeTab === 'chapters' && activeInstitution && (
                  <ChaptersEventsView
                    institution={activeInstitution}
                    currentUser={currentUser}
                  />
                )}

                {/* TAB 4: MY PROFILE & SETTINGS */}
                {activeTab === 'profile' && (
                  <div className="space-y-4 pb-20 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-100">
                          {isProfilePreviewMode ? 'Directory Profile Preview' : 'My Alumni Profile'}
                        </h2>
                        <p className="text-xs text-slate-400">
                          {isProfilePreviewMode
                            ? 'Viewing your profile card exactly as other alumni see it in the Directory'
                            : 'Manage your identity, career credentials & mentoring availability'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeProfile && (
                          <button
                            onClick={() => handleCopyProfileLink(activeProfile.id)}
                            className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 border ${
                              copiedProfileLink
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
                            }`}
                            title="Copy deep link to your alumni profile"
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
                        )}

                        {activeProfile && (
                          <button
                            onClick={() => {
                              TelegramSdkWrapper.haptic('selection');
                              setIsProfilePreviewMode(!isProfilePreviewMode);
                            }}
                            className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 border ${
                              isProfilePreviewMode
                                ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-blue-900/30'
                                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
                            }`}
                            title={isProfilePreviewMode ? 'Switch to Edit Profile Form' : 'Preview how your profile appears to other alumni in Directory'}
                          >
                            {isProfilePreviewMode ? (
                              <>
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Form</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-blue-400" />
                                <span>Preview</span>
                              </>
                            )}
                          </button>
                        )}

                        {activeProfile && (
                          <button
                            onClick={handleDownloadUserCv}
                            disabled={isGeneratingPdf}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-900/40 active:scale-95 transition-all disabled:opacity-50"
                            title="Generate and download official PDF CV"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline sm:inline">{isGeneratingPdf ? 'Generating...' : 'Download CV'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* PUBLIC DIRECTORY PREVIEW VIEW (When Preview is Active) */}
                    {isProfilePreviewMode && activeProfile && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="p-3 bg-blue-950/50 border border-blue-500/40 rounded-2xl text-xs text-blue-200 flex items-center justify-between shadow-md">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                              <span className="font-bold text-white block">Public Directory Appearance</span>
                              <span className="text-[11px] text-blue-300/80">
                                This is the exact view visible to verified alumni at {activeInstitution?.name}.
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              TelegramSdkWrapper.haptic('selection');
                              setIsProfilePreviewMode(false);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 shadow"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>

                        {/* Directory Card Exact Replica */}
                        <div
                          className={`p-4 rounded-2xl border transition-all shadow-md relative overflow-hidden space-y-3 ${
                            activeProfile.themeConfig?.pattern === 'mesh'
                              ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border-indigo-500/30'
                              : activeProfile.themeConfig?.pattern === 'matrix'
                              ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border-emerald-500/30'
                              : activeProfile.themeConfig?.pattern === 'topography'
                              ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 border-purple-500/30'
                              : activeProfile.themeConfig?.pattern === 'waves'
                              ? 'bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-950 border-cyan-500/30'
                              : 'bg-slate-850 bg-slate-800/80 border-slate-700/80 hover:border-blue-500/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                {currentUser.tgPhotoUrl ? (
                                  <img
                                    src={currentUser.tgPhotoUrl}
                                    alt={`${currentUser.tgFirstName} ${currentUser.tgLastName || ''}`}
                                    referrerPolicy="no-referrer"
                                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center border border-white/20">
                                    {currentUser.tgFirstName.charAt(0)}
                                  </div>
                                )}
                                {activeProfile.verificationStatus === 'VERIFIED' && (
                                  <div
                                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-bold shadow"
                                    title="Verified Alumnus"
                                  >
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-100 text-sm truncate">
                                    {currentUser.tgFirstName} {currentUser.tgLastName || ''}
                                  </span>
                                  {currentUser.tgUsername && (
                                    <span className="text-[11px] text-slate-400 truncate">
                                      @{currentUser.tgUsername}
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-slate-300 font-medium truncate mt-0.5 flex items-center gap-1">
                                  <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">
                                    {editJobTitle || activeProfile.jobTitle || 'Alumnus'}{' '}
                                    {editCompany || activeProfile.company ? `@ ${editCompany || activeProfile.company}` : ''}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="truncate">{activeProfile.department}</span>
                                  <span>•</span>
                                  <span className="shrink-0 font-mono">Class of {activeProfile.graduationYear}</span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex flex-col items-end gap-1">
                              {(editIsMentor || activeProfile.isMentor) && (
                                <span className="inline-flex items-center gap-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                                  <Sparkles className="w-2.5 h-2.5" /> Mentor
                                </span>
                              )}
                              {activeProfile.verificationStatus === 'VERIFIED' && (
                                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                                  {activeProfile.matriculationNo}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bio Snippet if exists */}
                          {(editBio || activeProfile.bio) && (
                            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50 text-xs text-slate-300 leading-relaxed italic">
                              "{editBio || activeProfile.bio}"
                            </div>
                          )}

                          {/* Skills tags and Directory Card Action Preview */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/40">
                            <div className="flex items-center gap-1 flex-wrap min-w-0 flex-1">
                              {(editSkills ? editSkills.split(',').map(s => s.trim()).filter(Boolean) : activeProfile.skills)
                                .slice(0, 4)
                                .map((skill, i) => (
                                  <span
                                    key={i}
                                    className="text-[9px] px-2 py-0.5 rounded-md border font-mono truncate max-w-[110px] bg-slate-900/80 text-slate-300 border-slate-700/60"
                                  >
                                    {skill}
                                  </span>
                                ))}
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-slate-900/80 rounded-md border border-slate-700/60">
                                You (In Directory)
                              </span>
                              {(editIsMentor || activeProfile.isMentor) && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" /> Mentorship Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Return to Edit Action Card */}
                        <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 text-center space-y-2">
                          <p className="text-xs text-slate-400">
                            Want to update your career title, biography, skills or mentoring availability?
                          </p>
                          <button
                            onClick={() => {
                              TelegramSdkWrapper.haptic('selection');
                              setIsProfilePreviewMode(false);
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-600 flex items-center justify-center gap-1.5 mx-auto transition-all shadow-sm active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Return to Edit Profile Form</span>
                          </button>
                        </div>

                        {/* Career Milestones in Preview Mode */}
                        <CareerMilestonesTimeline
                          profile={activeProfile}
                          isEditable={true}
                        />
                      </div>
                    )}

                    {/* EDIT MODE SECTIONS (Hidden when Preview Mode is Active) */}
                    {!isProfilePreviewMode && (
                      <>
                        {/* Current Institution Card */}
                        {activeProfile ? (
                          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={activeInstitution?.logoUrl}
                                  alt={activeInstitution?.shortName}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-xl object-cover"
                                />
                                <div>
                                  <div className="font-bold text-sm text-slate-100">
                                    {activeInstitution?.name}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {activeProfile.department} ({activeProfile.degreeType})
                                  </div>
                                </div>
                              </div>

                              {activeProfile.verificationStatus === 'VERIFIED' ? (
                                <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                </span>
                              ) : (
                                <button
                                  onClick={() => setIsVerificationOpen(true)}
                                  className="text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-full text-[11px] font-bold"
                                >
                                  Verify Portal
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                              <div>
                                <span className="text-slate-400 text-[10px] block font-mono">MATRICULATION</span>
                                <span className="font-mono font-bold text-slate-200">{activeProfile.matriculationNo}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block">GRADUATION YEAR</span>
                                <span className="font-semibold text-slate-200">Class of {activeProfile.graduationYear}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700 text-center space-y-2">
                            <p className="text-xs text-slate-300">
                              You do not have an active alumni profile for {activeInstitution?.name}.
                            </p>
                            <button
                              onClick={() => {
                                setOnboardingTargetInst(activeInstitution || undefined);
                                setIsOnboardingOpen(true);
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow"
                            >
                              Enroll for {activeInstitution?.shortName}
                            </button>
                          </div>
                        )}

                        {/* Visual Progress Tracker & Missing Suggestions */}
                        {activeProfile && (
                          <ProfileProgressTracker
                            profile={activeProfile}
                            onOpenVerification={() => setIsVerificationOpen(true)}
                            onFocusField={handleFocusField}
                          />
                        )}

                        {/* Alumni ZebraWallet & Dues Card */}
                        <div className="p-4 bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/30 rounded-2xl space-y-3 shadow-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                <Wallet className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-xs font-bold text-slate-100">
                                    Alumni ZebraWallet Gateway
                                  </h3>
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                    zebrawallet.org
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Pay statutory dues, student scholarships, building levies & manage balance.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-mono block">TRANSACTION MONETIZATION</span>
                              <span className="text-slate-300">1.5% Platform + 0.5% University Surcharge (2.0% total)</span>
                            </div>
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                              Verified Tier
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              TelegramSdkWrapper.haptic('medium');
                              setIsWalletModalOpen(true);
                            }}
                            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Open ZebraWallet & Manage Dues</span>
                          </button>
                        </div>

                        {/* Edit Profile Form */}
                        {activeProfile && (
                          <form onSubmit={handleSaveProfile} className="space-y-3.5">
                            <div className="flex items-center justify-between pt-1">
                              <div>
                                <span className="text-xs font-bold text-slate-200 block">
                                  Edit Career & Profile Information
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Updates sync live with directory & CV generator
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  TelegramSdkWrapper.haptic('light');
                                  setIsLinkedInModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 text-[#388ae0] border border-[#0A66C2]/40 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all"
                              >
                                <Linkedin className="w-3.5 h-3.5" />
                                <span>Import LinkedIn</span>
                              </button>
                            </div>

                            {saveSuccessMsg && (
                              <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Alumni profile updated and synchronized with directory.</span>
                              </div>
                            )}


                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Current Job Title
                                </label>
                                <input
                                  ref={jobTitleInputRef}
                                  type="text"
                                  value={editJobTitle}
                                  onChange={e => setEditJobTitle(e.target.value)}
                                  placeholder="e.g. Lead Software Engineer"
                                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Company / Workplace
                                </label>
                                <input
                                  ref={companyInputRef}
                                  type="text"
                                  value={editCompany}
                                  onChange={e => setEditCompany(e.target.value)}
                                  placeholder="e.g. Paystack / Google"
                                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Alumni Bio & Experience
                              </label>
                              <textarea
                                ref={bioInputRef}
                                rows={3}
                                value={editBio}
                                onChange={e => setEditBio(e.target.value)}
                                placeholder="Share your career achievements and how you can help fellow alumni..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Skills & Expertise (comma separated)
                              </label>
                              <input
                                ref={skillsInputRef}
                                type="text"
                                value={editSkills}
                                onChange={e => setEditSkills(e.target.value)}
                                placeholder="e.g. Kubernetes, React, Python, Cloud"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            {/* Mentorship Toggle */}
                            <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                  Available as an Alumni Mentor
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  Shows mentor badge on directory & enables mentorship requests
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editIsMentor}
                                  onChange={e => setEditIsMentor(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            <div className="flex gap-2.5">
                              <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 active:scale-98 transition-all disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                                {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                              </button>

                              <button
                                type="button"
                                onClick={handleDownloadUserCv}
                                disabled={isGeneratingPdf}
                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                                title="Download CV Summary as PDF"
                              >
                                <FileDown className="w-4 h-4 text-blue-400" />
                                <span className="hidden sm:inline">Download CV</span>
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Career Milestones & Professional Achievements Timeline */}
                        {activeProfile && (
                          <CareerMilestonesTimeline
                            profile={activeProfile}
                            isEditable={true}
                          />
                        )}

                        {/* Professional Identity Theme Picker */}
                        {activeProfile && (
                          <ThemePickerSection
                            profile={activeProfile}
                            currentUser={currentUser}
                            onThemeSaved={(newTheme) => {
                              setUserProfiles(prev =>
                                prev.map(p =>
                                  p.id === activeProfile.id
                                    ? { ...p, themeConfig: newTheme }
                                    : p
                                )
                              );
                            }}
                          />
                        )}

                        {/* Mini App Settings & Haptics Toggle Sub-Section */}
                        <SettingsSection />
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </main>

          {/* Floating AI Advisor Quick Access Button */}
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('medium');
              setIsAiChatOpen(true);
            }}
            className="fixed bottom-20 right-4 sm:absolute sm:bottom-20 sm:right-5 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-3 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 transition-all hover:scale-105 active:scale-95 group"
            title="Ask Gemini Alumni Advisor"
          >
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold pr-1 hidden sm:inline">AI Advisor</span>
          </button>

          {/* Telegram Native Bottom Navigation Bar */}
          <nav className="sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setActiveTab('dashboard');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'text-blue-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setActiveTab('directory');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'directory'
                  ? 'text-blue-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px]">Directory</span>
            </button>

            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setActiveTab('chapters');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'chapters'
                  ? 'text-blue-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[10px]">Chapters</span>
            </button>

            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setActiveTab('profile');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'profile'
                  ? 'text-blue-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px]">Profile</span>
            </button>
          </nav>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. School Tenant Switcher */}
      <SchoolSelectorModal
        isOpen={isSchoolSelectorOpen}
        onClose={() => setIsSchoolSelectorOpen(false)}
        institutions={institutions}
        userProfiles={userProfiles}
        activeInstitutionId={activeInstitutionId}
        onSelectInstitution={instId => setActiveInstitutionId(instId)}
        onStartOnboarding={targetInst => {
          setOnboardingTargetInst(targetInst);
          setIsOnboardingOpen(true);
        }}
      />

      {/* 2. Onboarding Wizard */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        institutions={institutions}
        initialInstitution={onboardingTargetInst}
        currentUser={currentUser}
        onEnrollSuccess={handleEnrollSuccess}
      />

      {/* 3. University Portal OAuth2 Verification Modal */}
      {activeInstitution && activeProfile && (
        <VerificationModal
          isOpen={isVerificationOpen}
          onClose={() => setIsVerificationOpen(false)}
          institution={activeInstitution}
          profile={activeProfile}
          currentUser={currentUser}
          onVerificationComplete={handleVerificationComplete}
        />
      )}

      {/* 4. Single Profile Inspection Modal */}
      <ProfileModal
        profile={selectedProfileForModal}
        currentUser={currentUser}
        institution={activeInstitution}
        onClose={() => setSelectedProfileForModal(null)}
        onRequestMentorship={mentor => {
          setSelectedProfileForModal(null);
          setMentorshipMentor(mentor);
          setIsMentorshipModalOpen(true);
        }}
      />

      {/* 5. Standardized Mentorship Request Modal */}
      <MentorshipRequestModal
        isOpen={isMentorshipModalOpen}
        mentorProfile={mentorshipMentor}
        currentUser={currentUser}
        senderProfileId={activeProfile?.id}
        onClose={() => {
          setIsMentorshipModalOpen(false);
          setMentorshipMentor(null);
        }}
      />

      {/* 6. Gemini Multi-Turn AI Advisor & Career Roadmap Chatbot */}
      <AlumniAiChatbot
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        currentUser={currentUser}
        activeInstitution={activeInstitution}
        profile={activeProfile}
        initialRole={aiAdvisorRole}
        initialPrompt={aiInitialPrompt}
      />

      {/* 7. LinkedIn OAuth Experience & Skills Import Modal */}
      <LinkedInImportModal
        isOpen={isLinkedInModalOpen}
        onClose={() => setIsLinkedInModalOpen(false)}
        currentUser={currentUser}
        onImportSuccess={importedData => {
          if (importedData.jobTitle) setEditJobTitle(importedData.jobTitle);
          if (importedData.company) setEditCompany(importedData.company);
          if (importedData.summary) setEditBio(importedData.summary);
          if (importedData.skills && importedData.skills.length > 0) {
            setEditSkills(importedData.skills.join(', '));
          }
          setSaveSuccessMsg(true);
          setTimeout(() => setSaveSuccessMsg(false), 4000);
        }}
      />

      {/* 8. ZebraWallet Gateway & Alumni Dues / Levies Modal */}
      <AlumniWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        currentUser={currentUser}
        institution={activeInstitution}
      />
    </div>
  );
}

