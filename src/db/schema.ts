import { pgTable, text, integer, timestamp, numeric, boolean, serial, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  tgUserId: text('tg_user_id').notNull().unique(),
  tgFirstName: text('tg_first_name').notNull(),
  tgLastName: text('tg_last_name'),
  tgUsername: text('tg_username'),
  tgPhotoUrl: text('tg_photo_url'),
  createdAt: timestamp('created_at').defaultNow()
});

// 2. Institutions
export const institutions = pgTable('institutions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  brandColor: text('brand_color'),
  telegramSupergroupId: text('telegram_supergroup_id'),
  inviteLinkExpireHours: integer('invite_link_expire_hours').default(24)
});

// 3. Alumni Profiles
export const alumniProfiles = pgTable('alumni_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  tgUserId: text('tg_user_id'),
  institutionId: text('institution_id').references(() => institutions.id).notNull(),
  matriculationNo: text('matriculation_no').notNull(),
  fullName: text('full_name').notNull(),
  graduationYear: integer('graduation_year').notNull(),
  department: text('department').notNull(),
  jobTitle: text('job_title'),
  company: text('company'),
  industry: text('industry'),
  location: text('location'),
  bio: text('bio'),
  phone: text('phone'),
  email: text('email'),
  linkedinUrl: text('linkedin_url'),
  portfolioUrl: text('portfolio_url'),
  isMentor: boolean('is_mentor').default(false),
  mentorshipTopics: jsonb('mentorship_topics').$type<string[]>(),
  skills: jsonb('skills').$type<string[]>(),
  verificationStatus: text('verification_status').default('PENDING'),
  isVerified: boolean('is_verified').default(false),
  profileViews: integer('profile_views').default(0),
  privacyMode: boolean('privacy_mode').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// 4. ZebraWallets
export const wallets = pgTable('wallets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  tgUserId: text('tg_user_id'),
  balanceNgn: numeric('balance_ngn', { precision: 14, scale: 2 }).default('0.00').notNull(),
  address: text('address'),
  virtualNuban: text('virtual_nuban'),
  virtualBank: text('virtual_bank'),
  updatedAt: timestamp('updated_at').defaultNow()
});

// 5. Transactions Ledger
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  walletId: text('wallet_id'),
  userId: text('user_id').notNull(),
  tgUserId: text('tg_user_id'),
  institutionId: text('institution_id'),
  type: text('type').notNull(), // CREDIT, DEBIT
  amountNgn: numeric('amount_ngn', { precision: 14, scale: 2 }).notNull(),
  currency: text('currency').default('NGN').notNull(),
  channel: text('channel').notNull(), // PAYSTACK, FLUTTERWAVE, VIRTUAL_NUBAN, STRIPE, USSD, SYSTEM
  reference: text('reference').notNull().unique(),
  category: text('category'),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('SUCCESS').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// 6. Connection Requests
export const connectionRequests = pgTable('connection_requests', {
  id: text('id').primaryKey(),
  institutionId: text('institution_id').notNull(),
  senderProfileId: text('sender_profile_id').notNull(),
  senderUserId: text('sender_user_id'),
  senderName: text('sender_name').notNull(),
  senderJobTitle: text('sender_job_title'),
  senderCompany: text('sender_company'),
  senderDepartment: text('sender_department'),
  senderGradYear: integer('sender_grad_year'),
  senderTgUsername: text('sender_tg_username'),
  recipientProfileId: text('recipient_profile_id').notNull(),
  recipientTgUserId: text('recipient_tg_user_id'),
  recipientName: text('recipient_name').notNull(),
  note: text('note'),
  status: text('status').default('PENDING').notNull(),
  deliveredViaTelegramBot: boolean('delivered_via_telegram_bot').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// 7. Mentorship Requests
export const mentorshipRequests = pgTable('mentorship_requests', {
  id: text('id').primaryKey(),
  menteeProfileId: text('mentee_profile_id').notNull(),
  menteeName: text('mentee_name').notNull(),
  mentorProfileId: text('mentor_profile_id').notNull(),
  mentorName: text('mentor_name').notNull(),
  fieldOfStudy: text('field_of_study').notNull(),
  message: text('message').notNull(),
  status: text('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// 8. Skill Endorsements
export const endorsements = pgTable('endorsements', {
  id: text('id').primaryKey(),
  targetProfileId: text('target_profile_id').notNull(),
  authorUserId: text('author_user_id').notNull(),
  authorName: text('author_name').notNull(),
  authorHeadline: text('author_headline'),
  authorGradYear: integer('author_grad_year'),
  authorPhotoUrl: text('author_photo_url'),
  skill: text('skill').notNull(),
  message: text('message').notNull(),
  relationship: text('relationship').default('ALUMNI_PEER').notNull(),
  upvotes: integer('upvotes').default(1),
  createdAt: timestamp('created_at').defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(alumniProfiles)
}));

export const alumniProfilesRelations = relations(alumniProfiles, ({ one }) => ({
  user: one(users, {
    fields: [alumniProfiles.userId],
    references: [users.id]
  }),
  institution: one(institutions, {
    fields: [alumniProfiles.institutionId],
    references: [institutions.id]
  })
}));
