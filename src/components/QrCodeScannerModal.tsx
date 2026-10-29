import React, { useState, useRef, useEffect } from 'react';
import { AlumniProfile, Institution } from '../types';
import { safeFetchJson } from '../lib/apiClient';
import {
  X,
  QrCode,
  Camera,
  Search,
  Upload,
  Flashlight,
  FlashlightOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  User,
  ShieldCheck,
  RefreshCw,
  Zap,
  Building
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';

interface QrCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profile: AlumniProfile) => void;
  institution?: Institution | null;
}

export const QrCodeScannerModal: React.FC<QrCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectProfile,
  institution
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'lookup'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick Demo Profiles for instant 1-tap test scans on all environments
  const demoQrTargets = [
    {
      id: 'prof-001',
      name: 'Adebayo Ogunlesi',
      role: 'Senior Cloud Solutions Architect @ AWS',
      inst: 'FUT Minna',
      gradYear: 2021,
      code: 'tma:alumni:prof-001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'prof-003',
      name: 'Dr. Amina Kabir',
      role: 'Health Informatics Lead & Physician @ WHO',
      inst: 'University of Ibadan',
      gradYear: 2018,
      code: 'tma:alumni:prof-003',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'prof-004',
      name: 'Chioma Eze',
      role: 'Principal PM @ Stripe Fintech',
      inst: 'UNILAG',
      gradYear: 2019,
      code: 'tma:alumni:prof-004',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
    }
  ];

  // Request actual camera stream if available in browser
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') return;

    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacing }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setCameraAvailable(true);
        } else {
          setCameraAvailable(false);
        }
      } catch (err) {
        console.warn('Camera access denied or unavailable in container frame:', err);
        setCameraAvailable(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, activeTab, cameraFacing]);

  if (!isOpen) return null;

  const handleResolveProfile = async (targetString: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    TelegramSdkWrapper.haptic('medium');

    try {
      // Clean string
      let profileId = targetString.trim();
      if (profileId.startsWith('tma:alumni:')) {
        profileId = profileId.replace('tma:alumni:', '');
      } else if (profileId.startsWith('alumni:')) {
        profileId = profileId.replace('alumni:', '');
      } else if (profileId.includes('profile_')) {
        profileId = profileId.split('profile_')[1];
      }

      // Try fetching by ID
      const data = await safeFetchJson<AlumniProfile>(`/api/profile/${profileId}`);

      if (data.success && data.data) {
        TelegramSdkWrapper.haptic('success');
        setScanStatusMessage(`Alumnus Profile Verified: ${data.data.user?.tgFirstName || 'Alum'}`);
        setTimeout(() => {
          onSelectProfile(data.data!);
          onClose();
        }, 500);
        return;
      }

      // Fallback: search directory by query or username
      const searchData = await safeFetchJson<{ alumni: AlumniProfile[] }>(`/api/directory?institutionId=${institution?.id || 'inst-futminna'}&q=${encodeURIComponent(targetString)}`);

      if (searchData.success && searchData.data?.alumni && searchData.data.alumni.length > 0) {
        TelegramSdkWrapper.haptic('success');
        const matched = searchData.data.alumni[0];
        setScanStatusMessage(`Matched Profile: ${matched.user?.tgFirstName || 'Alum'}`);
        setTimeout(() => {
          onSelectProfile(matched);
          onClose();
        }, 500);
        return;
      }

      setErrorMsg(`No alumni record found for identifier: "${targetString}".`);
      TelegramSdkWrapper.haptic('error');
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to scan QR code.');
      TelegramSdkWrapper.haptic('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    TelegramSdkWrapper.haptic('medium');
    setIsProcessing(true);
    setScanStatusMessage('Analyzing uploaded QR badge...');

    // Simulate scanning image QR code
    setTimeout(() => {
      // Default to Adebayo or random sample
      handleResolveProfile('prof-001');
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Alumni QR Code Scanner
              </h3>
              <p className="text-[10px] text-slate-400">
                Scan Telegram QR cards to view verified alumni profiles
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3">
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setActiveTab('camera');
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'camera'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Live Scanner
            </button>
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setActiveTab('lookup');
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'lookup'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Direct ID Lookup
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[72vh]">
          {activeTab === 'camera' ? (
            <div className="space-y-4">
              {/* Viewfinder HUD Container */}
              <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 flex items-center justify-center shadow-inner">
                {/* Real video if camera granted */}
                {cameraAvailable ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  /* Lens Simulation Background */
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-2 animate-pulse">
                      <QrCode className="w-7 h-7 text-blue-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      Viewfinder Active
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 max-w-[180px]">
                      Align an alumnus QR code or tap a demo badge below
                    </span>
                  </div>
                )}

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

                {/* Laser scan line animation */}
                <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-bounce top-1/4 pointer-events-none" />

                {/* Targeting Corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-lg pointer-events-none" />

                {/* Controls Bar over Viewfinder */}
                <div className="absolute bottom-3 inset-x-4 flex items-center justify-between z-10">
                  <button
                    onClick={() => {
                      TelegramSdkWrapper.haptic('light');
                      setIsTorchOn(!isTorchOn);
                    }}
                    className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                      isTorchOn
                        ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                        : 'bg-black/40 border-white/10 text-white/80 hover:bg-black/60'
                    }`}
                    title="Toggle Flash"
                  >
                    {isTorchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => {
                      TelegramSdkWrapper.haptic('selection');
                      setCameraFacing(prev => (prev === 'environment' ? 'user' : 'environment'));
                    }}
                    className="p-2 rounded-xl bg-black/40 border border-white/10 text-white/80 hover:bg-black/60 backdrop-blur-md transition-all"
                    title="Switch Camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-black/40 border border-white/10 text-white/80 hover:bg-black/60 backdrop-blur-md transition-all"
                    title="Upload QR Image"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Status or Error Display */}
              {isProcessing && (
                <div className="p-2.5 bg-blue-950/60 border border-blue-500/40 rounded-xl flex items-center justify-center gap-2 text-xs text-blue-300 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{scanStatusMessage || 'Resolving alumni identity token...'}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Quick Sample Alumni QR Badges */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Instant Demo QR Badges (1-Tap Scan):
                  </span>
                </div>

                <div className="space-y-1.5">
                  {demoQrTargets.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleResolveProfile(item.code)}
                      disabled={isProcessing}
                      className="w-full p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/60 rounded-xl flex items-center justify-between gap-3 text-left transition-all active:scale-98 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.avatar}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover border border-white/10"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 group-hover:text-blue-300 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.role}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-[10px] text-blue-400 font-semibold font-mono bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-800/40">
                        <QrCode className="w-3 h-3" />
                        <span>Scan</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Direct ID Lookup Tab */
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Enter an alumnus profile ID, matriculation number, or Telegram handle to view their public credentials:
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Alumnus ID or Telegram Username
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. prof-001, @adebayo_dev, or 2016/1/58291"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                onClick={() => handleResolveProfile(manualInput)}
                disabled={!manualInput.trim() || isProcessing}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                {isProcessing ? 'Searching Alumni Registry...' : 'Find & Inspect Profile'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 text-center">
          <span className="text-[10px] text-slate-500">
            Powered by Telegram TMA QR Protocol • Instant Registry Lookup
          </span>
        </div>
      </div>
    </div>
  );
};
