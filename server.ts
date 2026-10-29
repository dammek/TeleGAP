import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { db } from './src/server/db';
import { UniversityPortalVerifier } from './src/server/portalVerifier';
import { telegramBot } from './src/server/telegramBot';
import { verifyTelegramWebAppData } from './src/server/authMiddleware';
import { webhookRouter } from './src/server/paymentWebhooks';
import { DirectoryQuery } from './src/types';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Preserve raw buffer for HMAC webhook signature verification (Paystack / Flutterwave)
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  // Mount payment webhooks (Paystack & Flutterwave)
  app.use(webhookRouter);

  // Mount Telegram WebApp Auth HMAC-SHA256 middleware
  app.use('/api', (req, res, next) => {
    // Exempt public institutions, webhooks, and news feeds from Telegram signature requirement
    if (
      req.path.startsWith('/webhooks') ||
      req.path.startsWith('/institutions') ||
      req.path.startsWith('/news') ||
      req.path === '/wallet/monetization-terms'
    ) {
      return next();
    }
    return verifyTelegramWebAppData(req as any, res, next);
  });

  // ====================================================================
  // 1. Multi-Tenant Institutions API
  // ====================================================================
  app.get('/api/institutions', (req, res) => {
    try {
      const institutions = db.getInstitutions();
      res.json({ success: true, data: institutions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/institutions/:slug', (req, res) => {
    try {
      const institution = db.getInstitutionBySlug(req.params.slug) || db.getInstitutionById(req.params.slug);
      if (!institution) {
        return res.status(404).json({ success: false, error: 'Institution not found' });
      }
      res.json({ success: true, data: institution });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 2. Telegram User & Multi-Institutional Profile API
  // ====================================================================
  app.get('/api/user/me', (req, res) => {
    try {
      const tgUserId = (req.query.tgUserId as string) || '984102941'; // Defaults to Adebayo for demo
      let user = db.getUserByTgId(tgUserId);
      if (!user) {
        user = db.upsertUser({
          tgUserId,
          tgFirstName: (req.query.firstName as string) || 'Telegram Alum',
          tgUsername: (req.query.username as string) || 'tg_user',
          tgPhotoUrl: (req.query.photoUrl as string) || undefined
        });
      }

      const profiles = db.getProfilesByUserId(user.id);
      res.json({
        success: true,
        data: {
          user,
          profiles,
          activeProfile: profiles[0] || null
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/user/upsert', (req, res) => {
    try {
      const { tgUserId, tgFirstName, tgLastName, tgUsername, tgPhotoUrl, isPremium } = req.body;
      if (!tgUserId || !tgFirstName) {
        return res.status(400).json({ success: false, error: 'tgUserId and tgFirstName are required' });
      }

      const user = db.upsertUser({
        tgUserId: String(tgUserId),
        tgFirstName,
        tgLastName,
        tgUsername,
        tgPhotoUrl,
        isPremium: Boolean(isPremium)
      });

      const profiles = db.getProfilesByUserId(user.id);
      res.json({ success: true, data: { user, profiles } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 3. Alumni Onboarding & Institution Registration
  // ====================================================================
  app.post('/api/onboarding/enroll', (req, res) => {
    try {
      const {
        tgUserId,
        institutionId,
        matriculationNo,
        faculty,
        department,
        degreeType,
        graduationYear,
        entryYear,
        jobTitle,
        company,
        industry,
        locationCity,
        locationCountry,
        bio,
        skills,
        linkedinUrl,
        isMentor,
        mentoringTopics,
        chapterName
      } = req.body;

      if (!tgUserId || !institutionId || !matriculationNo || !department || !graduationYear) {
        return res.status(400).json({
          success: false,
          error: 'Missing required academic information (Matriculation No, Department, Graduation Year).'
        });
      }

      let user = db.getUserByTgId(String(tgUserId));
      if (!user) {
        user = db.upsertUser({
          tgUserId: String(tgUserId),
          tgFirstName: req.body.tgFirstName || 'Alumnus'
        });
      }

      // Check if profile already exists for this institution & matric
      const existingMatric = db.getProfileByMatric(institutionId, matriculationNo);
      if (existingMatric && existingMatric.userId !== user.id) {
        return res.status(409).json({
          success: false,
          error: `Matriculation number ${matriculationNo} is already registered to another alumni account.`
        });
      }

      // Check if user already has a profile in this institution
      const existingUserProfiles = db.getProfilesByUserId(user.id);
      const currentInstProfile = existingUserProfiles.find(p => p.institutionId === institutionId);

      let profile;
      if (currentInstProfile) {
        profile = db.updateProfile(currentInstProfile.id, {
          matriculationNo,
          faculty: faculty || currentInstProfile.faculty,
          department,
          degreeType: degreeType || 'B.Sc',
          graduationYear: Number(graduationYear),
          entryYear: entryYear ? Number(entryYear) : undefined,
          jobTitle,
          company,
          industry,
          locationCity,
          locationCountry,
          bio,
          skills: Array.isArray(skills) ? skills : [],
          linkedinUrl,
          isMentor: Boolean(isMentor),
          mentoringTopics: Array.isArray(mentoringTopics) ? mentoringTopics : [],
          chapterName
        });
      } else {
        profile = db.createProfile({
          userId: user.id,
          institutionId,
          matriculationNo,
          faculty: faculty || 'General Faculty',
          department,
          degreeType: degreeType || 'B.Sc',
          graduationYear: Number(graduationYear),
          entryYear: entryYear ? Number(entryYear) : undefined,
          verificationStatus: 'UNVERIFIED',
          jobTitle,
          company,
          industry,
          locationCity,
          locationCountry,
          bio,
          skills: Array.isArray(skills) ? skills : [],
          linkedinUrl,
          isMentor: Boolean(isMentor),
          mentoringTopics: Array.isArray(mentoringTopics) ? mentoringTopics : [],
          chapterName,
          isPublicInDirectory: true
        });
      }

      res.json({ success: true, data: profile });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 4. University Portal OAuth2 & Verification Endpoints
  // ====================================================================
  app.post('/api/auth/oauth-init', async (req, res) => {
    try {
      const { institutionId, profileId, tgUserId } = req.body;
      if (!institutionId || !profileId || !tgUserId) {
        return res.status(400).json({ success: false, error: 'institutionId, profileId, and tgUserId are required' });
      }

      const session = await UniversityPortalVerifier.initiateOAuthSession(
        institutionId,
        profileId,
        String(tgUserId)
      );

      res.json({ success: true, data: session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // OAuth2 Callback Route Handler (/api/auth/callback)
  app.all('/api/auth/callback', async (req, res) => {
    try {
      const state = (req.query.state as string) || (req.body.state as string);
      const code = (req.query.code as string) || (req.body.code as string);
      const token = (req.query.token as string) || (req.body.token as string);

      if (!state) {
        return res.status(400).json({
          success: false,
          error: 'Missing required OAuth state token in callback.'
        });
      }

      const result = await UniversityPortalVerifier.processOAuthCallback({
        state,
        code,
        token
      });

      // If requested via browser GET redirect, we can return a rich HTML or JSON
      if (req.method === 'GET' && !req.headers.accept?.includes('application/json')) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Alumni Verification Complete</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
                .card { background: #1e293b; border-radius: 16px; padding: 32px; max-width: 440px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
                .badge { display: inline-block; width: 64px; height: 64px; line-height: 64px; font-size: 32px; background: #059669; border-radius: 50%; margin-bottom: 16px; }
                h1 { margin: 0 0 8px; font-size: 22px; color: #34d399; }
                p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }
                .btn { display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 15px; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="badge">🎓</div>
                <h1>Verification Successful!</h1>
                <p>You have been verified as an official alumnus. You can now return to the Telegram Mini App.</p>
                <a class="btn" href="${result.inviteLink}">Join Telegram Alumni Supergroup</a>
              </div>
            </body>
          </html>
        `);
      }

      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      console.error('OAuth Callback Error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Direct fast verification
  app.post('/api/auth/direct-verify', async (req, res) => {
    try {
      const { institutionId, profileId, matricNo } = req.body;
      if (!institutionId || !profileId || !matricNo) {
        return res.status(400).json({ success: false, error: 'institutionId, profileId, and matricNo are required' });
      }

      const result = await UniversityPortalVerifier.verifyDirectMatriculation(
        institutionId,
        profileId,
        matricNo
      );

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Single-use Telegram Invite Link generator / getter
  app.post('/api/telegram/invite', async (req, res) => {
    try {
      const { institutionId, profileId, tgUserId } = req.body;
      const profile = db.getProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      if (profile.verificationStatus !== 'VERIFIED') {
        return res.status(403).json({
          success: false,
          error: 'Verification required before generating single-use supergroup invite links.'
        });
      }

      const invite = await telegramBot.createSingleUseInviteLink(
        institutionId || profile.institutionId,
        profileId,
        String(tgUserId || profile.user?.tgUserId)
      );

      res.json({ success: true, data: invite });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 5. Telegram Bot Webhook Integration (grammY handler)
  // ====================================================================
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      const update = req.body;
      console.log('[Telegram Webhook Update Received]:', update?.update_id);

      // Handle Telegram Bot commands / bot starts
      if (update?.message?.text === '/start') {
        const from = update.message.from;
        if (from) {
          db.upsertUser({
            tgUserId: String(from.id),
            tgFirstName: from.first_name,
            tgLastName: from.last_name,
            tgUsername: from.username,
            tgLanguageCode: from.language_code
          });
        }
      }

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ====================================================================
  // 6. Searchable & Filterable Directory API (Optimized & Paginated)
  // ====================================================================
  app.get('/api/directory', (req, res) => {
    try {
      const {
        institutionId,
        q,
        skill,
        department,
        gradYearMin,
        gradYearMax,
        industry,
        isMentor,
        chapter,
        page,
        limit
      } = req.query;

      if (!institutionId) {
        return res.status(400).json({ success: false, error: 'institutionId query parameter is required' });
      }

      const queryParams: DirectoryQuery = {
        institutionId: String(institutionId),
        q: q ? String(q) : undefined,
        skill: skill ? String(skill) : undefined,
        department: department ? String(department) : undefined,
        gradYearMin: gradYearMin ? Number(gradYearMin) : undefined,
        gradYearMax: gradYearMax ? Number(gradYearMax) : undefined,
        industry: industry ? String(industry) : undefined,
        isMentor: isMentor === 'true' || isMentor === '1',
        chapter: chapter ? String(chapter) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10
      };

      const result = db.searchDirectory(queryParams);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Top alumni locations & hubs endpoint
  app.get('/api/institutions/:id/locations', (req, res) => {
    try {
      const locations = db.getAlumniLocations(req.params.id);
      res.json({ success: true, data: locations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/profile/:id', (req, res) => {
    try {
      const profile = db.getProfileById(req.params.id);
      if (!profile) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }
      res.json({ success: true, data: profile });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/profile/:id', (req, res) => {
    try {
      const updated = db.updateProfile(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Increment profile views
  app.post(['/api/profile/:id/view', '/api/profiles/:id/view'], (req, res) => {
    try {
      const newViews = db.recordProfileView(req.params.id);
      res.json({ success: true, data: { profileViews: newViews } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 7. Regional Chapters, Mentorship & Community Events
  // ====================================================================
  app.get('/api/chapters', (req, res) => {
    try {
      const institutionId = req.query.institutionId as string;
      if (!institutionId) {
        return res.status(400).json({ success: false, error: 'institutionId is required' });
      }
      const chapters = db.getChapters(institutionId);
      res.json({ success: true, data: chapters });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/events', (req, res) => {
    try {
      const institutionId = req.query.institutionId as string;
      if (!institutionId) {
        return res.status(400).json({ success: false, error: 'institutionId is required' });
      }
      const events = db.getEvents(institutionId);
      res.json({ success: true, data: events });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/mentorship/requests', (req, res) => {
    try {
      const profileId = req.query.profileId as string;
      if (!profileId) {
        return res.status(400).json({ success: false, error: 'profileId is required' });
      }
      const requests = db.getMentorshipRequestsForUser(profileId);
      res.json({ success: true, data: requests });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/mentorship/request', (req, res) => {
    try {
      const {
        institutionId,
        senderProfileId,
        mentorProfileId,
        topic,
        goal,
        note,
        cadence,
        senderName,
        senderTgUsername,
        mentorName,
        mentorRole
      } = req.body;

      if (!senderProfileId || !mentorProfileId || !topic) {
        return res.status(400).json({ success: false, error: 'senderProfileId, mentorProfileId, and topic are required' });
      }

      const mentorshipReq = db.addMentorshipRequest({
        id: `ment-${Date.now()}`,
        institutionId: institutionId || 'inst-futminna',
        senderProfileId,
        mentorProfileId,
        senderName: senderName || 'Fellow Alumnus',
        senderTgUsername,
        topic,
        goal: goal || topic,
        note: note || '',
        cadence: cadence || 'One-off 30m Intro Chat',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        mentorName,
        mentorRole
      });

      res.json({
        success: true,
        data: mentorshipReq,
        message: 'Mentorship request transmitted to mentor profile.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 7a. Alumni Network Connection Requests & Telegram Bot Notifications
  // ====================================================================
  app.get('/api/connections', (req, res) => {
    try {
      const profileId = req.query.profileId as string;
      if (!profileId) {
        return res.status(400).json({ success: false, error: 'profileId is required' });
      }
      const connections = db.getConnectionRequests(profileId);
      const sentRecipientIds = db.getSentConnectionRecipientIds(profileId);
      res.json({
        success: true,
        data: {
          connections,
          sentRecipientIds
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/connections/request', async (req, res) => {
    try {
      const {
        institutionId,
        senderProfileId,
        senderUserId,
        senderName,
        senderJobTitle,
        senderCompany,
        senderDepartment,
        senderGradYear,
        senderTgUsername,
        recipientProfileId,
        recipientTgUserId,
        recipientName,
        note
      } = req.body;

      if (!senderProfileId || !recipientProfileId) {
        return res.status(400).json({
          success: false,
          error: 'senderProfileId and recipientProfileId are required'
        });
      }

      // Check recipient profile
      const recipientProfile = db.getProfileById(recipientProfileId);
      const targetTgUserId = recipientTgUserId || recipientProfile?.user?.tgUserId;
      const targetName = recipientName || (recipientProfile?.user ? `${recipientProfile.user.tgFirstName} ${recipientProfile.user.tgLastName || ''}`.trim() : 'Alumnus');

      const connectionRequest = db.addConnectionRequest({
        id: `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        institutionId: institutionId || recipientProfile?.institutionId || 'inst-futminna',
        senderProfileId,
        senderUserId,
        senderName: senderName || 'Fellow Alumnus',
        senderJobTitle,
        senderCompany,
        senderDepartment,
        senderGradYear: senderGradYear ? Number(senderGradYear) : undefined,
        senderTgUsername,
        recipientProfileId,
        recipientTgUserId: targetTgUserId,
        recipientName: targetName,
        note,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });

      // Dispatch real-time Telegram Bot Notification to target alumnus
      const dispatchResult = await telegramBot.sendConnectionRequestNotification(connectionRequest);
      connectionRequest.deliveredViaTelegramBot = dispatchResult.delivered;

      res.json({
        success: true,
        data: connectionRequest,
        delivered: dispatchResult.delivered,
        message: dispatchResult.delivered
          ? `Connection request delivered to @${targetTgUserId} via Telegram Bot.`
          : 'Connection request sent successfully to alumnus.'
      });
    } catch (err: any) {
      console.error('Error sending connection request:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 7b. Testimonials & Skill Endorsements API
  // ====================================================================
  app.get('/api/endorsements', (req, res) => {
    try {
      const profileId = req.query.profileId as string;
      if (!profileId) {
        return res.status(400).json({ success: false, error: 'profileId query parameter is required' });
      }
      const endorsements = db.getEndorsements(profileId);
      res.json({ success: true, data: endorsements });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/endorsements', (req, res) => {
    try {
      const {
        targetProfileId,
        authorUserId,
        authorName,
        authorHeadline,
        authorGradYear,
        authorPhotoUrl,
        skill,
        message,
        relationship
      } = req.body;

      if (!targetProfileId || !authorUserId || !authorName || !skill || !message) {
        return res.status(400).json({
          success: false,
          error: 'targetProfileId, authorUserId, authorName, skill, and message are required'
        });
      }

      const endorsement = db.addEndorsement({
        targetProfileId,
        authorUserId,
        authorName,
        authorHeadline,
        authorGradYear: authorGradYear ? Number(authorGradYear) : undefined,
        authorPhotoUrl,
        skill,
        message,
        relationship: relationship || 'ALUMNI_PEER'
      });

      res.json({
        success: true,
        data: endorsement,
        message: 'Skill endorsement submitted successfully.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/endorsements/:id/vote', (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }
      const updated = db.voteEndorsement(req.params.id, userId);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Endorsement not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 8. Gemini Multi-Turn AI Advisor Chatbot & Message Optimizer
  // ====================================================================
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const {
        messages,
        role = 'CAREER_STRATEGIST',
        model = 'gemini-3.7-flash',
        institutionName = 'University Alumni Network',
        userContext
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: 'messages array is required' });
      }

      // Valid model fallback
      const validModels = [
        'gemini-3.7-flash',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro-preview'
      ];
      const selectedModel = validModels.includes(model) ? model : 'gemini-3.7-flash';

      // Role System Instructions
      let roleInstructions = '';
      switch (role) {
        case 'CAREER_STRATEGIST':
          roleInstructions = `You are the Senior Alumni Career & Strategy Advisor for ${institutionName}. You provide sharp, practical, actionable advice on career transitions, resume positioning, tech salaries, interview strategies, and networking etiquette with senior alumni on Telegram. Keep responses formatted with clean bullet points and clear takeaways.`;
          break;
        case 'CAREER_ROADMAP':
          roleInstructions = `You are the Principal Executive Career Strategist and Roadmap Architect for ${institutionName}. You specialize in constructing personalized 3-phase career progression roadmaps based on an alumnus's degree, current job title, company, skills, and graduation year.
Structure your roadmap into:
1. 🎯 Phase 1: Immediate Growth & High-Impact Wins (0-6 Months) - Focus on core skill specialization and measurable projects.
2. 🚀 Phase 2: Leadership & High-Leverage Expansion (6-18 Months) - Cross-functional leadership, architecture, and senior visibility.
3. 🌟 Phase 3: Long-term Mastery & Industry Influence (2-5 Years) - Principal engineer / VP / Founder trajectory.
4. 🤝 Alumni Synergy Action Steps - Specific advice on alumni connections, mentorship, and Telegram chapter networking.
Use clear headings, bullet points, and realistic tech industry milestones.`;
          break;
        case 'MOCK_INTERVIEWER':
          roleInstructions = `You are a Principal Tech & Leadership Interview Coach for ${institutionName} alumni. You conduct mock interviews, ask probing technical and behavioural questions (STAR method), evaluate responses, and offer constructive feedback.`;
          break;
        case 'POSTGRAD_SCHOLARSHIP':
          roleInstructions = `You are the International Postgraduate & Scholarship Counselor for ${institutionName} alumni. You specialize in Chevening, Commonwealth, Erasmus Mundus, Fulbright, DAAD, GRE/GMAT prep, and Statement of Purpose (SOP) reviews.`;
          break;
        case 'STARTUP_FOUNDER_MENTOR':
          roleInstructions = `You are an experienced Venture Mentor and Alumni Angel for ${institutionName}. You provide feedback on startup ideas, MVP scoping, pitch decks, investor outreach, and scaling strategies for emerging market founders.`;
          break;
        default:
          roleInstructions = `You are a helpful and knowledgeable Alumni Mentor and Career Assistant for ${institutionName}.`;
      }

      if (userContext) {
        roleInstructions += ` User profile context: Name: ${userContext.name || 'Alumnus'}, Dept: ${userContext.department || 'Engineering'}, Degree: ${userContext.degreeType || 'B.Eng'}, Current Role: ${userContext.jobTitle || 'Professional'} at ${userContext.company || 'Tech Company'}, Skills: ${(userContext.skills || []).join(', ')}, Grad Year: ${userContext.gradYear || 'Alum'}.`;
      }


      const ai = getGenAI();

      // Format conversation history for multi-turn chat
      // Map user & assistant messages
      const historyContents = messages.map((m: { role: string; text: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const latestMessage = historyContents.pop();
      if (!latestMessage) {
        return res.status(400).json({ success: false, error: 'No user message provided.' });
      }

      // Using ai.chats.create
      const chat = ai.chats.create({
        model: selectedModel,
        config: {
          systemInstruction: roleInstructions
        },
        history: historyContents
      });

      const response = await chat.sendMessage({
        message: latestMessage.parts[0].text
      });

      const responseText = response.text || 'I apologize, but I could not generate a response. Please try again.';

      res.json({
        success: true,
        data: {
          role: 'model',
          text: responseText,
          timestamp: new Date().toISOString(),
          modelUsed: selectedModel
        }
      });
    } catch (err: any) {
      console.error('Gemini AI Chat Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'An error occurred while contacting the Gemini AI service.'
      });
    }
  });

  // Polish / Refine Mentorship Note
  app.post('/api/ai/refine-mentorship', async (req, res) => {
    try {
      const { mentorName, mentorRole, mentorCompany, topic, goal, rawNote, senderName } = req.body;
      const ai = getGenAI();

      const prompt = `You are an expert alumni networking coach. Refine the following mentorship outreach message to be concise (under 90 words), highly professional, polite, and clearly aligned with the mentor's background.

Mentor Name: ${mentorName || 'Alumni Mentor'}
Mentor Background: ${mentorRole || ''} ${mentorCompany ? 'at ' + mentorCompany : ''}
Focus Area: ${topic || 'Career Guidance'}
Specific Goal: ${goal || 'Seeking guidance and career roadmap advice'}
Sender Name: ${senderName || 'Fellow Alumnus'}
Sender's Raw Draft: "${rawNote || ''}"

Return ONLY the refined message body ready to send. Do not include markdown code fences or conversational filler.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt
      });

      const refinedText = response.text?.trim() || rawNote;
      res.json({ success: true, data: { refinedNote: refinedText } });
    } catch (err: any) {
      console.error('Refine Mentorship Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI-Aided Industry & Domain Suggestions
  app.all('/api/ai/industry-suggestions', async (req, res) => {
    try {
      const q = ((req.query.q || req.body?.q || '') as string).trim();
      const jobTitle = ((req.query.jobTitle || req.body?.jobTitle || '') as string).trim();
      const department = ((req.query.department || req.body?.department || '') as string).trim();

      const baseList = [
        'Fintech & Digital Banking',
        'Software Engineering & Cloud Architecture',
        'Artificial Intelligence, ML & Data Science',
        'Cybersecurity & Network Infrastructure',
        'Healthcare, Biotech & Informatics',
        'Energy, Renewable Power & Oil Exploration',
        'Investment Banking, Private Equity & VC',
        'Legal, Corporate Governance & Compliance',
        'Civil Infrastructure & Structural Engineering',
        'Telecommunications & Embedded Systems',
        'Agritech & Food Security Systems',
        'E-Commerce & Supply Chain Logistics',
        'Aerospace, Defence & Robotics',
        'Creative Media, UI/UX & Game Design',
        'Education, EdTech & Academic Research',
        'Public Policy, Governance & International Development',
        'Real Estate Tech & Smart City Planning',
        'Pharmaceuticals & Biomedical Devices',
        'Automotive, EV & Transportation Tech',
        'Chemical Manufacturing & Polymer Processing'
      ];

      // If Gemini API is available and user typed some characters or jobTitle, try Gemini for rich dynamic suggestions
      if (process.env.GEMINI_API_KEY && (q.length >= 2 || jobTitle.length >= 2)) {
        try {
          const ai = getGenAI();
          const prompt = `You are an intelligent Alumni Career & Industry Taxonomist.
Given the user's input:
- Typed characters / keywords: "${q}"
- Job Title: "${jobTitle}"
- Academic Department: "${department}"

Generate a list of 5 to 7 concise, highly relevant, and professional industry or domain sector titles that match this input.
Return ONLY a valid JSON array of strings, e.g. ["Fintech & Payments", "Cloud Architecture & DevOps", "Decentralized Finance & Web3"].
Do not include markdown codeblocks or explanation.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt
          });

          let text = response.text?.trim() || '';
          if (text.startsWith('```json')) {
            text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (text.startsWith('```')) {
            text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return res.json({ success: true, data: parsed });
          }
        } catch (aiErr) {
          console.warn('Gemini Industry AI Fallback to taxonomy:', aiErr);
        }
      }

      // Fast, smart fuzzy taxonomy filter
      let filtered = baseList;
      if (q) {
        const lowerQ = q.toLowerCase();
        filtered = baseList.filter(item => item.toLowerCase().includes(lowerQ));
        // If not enough matches, synthesize customized suggestion
        if (filtered.length === 0) {
          const capitalized = q.charAt(0).toUpperCase() + q.slice(1);
          filtered = [`${capitalized} & Digital Innovation`, `${capitalized} Technologies`, `${capitalized} Services`];
        }
      }

      res.json({ success: true, data: filtered.slice(0, 6) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 9. LinkedIn Profile Import & Authentication Gateway
  // ====================================================================
  app.post('/api/integrations/linkedin/import', async (req, res) => {
    try {
      const { vanityUrl, authCode, tgUserId } = req.body;
      const targetId = vanityUrl || 'adebayo-ogundimu';

      // Look up profile data
      const linkedinData = db.getLinkedInProfile(targetId);
      if (!linkedinData) {
        return res.status(404).json({ success: false, error: 'LinkedIn profile could not be retrieved.' });
      }

      res.json({
        success: true,
        data: linkedinData,
        message: 'Successfully imported LinkedIn experience and skills.'
      });
    } catch (err: any) {
      console.error('LinkedIn Import Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 10. ZebraWallet (`zebrawallet.org`) & Alumni Financial Transactions
  // ====================================================================
  app.get('/api/wallet/monetization-terms', (req, res) => {
    res.json({
      success: true,
      data: {
        platformFeeRate: 0.015, // 1.5% Standard Platform Fee
        developmentSurchargeRate: 0.005, // 0.5% University Development Levy
        totalRate: 0.020, // 2.0% Total transaction fee
        gatewayProvider: 'zebrawallet.org',
        termsNotice: 'All financial transactions (annual dues, donations, levies, contributions) processed via ZebraWallet Gateway (zebrawallet.org). A standard 1.5% platform transaction fee and 0.5% university development levy are automatically allocated.'
      }
    });
  });

  app.get('/api/wallet/me', (req, res) => {
    try {
      const userId = (req.query.userId as string) || (req.query.tgUserId as string) || '984102941';
      const wallet = db.getWallet(userId);
      res.json({ success: true, data: wallet });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/wallet/link', (req, res) => {
    try {
      const { userId, customAddress } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }
      const wallet = db.linkWallet(userId, customAddress);
      res.json({ success: true, data: wallet });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/wallet/transactions', (req, res) => {
    try {
      const userId = req.query.userId as string;
      const institutionId = req.query.institutionId as string;
      const transactions = db.getTransactions(userId, institutionId);
      res.json({ success: true, data: transactions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/wallet/transact', (req, res) => {
    try {
      const {
        institutionId,
        profileId,
        userId,
        type,
        title,
        description,
        subtotal,
        currency,
        payerName,
        category
      } = req.body;

      if (!userId || !institutionId || !type || subtotal === undefined) {
        return res.status(400).json({
          success: false,
          error: 'userId, institutionId, type, and subtotal are required'
        });
      }

      const result = db.createTransaction({
        institutionId,
        profileId,
        userId,
        type,
        title: title || 'Alumni Payment',
        description: description || 'Alumni financial transaction via ZebraWallet Gateway',
        subtotal: Number(subtotal),
        currency: currency || 'USD',
        payerName,
        category
      });

      res.json({
        success: true,
        data: result.transaction,
        wallet: result.updatedWallet,
        message: 'Transaction processed successfully via ZebraWallet Gateway.'
      });
    } catch (err: any) {
      console.error('Transaction Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 11. Directory Matching Alumni Alerts
  // ====================================================================
  app.get('/api/directory/matches', (req, res) => {
    try {
      const profileId = req.query.profileId as string;
      if (!profileId) {
        return res.status(400).json({ success: false, error: 'profileId is required' });
      }
      const matches = db.getMatchingAlumni(profileId);
      res.json({ success: true, data: matches });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 12. University News & Official Press Releases API
  // ====================================================================
  app.get('/api/institutions/:institutionId/news', (req, res) => {
    try {
      const news = db.getNewsByInstitution(req.params.institutionId);
      res.json({ success: true, data: news });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/news/:id', (req, res) => {
    try {
      const item = db.getNewsItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'News item not found' });
      }
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 13. Recent Telegram Messages Community Feed API
  // ====================================================================
  app.get('/api/messages/recent', (req, res) => {
    try {
      const messages = db.getRecentMessages();
      res.json({ success: true, data: messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/messages/recent', (req, res) => {
    try {
      const { senderName, senderTgUsername, senderPhotoUrl, senderHeadline, topic, messageSnippet, channelName, isVerifiedAlumnus } = req.body;
      if (!senderName || !messageSnippet) {
        return res.status(400).json({ success: false, error: 'senderName and messageSnippet are required' });
      }
      const newMsg = db.addRecentMessage({
        senderName,
        senderTgUsername,
        senderPhotoUrl,
        senderHeadline,
        topic: topic || 'AlumniChat',
        messageSnippet,
        channelName: channelName || 'Official Alumni Supergroup',
        isVerifiedAlumnus: isVerifiedAlumnus ?? true
      });
      res.json({ success: true, data: newMsg });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ====================================================================
  // 14. Career Milestones API
  // ====================================================================
  app.get('/api/profiles/:profileId/milestones', (req, res) => {
    try {
      const milestones = db.getCareerMilestones(req.params.profileId);
      res.json({ success: true, data: milestones });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/profiles/:profileId/milestones', (req, res) => {
    try {
      const { title, organization, year, type, description, skills, credentialUrl } = req.body;
      if (!title || !organization || !year || !type) {
        return res.status(400).json({ success: false, error: 'title, organization, year, and type are required' });
      }
      const milestone = db.addCareerMilestone(req.params.profileId, {
        title,
        organization,
        year,
        type,
        description: description || '',
        skills: skills || [],
        credentialUrl
      });
      res.json({ success: true, data: milestone });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/profiles/:profileId/milestones/:milestoneId', (req, res) => {
    try {
      db.deleteCareerMilestone(req.params.profileId, req.params.milestoneId);
      res.json({ success: true, message: 'Milestone removed successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // ====================================================================
  // Vite Middleware Setup
  // ====================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Telegram Alumni TMA Platform running on port ${PORT}`);
  });
}

startServer();
