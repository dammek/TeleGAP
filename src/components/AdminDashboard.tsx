import React, { useState, useEffect } from 'react';
import {
  Institution,
  TelegramUser,
  AlumniProfile,
  AdminDashboardData,
  AdminAuditLog,
  MentorshipRequest
} from '../types';
import { safeFetchJson, safePostJson } from '../lib/apiClient';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import {
  ShieldCheck,
  Building2,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  Send,
  MessageSquare,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Bot,
  Wallet,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: TelegramUser;
  institutions: Institution[];
  activeInstitutionId: string;
  onSelectInstitution?: (instId: string) => void;
  onSwitchToAdminUser?: () => void;
  onReturnToUserView: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  institutions,
  activeInstitutionId,
  onSelectInstitution,
  onSwitchToAdminUser,
  onReturnToUserView
}) => {
  const [selectedInstId, setSelectedInstId] = useState<string>(activeInstitutionId || 'all');
  const [activeTab, setActiveTab] = useState<'verifications' | 'mentorship' | 'engagement' | 'audit'>('verifications');
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & State for Verification Queue
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);

  // Modal states for Certificate Inspection and Reject Reason
  const [inspectingProfile, setInspectingProfile] = useState<AlumniProfile | null>(null);
  const [rejectingProfile, setRejectingProfile] = useState<AlumniProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Matriculation number or academic records did not match registry database.');

  // Mentorship filter
  const [mentorshipDisciplineFilter, setMentorshipDisciplineFilter] = useState<string>('all');
  const [mentorshipStatusFilter, setMentorshipStatusFilter] = useState<string>('all');

  // Check if current user has administrative rights
  const isAdmin = Boolean(currentUser.isAdmin);

  // Fetch admin metrics from server
  const fetchDashboardData = async (instId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await safeFetchJson<AdminDashboardData>(`/api/admin/metrics?institutionId=${instId}`, {
        headers: {
          'x-telegram-user-id': currentUser.tgUserId,
          'x-admin-role': currentUser.adminRole || 'ADMIN'
        }
      });

      if (res.success && res.data) {
        setDashboardData(res.data);
      } else {
        setErrorMsg(res.error || 'Failed to load administration telemetry.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error fetching admin metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData(selectedInstId);
    }
  }, [selectedInstId, isAdmin, currentUser.tgUserId]);

  // Handle Approve Action
  const handleApprove = async (profile: AlumniProfile, notes?: string) => {
    TelegramSdkWrapper.haptic('medium');
    setActionInProgressId(profile.id);
    try {
      const res = await safePostJson<{ success: boolean; data: AlumniProfile }>(
        `/api/admin/verifications/${profile.id}/approve`,
        {
          method: profile.verifiedByMethod || 'ALUMNI_EXECUTIVE_MANUAL',
          notes: notes || 'Approved by Institutional Alumni Relations Officer'
        },
        {
          headers: {
            'x-telegram-user-id': currentUser.tgUserId,
            'x-admin-role': currentUser.adminRole || 'ADMIN'
          }
        }
      );

      if (res.success) {
        TelegramSdkWrapper.haptic('success');
        setStatusFeedback({
          id: profile.id,
          msg: `Approved ${profile.matriculationNo}! Telegram invite & verification push dispatched.`,
          type: 'success'
        });
        // Refresh data
        fetchDashboardData(selectedInstId);
      } else {
        setStatusFeedback({
          id: profile.id,
          msg: res.error || 'Approval failed',
          type: 'error'
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        id: profile.id,
        msg: err.message || 'Error executing approval',
        type: 'error'
      });
    } finally {
      setActionInProgressId(null);
      setTimeout(() => setStatusFeedback(null), 4000);
    }
  };

  // Handle Reject Action
  const handleConfirmReject = async () => {
    if (!rejectingProfile) return;
    TelegramSdkWrapper.haptic('warning');
    const profileId = rejectingProfile.id;
    setActionInProgressId(profileId);
    try {
      const res = await safePostJson<{ success: boolean }>(
        `/api/admin/verifications/${profileId}/reject`,
        { reason: rejectionReason },
        {
          headers: {
            'x-telegram-user-id': currentUser.tgUserId,
            'x-admin-role': currentUser.adminRole || 'ADMIN'
          }
        }
      );

      if (res.success) {
        setStatusFeedback({
          id: profileId,
          msg: `Application rejected. Notice dispatched to candidate.`,
          type: 'success'
        });
        setRejectingProfile(null);
        fetchDashboardData(selectedInstId);
      } else {
        setStatusFeedback({
          id: profileId,
          msg: res.error || 'Rejection failed',
          type: 'error'
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        id: profileId,
        msg: err.message || 'Error rejecting verification',
        type: 'error'
      });
    } finally {
      setActionInProgressId(null);
      setTimeout(() => setStatusFeedback(null), 4000);
    }
  };

  // Handle Mentorship status update
  const handleUpdateMentorship = async (requestId: string, status: 'ACCEPTED' | 'DECLINED' | 'COMPLETED') => {
    TelegramSdkWrapper.haptic('selection');
    try {
      const res = await safePostJson(
        `/api/admin/mentorships/${requestId}/status`,
        { status },
        {
          headers: {
            'x-telegram-user-id': currentUser.tgUserId,
            'x-admin-role': currentUser.adminRole || 'ADMIN'
          }
        }
      );
      if (res.success) {
        fetchDashboardData(selectedInstId);
      }
    } catch (err) {
      console.error('Failed to update mentorship status:', err);
    }
  };

  // Handle Export CSV
  const handleExportCsv = () => {
    TelegramSdkWrapper.haptic('medium');
    const url = `/api/admin/export/csv?institutionId=${selectedInstId}&tgUserId=${currentUser.tgUserId}`;
    window.open(url, '_blank');
  };

  // ====================================================================
  // RBAC Unauthorized Guard
  // ====================================================================
  if (!isAdmin) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Institutional Administration Only</h2>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              Access to verified alumni rosters, candidate degree verification approvals, and platform treasury telemetry is restricted to authenticated University Alumni Relations Officers and Registrars.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-left space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Active Telegram Account:</span>
              <span className="font-mono text-slate-200">@{currentUser.tgUsername || currentUser.tgFirstName}</span>
            </div>
            <div className="flex justify-between">
              <span>Security Classification:</span>
              <span className="text-amber-400 font-medium">Standard Alumnus</span>
            </div>
            <div className="flex justify-between">
              <span>RBAC Policy:</span>
              <span className="text-slate-300">FERPA / Student Privacy Guard Active</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            {onSwitchToAdminUser && (
              <button
                onClick={() => {
                  TelegramSdkWrapper.haptic('selection');
                  onSwitchToAdminUser();
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Switch to Institutional Admin Persona
              </button>
            )}

            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('light');
                onReturnToUserView();
              }}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-all"
            >
              Return to Member Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter pending verifications
  const pendingList = (dashboardData?.pendingVerifications || []).filter(p => {
    const matchesMethod = methodFilter === 'all' || p.verifiedByMethod === methodFilter;
    const fullName = p.user ? `${p.user.tgFirstName} ${p.user.tgLastName || ''}` : '';
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      fullName.toLowerCase().includes(q) ||
      p.matriculationNo.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      (p.user?.tgUsername || '').toLowerCase().includes(q);
    return matchesMethod && matchesSearch;
  });

  // Filter mentorship requests
  const mentorshipList = (dashboardData?.activeMentorships || []).filter(m => {
    const matchesStatus = mentorshipStatusFilter === 'all' || m.status === mentorshipStatusFilter;
    const matchesDiscipline =
      mentorshipDisciplineFilter === 'all' ||
      m.topic.toLowerCase().includes(mentorshipDisciplineFilter.toLowerCase());
    return matchesStatus && matchesDiscipline;
  });

  const formatNgn = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Top Banner / Scope Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Institutional Admin & Oversight</h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring degree credential verifications, mentorship oversight, and platform treasury
              </p>
            </div>
          </div>

          {/* Action buttons & Multi-Tenant Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <select
                value={selectedInstId}
                onChange={e => {
                  TelegramSdkWrapper.haptic('selection');
                  setSelectedInstId(e.target.value);
                  if (onSelectInstitution) onSelectInstitution(e.target.value);
                }}
                className="appearance-none bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="all">All Institutional Chapters (Platform-Wide)</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.shortName})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => fetchDashboardData(selectedInstId)}
              disabled={isLoading}
              title="Refresh Data"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-medium transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Roster (CSV)</span>
            </button>
          </div>
        </div>

        {/* Admin context bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span>Admin Officer:</span>
            <span className="font-semibold text-slate-200">{currentUser.tgFirstName} {currentUser.tgLastName || ''}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 font-mono">@{currentUser.tgUsername || 'admin'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-blue-400 font-medium">{currentUser.adminRole || 'INSTITUTION_ADMIN'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Bot Engine: <strong className="text-slate-300">@Tel_alum_bot</strong></span>
          </div>
        </div>
      </div>

      {/* Hero Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Verified Alumni */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Verified Alumni</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white tracking-tight">
              {dashboardData?.userStats.verifiedAlumni.toLocaleString() || '---'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">{dashboardData?.userStats.verificationRate || 0}% rate</span>
              <span aria-hidden="true">·</span>
              <span>{dashboardData?.userStats.totalAlumni.toLocaleString()} total</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Verifications Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Verification Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-300 tracking-tight flex items-center gap-2">
              <span>{dashboardData?.userStats.pendingVerifications || 0}</span>
              {(dashboardData?.userStats.pendingVerifications || 0) > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Awaiting manual / PIN review</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Mentorships */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Mentorships</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white tracking-tight">
              {dashboardData?.mentorshipStats.activePairs || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{dashboardData?.mentorshipStats.pendingRequests || 0} pending</span>
              <span aria-hidden="true">·</span>
              <span>{dashboardData?.mentorshipStats.completedSessions || 0} finished</span>
            </div>
          </div>
        </div>

        {/* Card 4: Treasury / Paystack Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Treasury Inflow (NGN)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white tracking-tight">
              {dashboardData ? formatNgn(dashboardData.treasuryStats.totalVolumeNgn) : '---'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-indigo-400 font-semibold">{dashboardData?.treasuryStats.transactionCount || 0} txns</span>
              <span aria-hidden="true">·</span>
              <span>Paystack live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => {
            TelegramSdkWrapper.haptic('selection');
            setActiveTab('verifications');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
            activeTab === 'verifications'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Verification Queue</span>
          {(dashboardData?.userStats.pendingVerifications || 0) > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 font-bold text-[10px] rounded-full">
              {dashboardData?.userStats.pendingVerifications}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            TelegramSdkWrapper.haptic('selection');
            setActiveTab('mentorship');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
            activeTab === 'mentorship'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mentorship Oversight</span>
          <span className="text-[11px] opacity-75">({dashboardData?.mentorshipStats.totalRequests || 0})</span>
        </button>

        <button
          onClick={() => {
            TelegramSdkWrapper.haptic('selection');
            setActiveTab('engagement');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
            activeTab === 'engagement'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Engagement & Telemetry</span>
        </button>

        <button
          onClick={() => {
            TelegramSdkWrapper.haptic('selection');
            setActiveTab('audit');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: Verification Queue */}
      {/* ================================================================ */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search matric, name, or department..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-500 shrink-0">Method:</span>
              <div className="flex items-center gap-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'TRANSCRIPT_PIN', label: 'Transcript PIN' },
                  { key: 'STUDENT_ID_API', label: 'Student ID API' },
                  { key: 'OAUTH2_SCHOOL_PORTAL', label: 'Portal OAuth' },
                  { key: 'ALUMNI_EXECUTIVE_MANUAL', label: 'Certificate Review' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setMethodFilter(opt.key)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors shrink-0 ${
                      methodFilter === opt.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toast / Status feedback */}
          {statusFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 animate-fade-in ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {statusFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusFeedback.msg}</span>
            </div>
          )}

          {/* Candidate List */}
          {pendingList.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Verification Queue Clear</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No alumni degree verification applications are currently pending review for this institution scope.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingList.map(profile => {
                const fullName = profile.user
                  ? `${profile.user.tgFirstName} ${profile.user.tgLastName || ''}`.trim()
                  : 'Alumnus Applicant';
                const instName = institutions.find(i => i.id === profile.institutionId)?.shortName || profile.institutionId;
                const isWorking = actionInProgressId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Alumnus Identity & Credentials */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {profile.user?.tgPhotoUrl ? (
                        <img
                          src={profile.user.tgPhotoUrl}
                          alt={fullName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                          {fullName.charAt(0)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{fullName}</h4>
                          {profile.user?.tgUsername && (
                            <span className="text-xs text-blue-400 font-mono">@{profile.user.tgUsername}</span>
                          )}
                          <span className="text-xs text-slate-500 font-mono">· {instName}</span>
                        </div>

                        <div className="text-xs text-slate-300">
                          <span className="font-semibold text-white">{profile.degreeType} {profile.department}</span>
                          <span className="text-slate-400"> (Class of {profile.graduationYear})</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-0.5">
                          <span>Matric: <strong className="text-slate-200 font-mono">{profile.matriculationNo}</strong></span>
                          <span aria-hidden="true">·</span>
                          <span>Method: <strong className="text-slate-300">{profile.verifiedByMethod || 'PORTAL_AUTH'}</strong></span>
                          {profile.jobTitle && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-400">{profile.jobTitle} {profile.company ? `@ ${profile.company}` : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: View Certificate & Approve / Reject */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => {
                          TelegramSdkWrapper.haptic('light');
                          setInspectingProfile(profile);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Inspect Records</span>
                      </button>

                      <button
                        onClick={() => {
                          TelegramSdkWrapper.haptic('selection');
                          setRejectingProfile(profile);
                        }}
                        disabled={isWorking}
                        className="flex items-center gap-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApprove(profile)}
                        disabled={isWorking}
                        className="flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Grant Badge</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: Mentorship Oversight */}
      {/* ================================================================ */}
      {activeTab === 'mentorship' && (
        <div className="space-y-4">
          {/* Discipline Breakdown Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center justify-between">
              <span>Mentorship Requests by Discipline</span>
              <span className="text-xs font-normal text-slate-400">
                Avg Response: {dashboardData?.mentorshipStats.averageResponseTimeHours || 4.2}h
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(dashboardData?.mentorshipStats.byDiscipline || []).map(disc => (
                <div key={disc.discipline} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-300">{disc.discipline}</span>
                    <span className="font-bold text-blue-400">{disc.count} reqs</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${disc.percentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 text-right">{disc.percentage}% of total</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Bar for Mentorships */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Filter Status:</span>
              <div className="flex items-center gap-1">
                {['all', 'PENDING', 'ACCEPTED', 'COMPLETED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setMentorshipStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      mentorshipStatusFilter === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {st === 'all' ? 'All' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Showing <strong>{mentorshipList.length}</strong> mentorship engagements
            </div>
          </div>

          {/* Mentorship Oversight List */}
          <div className="space-y-3">
            {mentorshipList.map(item => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{item.topic}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.status === 'ACCEPTED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : item.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Cadence: <strong className="text-slate-300">{item.cadence || 'Flexible'}</strong> · Submitted {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Admin Status Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateMentorship(item.id, 'ACCEPTED')}
                        className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Force Accept
                      </button>
                    )}
                    {item.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateMentorship(item.id, 'COMPLETED')}
                        className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>

                {/* Mentee & Mentor pair */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[11px] text-slate-500 block uppercase font-mono tracking-wider">Mentee</span>
                    <span className="font-semibold text-slate-200">{item.senderName}</span>
                    {item.senderTgUsername && (
                      <span className="text-blue-400 block font-mono">@{item.senderTgUsername}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block uppercase font-mono tracking-wider">Assigned Mentor</span>
                    <span className="font-semibold text-slate-200">{item.mentorName || 'Senior Alumnus'}</span>
                    <span className="text-slate-400 block truncate">{item.mentorRole || 'Alumni Mentor'}</span>
                  </div>
                </div>

                {item.goal && (
                  <div className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                    <strong className="text-slate-300">Goal: </strong>
                    <span>{item.goal}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: Platform Engagement & Bot Telemetry */}
      {/* ================================================================ */}
      {activeTab === 'engagement' && (
        <div className="space-y-5">
          {/* Daily Engagement Trends */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Platform-Wide 7-Day Activity Trends</h3>
                <p className="text-xs text-slate-400 mt-0.5">Active Alumni DAU, Peer Connection Requests & Degree Verifications</p>
              </div>
              <div className="text-xs font-semibold text-emerald-400">
                +{dashboardData?.userStats.weeklyGrowthPercent || 14.8}% this week
              </div>
            </div>

            {/* Daily Bars */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {(dashboardData?.engagementStats.dailyActivity || []).map(day => (
                <div key={day.date} className="flex flex-col items-center gap-1.5">
                  <div className="w-full bg-slate-950 h-32 rounded-lg p-1.5 flex flex-col justify-end items-center border border-slate-800 relative group">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-md transition-all group-hover:brightness-110"
                      style={{ height: `${Math.min(100, Math.round((day.activeUsers / 800) * 100))}%` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-[10px] text-white py-0.5 px-1.5 rounded pointer-events-none transition-opacity whitespace-nowrap shadow-md">
                      {day.activeUsers} active
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">{day.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Telegram Bot Delivery Telemetry */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Telegram Bot Notification Engine</h3>
                  <p className="text-xs text-slate-400">Dispatches via Bot API for instant connection pings, approvals & wallet alerts</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Delivery Success</span>
                <span className="text-sm font-bold text-emerald-400">{dashboardData?.engagementStats.telegramDeliverySuccessRate || 99.4}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block">Bot Handle</span>
                <span className="text-sm font-mono font-bold text-cyan-300">@Tel_alum_bot</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Webhook Active</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block">30-Day Bot Deliveries</span>
                <span className="text-sm font-mono font-bold text-white">
                  {(dashboardData?.engagementStats.telegramNotificationDeliveries || 482).toLocaleString()} messages
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Zero Delivery Drop</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block">Telegram Supergroup Joins</span>
                <span className="text-sm font-mono font-bold text-white">
                  {(dashboardData?.engagementStats.telegramGroupJoinsThisMonth || 120).toLocaleString()} alumni
                </span>
                <span className="text-[10px] text-blue-400 block mt-0.5">Direct Invite Dispatch</span>
              </div>
            </div>
          </div>

          {/* Treasury Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span>Treasury & Paystack Settlement Flow</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400">Annual Alumni Dues</span>
                <div className="text-base font-bold text-white mt-1">
                  {formatNgn(dashboardData?.treasuryStats.duesCollectedNgn || 0)}
                </div>
                <span className="text-[10px] text-slate-500">55% of treasury inflow</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400">Event Registrations</span>
                <div className="text-base font-bold text-white mt-1">
                  {formatNgn(dashboardData?.treasuryStats.eventRegistrationsNgn || 0)}
                </div>
                <span className="text-[10px] text-slate-500">30% of treasury inflow</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400">Mentorship & Chapter Pledges</span>
                <div className="text-base font-bold text-white mt-1">
                  {formatNgn(dashboardData?.treasuryStats.mentorshipPledgesNgn || 0)}
                </div>
                <span className="text-[10px] text-slate-500">15% of treasury inflow</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 4: Audit Log */}
      {/* ================================================================ */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Institutional Administrative Audit Trail</h3>
              <p className="text-xs text-slate-400 mt-0.5">Immutable chronological record of approvals, rejections, and access events</p>
            </div>
            <button
              onClick={handleExportCsv}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Export Logs
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {(dashboardData?.recentAuditLogs || []).map(log => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      log.action === 'VERIFICATION_APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : log.action === 'VERIFICATION_REJECTED'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-slate-200">{log.targetName}</span>
                  </div>
                  {log.targetDetails && (
                    <p className="text-slate-400 text-[11px]">{log.targetDetails}</p>
                  )}
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                    <span>Actor: {log.actorName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                  log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 1: Inspect Verification Document & Records */}
      {/* ================================================================ */}
      {inspectingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Degree Credential Verification Dossier</h3>
              </div>
              <button
                onClick={() => setInspectingProfile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Candidate Name:</span>
                  <span className="font-bold text-white">
                    {inspectingProfile.user?.tgFirstName} {inspectingProfile.user?.tgLastName || ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telegram Handle:</span>
                  <span className="font-mono text-blue-400">@{inspectingProfile.user?.tgUsername || 'unspecified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Matriculation No:</span>
                  <span className="font-mono font-bold text-amber-300">{inspectingProfile.matriculationNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Degree & Department:</span>
                  <span className="text-slate-200">{inspectingProfile.degreeType} {inspectingProfile.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Graduation Year:</span>
                  <span className="text-slate-200">Class of {inspectingProfile.graduationYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verification Method:</span>
                  <span className="font-semibold text-slate-300">{inspectingProfile.verifiedByMethod || 'PORTAL_AUTH'}</span>
                </div>
              </div>

              {/* Extra Payload / CGPA records */}
              {inspectingProfile.portalPayload && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-slate-300 block">Registry Submission Records</span>
                  {Object.entries(inspectingProfile.portalPayload).map(([k, v]) => {
                    if (k === 'documentScanUrl') return null;
                    return (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="text-slate-200 font-mono">{String(v)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Certificate Scan Preview */}
              {inspectingProfile.portalPayload?.documentScanUrl && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-300 block">Attached Degree Certificate Scan</span>
                  <div className="border border-slate-700 rounded-xl overflow-hidden bg-black max-h-52">
                    <img
                      src={inspectingProfile.portalPayload.documentScanUrl as string}
                      alt="Certificate Scan"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectingProfile(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Close Dossier
              </button>
              <button
                onClick={() => {
                  const p = inspectingProfile;
                  setInspectingProfile(null);
                  handleApprove(p);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Approve & Issue Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 2: Reject Reason Selection */}
      {/* ================================================================ */}
      {rejectingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-2.5 text-amber-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Reject Verification Application</h3>
            </div>

            <p className="text-xs text-slate-300">
              You are about to reject the verification application for candidate{' '}
              <strong className="text-white">{rejectingProfile.user?.tgFirstName}</strong> (Matric: {rejectingProfile.matriculationNo}).
              A notification will be dispatched to their Telegram inbox via @Tel_alum_bot.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">Select or Enter Reason:</label>
              <div className="space-y-1.5 text-xs">
                {[
                  'Matriculation number or academic records did not match registry database.',
                  'Uploaded certificate scan was blurry, unreadable, or missing university seal.',
                  'Graduation year or degree program mismatch against departmental records.',
                  'Name on certificate does not correspond with Telegram identity.'
                ].map(reasonOption => (
                  <label
                    key={reasonOption}
                    className="flex items-start gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700"
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      checked={rejectionReason === reasonOption}
                      onChange={() => setRejectionReason(reasonOption)}
                      className="mt-0.5 text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-300 text-[11px]">{reasonOption}</span>
                  </label>
                ))}
              </div>

              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Custom reason note..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRejectingProfile(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
