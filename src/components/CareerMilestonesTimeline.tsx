import React, { useState, useEffect } from 'react';
import { CareerMilestone, MilestoneType, AlumniProfile } from '../types';
import {
  TrendingUp,
  Award,
  GraduationCap,
  Sparkles,
  Briefcase,
  Users,
  Plus,
  Trash2,
  Calendar,
  Building,
  CheckCircle2,
  Download,
  X,
  ChevronRight,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson, safePostJson, safeDeleteJson } from '../lib/apiClient';
import { INITIAL_CAREER_MILESTONES } from '../server/mockData';

interface CareerMilestonesTimelineProps {
  profile: AlumniProfile | null;
  isEditable?: boolean;
}

const MILESTONE_CONFIG: Record<MilestoneType, { label: string; icon: React.FC<{ className?: string }>; bg: string; text: string; border: string }> = {
  PROMOTION: { label: 'Career Promotion', icon: TrendingUp, bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  CERTIFICATION: { label: 'Professional Certification', icon: Award, bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  DEGREE: { label: 'Academic Degree', icon: GraduationCap, bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  AWARD: { label: 'Industry Award & Honor', icon: Sparkles, bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  VENTURE: { label: 'Venture / Startup', icon: Briefcase, bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  LEADERSHIP: { label: 'Leadership Role', icon: Users, bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  PUBLICATION: { label: 'Research & Publication', icon: BookOpen, bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' }
};

export const CareerMilestonesTimeline: React.FC<CareerMilestonesTimelineProps> = ({
  profile,
  isEditable = true,
}) => {
  const [milestones, setMilestones] = useState<CareerMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [type, setType] = useState<MilestoneType>('PROMOTION');
  const [description, setDescription] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.id) {
      setMilestones(INITIAL_CAREER_MILESTONES);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchMilestones = async () => {
      try {
        const json = await safeFetchJson<CareerMilestone[]>(`/api/profiles/${profile.id}/milestones`);
        if (json.success && json.data && isMounted) {
          if (json.data.length > 0) {
            setMilestones(json.data);
          } else {
            // Seed defaults for this profile
            const defaults = INITIAL_CAREER_MILESTONES.filter(m => m.profileId === profile.id);
            setMilestones(defaults.length > 0 ? defaults : INITIAL_CAREER_MILESTONES);
          }
        }
      } catch (err) {
        if (isMounted) setMilestones(INITIAL_CAREER_MILESTONES);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMilestones();
    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organization.trim() || !year.trim()) return;

    TelegramSdkWrapper.haptic('medium');
    setIsSubmitting(true);

    const skills = skillsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newMilestone: Omit<CareerMilestone, 'id' | 'createdAt'> = {
      profileId: profile?.id || 'prof-001',
      title: title.trim(),
      organization: organization.trim(),
      year: year.trim(),
      type,
      description: description.trim(),
      skills
    };

    try {
      if (profile?.id) {
        const json = await safePostJson<CareerMilestone>(`/api/profiles/${profile.id}/milestones`, newMilestone);
        if (json.success && json.data) {
          setMilestones(prev => [json.data!, ...prev]);
        } else {
          setMilestones(prev => [
            {
              id: `ms-${Date.now()}`,
              ...newMilestone,
              createdAt: new Date().toISOString()
            },
            ...prev
          ]);
        }
      } else {
        setMilestones(prev => [
          {
            id: `ms-${Date.now()}`,
            ...newMilestone,
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
      }

      // Reset form
      setTitle('');
      setOrganization('');
      setYear(new Date().getFullYear().toString());
      setDescription('');
      setSkillsText('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add milestone:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    TelegramSdkWrapper.haptic('warning');
    if (profile?.id) {
      safeDeleteJson(`/api/profiles/${profile.id}/milestones/${id}`);
    }
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const handleImportSampleMilestones = () => {
    TelegramSdkWrapper.haptic('success');
    // Pre-fill realistic career milestones based on current profile details
    const sampleMilestones: CareerMilestone[] = [
      {
        id: `ms-imp-1-${Date.now()}`,
        profileId: profile?.id || 'prof-001',
        title: profile?.jobTitle || 'Senior Staff Engineer',
        organization: profile?.company || 'Technology Global',
        year: '2025',
        type: 'PROMOTION',
        description: `Advanced to lead strategic engineering and product architecture teams across multi-region infrastructure.`,
        skills: profile?.skills.slice(0, 3) || ['Cloud Architecture', 'Distributed Systems'],
        createdAt: new Date().toISOString()
      },
      {
        id: `ms-imp-2-${Date.now()}`,
        profileId: profile?.id || 'prof-001',
        title: `Professional Cloud & Solutions Specialist`,
        organization: 'Global Cloud Institute',
        year: '2024',
        type: 'CERTIFICATION',
        description: 'Completed enterprise level certification in secure distributed architectures and zero-trust deployments.',
        skills: ['Security', 'Cloud Operations'],
        createdAt: new Date().toISOString()
      },
      {
        id: `ms-imp-3-${Date.now()}`,
        profileId: profile?.id || 'prof-001',
        title: `${profile?.degreeType || 'B.Eng.'} in ${profile?.department || 'Computer Engineering'}`,
        organization: profile?.institution?.name || 'Federal University of Technology, Minna',
        year: profile?.graduationYear ? profile.graduationYear.toString() : '2021',
        type: 'DEGREE',
        description: 'Graduated with high honours, completing thesis capstone research and active leadership in engineering student union.',
        skills: ['Research', 'Engineering Foundations'],
        createdAt: new Date().toISOString()
      }
    ];

    setMilestones(sampleMilestones);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">
              Career Milestones & Achievements
            </h3>
            <span className="text-[10px] text-slate-400">
              Verified career promotions, credentials, degrees & accolades
            </span>
          </div>
        </div>

        {isEditable && (
          <div className="flex items-center gap-1.5">
            {milestones.length === 0 && (
              <button
                type="button"
                onClick={handleImportSampleMilestones}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-blue-400" />
                <span>Auto-Import</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
          </div>
        )}
      </div>

      {/* Visual Timeline Cards List */}
      {milestones.length === 0 ? (
        <div className="p-6 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-200">No Milestones Added Yet</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
            Highlight promotions, professional certifications, awards, and degrees on your alumni record.
          </p>
          {isEditable && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleImportSampleMilestones}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700"
              >
                Import from Profile History
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                + Add First Milestone
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-blue-500 before:to-slate-700">
          {milestones.map((ms, index) => {
            const config = MILESTONE_CONFIG[ms.type] || MILESTONE_CONFIG.PROMOTION;
            const IconComponent = config.icon;

            return (
              <div key={ms.id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[27px] top-3.5 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-md ${config.bg} ${config.text}`}
                >
                  <IconComponent className="w-3 h-3" />
                </div>

                {/* Milestone Visual Card - Matching Upcoming Events Card Style */}
                <div className="overflow-hidden bg-slate-850/80 hover:bg-slate-800/90 rounded-2xl border border-slate-700/60 hover:border-slate-600 transition-all p-4 space-y-2.5 shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
                          {config.label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 font-bold">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {ms.year}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-100 text-sm leading-snug">
                        {ms.title}
                      </h4>

                      <div className="text-xs text-cyan-300 font-medium flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{ms.organization}</span>
                      </div>
                    </div>

                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(ms.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400"
                        title="Remove Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {ms.description && (
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                      {ms.description}
                    </p>
                  )}

                  {ms.skills && ms.skills.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {ms.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60 font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3.5 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-white text-sm">
                  Add Professional Milestone
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Milestone Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MilestoneType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="PROMOTION">Career Promotion / Title Elevation</option>
                  <option value="CERTIFICATION">Professional Certification (AWS, GCP, PMP)</option>
                  <option value="DEGREE">Degree / Postgraduate Graduation</option>
                  <option value="AWARD">Industry Award / Fellowship / Honor</option>
                  <option value="VENTURE">Founded Company / Startup Launch</option>
                  <option value="LEADERSHIP">Board / Executive Leadership Role</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Title / Achievement Name *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Senior Solutions Architect"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Amazon Web Services"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Year / Date *
                  </label>
                  <input
                    type="text"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g., 2025 or Aug 2024"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Key Accomplishments / Impact
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what you built, led, or were recognized for..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Associated Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="e.g., Cloud Architecture, Kubernetes, Go"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !organization.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Milestone'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
