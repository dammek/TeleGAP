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
  CareerMilestone
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
  INITIAL_CAREER_MILESTONES
} from './mockData';

class MultiTenantDatabase {
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


  constructor() {
    this.seed();
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
    return Array.from(this.users.values()).find(u => u.tgUserId === tgUserId);
  }

  public getUserById(id: string): TelegramUser | undefined {
    return this.users.get(id);
  }

  public upsertUser(user: Partial<TelegramUser> & { tgUserId: string; tgFirstName: string }): TelegramUser {
    let existing = this.getUserByTgId(user.tgUserId);
    if (existing) {
      existing = {
        ...existing,
        ...user,
        tgUsername: user.tgUsername || existing.tgUsername,
        tgFirstName: user.tgFirstName || existing.tgFirstName,
        tgLastName: user.tgLastName || existing.tgLastName,
        tgPhotoUrl: user.tgPhotoUrl || existing.tgPhotoUrl
      };
      this.users.set(existing.id, existing);
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
      isPremium: !!user.isPremium
    };
    this.users.set(newUser.id, newUser);
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

  public getProfileById(id: string): AlumniProfile | undefined {
    const p = this.profiles.get(id);
    if (!p) return undefined;
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
      return req;
    }
    this.connectionRequests.unshift(req);
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
      gateway: options.channel.includes('PAYSTACK') ? 'Paystack' : 'Flutterwave',
      gatewayRef: options.reference,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      receiptNumber: `RCP-NGN-${Date.now().toString().slice(-6)}`,
      payerName: 'Alumnus',
      category: 'Wallet Deposit'
    };
    this.transactions.unshift(newTx);

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
}

export const db = new MultiTenantDatabase();

