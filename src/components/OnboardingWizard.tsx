import React, { useState } from 'react';
import { Institution, AlumniProfile, TelegramUser } from '../types';
import {
  X,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Briefcase,
  Building2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Loader2,
  Linkedin
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';
import { LinkedInImportModal } from './LinkedInImportModal';


interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  institutions: Institution[];
  initialInstitution?: Institution;
  currentUser: TelegramUser;
  onEnrollSuccess: (profile: AlumniProfile) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  institutions,
  initialInstitution,
  currentUser,
  onEnrollSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedInstId, setSelectedInstId] = useState<string>(
    initialInstitution?.id || institutions[0]?.id || ''
  );
  const [matricNo, setMatricNo] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [degreeType, setDegreeType] = useState('B.Eng');
  const [gradYear, setGradYear] = useState(2022);
  const [entryYear, setEntryYear] = useState(2017);

  // Career
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('Fintech & Software');
  const [isOtherIndustry, setIsOtherIndustry] = useState(false);
  const [customIndustryInput, setCustomIndustryInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const [locationCity, setLocationCity] = useState('Lagos');
  const [bio, setBio] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [isMentor, setIsMentor] = useState(false);
  const [mentoringTopicsInput, setMentoringTopicsInput] = useState('');
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced AI industry suggestion fetching
  React.useEffect(() => {
    if (!isOtherIndustry) return;

    const timer = setTimeout(async () => {
      setIsLoadingAiSuggestions(true);
      try {
        const queryParam = customIndustryInput.trim();
        const res = await safeFetchJson<string[]>(
          `/api/ai/industry-suggestions?q=${encodeURIComponent(queryParam)}&jobTitle=${encodeURIComponent(jobTitle)}&department=${encodeURIComponent(department)}`
        );
        if (res.success && res.data) {
          setAiSuggestions(res.data);
        }
      } catch (err) {
        console.warn('AI suggestions error:', err);
      } finally {
        setIsLoadingAiSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [customIndustryInput, isOtherIndustry, jobTitle, department]);


  if (!isOpen) return null;

  const currentInst = institutions.find(i => i.id === selectedInstId) || institutions[0];

  // Auto-populate faculty & department options from institution config
  const availableFaculties = currentInst?.faculties || [];
  const selectedFacultyObj = availableFaculties.find(f => f.facultyName === faculty) || availableFaculties[0];
  const availableDepts = selectedFacultyObj?.departments || [
    'Computer Science',
    'Electrical Engineering',
    'Software Engineering',
    'Business Administration',
    'Economics'
  ];

  const handleNext = () => {
    setError(null);
    TelegramSdkWrapper.haptic('selection');

    if (step === 1) {
      if (!faculty && availableFaculties.length > 0) {
        setFaculty(availableFaculties[0].facultyName);
      }
      if (!department && availableDepts.length > 0) {
        setDepartment(availableDepts[0]);
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!matricNo.trim()) {
        setError('Please enter your valid matriculation or student identification number.');
        TelegramSdkWrapper.haptic('error');
        return;
      }
      if (!department) {
        setError('Please select your academic department.');
        TelegramSdkWrapper.haptic('error');
        return;
      }
      setStep(3);
      return;
    }
  };

  const handleBack = () => {
    TelegramSdkWrapper.haptic('selection');
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    TelegramSdkWrapper.haptic('medium');

    const parsedSkills = skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedTopics = mentoringTopicsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      const finalIndustry = isOtherIndustry ? (customIndustryInput.trim() || 'Other') : industry;

      const data = await safeFetchJson<AlumniProfile>('/api/onboarding/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tgUserId: currentUser.tgUserId,
          tgFirstName: currentUser.tgFirstName,
          institutionId: currentInst.id,
          matriculationNo: matricNo.trim().toUpperCase(),
          faculty: faculty || availableFaculties[0]?.facultyName || 'General Studies',
          department: department || availableDepts[0] || 'General Department',
          degreeType,
          graduationYear: Number(gradYear),
          entryYear: Number(entryYear),
          jobTitle: jobTitle.trim() || undefined,
          company: company.trim() || undefined,
          industry: finalIndustry || undefined,
          locationCity: locationCity || undefined,
          bio: bio.trim() || undefined,
          skills: parsedSkills,
          isMentor,
          mentoringTopics: parsedTopics
        })
      });

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to enroll');
      }

      TelegramSdkWrapper.haptic('success');
      onEnrollSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred during enrollment');
      TelegramSdkWrapper.haptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Alumni Onboarding Wizard
              </h2>
              <p className="text-[11px] text-slate-400">
                Step {step} of 3 • {step === 1 ? 'Select Institution' : step === 2 ? 'Academic Credentials' : 'Career & Mentorship'}
              </p>
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

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800 w-full">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* STEP 1: Select Institution */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Select the university, polytechnic, or college you attended:
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {institutions.map(inst => {
                  const isSelected = inst.id === selectedInstId;
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => {
                        TelegramSdkWrapper.haptic('selection');
                        setSelectedInstId(inst.id);
                        if (inst.faculties && inst.faculties[0]) {
                          setFaculty(inst.faculties[0].facultyName);
                          if (inst.faculties[0].departments[0]) {
                            setDepartment(inst.faculties[0].departments[0]);
                          }
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-blue-950/50 border-blue-500 shadow-md shadow-blue-950/40'
                          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
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
                          <div className="font-bold text-slate-100 text-sm truncate">
                            {inst.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {inst.shortName} • Est. {inst.establishedYear}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                            {inst.portalType === 'OAUTH2_SSO' ? '⚡ OAuth2 SSO Connected' : '📋 Student Registry API'}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Academic Record & Matriculation */}
          {step === 2 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <img
                  src={currentInst.logoUrl}
                  alt={currentInst.shortName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {currentInst.name}
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    {currentInst.portalType} Gateway
                  </div>
                </div>
              </div>

              {/* Matriculation Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Matriculation / Student Identification Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2017/1/58291EE or UI/2014/19820"
                  value={matricNo}
                  onChange={e => setMatricNo(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used by university portal OAuth2 to match your official academic record.
                </span>
              </div>

              {/* Faculty selection */}
              {availableFaculties.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Faculty / College / Division
                  </label>
                  <select
                    value={faculty || availableFaculties[0]?.facultyName}
                    onChange={e => {
                      setFaculty(e.target.value);
                      const fObj = availableFaculties.find(f => f.facultyName === e.target.value);
                      if (fObj?.departments[0]) {
                        setDepartment(fObj.departments[0]);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {availableFaculties.map((f, i) => (
                      <option key={i} value={f.facultyName}>
                        {f.facultyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Department selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department / Course of Study *
                </label>
                <select
                  value={department || availableDepts[0]}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {availableDepts.map((d, i) => (
                    <option key={i} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Degree Type & Grad Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Degree Awarded
                  </label>
                  <select
                    value={degreeType}
                    onChange={e => setDegreeType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="B.Eng">B.Eng (Engineering)</option>
                    <option value="B.Sc">B.Sc (Sciences / Social)</option>
                    <option value="B.A">B.A (Arts & Humanities)</option>
                    <option value="MBBS">MBBS (Medicine & Surgery)</option>
                    <option value="LL.B">LL.B (Law)</option>
                    <option value="M.Sc">M.Sc (Master of Science)</option>
                    <option value="Ph.D">Ph.D (Doctorate)</option>
                    <option value="HND">HND (Polytechnic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Graduation Class Year
                  </label>
                  <input
                    type="number"
                    min={1970}
                    max={2026}
                    value={gradYear}
                    onChange={e => setGradYear(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Career, Skills & Mentorship */}
          {step === 3 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {/* LinkedIn Fast Import Banner */}
              <div className="p-3 bg-[#0A66C2]/15 border border-[#0A66C2]/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center font-bold text-xs">
                    in
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Connect LinkedIn Account
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Auto-import job role, company, bio & verified skills
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    TelegramSdkWrapper.haptic('light');
                    setIsLinkedInModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-[11px] rounded-lg shadow transition-all active:scale-95 flex items-center gap-1"
                >
                  <Linkedin className="w-3 h-3" />
                  <span>Import</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Software Engineer"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paystack / Google"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Industry / Domain
                </label>
                <select
                  value={isOtherIndustry ? '__OTHER__' : industry}
                  onChange={e => {
                    if (e.target.value === '__OTHER__') {
                      setIsOtherIndustry(true);
                      if (!customIndustryInput) {
                        setCustomIndustryInput('');
                      }
                    } else {
                      setIsOtherIndustry(false);
                      setIndustry(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Fintech & Software">Fintech & Software</option>
                  <option value="Cloud, DevOps & Cybersecurity">Cloud, DevOps & Cybersecurity</option>
                  <option value="Healthcare & Informatics">Healthcare & Informatics</option>
                  <option value="Energy, Oil & Renewables">Energy, Oil & Renewables</option>
                  <option value="Investment Banking & Finance">Investment Banking & Finance</option>
                  <option value="Artificial Intelligence & ML">Artificial Intelligence & ML</option>
                  <option value="Legal, Policy & Regulatory">Legal, Policy & Regulatory</option>
                  <option value="Education & Academia">Education & Academia</option>
                  <option value="Civil Infrastructure & Real Estate">Civil Infrastructure & Real Estate</option>
                  <option value="__OTHER__">✨ Other (Specify with AI Suggestions)</option>
                </select>
              </div>

              {/* Conditional Custom Industry Input with AI-Aided Suggestions */}
              {isOtherIndustry && (
                <div className="p-3 bg-slate-850/90 border border-cyan-500/40 rounded-xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Custom Industry / Domain</span>
                    </label>
                    <span className="text-[10px] text-cyan-400/80 font-medium">
                      AI-assisted suggestions
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      required={isOtherIndustry}
                      placeholder="Start typing (e.g. Agritech, Robotics, Space, Clean Energy)..."
                      value={customIndustryInput}
                      onChange={e => setCustomIndustryInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none pr-8"
                    />
                    {isLoadingAiSuggestions && (
                      <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* AI Suggestions Pill Bar */}
                  {aiSuggestions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        AI Recommended Domains:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {aiSuggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              TelegramSdkWrapper.haptic('light');
                              setCustomIndustryInput(sug);
                            }}
                            className="text-[10px] px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-cyan-100 border border-cyan-800/60 rounded-full transition-all flex items-center gap-1 active:scale-95"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{sug}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Key Skills / Core Competencies (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kubernetes, React, Python, Product Strategy"
                  value={skillsInput}
                  onChange={e => setSkillsInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Mentorship Toggle */}
              <div className="p-3 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 rounded-xl border border-blue-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Alumni Mentorship Availability
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMentor}
                      onChange={e => setIsMentor(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {isMentor && (
                  <div className="pt-2 animate-in fade-in duration-150">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Mentoring Topics (e.g. CV reviews, Career transition, Tech interviews)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Transitioning to Tech, Postgraduate Abroad"
                      value={mentoringTopicsInput}
                      onChange={e => setMentoringTopicsInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-900/30 transition-all active:scale-98"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Proceed to Verification
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* LinkedIn Account Import Modal */}
      <LinkedInImportModal
        isOpen={isLinkedInModalOpen}
        onClose={() => setIsLinkedInModalOpen(false)}
        currentUser={currentUser}
        onImportSuccess={imported => {
          if (imported.jobTitle) setJobTitle(imported.jobTitle);
          if (imported.company) setCompany(imported.company);
          if (imported.summary) setBio(imported.summary);
          if (imported.skills && imported.skills.length > 0) {
            setSkillsInput(imported.skills.join(', '));
          }
          TelegramSdkWrapper.haptic('success');
        }}
      />
    </div>
  );
};

