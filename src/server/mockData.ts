import { Institution, AlumniProfile, TelegramUser, ChapterGroup, AlumniEvent, SkillEndorsement, UniversityNewsItem, RecentTelegramMessage, CareerMilestone, MentorshipRequest, AdminAuditLog } from '../types';

export const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-futminna',
    slug: 'futminna',
    name: 'Federal University of Technology, Minna',
    shortName: 'FUT Minna',
    motto: 'Technology for Empowerment',
    establishedYear: 1983,
    logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#047857', // Emerald / Green
    accentColor: '#fbbf24', // Amber gold
    portalType: 'OAUTH2_SSO',
    portalBaseUrl: 'https://eportal.futminna.edu.ng/api/v2',
    portalAuthEndpoint: 'https://eportal.futminna.edu.ng/oauth/authorize',
    portalUserEndpoint: 'https://eportal.futminna.edu.ng/api/v2/alumni/verify',
    allowedEmailDomains: ['@futminna.edu.ng', '@alumni.futminna.edu.ng'],
    telegramSupergroupId: '-1001892837491',
    telegramChannelId: '-1001783948271',
    inviteLinkExpireHours: 48,
    faculties: [
      {
        facultyName: 'School of Electrical Engineering & Technology (SEET)',
        departments: ['Computer Engineering', 'Electrical & Electronics Engineering', 'Telecommunication Engineering', 'Mechatronics Engineering']
      },
      {
        facultyName: 'School of Information & Communication Technology (SICT)',
        departments: ['Computer Science', 'Cyber Security Science', 'Information Technology', 'Information Science & Media Studies']
      },
      {
        facultyName: 'School of Infrastructure, Process Engineering & Technology (SIPET)',
        departments: ['Civil Engineering', 'Mechanical Engineering', 'Chemical Engineering', 'Agricultural & Bioresources Engineering']
      },
      {
        facultyName: 'School of Physical Sciences (SPS)',
        departments: ['Physics', 'Mathematics', 'Statistics', 'Geology', 'Chemistry']
      }
    ]
  },
  {
    id: 'inst-ui',
    slug: 'ui',
    name: 'University of Ibadan',
    shortName: 'UI',
    motto: 'Recte Sapere Fons (For Knowledge and Sound Judgement)',
    establishedYear: 1948,
    logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#1e3a8a', // Deep UI Blue
    accentColor: '#d97706', // Ochre Gold
    portalType: 'OAUTH2_SSO',
    portalBaseUrl: 'https://portal.ui.edu.ng/api/alumni',
    portalAuthEndpoint: 'https://portal.ui.edu.ng/oauth/auth',
    portalUserEndpoint: 'https://portal.ui.edu.ng/api/alumni/verify-token',
    allowedEmailDomains: ['@ui.edu.ng', '@alumni.ui.edu.ng', '@stu.ui.edu.ng'],
    telegramSupergroupId: '-1001928374829',
    telegramChannelId: '-1001648291039',
    inviteLinkExpireHours: 24,
    faculties: [
      {
        facultyName: 'Faculty of Technology',
        departments: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Petroleum Engineering', 'Civil Engineering', 'Industrial Production Engineering']
      },
      {
        facultyName: 'College of Medicine',
        departments: ['Medicine & Surgery (MBBS)', 'Dentistry', 'Physiotherapy', 'Nursing', 'Biochemistry']
      },
      {
        facultyName: 'Faculty of Science',
        departments: ['Computer Science', 'Mathematics', 'Statistics', 'Microbiology', 'Chemistry']
      },
      {
        facultyName: 'Faculty of Law',
        departments: ['Public Law', 'Commercial Law', 'Private Law']
      },
      {
        facultyName: 'Faculty of Economics & Management Sciences',
        departments: ['Economics', 'Banking & Finance', 'Accounting']
      }
    ]
  },
  {
    id: 'inst-unilag',
    slug: 'unilag',
    name: 'University of Lagos',
    shortName: 'UNILAG',
    motto: 'In Deed and in Truth',
    establishedYear: 1962,
    logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#831843', // Maroon / Claret
    accentColor: '#f59e0b', // Gold
    portalType: 'OAUTH2_SSO',
    portalBaseUrl: 'https://studentportal.unilag.edu.ng/api/v1',
    portalAuthEndpoint: 'https://studentportal.unilag.edu.ng/sso/authorize',
    portalUserEndpoint: 'https://studentportal.unilag.edu.ng/api/v1/alumni/profile',
    allowedEmailDomains: ['@unilag.edu.ng', '@live.unilag.edu.ng'],
    telegramSupergroupId: '-1001948271029',
    telegramChannelId: '-1001859384729',
    inviteLinkExpireHours: 48,
    faculties: [
      {
        facultyName: 'Faculty of Engineering',
        departments: ['Computer Engineering', 'Electrical & Electronics', 'Systems Engineering', 'Mechanical Engineering', 'Chemical & Polymer']
      },
      {
        facultyName: 'Faculty of Business Administration',
        departments: ['Finance', 'Accounting', 'Business Administration', 'Actuarial Science']
      },
      {
        facultyName: 'Faculty of Science',
        departments: ['Computer Science', 'Data Science', 'Physics', 'Cell Biology & Genetics']
      },
      {
        facultyName: 'Faculty of Environmental Sciences',
        departments: ['Architecture', 'Urban & Regional Planning', 'Estate Management']
      }
    ]
  },
  {
    id: 'inst-jogs',
    slug: 'jogs',
    name: 'Joseph Ayo Babalola University (JABU / JOGS)',
    shortName: 'JOGS',
    motto: 'For Knowledge and Godly Character',
    establishedYear: 2006,
    logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#0f766e', // Teal
    accentColor: '#eab308', // Yellow
    portalType: 'REST_API',
    portalBaseUrl: 'https://portal.jabu.edu.ng/api/alumni',
    allowedEmailDomains: ['@jabu.edu.ng'],
    telegramSupergroupId: '-1001678943210',
    inviteLinkExpireHours: 24,
    faculties: [
      {
        facultyName: 'College of Natural & Applied Sciences',
        departments: ['Computer Science', 'Cyber Security', 'Software Engineering', 'Biochemistry']
      },
      {
        facultyName: 'College of Management Sciences',
        departments: ['Accounting', 'Business Administration', 'Economics']
      },
      {
        facultyName: 'College of Law',
        departments: ['Law']
      }
    ]
  },
  {
    id: 'inst-gco',
    slug: 'gco',
    name: 'Government College Ibadan / Oyo (GCO)',
    shortName: 'GCO',
    motto: 'Aut Optimum Aut Nihil (Either the Best or Nothing)',
    establishedYear: 1929,
    logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#7f1d1d', // Crimson Red
    accentColor: '#facc15', // Gold
    portalType: 'REST_API',
    portalBaseUrl: 'https://gco-alumni.org.ng/api',
    allowedEmailDomains: ['@gco.org.ng', '@gcoba.org'],
    telegramSupergroupId: '-1001556677889',
    inviteLinkExpireHours: 72,
    faculties: [
      {
        facultyName: 'Academic Houses',
        departments: ['Grier House (Science)', 'Swanston House (Arts & Law)', 'Field House (Engineering)', 'Carr House (Commercial)']
      }
    ]
  },
  {
    id: 'inst-stgregs',
    slug: 'stgregs',
    name: "St. Gregory's College, Ikoyi Lagos",
    shortName: 'St. Gregs',
    motto: 'Pro Fide et Patria (For Faith and Fatherland)',
    establishedYear: 1928,
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#1e293b', // Slate Navy
    accentColor: '#38bdf8', // Sky Blue
    portalType: 'REST_API',
    portalBaseUrl: 'https://stgregscollege.net/api/alumni',
    allowedEmailDomains: ['@stgregscollege.net'],
    telegramSupergroupId: '-1001778899001',
    inviteLinkExpireHours: 48,
    faculties: [
      {
        facultyName: 'Class Sets',
        departments: ['Science & Tech Division', 'Commercial & Business Division', 'Arts & Social Science Division']
      }
    ]
  },
  {
    id: 'inst-stmarys',
    slug: 'stmarys',
    name: "St. Mary's College",
    shortName: "St. Mary's",
    motto: 'Lumen in Tenebris (Light in the Darkness)',
    establishedYear: 1954,
    logoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#312e81', // Indigo
    accentColor: '#ec4899', // Rose Pink
    portalType: 'REST_API',
    portalBaseUrl: 'https://stmaryscollege.org/api/alumni',
    allowedEmailDomains: ['@stmaryscollege.org'],
    telegramSupergroupId: '-1001667788990',
    inviteLinkExpireHours: 24,
    faculties: [
      {
        facultyName: 'Academic Programs',
        departments: ['Pure Sciences', 'Social Sciences & Humanities', 'Technology & ICT']
      }
    ]
  }
];

export const DEMO_TELEGRAM_USERS: TelegramUser[] = [
  {
    id: 'user-001',
    tgUserId: '984102941',
    tgUsername: 'adebayo_dev',
    tgFirstName: 'Adebayo',
    tgLastName: 'Ogunlesi',
    tgPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    tgLanguageCode: 'en',
    isPremium: true,
    isAdmin: true,
    adminRole: 'INSTITUTION_ADMIN',
    adminInstitutionId: 'inst-futminna'
  },
  {
    id: 'user-admin',
    tgUserId: '990011223',
    tgUsername: 'alumni_director_futminna',
    tgFirstName: 'Prof. Ibrahim',
    tgLastName: 'Haruna',
    tgPhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    tgLanguageCode: 'en',
    isPremium: true,
    isAdmin: true,
    adminRole: 'SUPERADMIN'
  },
  {
    id: 'user-002',
    tgUserId: '782910481',
    tgUsername: 'dr_amina_k',
    tgFirstName: 'Dr. Amina',
    tgLastName: 'Kabir',
    tgPhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    tgLanguageCode: 'en',
    isPremium: false,
    isAdmin: false
  },
  {
    id: 'user-003',
    tgUserId: '659281740',
    tgUsername: 'chioma_fintech',
    tgFirstName: 'Chioma',
    tgLastName: 'Eze',
    tgPhotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    tgLanguageCode: 'en',
    isPremium: true,
    isAdmin: false
  }
];

export const INITIAL_ALUMNI_PROFILES: AlumniProfile[] = [
  // Adebayo in FUT Minna (Verified)
  {
    id: 'prof-001',
    userId: 'user-001',
    institutionId: 'inst-futminna',
    matriculationNo: '2016/1/58291EE',
    faculty: 'School of Electrical Engineering & Technology (SEET)',
    department: 'Computer Engineering',
    degreeType: 'B.Eng',
    graduationYear: 2021,
    entryYear: 2016,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2024-03-15T10:30:00Z',
    verifiedByMethod: 'OAUTH2_SCHOOL_PORTAL',
    portalExternalId: 'FUTM-2016-58291',
    jobTitle: 'Senior Cloud Solutions Architect',
    company: 'AWS / Paystack',
    industry: 'Cloud & DevOps / Fintech',
    locationCity: 'Lagos & London',
    locationCountry: 'Nigeria',
    bio: 'FUT Minna Class of 2021. Scaling high-throughput payment pipelines and distributed cloud architectures. Open to mentoring students and junior engineers!',
    skills: ['Kubernetes', 'Go', 'Distributed Systems', 'Terraform', 'PostgreSQL', 'Telegram Mini Apps'],
    linkedinUrl: 'https://linkedin.com/in/adebayo-ogunlesi-cloud',
    githubUrl: 'https://github.com/adebayo-codes',
    isMentor: true,
    mentoringTopics: ['Cloud Architecture', 'Landing Remote Roles in Tech', 'DevOps & CI/CD Pipelines'],
    chapterName: 'Lagos Mainland Tech Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString()
  },
  // Adebayo in UNILAG (M.Sc. Verified)
  {
    id: 'prof-002',
    userId: 'user-001',
    institutionId: 'inst-unilag',
    matriculationNo: '229048102',
    faculty: 'Faculty of Engineering',
    department: 'Systems Engineering',
    degreeType: 'M.Sc',
    graduationYear: 2023,
    entryYear: 2022,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2024-05-10T14:20:00Z',
    verifiedByMethod: 'OAUTH2_SCHOOL_PORTAL',
    portalExternalId: 'UNILAG-PG-229048',
    jobTitle: 'Senior Cloud Solutions Architect',
    company: 'Paystack',
    industry: 'Fintech',
    locationCity: 'Lagos',
    locationCountry: 'Nigeria',
    bio: 'UNILAG Systems Engineering postgraduate alumnus. Active in Lagos startup ecosystem and research.',
    skills: ['System Modeling', 'AI Infrastructures', 'Microservices'],
    linkedinUrl: 'https://linkedin.com/in/adebayo-ogunlesi-cloud',
    isMentor: true,
    mentoringTopics: ['Postgraduate Tech Transition', 'Systems Thinking'],
    chapterName: 'Akoka Alumni Hub',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString()
  },
  // Dr. Amina in UI (Verified)
  {
    id: 'prof-003',
    userId: 'user-002',
    institutionId: 'inst-ui',
    matriculationNo: 'UI/2012/184920',
    faculty: 'College of Medicine',
    department: 'Medicine & Surgery (MBBS)',
    degreeType: 'MBBS',
    graduationYear: 2018,
    entryYear: 2012,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2023-11-20T08:15:00Z',
    verifiedByMethod: 'OAUTH2_SCHOOL_PORTAL',
    jobTitle: 'Health Informatics Lead & Physician',
    company: 'UCH Ibadan / WHO Health Network',
    industry: 'Digital Health & Clinical Informatics',
    locationCity: 'Ibadan',
    locationCountry: 'Nigeria',
    bio: 'UI College of Medicine alumnus. Bridging public clinical health with telemedicine and AI diagnostic systems across West Africa.',
    skills: ['Clinical Informatics', 'Epidemiology', 'Health Systems Management', 'Telemedicine'],
    linkedinUrl: 'https://linkedin.com/in/dr-amina-kabir',
    isMentor: true,
    mentoringTopics: ['Medical Electives Abroad', 'Transition to Health-Tech', 'Residency Matching'],
    chapterName: 'Ibadan Medical Alumni Guild',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString()
  },
  // Chioma in UNILAG (Verified)
  {
    id: 'prof-004',
    userId: 'user-003',
    institutionId: 'inst-unilag',
    matriculationNo: '160408042',
    faculty: 'Faculty of Business Administration',
    department: 'Finance',
    degreeType: 'B.Sc',
    graduationYear: 2020,
    entryYear: 2016,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2024-01-08T11:00:00Z',
    verifiedByMethod: 'OAUTH2_SCHOOL_PORTAL',
    jobTitle: 'Investment Banking Associate',
    company: 'Chapel Hill Denham / Goldman Sachs Alum',
    industry: 'Investment Banking & Private Equity',
    locationCity: 'Victoria Island, Lagos',
    locationCountry: 'Nigeria',
    bio: 'UNILAG Finance Alumna (First Class Honours). Specializing in energy transition financing and African venture debt.',
    skills: ['Financial Modeling', 'M&A Valuation', 'Venture Debt', 'ESG Financing'],
    linkedinUrl: 'https://linkedin.com/in/chioma-eze-finance',
    isMentor: true,
    mentoringTopics: ['IB Interview Prep', 'Private Equity Modeling', 'CFA Charterholder Strategy'],
    chapterName: 'Lagos Island Executive Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString()
  },
  // Additional Directory Alumni for rich searching & filtering:
  {
    id: 'prof-005',
    userId: 'user-005',
    institutionId: 'inst-futminna',
    matriculationNo: '2015/1/54910CS',
    faculty: 'School of Information & Communication Technology (SICT)',
    department: 'Cyber Security Science',
    degreeType: 'B.Tech',
    graduationYear: 2020,
    entryYear: 2015,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2023-09-12T16:00:00Z',
    verifiedByMethod: 'OAUTH2_SCHOOL_PORTAL',
    jobTitle: 'Principal Security Operations Lead',
    company: 'Interswitch Group',
    industry: 'Cybersecurity & Financial Defense',
    locationCity: 'Abuja',
    locationCountry: 'Nigeria',
    bio: 'FUT Minna Cyber Security alumni. Focused on zero-trust architectures, threat hunting, and fintech compliance across EMEA.',
    skills: ['SOC Operations', 'Penetration Testing', 'ISO 27001', 'Threat Intelligence', 'Splunk'],
    linkedinUrl: 'https://linkedin.com/in/tunde-bakare-cyber',
    isMentor: true,
    mentoringTopics: ['CEH & OSCP Certifications', 'Landing Security Analyst Roles'],
    chapterName: 'Abuja Federal Capital Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '582910482',
      tgUsername: 'tunde_cybersec',
      tgFirstName: 'Tunde',
      tgLastName: 'Bakare',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'prof-006',
    userId: 'user-006',
    institutionId: 'inst-futminna',
    matriculationNo: '2017/1/62019IT',
    faculty: 'School of Information & Communication Technology (SICT)',
    department: 'Information Technology',
    degreeType: 'B.Tech',
    graduationYear: 2022,
    entryYear: 2017,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2024-02-18T10:00:00Z',
    verifiedByMethod: 'OAUTH2_SCHOOL_PORTAL',
    jobTitle: 'Product Designer (UI/UX)',
    company: 'Moniepoint',
    industry: 'Product Design & HCI',
    locationCity: 'Lagos',
    locationCountry: 'Nigeria',
    bio: 'Designing intuitive financial apps for millions of informal merchants and businesses across Africa. Figma enthusiast.',
    skills: ['Product Design', 'Figma', 'Design Systems', 'User Research', 'Prototyping'],
    linkedinUrl: 'https://linkedin.com/in/zainab-alabi',
    isMentor: true,
    mentoringTopics: ['Portfolio Reviews', 'Figma Component Systems', 'Fintech UX'],
    chapterName: 'Lagos Mainland Tech Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '492810394',
      tgUsername: 'zainab_ux',
      tgFirstName: 'Zainab',
      tgLastName: 'Alabi',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'prof-007',
    userId: 'user-007',
    institutionId: 'inst-ui',
    matriculationNo: 'UI/2015/198234',
    faculty: 'Faculty of Technology',
    department: 'Computer Science',
    degreeType: 'B.Sc',
    graduationYear: 2019,
    entryYear: 2015,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2023-10-04T09:30:00Z',
    verifiedByMethod: 'OAUTH2_SCHOOL_PORTAL',
    jobTitle: 'Senior Machine Learning Engineer',
    company: 'DeepMind / Google',
    industry: 'Artificial Intelligence & Research',
    locationCity: 'London',
    locationCountry: 'United Kingdom',
    bio: 'First Degree UI Computer Science. Building foundational multilingual models and speech processing for low-resource African languages.',
    skills: ['PyTorch', 'Transformers', 'NLP', 'JAX', 'Distributed Training', 'Python'],
    linkedinUrl: 'https://linkedin.com/in/emeka-nwosu-ai',
    githubUrl: 'https://github.com/emeka-nlp',
    isMentor: true,
    mentoringTopics: ['AI Research Papers', 'UK Global Talent Visa / Tech Nation', 'Mastering LeetCode & ML Interviews'],
    chapterName: 'UK & Europe Diaspora Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '728194012',
      tgUsername: 'emeka_ml',
      tgFirstName: 'Emeka',
      tgLastName: 'Nwosu',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'prof-008',
    userId: 'user-008',
    institutionId: 'inst-unilag',
    matriculationNo: '150403019',
    faculty: 'Faculty of Engineering',
    department: 'Computer Engineering',
    degreeType: 'B.Sc',
    graduationYear: 2020,
    entryYear: 2015,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2023-12-14T11:45:00Z',
    verifiedByMethod: 'OAUTH2_SCHOOL_PORTAL',
    jobTitle: 'Staff Frontend Engineer',
    company: 'Flutterwave',
    industry: 'Fintech & Web Architecture',
    locationCity: 'Toronto & Lagos',
    locationCountry: 'Canada',
    bio: 'UNILAG Computer Engineering alumnus. Architecting responsive merchant portals and WebApp SDK experiences.',
    skills: ['React', 'TypeScript', 'Next.js', 'Web Performance', 'GraphQL', 'Tailwind'],
    linkedinUrl: 'https://linkedin.com/in/kemi-balogun',
    isMentor: true,
    mentoringTopics: ['Frontend Architecture', 'Relocating to North America as a Dev'],
    chapterName: 'North America Alumni Network',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '839201948',
      tgUsername: 'kemi_codes',
      tgFirstName: 'Kemi',
      tgLastName: 'Balogun',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'prof-009',
    userId: 'user-009',
    institutionId: 'inst-jogs',
    matriculationNo: 'JABU/17/COMC/042',
    faculty: 'College of Natural & Applied Sciences',
    department: 'Software Engineering',
    degreeType: 'B.Sc',
    graduationYear: 2021,
    entryYear: 2017,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2024-01-20T15:00:00Z',
    verifiedByMethod: 'STUDENT_ID_API',
    jobTitle: 'Lead Mobile Engineer',
    company: 'Kuda Bank',
    industry: 'Mobile Banking & Fintech',
    locationCity: 'Lagos',
    locationCountry: 'Nigeria',
    bio: 'JABU alumnus. Building lightning fast Flutter & native iOS/Android financial experiences for millions of users.',
    skills: ['Flutter', 'Swift', 'Kotlin', 'Clean Architecture', 'CI/CD'],
    linkedinUrl: 'https://linkedin.com/in/femi-aderinto',
    isMentor: true,
    mentoringTopics: ['Mobile App Architecture', 'Fintech Security in Mobile Apps'],
    chapterName: 'Lagos Island Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '671928401',
      tgUsername: 'femi_mobile',
      tgFirstName: 'Femi',
      tgLastName: 'Aderinto',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'prof-010',
    userId: 'user-010',
    institutionId: 'inst-gco',
    matriculationNo: 'GCO/2011/SET42',
    faculty: 'Academic Houses',
    department: 'Grier House (Science)',
    degreeType: 'SSCE Honours',
    graduationYear: 2017,
    entryYear: 2011,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2023-08-11T12:00:00Z',
    verifiedByMethod: 'ALUMNI_EXECUTIVE_MANUAL',
    jobTitle: 'Energy Infrastructure Analyst',
    company: 'Shell / Seplat Energy',
    industry: 'Energy & Sustainability',
    locationCity: 'Port Harcourt',
    locationCountry: 'Nigeria',
    bio: 'Proud GCO Old Boy. Dedicated to national industrialization, energy security and mentoring next-gen scholars.',
    skills: ['Energy Transition', 'Project Finance', 'Subsea Engineering'],
    linkedinUrl: 'https://linkedin.com/in/olu-gco',
    isMentor: true,
    mentoringTopics: ['STEM Scholarships', 'GCO Mentorship Circle'],
    chapterName: 'South-South Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '381920491',
      tgUsername: 'olu_grier',
      tgFirstName: 'Olumide',
      tgLastName: 'Adegoke',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'prof-011',
    userId: 'user-011',
    institutionId: 'inst-stgregs',
    matriculationNo: 'SGC/2013/8912',
    faculty: 'Class Sets',
    department: 'Science & Tech Division',
    degreeType: 'College Diploma',
    graduationYear: 2019,
    entryYear: 2013,
    verificationStatus: 'VERIFIED',
    verifiedAt: '2024-02-01T10:00:00Z',
    verifiedByMethod: 'STUDENT_ID_API',
    jobTitle: 'Corporate Legal Counsel & Tech Policy Advisor',
    company: 'Aluko & Oyebode',
    industry: 'Commercial Law & AI Regulation',
    locationCity: 'Ikoyi, Lagos',
    locationCountry: 'Nigeria',
    bio: 'Gregorians fraternity. Advising venture-backed technology companies on data protection (NDPR), IP, and international expansion.',
    skills: ['Corporate Law', 'Tech Policy', 'Venture Capital Financing', 'NDPR Compliance'],
    linkedinUrl: 'https://linkedin.com/in/tari-stgregs',
    isMentor: true,
    mentoringTopics: ['Legal Careers in Tech', 'Contract Negotiation for Founders'],
    chapterName: 'Ikoyi Executive Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '918273645',
      tgUsername: 'tari_legal',
      tgFirstName: 'Tari',
      tgLastName: 'Briggs',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    }
  },
  // Pending Verification Candidates for Admin Verification Queue:
  {
    id: 'prof-pending-001',
    userId: 'user-pending-001',
    institutionId: 'inst-futminna',
    matriculationNo: '2018/1/67291CS',
    faculty: 'School of Information & Communication Technology (SICT)',
    department: 'Computer Science',
    degreeType: 'B.Tech',
    graduationYear: 2023,
    entryYear: 2018,
    verificationStatus: 'PENDING_PORTAL_AUTH',
    verifiedByMethod: 'TRANSCRIPT_PIN',
    submittedVerificationAt: '2026-03-30T09:40:00Z',
    certificateMediaId: 'cert-futminna-67291',
    certificateFileName: 'FUTMINNA_BTech_Degree_Cert_Chukwudi.pdf',
    portalPayload: {
      documentScanUrl: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&auto=format&fit=crop&q=80',
      cgpa: '4.68 / 5.0 (First Class)',
      senateApprovalDate: 'November 2023'
    },
    jobTitle: 'Junior Backend Engineer',
    company: 'Kuda Bank',
    industry: 'Fintech / Engineering',
    locationCity: 'Lagos',
    locationCountry: 'Nigeria',
    bio: 'FUT Minna 2023 First Class graduate in Computer Science. Building distributed microservices with Go and gRPC.',
    skills: ['Go', 'PostgreSQL', 'Docker', 'Redis', 'Distributed Systems'],
    linkedinUrl: 'https://linkedin.com/in/chukwudi-nnamdi-dev',
    isMentor: false,
    mentoringTopics: [],
    chapterName: 'Lagos Mainland Tech Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '881920311',
      tgUsername: 'chukwudi_codes',
      tgFirstName: 'Chukwudi',
      tgLastName: 'Nnamdi',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'prof-pending-002',
    userId: 'user-pending-002',
    institutionId: 'inst-ui',
    matriculationNo: 'UI/2014/190821',
    faculty: 'College of Medicine',
    department: 'Medicine & Surgery (MBBS)',
    degreeType: 'MBBS',
    graduationYear: 2020,
    entryYear: 2014,
    verificationStatus: 'PENDING_PORTAL_AUTH',
    verifiedByMethod: 'STUDENT_ID_API',
    submittedVerificationAt: '2026-03-30T06:15:00Z',
    certificateMediaId: 'cert-ui-190821',
    certificateFileName: 'UI_College_of_Medicine_MBBS_Adeyemi.pdf',
    portalPayload: {
      documentScanUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      mdcnLicenseNo: 'MDCN/2021/89401',
      residencyHospital: 'University College Hospital (UCH)'
    },
    jobTitle: 'Senior Resident Physician',
    company: 'UCH Ibadan',
    industry: 'Medicine & Clinical Research',
    locationCity: 'Ibadan',
    locationCountry: 'Nigeria',
    bio: 'UI College of Medicine alumnus specializing in Internal Medicine and Cardiology. Conducting West African cardiovascular epidemiology research.',
    skills: ['Cardiology', 'Clinical Trials', 'Public Health', 'Echocardiography'],
    linkedinUrl: 'https://linkedin.com/in/kofo-adeyemi-md',
    isMentor: true,
    mentoringTopics: ['Postgraduate Medical Fellowship', 'Primary Fellowship Exams'],
    chapterName: 'Ibadan Medical Alumni Guild',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '772910481',
      tgUsername: 'kofo_md',
      tgFirstName: 'Dr. Kofo',
      tgLastName: 'Adeyemi',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'prof-pending-003',
    userId: 'user-pending-003',
    institutionId: 'inst-unilag',
    matriculationNo: '170402091',
    faculty: 'Faculty of Law',
    department: 'Commercial Law',
    degreeType: 'LL.B',
    graduationYear: 2022,
    entryYear: 2017,
    verificationStatus: 'PENDING_PORTAL_AUTH',
    verifiedByMethod: 'ALUMNI_EXECUTIVE_MANUAL',
    submittedVerificationAt: '2026-03-29T18:20:00Z',
    certificateMediaId: 'cert-unilag-170402091',
    certificateFileName: 'UNILAG_LLB_Certificate_Folake.pdf',
    portalPayload: {
      documentScanUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      nigerianLawSchoolSet: 'Bwari Campus 2023',
      supremeCourtEnrollmentNo: 'SCN/2023/14290'
    },
    jobTitle: 'Corporate Finance Associate',
    company: 'Aluko & Oyebode',
    industry: 'Law & Venture Financing',
    locationCity: 'Lagos',
    locationCountry: 'Nigeria',
    bio: 'UNILAG Law alumnus advising tech founders, angel syndicates, and pan-African venture funds on cross-border transactions and SEC compliance.',
    skills: ['Venture Capital Contracts', 'Fintech Regulatory Compliance', 'Cross-Border M&A'],
    linkedinUrl: 'https://linkedin.com/in/folake-adeleke-law',
    isMentor: true,
    mentoringTopics: ['Nigerian Law School Bar Exam Strategy', 'Transitioning to Tech Law'],
    chapterName: 'Lagos Island Executive Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '661829014',
      tgUsername: 'folake_law',
      tgFirstName: 'Folake',
      tgLastName: 'Adeleke',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'prof-pending-004',
    userId: 'user-pending-004',
    institutionId: 'inst-futminna',
    matriculationNo: '2017/1/64012EE',
    faculty: 'School of Electrical Engineering & Technology (SEET)',
    department: 'Telecommunication Engineering',
    degreeType: 'B.Eng',
    graduationYear: 2022,
    entryYear: 2017,
    verificationStatus: 'PENDING_PORTAL_AUTH',
    verifiedByMethod: 'OAUTH2_SCHOOL_PORTAL',
    submittedVerificationAt: '2026-03-29T11:10:00Z',
    certificateMediaId: 'cert-futminna-64012',
    certificateFileName: 'FUTMINNA_BEng_Telecomm_Garba.pdf',
    portalPayload: {
      documentScanUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
      cgpa: '4.42 / 5.0'
    },
    jobTitle: 'Radio Frequency Optimization Specialist',
    company: 'MTN Nigeria',
    industry: 'Telecommunications & 5G',
    locationCity: 'Abuja',
    locationCountry: 'Nigeria',
    bio: 'FUT Minna Telecommunications engineering. Optimizing 4G/5G cellular nodes and private campus networks in Northern Nigeria.',
    skills: ['5G NR', 'Fiber Optics', 'RF Planning', 'Huawei Core', 'Wireshark'],
    linkedinUrl: 'https://linkedin.com/in/usman-garba-rf',
    isMentor: false,
    mentoringTopics: [],
    chapterName: 'Abuja Federal Capital Chapter',
    isPublicInDirectory: true,
    lastActiveAt: new Date().toISOString(),
    user: {
      tgUserId: '551928371',
      tgUsername: 'usman_iot',
      tgFirstName: 'Usman',
      tgLastName: 'Garba',
      tgPhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
    }
  }
];

export const INITIAL_MENTORSHIP_REQUESTS: MentorshipRequest[] = [
  {
    id: 'mr-001',
    institutionId: 'inst-futminna',
    senderProfileId: 'prof-pending-001',
    mentorProfileId: 'prof-001',
    senderName: 'Chukwudi Nnamdi',
    senderTgUsername: 'chukwudi_codes',
    mentorName: 'Adebayo Ogunlesi',
    mentorRole: 'Senior Cloud Solutions Architect at AWS / Paystack',
    topic: 'Cloud Architecture & Distributed Systems',
    goal: 'Transitioning from junior Go backend engineer to cloud infrastructure engineer and preparing for AWS Solutions Architect Pro certification.',
    note: 'Hi Engr. Adebayo, fellow FUT Minna alumnus! I admired your talk on high-throughput payment architectures and would love your guidance on systems design.',
    cadence: 'Bi-weekly 30-min call',
    status: 'ACCEPTED',
    createdAt: '2026-03-24T14:30:00Z'
  },
  {
    id: 'mr-002',
    institutionId: 'inst-ui',
    senderProfileId: 'prof-007',
    mentorProfileId: 'prof-003',
    senderName: 'Emeka Nwosu',
    senderTgUsername: 'emeka_ml',
    mentorName: 'Dr. Amina Kabir',
    mentorRole: 'Health Informatics Lead & Physician at UCH Ibadan / WHO',
    topic: 'Clinical Health AI & Multilingual Diagnostics',
    goal: 'Collaborating on medical dataset annotation for low-resource Yoruba and Hausa speech diagnostic models.',
    note: 'Dr. Amina, I would love your clinical review on the ethical privacy parameters for our deep learning healthcare study.',
    cadence: 'Monthly sync',
    status: 'ACCEPTED',
    createdAt: '2026-03-22T09:15:00Z'
  },
  {
    id: 'mr-003',
    institutionId: 'inst-unilag',
    senderProfileId: 'prof-pending-003',
    mentorProfileId: 'prof-004',
    senderName: 'Folake Adeleke',
    senderTgUsername: 'folake_law',
    mentorName: 'Chioma Eze',
    mentorRole: 'Investment Banking Associate at Chapel Hill Denham',
    topic: 'Venture Capital Term Sheets & Convertible Notes',
    goal: 'Aligning corporate legal frameworks with Series A debt covenants for African fintech transactions.',
    note: 'Chioma, let us align on how founders can avoid toxic liquidation preferences during down rounds.',
    cadence: 'Ad-hoc advising',
    status: 'COMPLETED',
    createdAt: '2026-03-15T11:00:00Z'
  },
  {
    id: 'mr-004',
    institutionId: 'inst-futminna',
    senderProfileId: 'prof-pending-004',
    mentorProfileId: 'prof-005',
    senderName: 'Usman Garba',
    senderTgUsername: 'usman_iot',
    mentorName: 'Tunde Bakare',
    mentorRole: 'Principal Security Operations Lead at Interswitch',
    topic: 'Telecoms Infrastructure Zero-Trust Security',
    goal: 'Hardening 5G edge compute nodes and IoT cellular gateways against distributed denial of service attacks.',
    note: 'Seeking guidance on obtaining OSCP and CISSP while working full-time in telecommunications infrastructure.',
    cadence: 'Monthly review',
    status: 'PENDING',
    createdAt: '2026-03-29T16:45:00Z'
  },
  {
    id: 'mr-005',
    institutionId: 'inst-ui',
    senderProfileId: 'prof-pending-002',
    mentorProfileId: 'prof-003',
    senderName: 'Dr. Kofo Adeyemi',
    senderTgUsername: 'kofo_md',
    mentorName: 'Dr. Amina Kabir',
    mentorRole: 'Health Informatics Lead & Physician at UCH Ibadan / WHO',
    topic: 'International Clinical Fellowships & WHO Consultancy',
    goal: 'Applying for the Commonwealth Medical Fellowship in London and structuring epidemiology research grant applications.',
    note: 'Good day Dr. Amina, seeking your mentorship on balancing hospital ward rounds with global health scholarship essays.',
    cadence: 'Bi-weekly check-in',
    status: 'PENDING',
    createdAt: '2026-03-30T07:20:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'audit-001',
    institutionId: 'inst-futminna',
    action: 'VERIFICATION_APPROVED',
    actorName: 'Prof. Ibrahim Haruna (Director, Alumni Relations)',
    targetName: 'Adebayo Ogunlesi',
    targetDetails: 'Matric: 2016/1/58291EE · B.Eng Computer Engineering · Verified via Portal OAuth2',
    timestamp: '2026-03-28T16:20:00Z',
    status: 'SUCCESS'
  },
  {
    id: 'audit-002',
    institutionId: 'inst-ui',
    action: 'VERIFICATION_APPROVED',
    actorName: 'Alumni Registry Office UI',
    targetName: 'Dr. Amina Kabir',
    targetDetails: 'Matric: UI/2012/184920 · MBBS College of Medicine · Automated Portal Auth',
    timestamp: '2026-03-27T10:14:00Z',
    status: 'SUCCESS'
  },
  {
    id: 'audit-003',
    institutionId: 'inst-futminna',
    action: 'MENTORSHIP_PINGED',
    actorName: 'Institution Admin Bot',
    targetName: 'Engr. Adebayo Ogunlesi',
    targetDetails: 'Reminder dispatched via @Tel_alum_bot for pending mentorship request from Chukwudi Nnamdi',
    timestamp: '2026-03-26T12:00:00Z',
    status: 'INFO'
  },
  {
    id: 'audit-004',
    institutionId: 'inst-unilag',
    action: 'ROSTER_EXPORTED',
    actorName: 'University Advancement Officer',
    targetName: 'Akoka Alumni Registry',
    targetDetails: 'Exported 1,840 verified alumni records to encrypted CSV for 2026 Convocation Reunion',
    timestamp: '2026-03-25T14:45:00Z',
    status: 'INFO'
  }
];


export const INITIAL_CHAPTERS: ChapterGroup[] = [
  {
    id: 'chap-001',
    institutionId: 'inst-futminna',
    name: 'Lagos Mainland Tech Chapter',
    region: 'Lagos, Nigeria',
    leadName: 'Engr. Adebayo Ogunlesi',
    leadTgUsername: 'adebayo_dev',
    meetingSchedule: 'Last Saturday of every month (Hybrid)',
    chatUrl: 'https://t.me/+FUTMinnaLagosChapter',
    memberCount: 842
  },
  {
    id: 'chap-002',
    institutionId: 'inst-futminna',
    name: 'Abuja Federal Capital Chapter',
    region: 'Abuja, Nigeria',
    leadName: 'Tunde Bakare',
    leadTgUsername: 'tunde_cybersec',
    meetingSchedule: 'Bi-monthly Networking Dinner',
    chatUrl: 'https://t.me/+FUTMinnaAbujaAlumni',
    memberCount: 620
  },
  {
    id: 'chap-003',
    institutionId: 'inst-futminna',
    name: 'UK & Europe Diaspora Chapter',
    region: 'London / Europe',
    leadName: 'Dr. Fatima Haruna',
    leadTgUsername: 'fatima_uk',
    meetingSchedule: 'Quarterly Virtual Assembly',
    chatUrl: 'https://t.me/+FUTMinnaUKDiaspora',
    memberCount: 310
  },
  {
    id: 'chap-004',
    institutionId: 'inst-ui',
    name: 'Ibadan Medical & Tech Guild',
    region: 'Ibadan, Nigeria',
    leadName: 'Dr. Amina Kabir',
    leadTgUsername: 'dr_amina_k',
    meetingSchedule: 'Monthly Grand Rounds & Mentoring',
    chatUrl: 'https://t.me/+UIMedicalGuild',
    memberCount: 1140
  },
  {
    id: 'chap-005',
    institutionId: 'inst-unilag',
    name: 'Lagos Island Executive Chapter',
    region: 'Victoria Island / Ikoyi, Lagos',
    leadName: 'Chioma Eze',
    leadTgUsername: 'chioma_fintech',
    meetingSchedule: 'Third Thursday Breakfast Mixer',
    chatUrl: 'https://t.me/+UNILAGIslandAlumni',
    memberCount: 1450
  }
];

export const INITIAL_EVENTS: AlumniEvent[] = [
  {
    id: 'evt-001',
    institutionId: 'inst-futminna',
    title: 'FUT Minna Global Alumni Tech & Innovation Summit 2026',
    description: 'Keynote on AI in Africa, Venture Capital Panel, Career Speed Mentoring, and verified single-use lounge breakout rooms.',
    date: '2026-09-20T10:00:00Z',
    locationType: 'HYBRID',
    venue: 'Eko Convention Centre, Lagos & Live Telegram Voice Channel',
    rsvpCount: 428,
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'evt-002',
    institutionId: 'inst-futminna',
    title: 'SEET & SICT Class Reunion & Mentorship Circle',
    description: 'Connect with senior alumni working across global technology giants and high-growth African startups.',
    date: '2026-10-12T16:00:00Z',
    locationType: 'VIRTUAL',
    venue: 'Exclusive Telegram Video Stream',
    rsvpCount: 215,
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'evt-003',
    institutionId: 'inst-ui',
    title: 'University of Ibadan 78th Founders Day & Gala Dinner',
    description: 'Celebrating academic excellence, healthcare transformation, and honoring distinguished UI alumni.',
    date: '2026-11-17T18:00:00Z',
    locationType: 'IN_PERSON',
    venue: 'Trenchard Hall, University of Ibadan, Oyo State',
    rsvpCount: 680,
    bannerUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'evt-004',
    institutionId: 'inst-unilag',
    title: 'UNILAG FinTech & Investment Gala 2026',
    description: 'High-level networking with founders, institutional investors, and seasoned banking executives from UNILAG.',
    date: '2026-08-30T17:30:00Z',
    locationType: 'IN_PERSON',
    venue: 'The Civic Centre, Ozumba Mbadiwe, Victoria Island, Lagos',
    rsvpCount: 512,
    bannerUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_WALLETS: Record<string, import('../types').AlumniWallet> = {
  '984102941': {
    walletId: 'ZW-ALUMNI-984102941',
    gateway: 'zebrawallet.org',
    gatewayUrl: 'https://zebrawallet.org',
    currency: 'USD',
    balance: 145.50,
    status: 'ACTIVE',
    linkedAddress: '0x71C...a82F',
    lastSyncedAt: new Date().toISOString(),
    duesPaidUntilYear: 2026,
    totalContributed: 420.00
  },
  '718293019': {
    walletId: 'ZW-ALUMNI-718293019',
    gateway: 'zebrawallet.org',
    gatewayUrl: 'https://zebrawallet.org',
    currency: 'USD',
    balance: 890.00,
    status: 'ACTIVE',
    linkedAddress: '0x39B...c71E',
    lastSyncedAt: new Date().toISOString(),
    duesPaidUntilYear: 2027,
    totalContributed: 1250.00
  },
  '829104820': {
    walletId: 'ZW-ALUMNI-829104820',
    gateway: 'zebrawallet.org',
    gatewayUrl: 'https://zebrawallet.org',
    currency: 'USD',
    balance: 240.00,
    status: 'ACTIVE',
    linkedAddress: '0x52F...91DA',
    lastSyncedAt: new Date().toISOString(),
    duesPaidUntilYear: 2026,
    totalContributed: 560.00
  }
};

export const INITIAL_TRANSACTIONS: import('../types').FinancialTransaction[] = [
  {
    id: 'tx-1001',
    institutionId: 'inst-futminna',
    userId: '984102941',
    type: 'ANNUAL_DUES',
    title: '2026 Annual Alumni Membership Dues',
    description: 'Mandatory statutory annual dues for FUT Minna Global Alumni Association with verified digital clearance badge.',
    currency: 'USD',
    subtotal: 50.00,
    platformFee: 0.75, // 1.5%
    developmentSurcharge: 0.25, // 0.5%
    totalAmount: 51.00,
    gateway: 'zebrawallet.org',
    gatewayRef: 'ZW-TX-88392019',
    status: 'COMPLETED',
    createdAt: '2026-01-15T09:30:00Z',
    completedAt: '2026-01-15T09:30:12Z',
    receiptNumber: 'RCP-FUTM-2026-0891',
    payerName: 'Adebayo Ogundimu',
    category: 'Statutory Dues'
  },
  {
    id: 'tx-1002',
    institutionId: 'inst-futminna',
    userId: '984102941',
    type: 'ENDOWMENT_DONATION',
    title: 'SEET Engineering Labs Modernization Fund',
    description: 'Direct contribution towards cloud GPU computing servers and robotics workbench for undergraduate research.',
    currency: 'USD',
    subtotal: 100.00,
    platformFee: 1.50,
    developmentSurcharge: 0.50,
    totalAmount: 102.00,
    gateway: 'zebrawallet.org',
    gatewayRef: 'ZW-TX-99201844',
    status: 'COMPLETED',
    createdAt: '2026-04-20T14:15:00Z',
    completedAt: '2026-04-20T14:15:20Z',
    receiptNumber: 'RCP-FUTM-2026-1402',
    payerName: 'Adebayo Ogundimu',
    category: 'Endowment Donation'
  },
  {
    id: 'tx-1003',
    institutionId: 'inst-futminna',
    userId: '984102941',
    type: 'CHAPTER_CONTRIBUTION',
    title: 'Lagos Tech Alumni Networking Mixer Levy',
    description: 'Venue and catering sponsorship for the Q2 quarterly alumni executive mixer in Victoria Island.',
    currency: 'USD',
    subtotal: 35.00,
    platformFee: 0.53,
    developmentSurcharge: 0.17,
    totalAmount: 35.70,
    gateway: 'zebrawallet.org',
    gatewayRef: 'ZW-TX-77301988',
    status: 'COMPLETED',
    createdAt: '2026-06-10T11:00:00Z',
    completedAt: '2026-06-10T11:00:15Z',
    receiptNumber: 'RCP-FUTM-2026-2180',
    payerName: 'Adebayo Ogundimu',
    category: 'Chapter Contribution'
  }
];

export const LINKEDIN_SAMPLE_PROFILES: Record<string, import('../types').LinkedInImportProfile> = {
  'adebayo-ogundimu': {
    headline: 'Senior Cloud Solutions Architect & Staff Distributed Systems Engineer | ex-Paystack | FUT Minna Alum',
    jobTitle: 'Senior Cloud Solutions Architect',
    company: 'Paystack / Stripe',
    industry: 'Financial Technology / Cloud Infrastructure',
    locationCity: 'Lagos',
    locationCountry: 'Nigeria',
    bio: 'Senior Cloud Architect with 8+ years designing high-throughput payment pipelines and distributed cloud systems across sub-Saharan Africa and EMEA. Passionate about empowering engineering undergraduates with mentorship and modern cloud engineering best practices.',
    skills: ['Kubernetes', 'Cloud Architecture', 'Go', 'Distributed Systems', 'PostgreSQL', 'Docker', 'GCP', 'Terraform', 'System Design'],
    experience: [
      {
        title: 'Senior Cloud Architect',
        company: 'Paystack / Stripe',
        startDate: '2022-03',
        endDate: 'Present',
        description: 'Architecting 99.999% uptime multi-region cloud infrastructure processing millions of API events daily.'
      },
      {
        title: 'Lead Backend Engineer',
        company: 'Andela',
        startDate: '2019-01',
        endDate: '2022-02',
        description: 'Led a squad of 12 engineers building distributed microservices for global enterprise partners.'
      }
    ],
    education: [
      {
        school: 'Federal University of Technology, Minna',
        degree: 'B.Eng Computer Engineering',
        fieldOfStudy: 'First Class Honours'
      }
    ],
    vanityName: 'adebayo-ogundimu'
  },
  'fatima-abdullahi': {
    headline: 'Principal Cyber Security Threat Analyst & Incident Response Lead | CISSP, CISM',
    jobTitle: 'Principal Cyber Security Analyst',
    company: 'Standard Chartered Bank',
    industry: 'Banking & Cyber Defense',
    locationCity: 'Abuja',
    locationCountry: 'Nigeria',
    bio: 'Cybersecurity defense strategist specializing in SOC operations, zero-trust architecture, and automated threat hunting for financial institutions across Africa and the Middle East.',
    skills: ['Cybersecurity', 'Incident Response', 'Threat Intelligence', 'SIEM', 'Cloud Security', 'Network Forensics', 'Python', 'Splunk'],
    experience: [
      {
        title: 'Principal Cyber Threat Analyst',
        company: 'Standard Chartered Bank',
        startDate: '2021-06',
        endDate: 'Present',
        description: 'Leading 24/7 security operations center and incident response protocols across regional banking hubs.'
      }
    ],
    education: [
      {
        school: 'Federal University of Technology, Minna',
        degree: 'B.Tech Cyber Security Science',
        fieldOfStudy: 'Distinction'
      }
    ],
    vanityName: 'fatima-abdullahi'
  },
  'emeka-nwosu': {
    headline: 'AI Research Scientist & LLM Post-Training Engineer | ex-Google | Computer Vision & NLP',
    jobTitle: 'Staff AI Research Scientist',
    company: 'DeepMind / Google Research',
    industry: 'Artificial Intelligence & Machine Learning',
    locationCity: 'London',
    locationCountry: 'United Kingdom',
    bio: 'AI researcher working on foundation model alignment, multimodal reasoning, and low-resource African language NLP tokenization. Committed to mentoring African AI fellows.',
    skills: ['PyTorch', 'Large Language Models', 'Deep Learning', 'Transformers', 'Reinforcement Learning', 'Python', 'CUDA', 'NLP'],
    experience: [
      {
        title: 'Staff AI Researcher',
        company: 'Google DeepMind',
        startDate: '2020-09',
        endDate: 'Present',
        description: 'Conducting frontier research on multimodal tokenization and RLHF alignment architectures.'
      }
    ],
    education: [
      {
        school: 'Federal University of Technology, Minna',
        degree: 'B.Eng Telecommunication Engineering',
        fieldOfStudy: 'First Class'
      }
    ],
    vanityName: 'emeka-nwosu'
  }
};

export const INITIAL_ENDORSEMENTS: SkillEndorsement[] = [
  {
    id: 'end-001',
    targetProfileId: 'prof-001',
    authorUserId: 'user-002',
    authorName: 'Dr. Amina Kabir',
    authorHeadline: 'Health Informatics Lead & Physician',
    authorGradYear: 2018,
    authorPhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    skill: 'Distributed Systems',
    message: 'Adebayo has exceptional depth in high-reliability cloud architecture. He helped design our regional hospital data pipeline with zero downtime.',
    relationship: 'COLLEAGUE',
    helpfulVotes: 14,
    votedUserIds: ['user-003'],
    createdAt: '2024-06-12T14:22:00Z'
  },
  {
    id: 'end-002',
    targetProfileId: 'prof-001',
    authorUserId: 'user-003',
    authorName: 'Chioma Eze',
    authorHeadline: 'Principal Product Manager at Stripe',
    authorGradYear: 2019,
    authorPhotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    skill: 'Telegram Mini Apps',
    message: 'One of the sharpest engineers building Web3 and TMA experiences. His attention to UX smoothness and latency optimization is top-tier.',
    relationship: 'PROJECT_COLLABORATOR',
    helpfulVotes: 9,
    votedUserIds: [],
    createdAt: '2024-07-04T09:15:00Z'
  },
  {
    id: 'end-003',
    targetProfileId: 'prof-001',
    authorUserId: 'user-004',
    authorName: 'Engr. Nnamdi Eze',
    authorHeadline: 'Staff Infrastructure Engineer at Microsoft',
    authorGradYear: 2017,
    authorPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    skill: 'Kubernetes',
    message: 'Outstanding Kubernetes cluster management and infrastructure automation skills. Collaborated on multiple multi-region failover playbooks.',
    relationship: 'ALUMNI_PEER',
    helpfulVotes: 21,
    votedUserIds: ['user-002'],
    createdAt: '2024-05-18T16:40:00Z'
  },
  {
    id: 'end-004',
    targetProfileId: 'prof-003',
    authorUserId: 'user-001',
    authorName: 'Adebayo Ogunlesi',
    authorHeadline: 'Senior Cloud Solutions Architect at AWS',
    authorGradYear: 2021,
    authorPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    skill: 'Clinical Informatics',
    message: 'Dr. Amina combines deep medical expertise with modern technology. Truly inspirational leader in African digital healthcare transformation.',
    relationship: 'ALUMNI_PEER',
    helpfulVotes: 18,
    votedUserIds: [],
    createdAt: '2024-06-20T11:05:00Z'
  },
  {
    id: 'end-005',
    targetProfileId: 'prof-004',
    authorUserId: 'user-001',
    authorName: 'Adebayo Ogunlesi',
    authorHeadline: 'Senior Cloud Solutions Architect at AWS',
    authorGradYear: 2021,
    authorPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    skill: 'Product Strategy',
    message: 'Chioma is a visionary PM who knows how to ship global fintech infrastructure that scales seamlessly to millions of transactions.',
    relationship: 'COLLEAGUE',
    helpfulVotes: 12,
    votedUserIds: [],
    createdAt: '2024-06-25T13:30:00Z'
  }
];

export const INITIAL_UNIVERSITY_NEWS: UniversityNewsItem[] = [
  {
    id: 'news-001',
    institutionId: 'inst-futminna',
    title: 'FUT Minna Launches ₦500M AI & Robotics Centre with Global Alumni Endowment',
    summary: 'The Vice-Chancellor commissions the new state-of-the-art Artificial Intelligence and Embedded Robotics Research Centre funded by diaspora alumni contributions.',
    content: `The Management of the Federal University of Technology, Minna (FUT Minna) has officially inaugurated a ₦500M Advanced Artificial Intelligence, IoT, and Robotics Innovation Hub located at the Gidan Kwano Main Campus.
    
Funded through a collaborative endowment drive supported by the FUT Minna Alumni Association UK, US, and Lagos Chapters, the facility features high-performance NVIDIA GPU clusters, 3D prototyping labs, and autonomous drone simulation setups.

Speaking during the opening ceremony, the Vice-Chancellor commended the global alumni community for their persistent dedication to fostering cutting-edge technical education in Nigeria and creating internship pipelines for current students.`,
    category: 'RESEARCH',
    date: '2026-08-25',
    author: 'Directorate of University Information & Alumni Relations',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80',
    featured: true
  },
  {
    id: 'news-002',
    institutionId: 'inst-futminna',
    title: '41st Founder\'s Day & Annual Alumni Homecoming Reunion Dates Announced',
    summary: 'Join fellow alumni for 3 days of executive panel sessions, homecoming dinners, campus tours, and university development pitch days in Minna.',
    content: `The National Executive Council of the Alumni Association alongside the University Senate has confirmed October 18–21, 2026 for the 41st Founder's Day Celebrations and Global Alumni Homecoming.

Special highlights will include:
• Alumni Mentorship Speed-Networking with 1,200+ graduating students
• Presidential Gala and Hall of Fame Induction at the Senate Complex
• Commissioning of the new Solar Energy Backup for the University Library
• Launch of the 2026/2027 Postgrad Research Scholarship Fund

All alumni are encouraged to confirm attendance via their Regional Chapter leads on Telegram.`,
    category: 'REUNION',
    date: '2026-08-20',
    author: 'FUT Minna Alumni Global Council',
    readTime: '2 min read',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'news-003',
    institutionId: 'inst-futminna',
    title: 'Alumni Tech Founders Grant: ₦25M Seed Fund Open for SICT & SEET Innovators',
    summary: 'The University Ventures Council is accepting pitch decks from recent graduates and alumni-led startups for non-dilutive innovation grants.',
    content: `The Directorate of Entrepreneurship Development in partnership with the Alumni Angel Syndicate has opened applications for the 2026 Alumni Innovation Seed Fund.

Five winning teams will receive non-dilutive equity-free grants of up to ₦5,000,000 each, alongside 6 months of cloud credits, legal incorporation support, and direct mentorship from verified alumni tech executives at Stripe, AWS, and Google.`,
    category: 'ALUMNI_GRANT',
    date: '2026-08-14',
    author: 'Office of Innovation & Technology Transfer',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'news-004',
    institutionId: 'inst-ui',
    title: 'University of Ibadan Ranks Top in West Africa for Biomedical Research Citations',
    summary: 'UI College of Medicine and Science Faculty achieve historic research impact ranking with clinical breakthroughs funded in part by alumni medical trusts.',
    content: `The University of Ibadan has once again emerged as the premier research institution in West Africa in the latest Times Higher Education Subject Citations index.
    
The Dean of Clinical Sciences thanked the University of Ibadan Alumni Association Worldwide for their continuous funding of genomics sequencing labs and post-doctoral fellowship endowments.`,
    category: 'RESEARCH',
    date: '2026-08-22',
    author: 'UI Media & Public Communications Bureau',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&auto=format&fit=crop&q=80',
    featured: true
  },
  {
    id: 'news-005',
    institutionId: 'inst-unilag',
    title: 'UNILAG Digital Innovation Corridor Commissions High-Speed Campus Fiber',
    summary: 'Over 10km of high-capacity dark fiber completed across Akoka campus through UNILAG Engineering Alumni endowment initiative.',
    content: `The University of Lagos has unveiled its upgraded campus-wide gigabit digital backbone. The project was spearheaded by the 1994–2004 Engineering & Computer Science alumni cohorts to provide unhindered internet access to academic staff and student researchers.`,
    category: 'CAMPUS',
    date: '2026-08-19',
    author: 'UNILAG Information Unit',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    featured: true
  }
];

export const INITIAL_RECENT_MESSAGES: RecentTelegramMessage[] = [
  {
    id: 'msg-001',
    senderName: 'Tunde Adeleke',
    senderTgUsername: 'tunde_fintech',
    senderPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    senderHeadline: 'Staff Backend Engineer @ Moniepoint',
    topic: 'JobReferral',
    channelName: 'Lagos Chapter Tech Hub',
    messageSnippet: 'We have 3 open Senior Go/Kubernetes roles opening this week. Drop me a DM with your portfolio if you are interested in internal referral!',
    timestamp: '12m ago',
    isVerifiedAlumnus: true
  },
  {
    id: 'msg-002',
    senderName: 'Dr. Amina Bello',
    senderTgUsername: 'dr_amina_b',
    senderPhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    senderHeadline: 'Health Informatics Lead @ WHO',
    topic: 'Mentorship',
    channelName: 'Global Mentors Lounge',
    messageSnippet: 'Hosting a live 45-min AMA on postgraduate scholarship applications for European & Canadian universities this Thursday evening.',
    timestamp: '45m ago',
    isVerifiedAlumnus: true
  },
  {
    id: 'msg-003',
    senderName: 'Emeka Okafor',
    senderTgUsername: 'emeka_ml',
    senderPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    senderHeadline: 'Computer Vision Lead @ Terragon',
    topic: 'TechCollab',
    channelName: 'AI & Data Science Subgroup',
    messageSnippet: 'Looking for a fellow alumnus who has experience training multilingual LLMs for West African trade dialects. Coffee on me in Victoria Island!',
    timestamp: '2h ago',
    isVerifiedAlumnus: true
  },
  {
    id: 'msg-004',
    senderName: 'Chioma Nnamdi',
    senderTgUsername: 'chioma_pm',
    senderPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    senderHeadline: 'Senior Product Manager @ Flutterwave',
    topic: 'Homecoming',
    channelName: 'Class of 2020 Reunion',
    messageSnippet: 'We just hit 85% of our target for the departmental solar electrification project! Huge thanks to everyone who contributed via ZebraWallet.',
    timestamp: '3h ago',
    isVerifiedAlumnus: true
  },
  {
    id: 'msg-005',
    senderName: 'Kelechi Nwosu',
    senderTgUsername: 'kelechi_dev',
    senderPhotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    senderHeadline: 'Engineering Manager @ Paystack',
    topic: 'StartupPitch',
    channelName: 'Alumni Founders Network',
    messageSnippet: 'Reminder for seed founders: YC W27 alumni review session will happen this Saturday on Telegram voice chat. Slides due Friday midnight.',
    timestamp: '5h ago',
    isVerifiedAlumnus: true
  }
];

export const INITIAL_CAREER_MILESTONES: CareerMilestone[] = [
  {
    id: 'ms-001',
    profileId: 'prof-001',
    title: 'Senior Cloud Solutions Architect',
    organization: 'Amazon Web Services (AWS)',
    year: '2024',
    type: 'PROMOTION',
    description: 'Promoted to lead enterprise financial infrastructure architecture across EMEA high-growth fintech clients.',
    skills: ['AWS', 'Distributed Systems', 'Cloud Architecture'],
    createdAt: '2024-03-15T00:00:00Z'
  },
  {
    id: 'ms-002',
    profileId: 'prof-001',
    title: 'AWS Certified Solutions Architect - Professional',
    organization: 'Amazon Web Services',
    year: '2023',
    type: 'CERTIFICATION',
    description: 'Achieved professional level accreditation in complex cloud migration and multi-region fault tolerant infrastructure.',
    skills: ['Cloud Security', 'Kubernetes', 'High Availability'],
    createdAt: '2023-08-10T00:00:00Z'
  },
  {
    id: 'ms-003',
    profileId: 'prof-001',
    title: 'B.Eng. Computer Engineering (First Class Honours)',
    organization: 'Federal University of Technology, Minna',
    year: '2021',
    type: 'DEGREE',
    description: 'Graduated with distinction; awarded Departmental Best Capstone Project for embedded IoT smart grid monitoring system.',
    skills: ['Embedded Systems', 'Computer Architecture', 'C++'],
    createdAt: '2021-11-20T00:00:00Z'
  },
  {
    id: 'ms-004',
    profileId: 'prof-001',
    title: 'Africa Tech Excellence Leader Award',
    organization: 'Fintech Leadership Forum',
    year: '2025',
    type: 'AWARD',
    description: 'Recognized for pioneering open-source banking gateway reliability patterns adopted across 14 African digital banks.',
    skills: ['Fintech Infrastructure', 'Leadership'],
    createdAt: '2025-01-18T00:00:00Z'
  }
];


