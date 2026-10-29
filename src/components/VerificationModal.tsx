import React, { useState, useEffect } from 'react';
import { Institution, AlumniProfile, TelegramUser } from '../types';
import {
  ShieldCheck,
  ExternalLink,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  Copy,
  Check,
  Building,
  KeyRound,
  Fingerprint
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution;
  profile: AlumniProfile;
  currentUser: TelegramUser;
  onVerificationComplete: (updatedProfile: AlumniProfile, inviteLink: string) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  institution,
  profile,
  currentUser,
  onVerificationComplete,
}) => {
  const [step, setStep] = useState<'intro' | 'portal_auth' | 'processing' | 'verified'>('intro');
  const [portalPassword, setPortalPassword] = useState('demo1234');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{
    inviteLink: string;
    expiresAt: string;
    botDelivered?: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [oauthSession, setOauthSession] = useState<{
    stateToken: string;
    redirectUrl: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('intro');
      setError(null);
      setInviteResult(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Trigger celebratory confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }
  };

  // Step 1: Start OAuth2 Session
  const handleStartOAuth = async () => {
    setIsLoading(true);
    setError(null);
    TelegramSdkWrapper.haptic('medium');

    try {
      const data = await safeFetchJson<{ stateToken: string; redirectUrl: string }>('/api/auth/oauth-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: institution.id,
          profileId: profile.id,
          tgUserId: currentUser.tgUserId
        })
      });

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to initialize verification session');
      }

      setOauthSession(data.data);
      setStep('portal_auth');
    } catch (err: any) {
      setError(err.message || 'Could not connect to university portal gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Authorize in School Portal & Dispatch OAuth Callback
  const handleAuthorizePortal = async () => {
    if (!oauthSession) return;
    setIsLoading(true);
    setError(null);
    setStep('processing');
    TelegramSdkWrapper.haptic('medium');

    try {
      // Simulate OAuth redirect handshake with university API backend
      await new Promise(resolve => setTimeout(resolve, 1400));

      const callbackData = await safeFetchJson<any>('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          state: oauthSession.stateToken,
          code: `AUTH_CODE_${Math.floor(100000 + Math.random() * 900000)}`,
          token: `BEARER_PORTAL_TOKEN_${Date.now()}`
        })
      });

      if (!callbackData.success || !callbackData.data) {
        throw new Error(callbackData.error || 'Portal verification failed. Invalid credentials.');
      }

      const verifiedProfile = callbackData.data.profile;
      const link = callbackData.data.inviteLink;
      const botNotification = callbackData.data.botNotification;

      setInviteResult({
        inviteLink: link,
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        botDelivered: botNotification?.delivered
      });

      setStep('verified');
      TelegramSdkWrapper.haptic('success');
      triggerConfetti();
      onVerificationComplete(verifiedProfile, link);
    } catch (err: any) {
      setError(err.message || 'OAuth verification failed');
      setStep('portal_auth');
      TelegramSdkWrapper.haptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct 1-Click Verification Bypass (Alternative)
  const handleFastDirectVerify = async () => {
    setIsLoading(true);
    setError(null);
    setStep('processing');
    TelegramSdkWrapper.haptic('heavy');

    try {
      const data = await safeFetchJson<any>('/api/auth/direct-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: institution.id,
          profileId: profile.id,
          matricNo: profile.matriculationNo
        })
      });

      if (!data.success || !data.data) throw new Error(data.error || 'Failed direct verification');

      setInviteResult({
        inviteLink: data.data.inviteLink,
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        botDelivered: true
      });

      setStep('verified');
      TelegramSdkWrapper.haptic('success');
      triggerConfetti();
      onVerificationComplete(data.data.profile, data.data.inviteLink);
    } catch (err: any) {
      setError(err.message);
      setStep('intro');
      TelegramSdkWrapper.haptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteResult?.inviteLink) return;
    navigator.clipboard.writeText(inviteResult.inviteLink);
    setCopiedLink(true);
    TelegramSdkWrapper.haptic('light');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Official Portal Verification
              </h2>
              <p className="text-xs text-slate-400">
                {institution.shortName} Registry Gateway
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div>
                <strong className="block font-semibold">Verification Error</strong>
                {error}
              </div>
            </div>
          )}

          {/* VIEW: INTRO */}
          {step === 'intro' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={institution.logoUrl}
                    alt={institution.shortName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-white/10"
                  />
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">
                      {institution.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {institution.portalType === 'OAUTH2_SSO'
                        ? 'Automated OAuth2 Single Sign-On'
                        : 'Student Information System Registry API'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Matriculation No</span>
                    <span className="font-mono font-bold text-slate-200">
                      {profile.matriculationNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Class of</span>
                    <span className="font-semibold text-slate-200">
                      {profile.graduationYear} ({profile.department})
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Connects securely with external university portal API (
                    <span className="text-blue-400 font-mono text-[10px]">
                      {institution.portalBaseUrl}
                    </span>
                    )
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Validates department records, graduation status, and alumni standing.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Triggers automated Telegram Bot webhook to issue a unique, single-use
                    supergroup chat invite link.
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleStartOAuth}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Verify via {institution.shortName} Portal OAuth2
                    </>
                  )}
                </button>

                <button
                  onClick={handleFastDirectVerify}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                  Instant Direct Matriculation Validation
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PORTAL AUTH (SSO Simulation Screen) */}
          {step === 'portal_auth' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-gradient-to-b from-slate-800 to-slate-850 rounded-xl border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    SSO Handshake Active
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3 text-emerald-400" /> TLS 1.3 256-bit
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={institution.logoUrl}
                    alt={institution.shortName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-100">
                      {institution.name} e-Portal
                    </div>
                    <div className="text-xs text-slate-400">
                      Identity & Records Verification Service
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-2.5 pt-2 border-t border-slate-700/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Student / Alumni Matriculation Number
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={profile.matriculationNo}
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Portal Password / PIN / Security Passcode
                    </label>
                    <input
                      type="password"
                      value={portalPassword}
                      onChange={e => setPortalPassword(e.target.value)}
                      placeholder="Enter portal password"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Simulated university credential (prefilled for demo verification)
                    </span>
                  </div>

                  {oauthSession && (
                    <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 space-y-0.5">
                      <div><span className="text-slate-500">Callback Route:</span> /api/auth/callback</div>
                      <div className="truncate"><span className="text-slate-500">CSRF State:</span> {oauthSession.stateToken}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('intro')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAuthorizePortal}
                  disabled={isLoading}
                  className="flex-[2] py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Authorize & Grant Alumni Badge
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PROCESSING */}
          {step === 'processing' && (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-200">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Authenticating with University Registry...
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Validating token signature at <span className="font-mono text-cyan-400">{institution.portalBaseUrl}</span> and dispatching Telegram bot invite webhook.
                </p>
              </div>
            </div>
          )}

          {/* VIEW: VERIFIED & INVITE LINK GENERATED */}
          {step === 'verified' && inviteResult && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-xl text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-lg shadow-emerald-500/30">
                  ✓
                </div>
                <h3 className="text-base font-bold text-emerald-400">
                  Official Verification Approved!
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Congratulations, <strong className="text-white">{currentUser.tgFirstName}</strong>! Your alumni identity for <strong className="text-white">{institution.name}</strong> has been officially confirmed.
                </p>
              </div>

              {/* Exclusive Telegram Supergroup Box */}
              <div className="p-4 bg-slate-800/80 rounded-xl border border-blue-500/40 space-y-3 shadow-lg shadow-blue-950/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                    Single-Use Telegram Chat Invite Link
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                    1 Join Limit
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.inviteLink}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-xs font-semibold text-slate-200 rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>🔒 Valid for 48 hours</span>
                  <span className="text-emerald-400 font-medium">
                    {inviteResult.botDelivered ? '✓ Delivered to Telegram DM' : '⚡ Direct Access Ready'}
                  </span>
                </div>

                <a
                  href={inviteResult.inviteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    TelegramSdkWrapper.haptic('heavy');
                    TelegramSdkWrapper.openLink(inviteResult.inviteLink);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 active:scale-98 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Join {institution.shortName} Verified Supergroup Now
                  <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                </a>
              </div>

              <button
                onClick={() => {
                  TelegramSdkWrapper.haptic('light');
                  onClose();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
              >
                Done & Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
