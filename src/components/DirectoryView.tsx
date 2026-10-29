import React, { useState, useEffect, useCallback } from 'react';
import { Institution, AlumniProfile, DirectoryResponse, TelegramUser } from '../types';
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  Loader2,
  ChevronRight,
  Filter,
  ShieldCheck,
  Briefcase,
  Code,
  WifiOff,
  Database,
  QrCode,
  UserPlus,
  UserMinus,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  FileDown,
  MessageSquare,
  Radio,
  MapPin,
  GraduationCap,
  Eye,
  Lock,
  Download,
  Contact,
  ArrowUpDown,
  Crown,
  Zap,
  Clock,
  Undo2,
  Users,
  Award
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { DirectoryCache } from '../lib/directoryCache';
import { safeFetchJson } from '../lib/apiClient';
import { downloadVCard } from '../lib/vcard';
import { formatLastActive } from '../lib/dateUtils';
import { getAlumniMilestoneBadges } from '../lib/badgeUtils';
import { INITIAL_ALUMNI_PROFILES } from '../server/mockData';
import { DirectoryMatchNotificationBanner } from './DirectoryMatchNotificationBanner';
import { QrCodeScannerModal } from './QrCodeScannerModal';
import { RecentMessagesSidebar } from './RecentMessagesSidebar';

interface DirectoryViewProps {
  institution?: Institution | null;
  currentProfile?: AlumniProfile | null;
  currentUser?: TelegramUser;
  onSelectProfile: (profile: AlumniProfile) => void;
  onRequestMentorship?: (profile: AlumniProfile) => void;
  initialSearchQuery?: string;
  initialSkill?: string;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  institution,
  currentProfile,
  currentUser,
  onSelectProfile,
  onRequestMentorship,
  initialSearchQuery = '',
  initialSkill = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedSkill, setSelectedSkill] = useState<string>(initialSkill);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedGradYear, setSelectedGradYear] = useState<number | undefined>(undefined);
  const [onlyMentors, setOnlyMentors] = useState<boolean>(false);
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isMessagesSidebarOpen, setIsMessagesSidebarOpen] = useState(false);

  // Tab & Sorting States
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<'ALL' | 'PENDING'>('ALL');
  const [sortBy, setSortBy] = useState<'LAST_ACTIVE' | 'NAME_ASC' | 'YEAR_DESC' | 'VIEWS_DESC'>('LAST_ACTIVE');

  // Recent Searches (Stored in LocalStorage for quick access)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('alumni_recent_searches');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Fintech', 'Computer Science', 'Lagos'];
  });

  // Connection Request States
  const [sentConnectionIds, setSentConnectionIds] = useState<Set<string>>(new Set());
  const [isConnectingId, setIsConnectingId] = useState<string | null>(null);
  const [connectionFeedback, setConnectionFeedback] = useState<{ profileId: string; message: string } | null>(null);

  // CSV Export States
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [directoryData, setDirectoryData] = useState<DirectoryResponse>({
    alumni: [],
    total: 0,
    page: 1,
    totalPages: 1,
    hasMore: false,
    filters: {
      departments: [],
      industries: [],
      graduationYears: [],
      chapters: [],
      skills: []
    }
  });


  // Top popular skills fallback
  const popularSkills = [
    'React',
    'Python',
    'Machine Learning',
    'System Design',
    'Fintech',
    'Cloud / AWS',
    'Cyber Security',
    'Product Management',
    'PostgreSQL',
    'Distributed Systems',
    'AI & LLMs'
  ];

  const availableSkills =
    directoryData.filters.skills && directoryData.filters.skills.length > 0
      ? directoryData.filters.skills
      : popularSkills;

  const fetchDirectory = useCallback(
    async (pageToFetch = 1, append = false) => {
      if (!institution?.id) {
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const queryParams = {
        q: searchQuery.trim() || undefined,
        skill: selectedSkill.trim() || undefined,
        department: selectedDept || undefined,
        industry: selectedIndustry || undefined,
        gradYearMin: selectedGradYear,
        gradYearMax: selectedGradYear,
        isMentor: onlyMentors ? true : undefined
      };

      // Check offline cache first on initial load
      if (pageToFetch === 1 && !append) {
        const cached = DirectoryCache.get(institution.id, queryParams);
        if (cached) {
          setDirectoryData(cached);
          setIsOfflineCached(true);
          setIsLoading(false);
        } else {
          setIsLoading(true);
        }
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          institutionId: institution.id,
          page: String(pageToFetch),
          limit: '10',
        });

        if (searchQuery.trim()) params.append('q', searchQuery.trim());
        if (selectedSkill.trim()) params.append('skill', selectedSkill.trim());
        if (selectedDept) params.append('department', selectedDept);
        if (selectedIndustry) params.append('industry', selectedIndustry);
        if (selectedGradYear) {
          params.append('gradYearMin', String(selectedGradYear));
          params.append('gradYearMax', String(selectedGradYear));
        }
        if (onlyMentors) params.append('isMentor', 'true');

        const data = await safeFetchJson<DirectoryResponse>(`/api/directory?${params.toString()}`);

        if (data.success && data.data) {
          setDirectoryData((prev) => {
            const nextData = {
              ...data.data!,
              alumni: append ? [...prev.alumni, ...data.data!.alumni] : data.data!.alumni,
            };
            if (pageToFetch === 1 && !append) {
              DirectoryCache.set(institution.id, queryParams, nextData);
            }
            return nextData;
          });
          setIsOfflineCached(false);
        } else {
          // Fallback to cache or initial sample profiles
          const cached = DirectoryCache.get(institution.id, queryParams);
          if (cached) {
            setDirectoryData(cached);
            setIsOfflineCached(true);
          } else {
            const sampleFiltered = INITIAL_ALUMNI_PROFILES.filter(
              p => !institution || p.institutionId === institution.id
            );
            setDirectoryData({
              alumni: sampleFiltered,
              total: sampleFiltered.length,
              page: 1,
              totalPages: 1,
              hasMore: false
            });
          }
        }
      } catch (err) {
        console.error('Error fetching directory, falling back to cache:', err);
        const cached = DirectoryCache.get(institution.id, queryParams);
        if (cached) {
          setDirectoryData(cached);
          setIsOfflineCached(true);
        } else {
          const sampleFiltered = INITIAL_ALUMNI_PROFILES.filter(
            p => !institution || p.institutionId === institution.id
          );
          setDirectoryData({
            alumni: sampleFiltered,
            total: sampleFiltered.length,
            page: 1,
            totalPages: 1,
            hasMore: false
          });
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      institution?.id,
      searchQuery,
      selectedSkill,
      selectedDept,
      selectedIndustry,
      selectedGradYear,
      onlyMentors,
    ]
  );


  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDirectory(1, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDirectory]);

  // Synchronize when initialSearchQuery or initialSkill changes from props
  useEffect(() => {
    if (initialSearchQuery) setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialSkill) setSelectedSkill(initialSkill);
  }, [initialSkill]);

  const handleLoadMore = () => {
    if (directoryData.hasMore && !isLoadingMore) {
      TelegramSdkWrapper.haptic('light');
      fetchDirectory(directoryData.page + 1, true);
    }
  };

  const activeFilterCount =
    (selectedSkill ? 1 : 0) +
    (selectedDept ? 1 : 0) +
    (selectedIndustry ? 1 : 0) +
    (selectedGradYear ? 1 : 0) +
    (onlyMentors ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedSkill('');
    setSelectedDept('');
    setSelectedIndustry('');
    setSelectedGradYear(undefined);
    setOnlyMentors(false);
    setSearchQuery('');
    TelegramSdkWrapper.haptic('selection');
  };

  const handleSelectSkill = (skill: string) => {
    TelegramSdkWrapper.haptic('selection');
    if (selectedSkill.toLowerCase() === skill.toLowerCase()) {
      setSelectedSkill('');
    } else {
      setSelectedSkill(skill);
    }
  };

  // Fetch already sent connection IDs for the current profile
  useEffect(() => {
    if (currentProfile?.id) {
      safeFetchJson<{ sentRecipientIds: string[] }>(`/api/connections?profileId=${currentProfile.id}`)
        .then(res => {
          if (res.success && res.data?.sentRecipientIds) {
            setSentConnectionIds(new Set(res.data.sentRecipientIds));
          }
        })
        .catch(err => console.warn('Could not load connection status:', err));
    }
  }, [currentProfile?.id]);

  // Send Connection Request with Telegram Bot Notification
  const handleSendConnect = async (e: React.MouseEvent, targetAlumnus: AlumniProfile) => {
    e.stopPropagation();
    TelegramSdkWrapper.haptic('medium');
    setIsConnectingId(targetAlumnus.id);

    try {
      const res = await safeFetchJson<{ delivered?: boolean; message?: string }>('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: institution?.id || targetAlumnus.institutionId,
          senderProfileId: currentProfile?.id || 'demo-sender-profile',
          senderUserId: currentProfile?.userId,
          senderName: currentProfile?.user
            ? `${currentProfile.user.tgFirstName} ${currentProfile.user.tgLastName || ''}`.trim()
            : 'Fellow Alumnus',
          senderJobTitle: currentProfile?.jobTitle || 'Alumnus',
          senderCompany: currentProfile?.company,
          senderDepartment: currentProfile?.department,
          senderGradYear: currentProfile?.graduationYear,
          senderTgUsername: currentProfile?.user?.tgUsername,
          recipientProfileId: targetAlumnus.id,
          recipientTgUserId: targetAlumnus.user?.tgUserId,
          recipientName: targetAlumnus.user
            ? `${targetAlumnus.user.tgFirstName} ${targetAlumnus.user.tgLastName || ''}`.trim()
            : 'Alumnus'
        })
      });

      setSentConnectionIds(prev => new Set(prev).add(targetAlumnus.id));
      setConnectionFeedback({
        profileId: targetAlumnus.id,
        message: res.delivered ? 'Request sent via Telegram Bot! ✈️' : 'Connection requested! 🤝'
      });
      TelegramSdkWrapper.haptic('success');
      setTimeout(() => setConnectionFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to send connect request', err);
      // Optimistic fallback for preview
      setSentConnectionIds(prev => new Set(prev).add(targetAlumnus.id));
      setConnectionFeedback({
        profileId: targetAlumnus.id,
        message: 'Connection requested! 🤝'
      });
      TelegramSdkWrapper.haptic('success');
      setTimeout(() => setConnectionFeedback(null), 4000);
    } finally {
      setIsConnectingId(null);
    }
  };

  // Withdraw Outgoing Connection Request
  const handleWithdrawConnect = (e: React.MouseEvent, targetAlumnus: AlumniProfile) => {
    e.stopPropagation();
    TelegramSdkWrapper.haptic('medium');
    setSentConnectionIds(prev => {
      const next = new Set(prev);
      next.delete(targetAlumnus.id);
      return next;
    });
    setConnectionFeedback({
      profileId: targetAlumnus.id,
      message: 'Connection request withdrawn. ↩️'
    });
    setTimeout(() => setConnectionFeedback(null), 3500);
  };

  // Recent Search Management
  const removeRecentSearch = (term: string) => {
    TelegramSdkWrapper.haptic('light');
    setRecentSearches(prev => {
      const next = prev.filter(s => s !== term);
      try { localStorage.setItem('alumni_recent_searches', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const clearAllRecentSearches = () => {
    TelegramSdkWrapper.haptic('light');
    setRecentSearches([]);
    try { localStorage.removeItem('alumni_recent_searches'); } catch {}
  };

  // Sync recent searches on query change
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        const trimmed = searchQuery.trim();
        setRecentSearches(prev => {
          const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
          const next = [trimmed, ...filtered].slice(0, 3);
          try { localStorage.setItem('alumni_recent_searches', JSON.stringify(next)); } catch {}
          return next;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Client-side sorting computation
  const sortedAlumni = [...directoryData.alumni].sort((a, b) => {
    if (sortBy === 'NAME_ASC') {
      const nameA = `${a.user?.tgFirstName || ''} ${a.user?.tgLastName || ''}`.trim().toLowerCase();
      const nameB = `${b.user?.tgFirstName || ''} ${b.user?.tgLastName || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'YEAR_DESC') {
      return (b.graduationYear || 0) - (a.graduationYear || 0);
    }
    if (sortBy === 'VIEWS_DESC') {
      return (b.profileViews || 0) - (a.profileViews || 0);
    }
    // LAST_ACTIVE (default)
    const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
    const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
    return timeB - timeA;
  });

  const pendingAlumni = sortedAlumni.filter(a => sentConnectionIds.has(a.id));

  // Export alumni directory connections to CSV file
  const handleExportCsv = () => {
    TelegramSdkWrapper.haptic('medium');
    setIsExportingCsv(true);

    try {
      const alumniToExport = directoryData.alumni;
      if (!alumniToExport || alumniToExport.length === 0) {
        TelegramSdkWrapper.haptic('error');
        setIsExportingCsv(false);
        return;
      }

      const escapeCsv = (str: string | number | boolean | undefined | null) => {
        if (str === undefined || str === null) return '""';
        const val = String(str).replace(/"/g, '""');
        return `"${val}"`;
      };

      const headers = [
        'Full Name',
        'Telegram Username',
        'Telegram User ID',
        'Institution',
        'Department',
        'Degree',
        'Graduation Year',
        'Job Title',
        'Company',
        'Industry',
        'City',
        'Country',
        'Skills',
        'Is Mentor',
        'Verification Status',
        'LinkedIn URL'
      ];

      const rows = alumniToExport.map(p => {
        const user = p.user;
        const fullName = user ? `${user.tgFirstName} ${user.tgLastName || ''}`.trim() : 'Alumnus';
        const skillsStr = (p.skills || []).join(', ');

        return [
          escapeCsv(fullName),
          escapeCsv(user?.tgUsername ? `@${user.tgUsername}` : ''),
          escapeCsv(user?.tgUserId || ''),
          escapeCsv(institution?.name || p.institutionId),
          escapeCsv(p.department || ''),
          escapeCsv(p.degreeType || ''),
          escapeCsv(p.graduationYear || ''),
          escapeCsv(p.jobTitle || ''),
          escapeCsv(p.company || ''),
          escapeCsv(p.industry || ''),
          escapeCsv(p.locationCity || ''),
          escapeCsv(p.locationCountry || ''),
          escapeCsv(skillsStr),
          escapeCsv(p.isMentor ? 'Yes' : 'No'),
          escapeCsv(p.verificationStatus || 'UNVERIFIED'),
          escapeCsv(p.linkedinUrl || '')
        ].join(',');
      });

      const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `alumni_network_${institution?.slug || 'connections'}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      TelegramSdkWrapper.haptic('success');
      setExportSuccessMessage(`Exported ${alumniToExport.length} alumni connections to CSV`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="space-y-3 pb-20 animate-in fade-in duration-200">
      {/* Network Match Alerts Banner */}
      <DirectoryMatchNotificationBanner
        currentProfile={currentProfile}
        onSelectMatchedProfile={onSelectProfile}
      />

      {/* CSV Export Success Banner */}
      {exportSuccessMessage && (
        <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{exportSuccessMessage}</span>
          </div>
          <button onClick={() => setExportSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Offline cached notification if applicable */}
      {isOfflineCached && (
        <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-[11px] text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Viewing offline cached directory (synced locally).</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Offline Ready</span>
        </div>
      )}

      {/* Title & Top Navigation Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
          <div>
            <h2 className="text-base font-bold text-slate-100">Alumni Directory</h2>
            <p className="text-xs text-slate-400">
              {directoryData.total} verified & public alumni at {institution?.shortName || 'University'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Sorting Dropdown Component */}
            <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <label htmlFor="directory-sort-select" className="text-[11px] text-slate-400 font-semibold hidden xs:inline">Sort:</label>
              <select
                id="directory-sort-select"
                value={sortBy}
                onChange={(e) => {
                  TelegramSdkWrapper.haptic('selection');
                  setSortBy(e.target.value as any);
                }}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
                title="Sort alumni directory"
              >
                <option value="LAST_ACTIVE" className="bg-slate-900 text-slate-100">Last Active</option>
                <option value="NAME_ASC" className="bg-slate-900 text-slate-100">Name (A-Z)</option>
                <option value="YEAR_DESC" className="bg-slate-900 text-slate-100">Graduation Year (Newest)</option>
                <option value="VIEWS_DESC" className="bg-slate-900 text-slate-100">Most Viewed</option>
              </select>
            </div>

            {/* Telegram Wire / Recent Messages Sidebar Trigger */}
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('medium');
                setIsMessagesSidebarOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold bg-blue-950/50 border-blue-600/60 text-blue-300 hover:bg-blue-900/60 hover:text-white transition-all shadow-sm active:scale-95"
              title="Open Live Alumni Telegram Wire & Recent Chat Snippets"
            >
              <div className="relative flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <span className="hidden xs:inline sm:inline">Telegram Wire</span>
              <span className="inline xs:hidden sm:hidden">Wire</span>
            </button>

            {/* CSV Export Button in Directory Header */}
            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv || directoryData.alumni.length === 0}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold bg-emerald-950/40 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/50 hover:text-emerald-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Export Alumni Network Connections as CSV file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline sm:inline">{isExportingCsv ? 'Exporting...' : 'Export CSV'}</span>
              <span className="inline xs:hidden sm:hidden">CSV</span>
            </button>

            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('light');
                setIsQrScannerOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm active:scale-95"
              title="Scan Alumnus QR Code Badge"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xs:inline sm:inline">Scan QR</span>
            </button>

            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('light');
                setIsFilterSheetOpen(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                activeFilterCount > 0
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Directory View Mode Tabs: All Alumni vs Pending Connections */}
        <div className="flex items-center gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              TelegramSdkWrapper.haptic('selection');
              setActiveDirectoryTab('ALL');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeDirectoryTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Alumni</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-black/30 rounded-full font-mono">
              {directoryData.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              TelegramSdkWrapper.haptic('selection');
              setActiveDirectoryTab('PENDING');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeDirectoryTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Connections</span>
            {sentConnectionIds.size > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-500/50 rounded-full font-mono font-bold">
                {sentConnectionIds.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, department, city..."
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Recent Searches Section: Lists last 3 queries for quick re-access */}
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="flex items-center gap-1 text-slate-400 font-semibold shrink-0">
              <Clock className="w-3 h-3 text-cyan-400" /> Recent:
            </span>
            {recentSearches.map((term) => (
              <span
                key={term}
                className="inline-flex items-center gap-1 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 px-2.5 py-0.5 rounded-full text-[11px] shrink-0 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    TelegramSdkWrapper.haptic('light');
                    setSearchQuery(term);
                  }}
                  className="hover:text-blue-300 font-medium"
                >
                  {term}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSearch(term);
                  }}
                  className="text-slate-400 hover:text-red-400 ml-0.5"
                  title="Remove query"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllRecentSearches}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline shrink-0 ml-1 font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Skills & Expertise Filter Chips Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
          <span className="font-semibold flex items-center gap-1">
            <Code className="w-3 h-3 text-blue-400" /> Filter by Skill & Expertise:
          </span>
          {selectedSkill && (
            <button
              onClick={() => setSelectedSkill('')}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Reset Skill
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('selection');
              setOnlyMentors(!onlyMentors);
            }}
            className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-full border transition-all ${
              onlyMentors
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold shadow-sm'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            Mentors Only
          </button>

          {availableSkills.slice(0, 12).map((skill) => {
            const isSelected = selectedSkill.toLowerCase() === skill.toLowerCase();
            return (
              <button
                key={skill}
                onClick={() => handleSelectSkill(skill)}
                className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 border-blue-400 text-white font-bold shadow-md shadow-blue-900/40 ring-1 ring-blue-400'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-0.5">
          <span className="text-slate-400">Active:</span>
          {selectedSkill && (
            <span className="inline-flex items-center gap-1 bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded-lg border border-blue-700/60 font-mono">
              Skill: {selectedSkill}
              <button onClick={() => setSelectedSkill('')}>
                <X className="w-3 h-3 text-blue-400" />
              </button>
            </span>
          )}
          {selectedDept && (
            <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 px-2 py-0.5 rounded-lg border border-slate-700">
              {selectedDept}
              <button onClick={() => setSelectedDept('')}>
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </span>
          )}
          {selectedIndustry && (
            <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 px-2 py-0.5 rounded-lg border border-slate-700">
              {selectedIndustry}
              <button onClick={() => setSelectedIndustry('')}>
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </span>
          )}
          {selectedGradYear && (
            <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 px-2 py-0.5 rounded-lg border border-slate-700">
              Class of {selectedGradYear}
              <button onClick={() => setSelectedGradYear(undefined)}>
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-400 hover:underline ml-1 font-semibold"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Alumni Results or Pending Connections List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" />
          <p className="text-xs">Searching alumni database...</p>
        </div>
      ) : activeDirectoryTab === 'PENDING' && pendingAlumni.length === 0 ? (
        <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">No Pending Requests</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            You haven't sent any connection requests yet, or all your previous requests have been accepted.
          </p>
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('selection');
              setActiveDirectoryTab('ALL');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 inline-flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Browse Alumni Directory</span>
          </button>
        </div>
      ) : activeDirectoryTab === 'ALL' && sortedAlumni.length === 0 ? (
        <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">No Alumni Found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            No matching profiles found for your current skill or search criteria.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDirectoryTab === 'PENDING' && (
            <div className="px-3 py-2 bg-amber-950/40 border border-amber-600/30 rounded-xl text-xs text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Showing <strong>{pendingAlumni.length}</strong> outgoing connection request{pendingAlumni.length === 1 ? '' : 's'}.</span>
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">Pending Confirmation</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {(activeDirectoryTab === 'PENDING' ? pendingAlumni : sortedAlumni).map((alumnus) => {
            const isVerified = alumnus.verificationStatus === 'VERIFIED';
            const user = alumnus.user;
            const displayName = user
              ? `${user.tgFirstName} ${user.tgLastName || ''}`
              : 'Alumnus';
            const isCurrentSelf = currentProfile
              ? currentProfile.id === alumnus.id || currentProfile.userId === alumnus.userId
              : false;
            const activeStatus = formatLastActive(alumnus.lastActiveAt);
            const milestoneBadges = getAlumniMilestoneBadges(alumnus);

            return (
              <div
                key={alumnus.id}
                onClick={() => {
                  TelegramSdkWrapper.haptic('light');
                  onSelectProfile(alumnus);
                }}
                className="overflow-hidden bg-slate-800/60 hover:bg-slate-800/90 rounded-2xl border border-slate-700/60 hover:border-blue-500/40 shadow-md transition-all flex flex-col justify-between group cursor-pointer"
              >
                {/* Accent Top Strip Header */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-blue-950/60 via-slate-850 to-slate-900 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isVerified ? (
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                        Pending
                      </span>
                    )}

                    {alumnus.isMentor && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Mentor
                      </span>
                    )}

                    {alumnus.privacyMode && (
                      <span className="text-[10px] font-semibold bg-slate-800/90 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-slate-400" /> Private
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Dynamic Last Active Indicator */}
                    <span
                      className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-800"
                      title={`Last active: ${alumnus.lastActiveAt ? new Date(alumnus.lastActiveAt).toLocaleString() : 'recently'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          activeStatus.isOnline
                            ? 'bg-emerald-400 animate-pulse'
                            : activeStatus.isRecent
                            ? 'bg-cyan-400'
                            : 'bg-slate-500'
                        }`}
                      />
                      <span>{activeStatus.text}</span>
                    </span>

                    {/* Profile Views Counter */}
                    <span
                      className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1"
                      title="Profile views count"
                    >
                      <Eye className="w-2.5 h-2.5 text-blue-400" />
                      <span>{alumnus.profileViews || 0}</span>
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Alumnus Identity Block */}
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        {user?.tgPhotoUrl ? (
                          <img
                            src={user.tgPhotoUrl}
                            alt={displayName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center border-2 border-white/20 shadow-sm">
                            {displayName.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-100 text-sm leading-snug truncate group-hover:text-blue-300 transition-colors">
                            {displayName}
                          </h3>
                          {user?.tgUsername && (
                            <span className="text-[11px] text-blue-400 font-mono truncate">
                              @{user.tgUsername}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-300 font-medium truncate mt-0.5 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {alumnus.jobTitle || 'Alumnus'} {alumnus.company ? `@ ${alumnus.company}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Badges System (Early Adopter, Top Mentor, Founding Alumnus, etc.) */}
                    {milestoneBadges.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {milestoneBadges.map((badge) => (
                          <span
                            key={badge.id}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shadow-sm ${badge.bgClasses} ${badge.colorClasses} ${badge.borderClasses}`}
                            title={badge.description}
                          >
                            {badge.iconName === 'Crown' && <Crown className="w-2.5 h-2.5" />}
                            {badge.iconName === 'Sparkles' && <Sparkles className="w-2.5 h-2.5" />}
                            {badge.iconName === 'Zap' && <Zap className="w-2.5 h-2.5" />}
                            {badge.iconName === 'ShieldCheck' && <ShieldCheck className="w-2.5 h-2.5" />}
                            <span>{badge.label}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio or Department Detail Box */}
                    <div className="space-y-1.5 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <div className="text-slate-300 flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1 truncate">
                          <GraduationCap className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{alumnus.department}</span>
                        </span>
                        {alumnus.locationCity && (
                          <span className="text-cyan-300 text-[11px] flex items-center gap-0.5 shrink-0 ml-1">
                            <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{alumnus.locationCity}</span>
                          </span>
                        )}
                      </div>

                      {alumnus.privacyMode ? (
                        <p className="text-[11px] text-slate-500 italic leading-relaxed pt-1 border-t border-slate-800/80 flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>Bio hidden by user in Privacy Mode</span>
                        </p>
                      ) : alumnus.bio ? (
                        <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-2 pt-1 border-t border-slate-800/80">
                          "{alumnus.bio}"
                        </p>
                      ) : null}
                    </div>

                    {/* Skills Chips */}
                    {alumnus.skills && alumnus.skills.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {alumnus.skills.slice(0, 3).map((skill, i) => {
                          const isTargetSkill = selectedSkill.toLowerCase() === skill.toLowerCase();
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSkill(skill);
                              }}
                              className={`text-[9px] px-2 py-0.5 rounded-md border font-mono truncate max-w-[110px] transition-colors ${
                                isTargetSkill
                                  ? 'bg-blue-600 border-blue-400 text-white font-bold'
                                  : 'bg-slate-900/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                              }`}
                              title={`Filter by ${skill}`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                        {alumnus.skills.length > 3 && (
                          <span className="text-[9px] text-slate-500 font-mono">
                            +{alumnus.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Connection Feedback Banner */}
                  {connectionFeedback?.profileId === alumnus.id && (
                    <div className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-[11px] text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{connectionFeedback.message}</span>
                    </div>
                  )}

                  {/* Action Bar Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 gap-1.5">
                    {/* Add to Contacts (.vcf) Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        TelegramSdkWrapper.haptic('medium');
                        downloadVCard(alumnus);
                      }}
                      className="text-[10px] bg-slate-900 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold px-2.5 py-1 rounded-xl border border-slate-700 flex items-center gap-1 shadow-sm transition-all active:scale-95 shrink-0"
                      title="Download .vcf contact card to your phone"
                    >
                      <Download className="w-3 h-3 text-cyan-400" />
                      <span>Add to Contacts</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {isCurrentSelf ? (
                        <span className="text-[10px] text-slate-400 font-semibold px-2.5 py-1 bg-slate-900/80 rounded-xl border border-slate-700/60">
                          Your Profile
                        </span>
                      ) : alumnus.privacyMode ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] bg-slate-900/90 text-slate-400 border border-slate-800 font-medium px-2 py-1 rounded-xl"
                          title="Direct connections disabled in Privacy Mode"
                        >
                          <Lock className="w-2.5 h-2.5 text-slate-500" />
                          <span>Direct Connects Disabled</span>
                        </span>
                      ) : (
                        <>
                          {sentConnectionIds.has(alumnus.id) ? (
                            <div className="flex items-center gap-1">
                              <span
                                className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-semibold px-2 py-1 rounded-xl"
                                title="Connection request sent"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Sent</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleWithdrawConnect(e, alumnus)}
                                className="inline-flex items-center gap-1 text-[10px] bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 font-medium px-2 py-1 rounded-xl transition-all active:scale-95"
                                title="Withdraw outgoing connection request"
                              >
                                <Undo2 className="w-3 h-3 text-red-400" />
                                <span>Withdraw</span>
                              </button>
                            </div>
                          ) : isConnectingId === alumnus.id ? (
                            <button
                              disabled
                              className="text-[10px] bg-blue-700/80 text-white font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1 opacity-80"
                            >
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Connecting...</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleSendConnect(e, alumnus)}
                              className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
                              title="Send connection request notification via Telegram bot"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Connect</span>
                            </button>
                          )}
                        </>
                      )}

                      {alumnus.isMentor && onRequestMentorship && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            TelegramSdkWrapper.haptic('selection');
                            onRequestMentorship(alumnus);
                          }}
                          className="text-[10px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-2.5 py-1 rounded-xl shadow-sm transition-transform active:scale-95 flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          Mentorship
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

          {/* Load More Pagination */}
          {activeDirectoryTab === 'ALL' && directoryData.hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading page {directoryData.page + 1}...
                  </>
                ) : (
                  `Load More (${directoryData.total - directoryData.alumni.length} remaining)`
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* FILTER BOTTOM SHEET MODAL */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-t border-slate-800 w-full max-w-lg rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-slate-100 text-sm">Directory Filters</h3>
              </div>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Skill Filter Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Filter by Skill & Technical Competency
                </label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Skills & Expertise</option>
                  {availableSkills.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Academic Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Departments</option>
                  {directoryData.filters.departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Industry / Sector
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Industries</option>
                  {directoryData.filters.industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              {/* Graduation Class Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Graduation Class Year
                </label>
                <select
                  value={selectedGradYear || ''}
                  onChange={(e) =>
                    setSelectedGradYear(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Years (1980 - 2026)</option>
                  {directoryData.filters.graduationYears.map((year) => (
                    <option key={year} value={year}>
                      Class of {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mentorship Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="text-xs font-bold text-slate-200">
                  Open for Mentoring Only
                </span>
                <input
                  type="checkbox"
                  checked={onlyMentors}
                  onChange={(e) => setOnlyMentors(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center gap-3">
              <button
                onClick={() => {
                  clearAllFilters();
                  setIsFilterSheetOpen(false);
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  TelegramSdkWrapper.haptic('selection');
                  setIsFilterSheetOpen(false);
                  fetchDirectory(1, false);
                }}
                className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-900/30"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner Modal */}
      <QrCodeScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onSelectProfile={onSelectProfile}
        institution={institution}
      />

      {/* Recent Messages Community Wire Sidebar */}
      <RecentMessagesSidebar
        isOpen={isMessagesSidebarOpen}
        onClose={() => setIsMessagesSidebarOpen(false)}
        currentUser={
          currentUser || {
            id: currentProfile?.userId || 999999,
            tgFirstName: currentProfile?.user?.tgFirstName || 'Alumnus',
            tgLastName: currentProfile?.user?.tgLastName,
            tgUsername: currentProfile?.user?.tgUsername || 'alumnus_tg',
            tgPhotoUrl: currentProfile?.user?.tgPhotoUrl
          }
        }
        currentProfile={currentProfile}
        onSelectAlumnusByName={(name) => {
          setSearchQuery(name);
        }}
      />
    </div>
  );
};
