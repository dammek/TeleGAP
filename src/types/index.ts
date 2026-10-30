export type VerificationStatus = 
  | 'UNVERIFIED' 
  | 'PENDING_PORTAL_AUTH' 
  | 'VERIFIED' 
  | 'REJECTED' 
  | 'FLAGGED';

export type VerificationMethod = 
  | 'OAUTH2_SCHOOL_PORTAL' 
  | 'STUDENT_ID_API' 
  | 'TRANSCRIPT_PIN' 
  | 'ALUMNI_EXECUTIVE_MANUAL';

export interface Institution {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  motto?: string;
  establishedYear: number;
  logoUrl: string;
  bannerUrl?: string;
  primaryColor: string;
  accentColor: string;
  portalType: string;
  portalBaseUrl: string;
  portalAuthEndpoint?: string;
  portalUserEndpoint?: string;
  allowedEmailDomains: string[];
  telegramSupergroupId?: string;
  telegramChannelId?: string;
  inviteLinkExpireHours: number;
  faculties: {
    facultyName: string;
    departments: string[];
  }[];
  stats?: {
    totalAlumni: number;
    verifiedAlumni: number;
    mentorsCount: number;
    chaptersCount: number;
  };
}

export interface TelegramUser {
  id: string;
  tgUserId: string; // serialized as string for JS BigInt safety
  tgUsername?: string;
  tgFirstName: string;
  tgLastName?: string;
  tgPhotoUrl?: string;
  tgLanguageCode?: string;
  isPremium?: boolean;
  isAdmin?: boolean;
  adminRole?: 'SUPERADMIN' | 'INSTITUTION_ADMIN';
  adminInstitutionId?: string;
}

export interface AlumniProfile {
  id: string;
  userId: string;
  institutionId: string;
  institution?: Institution;
  matriculationNo: string;
  faculty: string;
  department: string;
  degreeType: string;
  graduationYear: number;
  entryYear?: number;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedByMethod?: VerificationMethod;
  portalExternalId?: string;
  portalPayload?: Record<string, unknown>;
  rejectionReason?: string;
  certificateMediaId?: string;
  certificateFileName?: string;
  submittedVerificationAt?: string;
  isAdmin?: boolean;
  adminRole?: 'SUPERADMIN' | 'INSTITUTION_ADMIN';
  
  // Career & Networking Profile
  jobTitle?: string;
  company?: string;
  industry?: string;
  locationCity?: string;
  locationCountry?: string;
  bio?: string;
  skills: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  
  // Mentorship & Community
  isMentor: boolean;
  mentoringTopics: string[];
  chapterName?: string;
  isPublicInDirectory: boolean;
  lastActiveAt: string;
  profileViews?: number;
  privacyMode?: boolean;
  
  // Professional Identity Custom Theme
  themeConfig?: ProfileThemeConfig;

  // Telegram User Snapshot
  user?: {
    tgUserId: string;
    tgUsername?: string;
    tgFirstName: string;
    tgLastName?: string;
    tgPhotoUrl?: string;
  };
}

export interface DirectoryQuery {
  institutionId: string;
  q?: string;
  skill?: string;
  department?: string;
  gradYearMin?: number;
  gradYearMax?: number;
  industry?: string;
  isMentor?: boolean;
  chapter?: string;
  page?: number;
  limit?: number;
}

export interface DirectoryResponse {
  alumni: AlumniProfile[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  filters: {
    departments: string[];
    industries: string[];
    graduationYears: number[];
    chapters: string[];
    skills: string[];
  };
}

export interface AlumniLocationSummary {
  city: string;
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
  topCompanies: string[];
  industryFocus: string;
  lat: number;
  lng: number;
}

export interface VerificationSession {
  id: string;
  profileId: string;
  institutionId: string;
  tgUserId: string;
  stateToken: string;
  portalRedirectUrl: string;
  expiresAt: string;
  isCompleted: boolean;
}

export interface TelegramInviteResponse {
  success: boolean;
  inviteLink: string;
  expiresAt: string;
  memberLimit: number;
  chatTitle: string;
  chatId: string;
}

export interface ChapterGroup {
  id: string;
  institutionId: string;
  name: string;
  region: string;
  leadName?: string;
  leadTgUsername?: string;
  meetingSchedule?: string;
  chatUrl?: string;
  memberCount: number;
}

export interface AlumniEvent {
  id: string;
  institutionId: string;
  title: string;
  description: string;
  date: string;
  locationType: 'VIRTUAL' | 'HYBRID' | 'IN_PERSON';
  venue: string;
  rsvpCount: number;
  bannerUrl?: string;
}

export interface MentorshipRequest {
  id: string;
  institutionId: string;
  senderProfileId: string;
  mentorProfileId: string;
  senderName: string;
  senderTgUsername?: string;
  topic: string;
  goal?: string;
  note?: string;
  cadence?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  createdAt: string;
  mentorName?: string;
  mentorRole?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export type AiAdvisorRole = 
  | 'CAREER_STRATEGIST'
  | 'CAREER_ROADMAP'
  | 'MOCK_INTERVIEWER'
  | 'POSTGRAD_SCHOLARSHIP'
  | 'STARTUP_FOUNDER_MENTOR';

export interface LinkedInImportProfile {
  headline?: string;
  jobTitle: string;
  company: string;
  industry?: string;
  locationCity?: string;
  locationCountry?: string;
  bio: string;
  skills: string[];
  experience?: {
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];
  education?: {
    school: string;
    degree: string;
    fieldOfStudy?: string;
  }[];
  vanityName?: string;
  profilePictureUrl?: string;
}

export type FinancialTransactionType = 
  | 'ANNUAL_DUES'
  | 'ENDOWMENT_DONATION'
  | 'DEPARTMENT_LEVY'
  | 'CHAPTER_CONTRIBUTION'
  | 'WALLET_TOPUP';

export type FinancialTransactionStatus = 
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

export interface AlumniWallet {
  walletId: string; // e.g. "ZW-ALUMNI-984102941"
  gateway: string; // "zebrawallet.org"
  gatewayUrl: string;
  currency: 'USD' | 'NGN' | 'USDT';
  balance: number;
  status: 'ACTIVE' | 'UNLINKED';
  linkedAddress?: string;
  lastSyncedAt: string;
  duesPaidUntilYear?: number;
  totalContributed: number;
}

export interface FinancialTransaction {
  id: string;
  institutionId: string;
  profileId?: string;
  userId: string;
  type: FinancialTransactionType;
  title: string;
  description: string;
  currency: string;
  subtotal: number;
  platformFee: number; // 1.5% Standard Platform Fee
  developmentSurcharge: number; // 0.5% University Development Levy
  totalAmount: number; // subtotal + platformFee + developmentSurcharge
  gateway: string; // "zebrawallet.org"
  gatewayRef: string;
  status: FinancialTransactionStatus;
  createdAt: string;
  completedAt?: string;
  receiptNumber: string;
  payerName: string;
  category: string;
}

export interface MonetizationFeeTerms {
  platformFeeRate: number; // 0.015 (1.5%)
  developmentSurchargeRate: number; // 0.005 (0.5%)
  totalRate: number; // 0.020 (2.0%)
  termsNotice: string;
  gatewayProvider: string;
}

export interface DirectoryMatchNotification {
  id: string;
  matchedProfile: AlumniProfile;
  matchType: 'SHARED_SKILL' | 'SHARED_COMPANY' | 'BOTH';
  sharedSkills: string[];
  sharedCompany?: string;
  matchedAt: string;
  isRead: boolean;
}

export type ProfileAccentColor = 
  | 'azure' 
  | 'emerald' 
  | 'amethyst' 
  | 'amber' 
  | 'cyan' 
  | 'crimson';

export type ProfileBackgroundPattern = 
  | 'mesh' 
  | 'matrix' 
  | 'dots' 
  | 'waves' 
  | 'topography';

export interface ProfileThemeConfig {
  accentColor: ProfileAccentColor;
  pattern: ProfileBackgroundPattern;
}

export type EndorsementRelationship = 
  | 'ALUMNI_PEER' 
  | 'COLLEAGUE' 
  | 'MENTOR' 
  | 'STUDY_PARTNER'
  | 'PROJECT_COLLABORATOR';

export interface SkillEndorsement {
  id: string;
  targetProfileId: string;
  authorUserId: string;
  authorName: string;
  authorHeadline?: string;
  authorGradYear?: number;
  authorPhotoUrl?: string;
  skill: string;
  message: string;
  relationship: EndorsementRelationship;
  helpfulVotes: number;
  votedUserIds?: string[];
  createdAt: string;
}

export interface ConnectionRequest {
  id: string;
  institutionId: string;
  senderProfileId: string;
  senderUserId?: string;
  senderName: string;
  senderJobTitle?: string;
  senderCompany?: string;
  senderDepartment?: string;
  senderGradYear?: number;
  senderTgUsername?: string;
  recipientProfileId: string;
  recipientTgUserId?: string;
  recipientName?: string;
  note?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  deliveredViaTelegramBot?: boolean;
}

export type MilestoneType = 
  | 'PROMOTION'
  | 'CERTIFICATION'
  | 'AWARD'
  | 'DEGREE'
  | 'PUBLICATION'
  | 'VENTURE'
  | 'LEADERSHIP';

export interface CareerMilestone {
  id: string;
  profileId: string;
  title: string;
  organization: string;
  year: string; // e.g. "2025" or "Aug 2024"
  type: MilestoneType;
  description: string;
  skills?: string[];
  credentialUrl?: string;
  createdAt: string;
}

export type UniversityNewsCategory = 
  | 'ACADEMIC'
  | 'RESEARCH'
  | 'CAMPUS'
  | 'ALUMNI_GRANT'
  | 'REUNION'
  | 'PARTNERSHIP';

export interface UniversityNewsItem {
  id: string;
  institutionId: string;
  title: string;
  summary: string;
  content: string;
  category: UniversityNewsCategory;
  date: string;
  author: string;
  readTime: string;
  imageUrl?: string;
  linkUrl?: string;
  featured?: boolean;
}

export interface RecentTelegramMessage {
  id: string;
  senderName: string;
  senderTgUsername?: string;
  senderPhotoUrl?: string;
  senderHeadline?: string;
  topic?: string;
  messageSnippet: string;
  timestamp: string;
  channelName?: string;
  isVerifiedAlumnus?: boolean;
}

// ====================================================================
// Admin Dashboard & Institutional Oversight Types
// ====================================================================

export interface AdminUserStats {
  totalAlumni: number;
  verifiedAlumni: number;
  pendingVerifications: number;
  rejectedAlumni: number;
  unverifiedAlumni: number;
  verificationRate: number; // percentage
  weeklyGrowthPercent: number;
}

export interface AdminMentorshipStats {
  totalRequests: number;
  activePairs: number;
  pendingRequests: number;
  completedSessions: number;
  declinedRequests: number;
  averageResponseTimeHours: number;
  byDiscipline: {
    discipline: string;
    count: number;
    percentage: number;
  }[];
  byStatus: {
    status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED';
    count: number;
  }[];
}

export interface AdminEngagementStats {
  active30DayAlumni: number;
  totalProfileViews: number;
  totalConnectionsSent: number;
  telegramGroupJoinsThisMonth: number;
  telegramNotificationDeliveries: number;
  telegramDeliverySuccessRate: number;
  dailyActivity: {
    date: string;
    activeUsers: number;
    connections: number;
    verifications: number;
  }[];
}

export interface AdminTreasuryStats {
  totalVolumeNgn: number;
  transactionCount: number;
  paystackLiveBalanceNgn: number;
  duesCollectedNgn: number;
  eventRegistrationsNgn: number;
  mentorshipPledgesNgn: number;
}

export interface AdminAuditLog {
  id: string;
  institutionId?: string;
  action: 'VERIFICATION_APPROVED' | 'VERIFICATION_REJECTED' | 'MENTORSHIP_PINGED' | 'ADMIN_LOGIN' | 'ROSTER_EXPORTED';
  actorName: string;
  targetName: string;
  targetDetails?: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'INFO';
}

export interface AdminDashboardData {
  institution: Institution | { id: string; name: string; shortName: string; logoUrl?: string; [key: string]: any };
  userStats: AdminUserStats;
  mentorshipStats: AdminMentorshipStats;
  engagementStats: AdminEngagementStats;
  treasuryStats: AdminTreasuryStats;
  pendingVerifications: AlumniProfile[];
  activeMentorships: MentorshipRequest[];
  recentAuditLogs: AdminAuditLog[];
}



