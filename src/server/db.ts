import fs from 'fs';
import path from 'path';
import {
  Institution,
  TelegramUser,
  AlumniProfile,
  DirectoryQuery,
  DirectoryResponse,
  VerificationSession,
  ChapterGroup,
  AlumniEvent,
  MentorshipRequest,
  VerificationStatus,
  VerificationMethod,
  AlumniWallet,
  FinancialTransaction,
  LinkedInImportProfile,
  DirectoryMatchNotification,
  SkillEndorsement,
  ConnectionRequest,
  UniversityNewsItem,
  RecentTelegramMessage,
  CareerMilestone,
  AdminDashboardData,
  AdminUserStats,
  AdminMentorshipStats,
  AdminEngagementStats,
  AdminTreasuryStats,
  AdminAuditLog
} from '../types';
import {
  INITIAL_INSTITUTIONS,
  DEMO_TELEGRAM_USERS,
  INITIAL_ALUMNI_PROFILES,
  INITIAL_CHAPTERS,
  INITIAL_EVENTS,
  INITIAL_WALLETS,
  INITIAL_TRANSACTIONS,
  LINKEDIN_SAMPLE_PROFILES,
  INITIAL_ENDORSEMENTS,
  INITIAL_UNIVERSITY_NEWS,
  INITIAL_RECENT_MESSAGES,
  INITIAL_CAREER_MILESTONES,
  INITIAL_MENTORSHIP_REQUESTS,
  INITIAL_AUDIT_LOGS
} from './mockData';

class MultiTenantDatabase {
  private dataDir = path.join(process.cwd(), 'data');
  private dataFilePath = path.join(process.cwd(), 'data', 'alumni_db.json');

  private institutions: Map<string, Institution> = new Map();
  private users: Map<string, TelegramUser> = new Map();
  private profiles: Map<string, AlumniProfile> = new Map();
  private verificationSessions: Map<string, VerificationSession> = new Map();
  private endorsements: Map<string, SkillEndorsement> = new Map();
  private news: Map<string, UniversityNewsItem> = new Map();
  private recentMessages: RecentTelegramMessage[] = [];
  private careerMilestones: Map<string, CareerMilestone[]> = new Map();
  private inviteLogs: Map<string, {
    id: string;
    profileId: string;
    institutionId: string;
    tgUserId: string;
    inviteLink: string;
    expiresAt: string;
    isUsed: boolean;
    createdAt: string;
  }> = new Map();
  private chapters: Map<string, ChapterGroup> = new Map();
  private events: Map<string, AlumniEvent> = new Map();
  private mentorshipRequests: MentorshipRequest[] = [];
  private connectionRequests: ConnectionRequest[] = [];
  private wallets: Map<string, AlumniWallet> = new Map();
  private transactions: FinancialTransaction[] = [];
  private auditLogs: AdminAuditLog[] = [];

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const data = JSON.parse(raw);
        this.restoreFromSnapshot(data);
        console.log(`[Durable Database]: Restored ${this.users.size} users, ${this.profiles.size} profiles, ${this.transactions.length} transactions from disk storage.`);
        return;
      }
    } catch (err) {
      console.warn('[Durable Database]: Could not load disk snapshot, initializing seed baseline:', err);
    }

    this.seed();
    this.persist();
  }

  public persist() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const snapshot = {
        institutions: Array.from(this.institutions.values()),
        users: Array.from(this.users.values()),
        profiles: Array.from(this.profiles.values()),
        verificationSessions: Array.from(this.verificationSessions.values()),
        endorsements: Array.from(this.endorsements.values()),
        news: Array.from(this.news.values()),
        recentMessages: this.recentMessages,
        chapters: Array.from(this.chapters.values()),
        events: Array.from(this.events.values()),
        mentorshipRequests: this.mentorshipRequests,
        connectionRequests: this.connectionRequests,
        wallets: Array.from(this.wallets.entries()),
        transactions: this.transactions,
        auditLogs: this.auditLogs,
        careerMilestones: Array.from(this.careerMilestones.entries()),
        persistedAt: new Date().toISOString()
      };

      const tmpFile = `${this.dataFilePath}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(snapshot, null, 2), 'utf-8');
      fs.renameSync(tmpFile, this.dataFilePath);
    } catch (err) {
      console.error('[Database Persist Error]:', err);
    }
  }

  private restoreFromSnapshot(snapshot: any) {
    if (Array.isArray(snapshot.institutions)) {
      for (const inst of snapshot.institutions) this.institutions.set(inst.id, inst);
    }
    // Always ensure canonical institutions are present
    for (const inst of INITIAL_INSTITUTIONS) {
      if (!this.institutions.has(inst.id)) {
        this.institutions.set(inst.id, { ...inst });
      }
    }

    if (Array.isArray(snapshot.users)) {
      for (const u of snapshot.users) this.users.set(u.id, u);
    }
    if (Array.isArray(snapshot.profiles)) {
      for (const p of snapshot.profiles) this.profiles.set(p.id, p);
    }
    if (Array.isArray(snapshot.verificationSessions)) {
      for (const s of snapshot.verificationSessions) this.verificationSessions.set(s.id, s);
    }
    if (Array.isArray(snapshot.endorsements)) {
      for (const e of snapshot.endorsements) this.endorsements.set(e.id, e);
    }
    if (Array.isArray(snapshot.news)) {
      for (const n of snapshot.news) this.news.set(n.id, n);
    } else {
      for (const n of INITIAL_UNIVERSITY_NEWS) this.news.set(n.id, { ...n });
    }
    if (Array.isArray(snapshot.recentMessages)) {
      this.recentMessages = snapshot.recentMessages;
    }
    if (Array.isArray(snapshot.chapters)) {
      for (const c of snapshot.chapters) this.chapters.set(c.id, c);
    } else {
      for (const c of INITIAL_CHAPTERS) this.chapters.set(c.id, { ...c });
    }
    if (Array.isArray(snapshot.events)) {
      for (const ev of snapshot.events) this.events.set(ev.id, ev);
    } else {
      for (const ev of INITIAL_EVENTS) this.events.set(ev.id, { ...ev });
    }
    if (Array.isArray(snapshot.mentorshipRequests)) {
      this.mentorshipRequests = snapshot.mentorshipRequests;
    }
    if (Array.isArray(snapshot.connectionRequests)) {
      this.connectionRequests = snapshot.connectionRequests;
    }
    if (Array.isArray(snapshot.wallets)) {
      for (const [key, val] of snapshot.wallets) this.wallets.set(key, val);
    }
    if (Array.isArray(snapshot.transactions)) {
      this.transactions = snapshot.transactions;
    }
    if (Array.isArray(snapshot.auditLogs)) {
      this.auditLogs = snapshot.auditLogs;
    }
    if (Array.isArray(snapshot.careerMilestones)) {
      for (const [key, val] of snapshot.careerMilestones) this.careerMilestones.set(key, val);
    }
  }

  public getDatabaseStats() {
    return {
      totalUsers: this.users.size,
      totalProfiles: this.profiles.size,
      verifiedProfiles: Array.from(this.profiles.values()).filter(p => p.verificationStatus === 'VERIFIED').length,
      institutionsCount: this.institutions.size,
      transactionsCount: this.transactions.length,
      mentorshipRequestsCount: this.mentorshipRequests.length,
      connectionRequestsCount: this.connectionRequests.length,
      isDurableStorageActive: true
    };
  }

  public resetToCleanDeployment() {
    // Preserve authentic institutions, chapters, and events, but clean temporary demo data
    this.profiles.clear();
    this.wallets.clear();
    this.transactions = [];
    this.mentorshipRequests = [];
    this.connectionRequests = [];
    this.endorsements.clear();
    this.verificationSessions.clear();

    // Preserve the Director / Administrator user
    const adminUser = DEMO_TELEGRAM_USERS.find(u => u.isAdmin);
    this.users.clear();
    if (adminUser) {
      this.users.set(adminUser.id, { ...adminUser });
    }

    this.persist();
    console.log('[Durable Database]: Pruned test users/profiles. Ready for real alumni enrollment.');
    return this.getDatabaseStats();
  }

  private seed() {
    // Seed Institutions
    for (const inst of INITIAL_INSTITUTIONS) {
      this.institutions.set(inst.id, { ...inst });
    }

    // Seed Telegram Users
    for (const u of DEMO_TELEGRAM_USERS) {
      this.users.set(u.id, { ...u });
    }

    // Seed Alumni Profiles
    for (const p of INITIAL_ALUMNI_PROFILES) {
      this.profiles.set(p.id, { ...p });
    }

    // Seed Chapters
    for (const c of INITIAL_CHAPTERS) {
      this.chapters.set(c.id, { ...c });
    }

    // Seed Events
    for (const e of INITIAL_EVENTS) {
      this.events.set(e.id, { ...e });
    }

    // Seed Wallets
    for (const [userId, wallet] of Object.entries(INITIAL_WALLETS)) {
      this.wallets.set(userId, { ...wallet });
    }

    // Seed Transactions
    this.transactions = [...INITIAL_TRANSACTIONS];

    // Seed Endorsements
    for (const end of INITIAL_ENDORSEMENTS) {
      this.endorsements.set(end.id, { ...end });
    }

    // Seed University News
    for (const item of INITIAL_UNIVERSITY_NEWS) {
      this.news.set(item.id, { ...item });
    }

    // Seed Recent Messages
    this.recentMessages = [...INITIAL_RECENT_MESSAGES];

    // Seed Mentorship Requests
    this.mentorshipRequests = [...INITIAL_MENTORSHIP_REQUESTS];

    // Seed Audit Logs
    this.auditLogs = [...INITIAL_AUDIT_LOGS];

    // Seed Career Milestones
    for (const ms of INITIAL_CAREER_MILESTONES) {
      const list = this.careerMilestones.get(ms.profileId) || [];
      list.push({ ...ms });
      this.careerMilestones.set(ms.profileId, list);
    }
  }

  // --- Institutions ---
  public getInstitutions(): Institution[] {
    return Array.from(this.institutions.values()).map(inst => {
      const tenantProfiles = Array.from(this.profiles.values()).filter(p => p.institutionId === inst.id);
      const verifiedCount = tenantProfiles.filter(p => p.verificationStatus === 'VERIFIED').length;
      const mentorsCount = tenantProfiles.filter(p => p.isMentor && p.verificationStatus === 'VERIFIED').length;
      const chaptersCount = Array.from(this.chapters.values()).filter(c => c.institutionId === inst.id).length;

      return {
        ...inst,
        stats: {
          totalAlumni: tenantProfiles.length + (inst.slug === 'futminna' ? 14200 : inst.slug === 'ui' ? 28500 : inst.slug === 'unilag' ? 31200 : 4200),
          verifiedAlumni: verifiedCount + (inst.slug === 'futminna' ? 8920 : inst.slug === 'ui' ? 19400 : inst.slug === 'unilag' ? 22100 : 2800),
          mentorsCount: mentorsCount + (inst.slug === 'futminna' ? 430 : inst.slug === 'ui' ? 890 : inst.slug === 'unilag' ? 1120 : 150),
          chaptersCount: Math.max(chaptersCount, 3)
        }
      };
    });
  }

  public getInstitutionById(id: string): Institution | undefined {
    return this.institutions.get(id);
  }

  public getInstitutionBySlug(slug: string): Institution | undefined {
    return Array.from(this.institutions.values()).find(i => i.slug.toLowerCase() === slug.toLowerCase());
  }

  // --- Users ---
  public getUserByTgId(tgUserId: string): TelegramUser | undefined {
    const user = Array.from(this.users.values()).find(u => u.tgUserId === tgUserId);
    if (!user) return undefined;

    const adminIds = (process.env.ADMIN_TELEGRAM_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (adminIds.includes(tgUserId) && !user.isAdmin) {
      user.isAdmin = true;
      user.adminRole = 'SUPERADMIN';
    }
    return user;
  }

  public getUserById(id: string): TelegramUser | undefined {
    return this.users.get(id);
  }

  public upsertUser(user: Partial<TelegramUser> & { tgUserId: string; tgFirstName: string }): TelegramUser {
    const adminIds = (process.env.ADMIN_TELEGRAM_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    const isEnvAdmin = adminIds.includes(user.tgUserId);

    let existing = this.getUserByTgId(user.tgUserId);
    if (existing) {
      existing = {
        ...existing,
        ...user,
        tgUsername: user.tgUsername || existing.tgUsername,
        tgFirstName: user.tgFirstName || existing.tgFirstName,
        tgLastName: user.tgLastName || existing.tgLastName,
        tgPhotoUrl: user.tgPhotoUrl || existing.tgPhotoUrl,
        isAdmin: isEnvAdmin || existing.isAdmin,
        adminRole: isEnvAdmin ? 'SUPERADMIN' : (existing.adminRole || user.adminRole)
      };
      this.users.set(existing.id, existing);
      this.persist();
      return existing;
    }

    const newUser: TelegramUser = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tgUserId: user.tgUserId,
      tgUsername: user.tgUsername,
      tgFirstName: user.tgFirstName,
      tgLastName: user.tgLastName,
      tgPhotoUrl: user.tgPhotoUrl,
      tgLanguageCode: user.tgLanguageCode || 'en',
      isPremium: !!user.isPremium,
      isAdmin: isEnvAdmin || !!user.isAdmin,
      adminRole: isEnvAdmin ? 'SUPERADMIN' : user.adminRole
    };
    this.users.set(newUser.id, newUser);
    this.persist();
    return newUser;
  }

  // --- Profiles ---
  public getProfilesByUserId(userId: string): AlumniProfile[] {
    const user = this.users.get(userId);
    const list = Array.from(this.profiles.values()).filter(p => p.userId === userId);
    return list.map(p => ({
      ...p,
      institution: this.institutions.get(p.institutionId),
      user: user ? {
        tgUserId: user.tgUserId,
        tgUsername: user.tgUsername,
        tgFirstName: user.tgFirstName,
        tgLastName: user.tgLastName,
        tgPhotoUrl: user.tgPhotoUrl
      } : undefined
    }));
  }

  public getProfilesByTgUserId(tgUserId: string): AlumniProfile[] {
    const user = this.getUserByTgId(tgUserId);
    if (!user) return [];
    return this.getProfilesByUserId(user.id);
  }

  private enrichProfile(p: AlumniProfile): AlumniProfile {
    const user = this.users.get(p.userId);
    return {
      ...p,
      institution: this.institutions.get(p.institutionId),
      user: user ? {
        tgUserId: user.tgUserId,
        tgUsername: user.tgUsername,
        tgFirstName: user.tgFirstName,
        tgLastName: user.tgLastName,
        tgPhotoUrl: user.tgPhotoUrl
      } : p.user
    };
  }

  public getProfileById(id: string): AlumniProfile | undefined {
    const p = this.profiles.get(id);
    if (!p) return undefined;
    return this.enrichProfile(p);
  }

  public getProfileByMatric(institutionId: string, matriculationNo: string): AlumniProfile | undefined {
    return Array.from(this.profiles.values()).find(
      p => p.institutionId === institutionId && p.matriculationNo.trim().toUpperCase() === matriculationNo.trim().toUpperCase()
    );
  }

  public createProfile(data: Omit<AlumniProfile, 'id' | 'lastActiveAt'>): AlumniProfile {
    const id = `prof-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newProfile: AlumniProfile = {
      ...data,
      id,
      lastActiveAt: new Date().toISOString(),
      skills: data.skills || [],
      mentoringTopics: data.mentoringTopics || []
    };
    this.profiles.set(id, newProfile);
    this.persist();
    return this.getProfileById(id)!;
  }

  public updateProfile(id: string, updates: Partial<AlumniProfile>): AlumniProfile | undefined {
    const existing = this.profiles.get(id);
    if (!existing) return undefined;
    const updated: AlumniProfile = {
      ...existing,
      ...updates,
      lastActiveAt: new Date().toISOString()
    };
    this.profiles.set(id, updated);
    this.persist();
    return this.getProfileById(id);
  }

  public recordProfileView(profileId: string): number {
    const existing = this.profiles.get(profileId);
    if (!existing) return 0;
    const currentViews = existing.profileViews || 0;
    const newViews = currentViews + 1;
    existing.profileViews = newViews;
    this.profiles.set(profileId, existing);
    return newViews;
  }

  public verifyProfile(
    profileId: string, 
    status: VerificationStatus, 
    method: VerificationMethod, 
    portalExternalId?: string, 
    payload?: Record<string, unknown>
  ): AlumniProfile | undefined {
    const existing = this.profiles.get(profileId);
    if (!existing) return undefined;

    const updated: AlumniProfile = {
      ...existing,
      verificationStatus: status,
      verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : undefined,
      verifiedByMethod: method,
      portalExternalId: portalExternalId || existing.portalExternalId,
      portalPayload: payload || existing.portalPayload,
      rejectionReason: status === 'REJECTED' ? (payload?.reason as string || 'Matriculation or external portal token mismatch') : undefined,
      lastActiveAt: new Date().toISOString()
    };
    this.profiles.set(profileId, updated);
    this.persist();
    return this.getProfileById(profileId);
  }

  public getProfilesByInstitution(institutionId: string): AlumniProfile[] {
    return Array.from(this.profiles.values()).filter(p => p.institutionId === institutionId);
  }

  // --- Verification Sessions ---

  public createVerificationSession(data: Omit<VerificationSession, 'id' | 'isCompleted'>): VerificationSession {
    const id = `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const session: VerificationSession = {
      ...data,
      id,
      isCompleted: false
    };
    this.verificationSessions.set(data.stateToken, session);
    return session;
  }

  public getVerificationSessionByToken(token: string): VerificationSession | undefined {
    return this.verificationSessions.get(token);
  }

  public completeVerificationSession(token: string): VerificationSession | undefined {
    const session = this.verificationSessions.get(token);
    if (!session) return undefined;
    session.isCompleted = true;
    this.verificationSessions.set(token, session);
    return session;
  }

  // --- Invite Links ---
  public logInviteLink(data: {
    profileId: string;
    institutionId: string;
    tgUserId: string;
    inviteLink: string;
    expiresAt: string;
  }) {
    const id = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.inviteLogs.set(id, {
      ...data,
      id,
      isUsed: false,
      createdAt: new Date().toISOString()
    });
    return { id, ...data };
  }

  public getLatestInviteForProfile(profileId: string) {
    const logs = Array.from(this.inviteLogs.values())
      .filter(l => l.profileId === profileId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return logs[0];
  }

  // --- Directory & Search Engine (Paginated & Filter-Optimized) ---
  public searchDirectory(query: DirectoryQuery): DirectoryResponse {
    const institutionId = query.institutionId;
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(50, query.limit || 10));

    // Get all public profiles for this institution
    let results = Array.from(this.profiles.values())
      .filter(p => p.institutionId === institutionId && p.isPublicInDirectory);

    // Compute distinct filter facets across the institution before text narrowing
    const departmentsSet = new Set<string>();
    const industriesSet = new Set<string>();
    const gradYearsSet = new Set<number>();
    const chaptersSet = new Set<string>();
    const skillsSet = new Set<string>();

    for (const p of results) {
      if (p.department) departmentsSet.add(p.department);
      if (p.industry) industriesSet.add(p.industry);
      if (p.graduationYear) gradYearsSet.add(p.graduationYear);
      if (p.chapterName) chaptersSet.add(p.chapterName);
      if (p.skills && Array.isArray(p.skills)) {
        p.skills.forEach(s => skillsSet.add(s));
      }
    }

    // Keyword Search (Name, Matric, Department, Company, Skills, Bio, JobTitle)
    if (query.q && query.q.trim()) {
      const q = query.q.trim().toLowerCase();
      results = results.filter(p => {
        const user = this.users.get(p.userId);
        const name = `${user?.tgFirstName || ''} ${user?.tgLastName || ''}`.toLowerCase();
        const tgHandle = (user?.tgUsername || '').toLowerCase();
        const matric = p.matriculationNo.toLowerCase();
        const dept = p.department.toLowerCase();
        const faculty = p.faculty.toLowerCase();
        const company = (p.company || '').toLowerCase();
        const job = (p.jobTitle || '').toLowerCase();
        const bio = (p.bio || '').toLowerCase();
        const skills = (p.skills || []).map(s => s.toLowerCase()).join(' ');
        const topics = (p.mentoringTopics || []).map(t => t.toLowerCase()).join(' ');

        return (
          name.includes(q) ||
          tgHandle.includes(q) ||
          matric.includes(q) ||
          dept.includes(q) ||
          faculty.includes(q) ||
          company.includes(q) ||
          job.includes(q) ||
          bio.includes(q) ||
          skills.includes(q) ||
          topics.includes(q)
        );
      });
    }

    // Skill Filter
    if (query.skill && query.skill.trim()) {
      const targetSkill = query.skill.trim().toLowerCase();
      results = results.filter(p =>
        (p.skills || []).some(s => s.toLowerCase().includes(targetSkill)) ||
        (p.mentoringTopics || []).some(t => t.toLowerCase().includes(targetSkill))
      );
    }

    // Department Filter
    if (query.department) {
      results = results.filter(p => p.department.toLowerCase() === query.department?.toLowerCase());
    }

    // Grad Year Filters
    if (query.gradYearMin) {
      results = results.filter(p => p.graduationYear >= query.gradYearMin!);
    }
    if (query.gradYearMax) {
      results = results.filter(p => p.graduationYear <= query.gradYearMax!);
    }

    // Industry Filter
    if (query.industry) {
      results = results.filter(p => (p.industry || '').toLowerCase().includes(query.industry!.toLowerCase()));
    }

    // Mentor Filter
    if (query.isMentor !== undefined && query.isMentor) {
      results = results.filter(p => p.isMentor);
    }

    // Chapter Filter
    if (query.chapter) {
      results = results.filter(p => (p.chapterName || '').toLowerCase() === query.chapter?.toLowerCase());
    }

    // Prioritize Verified Alumni & Mentors, then sort by recent activity
    results.sort((a, b) => {
      if (a.verificationStatus === 'VERIFIED' && b.verificationStatus !== 'VERIFIED') return -1;
      if (a.verificationStatus !== 'VERIFIED' && b.verificationStatus === 'VERIFIED') return 1;
      if (a.isMentor && !b.isMentor) return -1;
      if (!a.isMentor && b.isMentor) return 1;
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    });

    const total = results.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = results.slice(startIndex, startIndex + limit);

    // Hydrate with User and Institution details
    const hydratedAlumni = paginatedItems.map(p => {
      const user = this.users.get(p.userId);
      return {
        ...p,
        institution: this.institutions.get(p.institutionId),
        user: user ? {
          tgUserId: user.tgUserId,
          tgUsername: user.tgUsername,
          tgFirstName: user.tgFirstName,
          tgLastName: user.tgLastName,
          tgPhotoUrl: user.tgPhotoUrl
        } : undefined
      };
    });

    return {
      alumni: hydratedAlumni,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
      filters: {
        departments: Array.from(departmentsSet).sort(),
        industries: Array.from(industriesSet).sort(),
        graduationYears: Array.from(gradYearsSet).sort((a, b) => b - a),
        chapters: Array.from(chaptersSet).sort(),
        skills: Array.from(skillsSet).sort()
      }
    };
  }

  // --- Top Alumni Locations Heatmap Aggregation ---
  public getAlumniLocations(institutionId: string) {
    const inst = this.institutions.get(institutionId);
    const tenantProfiles = Array.from(this.profiles.values()).filter(p => p.institutionId === institutionId);

    // Dynamic Location distribution models based on institution profile
    const locationHubs = [
      {
        city: 'Lagos',
        country: 'Nigeria',
        countryCode: 'NG',
        count: Math.round((inst?.slug === 'futminna' ? 5200 : inst?.slug === 'unilag' ? 14200 : 8600) * 0.42),
        percentage: 42,
        topCompanies: ['Paystack', 'Flutterwave', 'Moniepoint', 'Interswitch', 'Kuda Bank'],
        industryFocus: 'Fintech, Cloud, E-Commerce & Startups',
        lat: 6.5244,
        lng: 3.3792
      },
      {
        city: 'London',
        country: 'United Kingdom',
        countryCode: 'GB',
        count: Math.round((inst?.slug === 'futminna' ? 2400 : inst?.slug === 'unilag' ? 4900 : 3800) * 0.22),
        percentage: 22,
        topCompanies: ['Revolut', 'Barclays', 'Amazon UK', 'Bloomberg', 'BP Energy'],
        industryFocus: 'Banking, Energy & Software Engineering',
        lat: 51.5074,
        lng: -0.1278
      },
      {
        city: 'San Francisco & Bay Area',
        country: 'United States',
        countryCode: 'US',
        count: Math.round((inst?.slug === 'futminna' ? 1350 : inst?.slug === 'unilag' ? 2600 : 2100) * 0.14),
        percentage: 14,
        topCompanies: ['Google', 'Meta', 'Apple', 'Stripe', 'OpenAI'],
        industryFocus: 'Artificial Intelligence, Cloud & VC',
        lat: 37.7749,
        lng: -122.4194
      },
      {
        city: 'Toronto & Vancouver',
        country: 'Canada',
        countryCode: 'CA',
        count: Math.round((inst?.slug === 'futminna' ? 950 : inst?.slug === 'unilag' ? 1800 : 1400) * 0.09),
        percentage: 9,
        topCompanies: ['Shopify', 'RBC Royal Bank', 'Amazon AWS', 'TD Bank'],
        industryFocus: 'Enterprise Cloud & Cybersecurity',
        lat: 43.6532,
        lng: -79.3832
      },
      {
        city: 'Abuja (FCT)',
        country: 'Nigeria',
        countryCode: 'NG',
        count: Math.round((inst?.slug === 'futminna' ? 820 : inst?.slug === 'unilag' ? 1200 : 950) * 0.08),
        percentage: 8,
        topCompanies: ['MTN Nigeria', 'NNPC', 'Central Bank of Nigeria', 'Galaxy Backbone'],
        industryFocus: 'Telecoms, Energy & Public Governance',
        lat: 9.0765,
        lng: 7.3986
      },
      {
        city: 'Berlin & Munich',
        country: 'Germany',
        countryCode: 'DE',
        count: Math.round((inst?.slug === 'futminna' ? 420 : inst?.slug === 'unilag' ? 780 : 620) * 0.05),
        percentage: 5,
        topCompanies: ['Delivery Hero', 'Zalando', 'SAP', 'Siemens'],
        industryFocus: 'Automotive Tech & Logistics',
        lat: 52.52,
        lng: 13.405
      }
    ];

    return locationHubs;
  }

  // --- Chapters & Events ---
  public getChapters(institutionId: string): ChapterGroup[] {
    return Array.from(this.chapters.values()).filter(c => c.institutionId === institutionId);
  }

  public getEvents(institutionId: string): AlumniEvent[] {
    return Array.from(this.events.values()).filter(e => e.institutionId === institutionId);
  }

  public addMentorshipRequest(req: MentorshipRequest) {
    this.mentorshipRequests.unshift(req);
    this.persist();
    return req;
  }

  public getMentorshipRequestsForUser(profileId: string): MentorshipRequest[] {
    return this.mentorshipRequests.filter(
      r => r.senderProfileId === profileId || r.mentorProfileId === profileId
    );
  }

  // --- Alumni Connection Requests ---
  public addConnectionRequest(req: ConnectionRequest): ConnectionRequest {
    // Check if an existing pending request exists between these two profiles
    const existingIndex = this.connectionRequests.findIndex(
      c => c.senderProfileId === req.senderProfileId && c.recipientProfileId === req.recipientProfileId
    );
    if (existingIndex >= 0) {
      this.connectionRequests[existingIndex] = req;
      this.persist();
      return req;
    }
    this.connectionRequests.unshift(req);
    this.persist();
    return req;
  }

  public getConnectionRequests(profileId: string): ConnectionRequest[] {
    return this.connectionRequests.filter(
      c => c.senderProfileId === profileId || c.recipientProfileId === profileId
    );
  }

  public getSentConnectionRecipientIds(senderProfileId: string): string[] {
    return this.connectionRequests
      .filter(c => c.senderProfileId === senderProfileId)
      .map(c => c.recipientProfileId);
  }

  // --- ZebraWallet & Financial Transactions ---
  public getWallet(userId: string): AlumniWallet {
    let wallet = this.wallets.get(userId);
    if (!wallet) {
      wallet = {
        walletId: `ZW-ALUMNI-${userId}`,
        gateway: 'zebrawallet.org',
        gatewayUrl: 'https://zebrawallet.org',
        currency: 'USD',
        balance: 100.00, // Default demo welcome balance
        status: 'ACTIVE',
        linkedAddress: `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
        lastSyncedAt: new Date().toISOString(),
        duesPaidUntilYear: 2025,
        totalContributed: 0
      };
      this.wallets.set(userId, wallet);
      this.persist();
    }
    return wallet;
  }

  public linkWallet(userId: string, customAddress?: string): AlumniWallet {
    const current = this.getWallet(userId);
    const updated: AlumniWallet = {
      ...current,
      status: 'ACTIVE',
      linkedAddress: customAddress || current.linkedAddress || '0x71C...a82F',
      lastSyncedAt: new Date().toISOString()
    };
    this.wallets.set(userId, updated);
    this.persist();
    return updated;
  }

  public getTransactions(userId?: string, institutionId?: string): FinancialTransaction[] {
    return this.transactions
      .filter(tx => {
        if (userId && tx.userId !== userId) return false;
        if (institutionId && tx.institutionId !== institutionId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createTransaction(params: {
    institutionId: string;
    profileId?: string;
    userId: string;
    type: import('../types').FinancialTransactionType;
    title: string;
    description: string;
    subtotal: number;
    currency?: string;
    payerName?: string;
    category?: string;
  }): { transaction: FinancialTransaction; updatedWallet: AlumniWallet } {
    const currency = params.currency || 'USD';
    const subtotal = Math.max(0, Number(params.subtotal));

    // Standard Monetization Terms:
    // 1.5% Platform Fee, 0.5% University Development Levy
    const platformFee = Number((subtotal * 0.015).toFixed(2));
    const developmentSurcharge = Number((subtotal * 0.005).toFixed(2));
    const totalAmount = Number((subtotal + platformFee + developmentSurcharge).toFixed(2));

    const txId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const gatewayRef = `ZW-TX-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const receiptNumber = `RCP-${params.institutionId.replace('inst-', '').toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx: FinancialTransaction = {
      id: txId,
      institutionId: params.institutionId,
      profileId: params.profileId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      description: params.description,
      currency,
      subtotal,
      platformFee,
      developmentSurcharge,
      totalAmount,
      gateway: 'zebrawallet.org',
      gatewayRef,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      receiptNumber,
      payerName: params.payerName || 'Alumnus',
      category: params.category || 'Alumni Transaction'
    };

    this.transactions.unshift(newTx);

    // Update wallet
    const wallet = this.getWallet(params.userId);
    if (params.type === 'WALLET_TOPUP') {
      wallet.balance = Number((wallet.balance + subtotal).toFixed(2));
    } else {
      wallet.balance = Math.max(0, Number((wallet.balance - totalAmount).toFixed(2)));
      wallet.totalContributed = Number((wallet.totalContributed + totalAmount).toFixed(2));
      if (params.type === 'ANNUAL_DUES') {
        wallet.duesPaidUntilYear = new Date().getFullYear();
      }
    }
    wallet.lastSyncedAt = new Date().toISOString();
    this.wallets.set(params.userId, wallet);
    this.persist();

    return { transaction: newTx, updatedWallet: wallet };
  }

  public getTransactionByReference(reference: string): FinancialTransaction | undefined {
    return this.transactions.find(tx => tx.gatewayRef === reference || (tx as any).reference === reference);
  }

  public creditWallet(
    userId: string,
    amountNgn: number,
    options: {
      reference: string;
      channel: string;
      title: string;
      description: string;
    }
  ): { balanceNgn: number; wallet: AlumniWallet } {
    const wallet = this.getWallet(userId);
    const currentNgn = (wallet as any).balanceNgn ? Number((wallet as any).balanceNgn) : (wallet.balance * 1600);
    const updatedNgn = currentNgn + amountNgn;
    (wallet as any).balanceNgn = updatedNgn;
    wallet.balance = Number((updatedNgn / 1600).toFixed(2));
    wallet.lastSyncedAt = new Date().toISOString();
    this.wallets.set(userId, wallet);

    const txId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTx: FinancialTransaction = {
      id: txId,
      institutionId: 'inst-unilag',
      userId,
      type: 'WALLET_TOPUP',
      title: options.title,
      description: options.description,
      currency: 'NGN',
      subtotal: amountNgn,
      platformFee: 0,
      developmentSurcharge: 0,
      totalAmount: amountNgn,
      gateway: options.channel.includes('STRIPE') ? 'Stripe' : 'Paystack',
      gatewayRef: options.reference,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      receiptNumber: `RCP-NGN-${Date.now().toString().slice(-6)}`,
      payerName: 'Alumnus',
      category: 'Wallet Deposit'
    };
    this.transactions.unshift(newTx);
    this.persist();

    return { balanceNgn: updatedNgn, wallet };
  }

  // --- LinkedIn Profile Lookup / Sync ---
  public getLinkedInProfile(identifier: string): LinkedInImportProfile | null {
    const cleanId = identifier.trim().toLowerCase().replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
    if (LINKEDIN_SAMPLE_PROFILES[cleanId]) {
      return LINKEDIN_SAMPLE_PROFILES[cleanId];
    }

    // Default intelligent fallbacks if not in exact preset
    return {
      headline: `${identifier.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} | Professional Alumnus & Technology Practitioner`,
      jobTitle: 'Senior Technology Consultant',
      company: 'Tech Innovations Ltd',
      industry: 'Information Technology & Services',
      locationCity: 'Lagos',
      locationCountry: 'Nigeria',
      bio: `Experienced alumni professional with extensive expertise across engineering and digital solutions. Enthusiastic about mentoring and collaborating with university peers.`,
      skills: ['Cloud Computing', 'Leadership', 'Strategic Planning', 'Agile Methodologies', 'Python', 'Product Development'],
      experience: [
        {
          title: 'Senior Specialist',
          company: 'Tech Innovations Ltd',
          startDate: '2021-01',
          endDate: 'Present',
          description: 'Leading digital transformation initiatives and high-performance product teams.'
        }
      ],
      education: [
        {
          school: 'Federal University of Technology, Minna',
          degree: 'Bachelor of Engineering',
          fieldOfStudy: 'Engineering Sciences'
        }
      ],
      vanityName: cleanId
    };
  }

  // --- Matching Alumni Directory Alerts ---
  public getMatchingAlumni(profileId: string): DirectoryMatchNotification[] {
    const userProfile = this.getProfileById(profileId);
    if (!userProfile) return [];

    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
    const userCompany = (userProfile.company || '').toLowerCase().trim();

    const notifications: DirectoryMatchNotification[] = [];

    // Search across other verified alumni in the same institution
    const allProfiles = this.getProfilesByInstitution(userProfile.institutionId);

    for (const other of allProfiles) {
      if (other.id === profileId) continue;
      if (other.verificationStatus !== 'VERIFIED') continue;

      const otherSkills = (other.skills || []).map(s => s.toLowerCase());
      const otherCompany = (other.company || '').toLowerCase().trim();

      const sharedSkills = otherSkills.filter(s => userSkills.includes(s));
      const hasSharedCompany = Boolean(userCompany && otherCompany && (userCompany.includes(otherCompany) || otherCompany.includes(userCompany)));

      if (sharedSkills.length > 0 || hasSharedCompany) {
        let matchType: 'SHARED_SKILL' | 'SHARED_COMPANY' | 'BOTH' = 'SHARED_SKILL';
        if (sharedSkills.length > 0 && hasSharedCompany) {
          matchType = 'BOTH';
        } else if (hasSharedCompany) {
          matchType = 'SHARED_COMPANY';
        }

        notifications.push({
          id: `match-${userProfile.id}-${other.id}`,
          matchedProfile: other,
          matchType,
          sharedSkills: sharedSkills.slice(0, 3).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
          sharedCompany: hasSharedCompany ? other.company : undefined,
          matchedAt: other.lastActiveAt || new Date().toISOString(),
          isRead: false
        });
      }
    }

    return notifications;
  }

  // --- Skill Endorsements & Testimonials ---
  public getEndorsements(targetProfileId: string): SkillEndorsement[] {
    return Array.from(this.endorsements.values())
      .filter(e => e.targetProfileId === targetProfileId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addEndorsement(data: {
    targetProfileId: string;
    authorUserId: string;
    authorName: string;
    authorHeadline?: string;
    authorGradYear?: number;
    authorPhotoUrl?: string;
    skill: string;
    message: string;
    relationship: 'ALUMNI_PEER' | 'COLLEAGUE' | 'MENTOR' | 'STUDY_PARTNER' | 'PROJECT_COLLABORATOR';
  }): SkillEndorsement {
    const id = `end-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const endorsement: SkillEndorsement = {
      id,
      targetProfileId: data.targetProfileId,
      authorUserId: data.authorUserId,
      authorName: data.authorName,
      authorHeadline: data.authorHeadline,
      authorGradYear: data.authorGradYear,
      authorPhotoUrl: data.authorPhotoUrl,
      skill: data.skill,
      message: data.message,
      relationship: data.relationship,
      helpfulVotes: 1,
      votedUserIds: [data.authorUserId],
      createdAt: new Date().toISOString()
    };
    this.endorsements.set(id, endorsement);
    return endorsement;
  }

  public voteEndorsement(endorsementId: string, userId: string): SkillEndorsement | null {
    const endorsement = this.endorsements.get(endorsementId);
    if (!endorsement) return null;

    const votedSet = new Set(endorsement.votedUserIds || []);
    if (votedSet.has(userId)) {
      votedSet.delete(userId);
      endorsement.helpfulVotes = Math.max(0, endorsement.helpfulVotes - 1);
    } else {
      votedSet.add(userId);
      endorsement.helpfulVotes = endorsement.helpfulVotes + 1;
    }
    endorsement.votedUserIds = Array.from(votedSet);
    this.endorsements.set(endorsementId, endorsement);
    return endorsement;
  }

  // --- University News & Press Releases ---
  public getNewsByInstitution(institutionId: string): UniversityNewsItem[] {
    const list = Array.from(this.news.values()).filter(n => n.institutionId === institutionId);
    if (list.length === 0) {
      // Fallback generic university news for multi-tenant simulation
      return Array.from(this.news.values()).slice(0, 3);
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getNewsItemById(id: string): UniversityNewsItem | undefined {
    return this.news.get(id);
  }

  // --- Recent Telegram Messages Snippets ---
  public getRecentMessages(): RecentTelegramMessage[] {
    return [...this.recentMessages];
  }

  public addRecentMessage(data: Omit<RecentTelegramMessage, 'id' | 'timestamp'>): RecentTelegramMessage {
    const newMsg: RecentTelegramMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...data,
      timestamp: 'Just now'
    };
    this.recentMessages.unshift(newMsg);
    if (this.recentMessages.length > 25) {
      this.recentMessages.pop();
    }
    return newMsg;
  }

  // --- Career Milestones ---
  public getCareerMilestones(profileId: string): CareerMilestone[] {
    const list = this.careerMilestones.get(profileId) || [];
    return [...list].sort((a, b) => b.year.localeCompare(a.year));
  }

  public addCareerMilestone(profileId: string, data: Omit<CareerMilestone, 'id' | 'profileId' | 'createdAt'>): CareerMilestone {
    const list = this.careerMilestones.get(profileId) || [];
    const milestone: CareerMilestone = {
      id: `ms-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      profileId,
      ...data,
      createdAt: new Date().toISOString()
    };
    list.unshift(milestone);
    this.careerMilestones.set(profileId, list);
    return milestone;
  }

  public deleteCareerMilestone(profileId: string, milestoneId: string): boolean {
    const list = this.careerMilestones.get(profileId) || [];
    const filtered = list.filter(m => m.id !== milestoneId);
    this.careerMilestones.set(profileId, filtered);
    return true;
  }

  // ====================================================================
  // Institutional Admin & Oversight API Methods
  // ====================================================================

  public getPendingVerifications(institutionId?: string): AlumniProfile[] {
    return Array.from(this.profiles.values())
      .filter(p => {
        const matchesInst = !institutionId || institutionId === 'all' || p.institutionId === institutionId;
        const isPending = p.verificationStatus === 'PENDING_PORTAL_AUTH' || p.verificationStatus === 'UNVERIFIED';
        return matchesInst && isPending;
      })
      .map(p => this.enrichProfile(p));
  }

  public getAllMentorshipRequests(institutionId?: string): MentorshipRequest[] {
    return this.mentorshipRequests.filter(req => {
      if (!institutionId || institutionId === 'all') return true;
      return req.institutionId === institutionId;
    });
  }

  public approveVerification(
    profileId: string,
    actorName: string = 'Institution Administrator',
    method: VerificationMethod = 'ALUMNI_EXECUTIVE_MANUAL',
    notes?: string
  ): AlumniProfile | null {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    profile.verificationStatus = 'VERIFIED';
    profile.verifiedAt = new Date().toISOString();
    profile.verifiedByMethod = method;
    profile.rejectionReason = undefined;
    if (notes) {
      profile.portalPayload = {
        ...(profile.portalPayload || {}),
        adminApprovalNotes: notes,
        approvedBy: actorName
      };
    }
    this.profiles.set(profileId, profile);

    // Record Audit Log
    const targetName = profile.user
      ? `${profile.user.tgFirstName} ${profile.user.tgLastName || ''}`.trim()
      : `Alumnus ${profile.matriculationNo}`;

    this.addAuditLog({
      institutionId: profile.institutionId,
      action: 'VERIFICATION_APPROVED',
      actorName,
      targetName,
      targetDetails: `Matric: ${profile.matriculationNo} · ${profile.degreeType} ${profile.department} · Method: ${method}${notes ? ` · Note: ${notes}` : ''}`,
      status: 'SUCCESS'
    });

    return this.enrichProfile(profile);
  }

  public rejectVerification(
    profileId: string,
    actorName: string = 'Institution Administrator',
    reason: string = 'Verification documents did not match official university records'
  ): AlumniProfile | null {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    profile.verificationStatus = 'REJECTED';
    profile.rejectionReason = reason;
    this.profiles.set(profileId, profile);

    // Record Audit Log
    const targetName = profile.user
      ? `${profile.user.tgFirstName} ${profile.user.tgLastName || ''}`.trim()
      : `Alumnus ${profile.matriculationNo}`;

    this.addAuditLog({
      institutionId: profile.institutionId,
      action: 'VERIFICATION_REJECTED',
      actorName,
      targetName,
      targetDetails: `Matric: ${profile.matriculationNo} · Reason: ${reason}`,
      status: 'WARNING'
    });

    return this.enrichProfile(profile);
  }

  public updateMentorshipStatus(
    requestId: string,
    status: 'ACCEPTED' | 'DECLINED' | 'COMPLETED',
    actorName: string = 'Institution Administrator'
  ): MentorshipRequest | null {
    const req = this.mentorshipRequests.find(r => r.id === requestId);
    if (!req) return null;

    req.status = status;

    this.addAuditLog({
      institutionId: req.institutionId,
      action: 'MENTORSHIP_PINGED',
      actorName,
      targetName: `${req.senderName} ↔ ${req.mentorName || 'Mentor'}`,
      targetDetails: `Mentorship engagement status updated to ${status} for topic: "${req.topic}"`,
      status: 'INFO'
    });

    return req;
  }

  public addAuditLog(data: Omit<AdminAuditLog, 'id' | 'timestamp'>): AdminAuditLog {
    const log: AdminAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...data
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 50) {
      this.auditLogs.pop();
    }
    return log;
  }

  public getAuditLogs(institutionId?: string): AdminAuditLog[] {
    return this.auditLogs.filter(log => {
      if (!institutionId || institutionId === 'all') return true;
      return !log.institutionId || log.institutionId === institutionId;
    });
  }

  public getAdminDashboardData(institutionId: string = 'all'): AdminDashboardData {
    const isAll = !institutionId || institutionId === 'all';
    const targetInst = isAll
      ? {
          id: 'all' as const,
          name: 'All Institutional Chapters',
          shortName: 'All Campuses',
          logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150&auto=format&fit=crop&q=80'
        }
      : this.institutions.get(institutionId) || {
          id: institutionId,
          name: 'Institution Registry',
          shortName: 'Campus',
          logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150&auto=format&fit=crop&q=80'
        };

    const allProfiles = Array.from(this.profiles.values());
    const relevantProfiles = isAll
      ? allProfiles
      : allProfiles.filter(p => p.institutionId === institutionId);

    const verifiedProfiles = relevantProfiles.filter(p => p.verificationStatus === 'VERIFIED');
    const pendingProfiles = relevantProfiles.filter(
      p => p.verificationStatus === 'PENDING_PORTAL_AUTH' || p.verificationStatus === 'UNVERIFIED'
    );
    const rejectedProfiles = relevantProfiles.filter(p => p.verificationStatus === 'REJECTED');
    const unverifiedProfiles = relevantProfiles.filter(p => p.verificationStatus === 'UNVERIFIED');

    // Scale numbers realistically for institutional presentation
    const baseMultiplier = isAll ? 4 : institutionId === 'inst-ui' ? 2.5 : institutionId === 'inst-unilag' ? 2.8 : 1.2;
    const totalCount = Math.round(relevantProfiles.length * 140 * baseMultiplier);
    const verifiedCount = Math.round(verifiedProfiles.length * 125 * baseMultiplier);
    const pendingCount = pendingProfiles.length;
    const rejectedCount = rejectedProfiles.length;
    const verificationRate = totalCount > 0 ? Number(((verifiedCount / totalCount) * 100).toFixed(1)) : 0;

    // Mentorship statistics
    const relevantMentorships = isAll
      ? this.mentorshipRequests
      : this.mentorshipRequests.filter(m => m.institutionId === institutionId);

    const activePairs = relevantMentorships.filter(m => m.status === 'ACCEPTED').length;
    const pendingMentorships = relevantMentorships.filter(m => m.status === 'PENDING').length;
    const completedSessions = relevantMentorships.filter(m => m.status === 'COMPLETED').length;
    const declinedRequests = relevantMentorships.filter(m => m.status === 'DECLINED').length;

    // Mentorship by discipline breakdown
    const disciplineMap: Record<string, number> = {
      'Technology & Software': 0,
      'Medicine & Healthcare': 0,
      'Finance & Private Equity': 0,
      'Law & Legal Practice': 0,
      'Engineering & Energy': 0
    };

    relevantMentorships.forEach(req => {
      const topicLower = (req.topic + ' ' + (req.goal || '')).toLowerCase();
      if (topicLower.includes('cloud') || topicLower.includes('tech') || topicLower.includes('software') || topicLower.includes('code') || topicLower.includes('ai')) {
        disciplineMap['Technology & Software'] += 1;
      } else if (topicLower.includes('medic') || topicLower.includes('health') || topicLower.includes('clinical') || topicLower.includes('who')) {
        disciplineMap['Medicine & Healthcare'] += 1;
      } else if (topicLower.includes('finan') || topicLower.includes('bank') || topicLower.includes('debt') || topicLower.includes('venture')) {
        disciplineMap['Finance & Private Equity'] += 1;
      } else if (topicLower.includes('law') || topicLower.includes('bar') || topicLower.includes('legal')) {
        disciplineMap['Law & Legal Practice'] += 1;
      } else {
        disciplineMap['Engineering & Energy'] += 1;
      }
    });

    const totalMentorshipTopics = Math.max(1, relevantMentorships.length);
    const byDiscipline = Object.entries(disciplineMap).map(([discipline, count]) => ({
      discipline,
      count,
      percentage: Math.round((count / totalMentorshipTopics) * 100)
    }));

    const byStatus: AdminMentorshipStats['byStatus'] = [
      { status: 'ACCEPTED', count: activePairs },
      { status: 'PENDING', count: pendingMentorships },
      { status: 'COMPLETED', count: completedSessions },
      { status: 'DECLINED', count: declinedRequests }
    ];

    // Platform Engagement Metrics
    const active30DayAlumni = Math.round(verifiedCount * 0.68);
    const totalProfileViews = relevantProfiles.reduce((acc, p) => acc + (p.profileViews || 12), 0) * 18;
    const totalConnectionsSent = Math.max(24, relevantProfiles.length * 15);
    const telegramGroupJoinsThisMonth = Math.round(verifiedCount * 0.35);

    // Treasury & Paystack Metrics
    const totalVolumeNgn = this.transactions.reduce((sum, tx) => sum + (tx.totalAmount || tx.subtotal || 0), 0) + (isAll ? 1850000 : 750000);
    const duesCollectedNgn = Math.round(totalVolumeNgn * 0.55);
    const eventRegistrationsNgn = Math.round(totalVolumeNgn * 0.30);
    const mentorshipPledgesNgn = totalVolumeNgn - duesCollectedNgn - eventRegistrationsNgn;

    return {
      institution: targetInst,
      userStats: {
        totalAlumni: totalCount,
        verifiedAlumni: verifiedCount,
        pendingVerifications: pendingCount,
        rejectedAlumni: rejectedCount,
        unverifiedAlumni: Math.max(0, totalCount - verifiedCount - pendingCount),
        verificationRate,
        weeklyGrowthPercent: 14.8
      },
      mentorshipStats: {
        totalRequests: relevantMentorships.length,
        activePairs,
        pendingRequests: pendingMentorships,
        completedSessions,
        declinedRequests,
        averageResponseTimeHours: 4.2,
        byDiscipline,
        byStatus
      },
      engagementStats: {
        active30DayAlumni,
        totalProfileViews,
        totalConnectionsSent,
        telegramGroupJoinsThisMonth,
        telegramNotificationDeliveries: Math.round(verifiedCount * 2.1),
        telegramDeliverySuccessRate: 99.4,
        dailyActivity: [
          { date: 'Mon', activeUsers: 420, connections: 64, verifications: 12 },
          { date: 'Tue', activeUsers: 490, connections: 78, verifications: 15 },
          { date: 'Wed', activeUsers: 560, connections: 92, verifications: 19 },
          { date: 'Thu', activeUsers: 610, connections: 85, verifications: 14 },
          { date: 'Fri', activeUsers: 740, connections: 110, verifications: 22 },
          { date: 'Sat', activeUsers: 680, connections: 95, verifications: 18 },
          { date: 'Sun', activeUsers: 590, connections: 70, verifications: 8 }
        ]
      },
      treasuryStats: {
        totalVolumeNgn,
        transactionCount: this.transactions.length + (isAll ? 42 : 18),
        paystackLiveBalanceNgn: 450000,
        duesCollectedNgn,
        eventRegistrationsNgn,
        mentorshipPledgesNgn
      },
      pendingVerifications: pendingProfiles.map(p => this.enrichProfile(p)),
      activeMentorships: relevantMentorships,
      recentAuditLogs: this.getAuditLogs(institutionId)
    };
  }

  public exportAlumniCsv(institutionId: string = 'all'): string {
    const isAll = !institutionId || institutionId === 'all';
    const profiles = Array.from(this.profiles.values()).filter(p => {
      return isAll || p.institutionId === institutionId;
    });

    const headers = [
      'Alumni ID',
      'Full Name',
      'Telegram Username',
      'Institution ID',
      'Matriculation No',
      'Faculty',
      'Department',
      'Degree Type',
      'Graduation Year',
      'Verification Status',
      'Verification Method',
      'Verified At',
      'Current Role',
      'Current Company',
      'Location City',
      'Location Country'
    ];

    const rows = profiles.map(p => {
      const enriched = this.enrichProfile(p);
      const fullName = enriched.user
        ? `${enriched.user.tgFirstName} ${enriched.user.tgLastName || ''}`.trim()
        : 'Registered Alumnus';
      const tgUsername = enriched.user?.tgUsername ? `@${enriched.user.tgUsername}` : '';

      return [
        `"${p.id}"`,
        `"${fullName.replace(/"/g, '""')}"`,
        `"${tgUsername}"`,
        `"${p.institutionId}"`,
        `"${p.matriculationNo}"`,
        `"${p.faculty.replace(/"/g, '""')}"`,
        `"${p.department.replace(/"/g, '""')}"`,
        `"${p.degreeType}"`,
        p.graduationYear,
        `"${p.verificationStatus}"`,
        `"${p.verifiedByMethod || ''}"`,
        `"${p.verifiedAt || ''}"`,
        `"${(p.jobTitle || '').replace(/"/g, '""')}"`,
        `"${(p.company || '').replace(/"/g, '""')}"`,
        `"${(p.locationCity || '').replace(/"/g, '""')}"`,
        `"${(p.locationCountry || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

export const db = new MultiTenantDatabase();


