import React, { useState, useEffect } from 'react';
import {
  Institution,
  TelegramUser,
  AlumniProfile,
  AlumniWallet,
  FinancialTransaction,
  FinancialTransactionType
} from '../types';
import { TelegramSdkWrapper } from '../lib/telegramSdk';
import { safeFetchJson } from '../lib/apiClient';
import {
  detectUserCurrency,
  convertCurrency,
  formatCurrency,
  SUPPORTED_CURRENCIES,
  NIGERIAN_BANKS,
  DESIGNATED_PAYOUT_RAILS
} from '../lib/currency';
import {
  X,
  Wallet,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowUpRight,
  History,
  GraduationCap,
  HeartHandshake,
  FileText,
  AlertCircle,
  ExternalLink,
  Layers,
  Lock,
  Receipt,
  Coins,
  RefreshCw,
  Plus,
  ArrowRightLeft,
  Banknote,
  Globe,
  Building,
  Check,
  Copy,
  Zap,
  Smartphone,
  QrCode
} from 'lucide-react';

interface AlumniWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution?: Institution | null;
  currentUser: TelegramUser;
  profile?: AlumniProfile | null;
  onTransactionSuccess?: () => void;
}

export const AlumniWalletModal: React.FC<AlumniWalletModalProps> = ({
  isOpen,
  onClose,
  institution,
  currentUser,
  profile,
  onTransactionSuccess
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PAY' | 'CONVERTER' | 'HISTORY' | 'TOPUP'>('PAY');
  const [wallet, setWallet] = useState<AlumniWallet | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<FinancialTransaction | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Currency Selection - Defaults to local currency of user's location, or Naira (NGN) if not provided / determinable
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() =>
    detectUserCurrency(profile?.locationCountry, profile?.locationCity)
  );

  // Transaction form state (Base amounts in USD, displayed in selectedCurrency)
  const [selectedType, setSelectedType] = useState<FinancialTransactionType>('ANNUAL_DUES');
  const [customAmount, setCustomAmount] = useState<string>('50');
  const [donationCategory, setDonationCategory] = useState<string>('Student Merit Scholarship Fund');
  const [memoNote, setMemoNote] = useState<string>('');

  // FX & Bank Payout State
  const [payoutMode, setPayoutMode] = useState<'NAIRA_BANK' | 'DESIGNATED_RAIL'>('NAIRA_BANK');
  const [sourceCurrency, setSourceCurrency] = useState<string>('USD');
  const [sourceAmount, setSourceAmount] = useState<string>('100');
  const [selectedBankCode, setSelectedBankCode] = useState<string>(NIGERIAN_BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState<string>('0123456789');
  const [resolvedAccountName, setResolvedAccountName] = useState<string>('ALUMNI TRUSTEE - CLEARANCE ACC');
  const [isResolvingAccount, setIsResolvingAccount] = useState<boolean>(false);
  const [designatedRailId, setDesignatedRailId] = useState<string>(DESIGNATED_PAYOUT_RAILS[0].id);
  const [designatedBeneficiaryInfo, setDesignatedBeneficiaryInfo] = useState<string>('Alumni Endowment Global Clearing');
  const [payoutSuccessData, setPayoutSuccessData] = useState<any | null>(null);

  const [copiedNuban, setCopiedNuban] = useState(false);
  const [copiedUsdt, setCopiedUsdt] = useState(false);
  const [selectedGatewayModal, setSelectedGatewayModal] = useState<string | null>(null);

  // Update default currency if profile changes
  useEffect(() => {
    const locCurr = detectUserCurrency(profile?.locationCountry, profile?.locationCity);
    setSelectedCurrency(locCurr);
  }, [profile?.locationCountry, profile?.locationCity]);

  // Fetch wallet & transactions
  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const walletData = await safeFetchJson<AlumniWallet>(`/api/wallet/me?userId=${currentUser.tgUserId}`);
      if (walletData.success && walletData.data) {
        setWallet(walletData.data);
      }

      if (institution?.id) {
        const txData = await safeFetchJson<FinancialTransaction[]>(
          `/api/wallet/transactions?userId=${currentUser.tgUserId}&institutionId=${institution.id}`
        );
        if (txData.success && txData.data) {
          setTransactions(txData.data);
        }
      }
    } catch (e) {
      console.error('Failed to load wallet data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWalletData();
      setSuccessReceipt(null);
      setPayoutSuccessData(null);
      setErrorMsg(null);
    }
  }, [isOpen, currentUser.tgUserId, institution?.id]);

  // Simulate account resolution on 10-digit account number change
  useEffect(() => {
    if (accountNumber.length === 10) {
      setIsResolvingAccount(true);
      const timer = setTimeout(() => {
        const bank = NIGERIAN_BANKS.find(b => b.code === selectedBankCode);
        const namePrefix = profile?.user ? `${profile.user.tgFirstName} ${profile.user.tgLastName || ''}`.toUpperCase() : 'ALUMNI TREASURY';
        setResolvedAccountName(`${namePrefix} / ${bank?.name.toUpperCase() || 'NIBSS SETTLEMENT'}`);
        setIsResolvingAccount(false);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setResolvedAccountName('');
    }
  }, [accountNumber, selectedBankCode, profile]);

  if (!isOpen) return null;

  // Preset payment packages (default amounts in USD)
  const PAYMENT_PRESETS = [
    {
      type: 'ANNUAL_DUES' as FinancialTransactionType,
      title: `${new Date().getFullYear()} Annual Alumni Statutory Dues`,
      defaultAmountUsd: 50,
      description: `Official statutory annual membership dues for ${institution?.shortName || 'University'} Alumni Association with verified clearance.`,
      icon: GraduationCap,
      category: 'Statutory Dues'
    },
    {
      type: 'ENDOWMENT_DONATION' as FinancialTransactionType,
      title: 'Alumni Endowment & Scholarship Fund',
      defaultAmountUsd: 100,
      description: 'Support high-achieving undergraduate students with tuition grants and campus tech equipment.',
      icon: HeartHandshake,
      category: 'Endowment Donation'
    },
    {
      type: 'DEPARTMENT_LEVY' as FinancialTransactionType,
      title: 'Departmental Lab & Infrastructure Levy',
      defaultAmountUsd: 35,
      description: `Direct allocation to ${profile?.department || 'Departmental'} laboratory upgrades, servers & research.`,
      icon: Building2,
      category: 'Departmental Levy'
    },
    {
      type: 'CHAPTER_CONTRIBUTION' as FinancialTransactionType,
      title: 'Regional Chapter Project & Gala Fund',
      defaultAmountUsd: 25,
      description: 'Funding regional alumni networking galas, career clinics, and community outreach projects.',
      icon: Layers,
      category: 'Chapter Contribution'
    }
  ];

  const currentPreset = PAYMENT_PRESETS.find(p => p.type === selectedType) || PAYMENT_PRESETS[0];

  // Monetization Calculation (in USD base, converted to selected currency for display):
  const subtotalUsd = Math.max(1, parseFloat(customAmount) || 0);
  const platformFeeUsd = Number((subtotalUsd * 0.015).toFixed(2));
  const developmentSurchargeUsd = Number((subtotalUsd * 0.005).toFixed(2));
  const totalBilledUsd = Number((subtotalUsd + platformFeeUsd + developmentSurchargeUsd).toFixed(2));

  // Converted display values in user's selected/local currency
  const totalBilledLocal = convertCurrency(totalBilledUsd, 'USD', selectedCurrency);
  const subtotalLocal = convertCurrency(subtotalUsd, 'USD', selectedCurrency);
  const platformFeeLocal = convertCurrency(platformFeeUsd, 'USD', selectedCurrency);
  const devSurchargeLocal = convertCurrency(developmentSurchargeUsd, 'USD', selectedCurrency);

  // FX Payout calculation
  const parsedSourceAmount = Math.max(1, parseFloat(sourceAmount) || 0);
  const targetConvertedNaira = convertCurrency(parsedSourceAmount, sourceCurrency, 'NGN');
  const targetRail = DESIGNATED_PAYOUT_RAILS.find(r => r.id === designatedRailId) || DESIGNATED_PAYOUT_RAILS[0];
  const targetRailConvertedAmount = convertCurrency(parsedSourceAmount, sourceCurrency, targetRail.currency);

  const handleProcessTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subtotalUsd <= 0) {
      setErrorMsg('Please specify a valid transaction amount.');
      return;
    }

    if (wallet && wallet.balance < totalBilledUsd && selectedType !== 'WALLET_TOPUP') {
      setErrorMsg(`Insufficient ZebraWallet balance ($${wallet.balance.toFixed(2)} USD). Please top up via zebrawallet.org or reduce amount.`);
      TelegramSdkWrapper.haptic('error');
      return;
    }

    TelegramSdkWrapper.haptic('medium');
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const isDues = selectedType === 'ANNUAL_DUES';
      const json = await safeFetchJson<any>('/api/wallet/transact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: institution?.id || 'inst-1',
          profileId: profile?.id,
          userId: currentUser.tgUserId,
          type: selectedType,
          title: currentPreset.title,
          description: isDues
            ? `Verified Clearance for Academic Year ${new Date().getFullYear()}`
            : `${currentPreset.category}: ${memoNote || donationCategory}`,
          subtotal: subtotalUsd,
          currency: 'USD',
          localCurrency: selectedCurrency,
          localAmount: totalBilledLocal,
          payerName: `${currentUser.tgFirstName} ${currentUser.tgLastName || ''}`.trim(),
          category: currentPreset.category,
          metadata: {
            department: profile?.department,
            matricNo: profile?.matriculationNo,
            year: new Date().getFullYear(),
            selectedCurrency,
            rateApplied: SUPPORTED_CURRENCIES[selectedCurrency]?.rateToUsd
          }
        })
      });

      if (json.success && json.data) {
        if (json.wallet) setWallet(json.wallet);
        setTransactions(prev => [json.data, ...prev]);
        setSuccessReceipt(json.data);
        TelegramSdkWrapper.haptic('success');
        if (onTransactionSuccess) onTransactionSuccess();
      } else {
        setErrorMsg(json.error || 'Transaction failed. Please try again.');
        TelegramSdkWrapper.haptic('error');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Network error processing financial settlement.');
      TelegramSdkWrapper.haptic('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteBankPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedSourceAmount <= 0) {
      setErrorMsg('Please enter a valid conversion payout amount.');
      return;
    }

    TelegramSdkWrapper.haptic('medium');
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const selectedBank = NIGERIAN_BANKS.find(b => b.code === selectedBankCode);
      const isNairaPayout = payoutMode === 'NAIRA_BANK';

      const payoutData = {
        txId: `PAYOUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        mode: payoutMode,
        sourceCurrency,
        sourceAmount: parsedSourceAmount,
        targetCurrency: isNairaPayout ? 'NGN' : targetRail.currency,
        targetAmount: isNairaPayout ? targetConvertedNaira : targetRailConvertedAmount,
        destinationBank: isNairaPayout ? selectedBank?.name : targetRail.name,
        accountNumber: isNairaPayout ? accountNumber : 'DESIGNATED-ADMIN-ESCROW',
        accountName: isNairaPayout ? (resolvedAccountName || 'VERIFIED ALUMNI BENEFICIARY') : designatedBeneficiaryInfo,
        reference: `NIBSS-FX-${Date.now()}`,
        status: 'SETTLED_INSTANT',
        timestamp: new Date().toISOString(),
        exchangeRate: `1 ${sourceCurrency} = ${((isNairaPayout ? targetConvertedNaira : targetRailConvertedAmount) / parsedSourceAmount).toLocaleString()} ${isNairaPayout ? 'NGN' : targetRail.currency}`
      };

      // Mock bank payout settlement response
      await new Promise(r => setTimeout(r, 650));
      setPayoutSuccessData(payoutData);
      TelegramSdkWrapper.haptic('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute bank conversion payout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateTopUp = async (topUpAmount: number) => {
    TelegramSdkWrapper.haptic('light');
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const json = await safeFetchJson<any>('/api/wallet/transact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: institution?.id || 'inst-1',
          profileId: profile?.id,
          userId: currentUser.tgUserId,
          type: 'WALLET_TOPUP',
          title: 'ZebraWallet Balance Top-Up',
          description: 'Added funds via ZebraWallet Gateway (zebrawallet.org)',
          subtotal: topUpAmount,
          currency: 'USD',
          payerName: `${currentUser.tgFirstName} ${currentUser.tgLastName || ''}`.trim(),
          category: 'Wallet Top-Up'
        })
      });

      if (json.success) {
        if (json.wallet) setWallet(json.wallet);
        setTransactions(prev => [json.data, ...prev]);
        TelegramSdkWrapper.haptic('success');
        setActiveSubTab('PAY');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDuesPaid = wallet?.duesPaidUntilYear === new Date().getFullYear();
  const currentCurrInfo = SUPPORTED_CURRENCIES[selectedCurrency] || SUPPORTED_CURRENCIES.NGN;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                Alumni Financial Wallet
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  zebrawallet.org
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official gateway for dues, donations, levies & FX payouts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency Selector */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 gap-1">
              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
              <select
                value={selectedCurrency}
                onChange={e => {
                  TelegramSdkWrapper.haptic('selection');
                  setSelectedCurrency(e.target.value);
                }}
                className="bg-transparent text-[11px] text-slate-200 font-bold focus:outline-none cursor-pointer"
                title="Change display currency"
              >
                {Object.values(SUPPORTED_CURRENCIES).map(curr => (
                  <option key={curr.code} value={curr.code} className="bg-slate-900 text-slate-100">
                    {curr.flag} {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('light');
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wallet Overview Card */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800/80">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950/50 border border-emerald-500/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Wallet className="w-24 h-24 text-emerald-400" />
            </div>

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">
                  AVAILABLE BALANCE • ZEBRAWALLET
                </span>
                <div className="text-2xl font-black text-slate-100 mt-0.5 flex items-baseline gap-1.5 font-mono">
                  <span>{formatCurrency(convertCurrency(wallet?.balance || 0, 'USD', 'NGN'), 'NGN', { showCode: true })}</span>
                </div>
                <div className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5 font-mono">
                  <span>≈ ${wallet ? wallet.balance.toFixed(2) : '0.00'} USD</span>
                  {selectedCurrency !== 'NGN' && selectedCurrency !== 'USD' && (
                    <span className="text-slate-400 text-[10px]">
                      (≈ {formatCurrency(convertCurrency(wallet?.balance || 0, 'USD', selectedCurrency), selectedCurrency)})
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{wallet?.walletId || `ZW-ALUMNI-${currentUser.tgUserId}`}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                {isDuesPaid ? (
                  <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {new Date().getFullYear()} Dues Paid
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/80 text-amber-300 rounded-full text-[10px] font-bold">
                    {new Date().getFullYear()} Dues Pending
                  </span>
                )}

                <button
                  onClick={() => setActiveSubTab('TOPUP')}
                  className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" /> Top Up
                </button>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setActiveSubTab('PAY');
                setSuccessReceipt(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeSubTab === 'PAY'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              Pay Dues
            </button>
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setActiveSubTab('CONVERTER');
                setPayoutSuccessData(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all ${
                activeSubTab === 'CONVERTER'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>FX Payouts</span>
            </button>
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setActiveSubTab('HISTORY');
              }}
              className={`py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all ${
                activeSubTab === 'HISTORY'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3 h-3" />
              <span>History</span>
            </button>
            <button
              onClick={() => {
                TelegramSdkWrapper.haptic('selection');
                setActiveSubTab('TOPUP');
              }}
              className={`py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all ${
                activeSubTab === 'TOPUP'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>Top Up</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: MAKE PAYMENT */}
          {activeSubTab === 'PAY' && !successReceipt && (
            <form onSubmit={handleProcessTransaction} className="space-y-4">
              {/* Category Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Select Clearance or Contribution Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PAYMENT_PRESETS.map(preset => {
                    const Icon = preset.icon;
                    const isSelected = selectedType === preset.type;
                    const convertedPresetAmount = convertCurrency(preset.defaultAmountUsd, 'USD', selectedCurrency);

                    return (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => {
                          TelegramSdkWrapper.haptic('selection');
                          setSelectedType(preset.type);
                          setCustomAmount(preset.defaultAmountUsd.toString());
                        }}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-950/40 text-emerald-100'
                            : 'bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs truncate">{preset.title}</div>
                          <div className="text-[11px] text-emerald-400 font-mono font-semibold mt-0.5">
                            {formatCurrency(convertedPresetAmount, selectedCurrency)} ({preset.defaultAmountUsd} USD)
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Editor */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Contribution Amount (USD Base)
                  </label>
                  <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                    Local: {formatCurrency(subtotalLocal, selectedCurrency)}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-20 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-semibold">
                    USD
                  </span>
                </div>

                {/* Breakdown */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span className="font-mono text-slate-300">${subtotalUsd.toFixed(2)} ({formatCurrency(subtotalLocal, selectedCurrency)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zebra Gateway Platform Fee (1.5%):</span>
                    <span className="font-mono text-slate-300">${platformFeeUsd.toFixed(2)} ({formatCurrency(platformFeeLocal, selectedCurrency)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{institution?.shortName || 'University'} Endowment Levy (0.5%):</span>
                    <span className="font-mono text-slate-300">${developmentSurchargeUsd.toFixed(2)} ({formatCurrency(devSurchargeLocal, selectedCurrency)})</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 text-xs font-bold text-emerald-400">
                    <span>Total Billed:</span>
                    <span className="font-mono">${totalBilledUsd.toFixed(2)} USD ≈ {formatCurrency(totalBilledLocal, selectedCurrency, { showCode: true })}</span>
                  </div>
                </div>
              </div>

              {/* Note / Memo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Transaction Note / Academic Reference (Optional)
                </label>
                <input
                  type="text"
                  value={memoNote}
                  onChange={e => setMemoNote(e.target.value)}
                  placeholder={`e.g. ${profile?.matriculationNo || 'Matric No'} clearance, graduation class project`}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Authorize Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-98 transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {isProcessing
                  ? 'Processing Settlement...'
                  : `Authorize ${formatCurrency(totalBilledLocal, selectedCurrency)} ($${totalBilledUsd.toFixed(2)} USD)`}
              </button>
            </form>
          )}

          {/* TAB 2: FX CONVERTER & BANK PAYOUTS */}
          {activeSubTab === 'CONVERTER' && !payoutSuccessData && (
            <div className="space-y-4">
              {/* Payout Mode Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    TelegramSdkWrapper.haptic('selection');
                    setPayoutMode('NAIRA_BANK');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    payoutMode === 'NAIRA_BANK'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Naira Bank Payout (₦)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    TelegramSdkWrapper.haptic('selection');
                    setPayoutMode('DESIGNATED_RAIL');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    payoutMode === 'DESIGNATED_RAIL'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Designated Admin Currency</span>
                </button>
              </div>

              {/* Conversion Calculator Card */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Real-Time Currency Conversion</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                    Live FX Rates
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* From Currency & Amount */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">From (Source Currency)</label>
                    <div className="flex gap-1.5">
                      <select
                        value={sourceCurrency}
                        onChange={e => setSourceCurrency(e.target.value)}
                        className="bg-slate-850 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-100 focus:outline-none"
                      >
                        {Object.values(SUPPORTED_CURRENCIES).map(curr => (
                          <option key={curr.code} value={curr.code}>
                            {curr.flag} {curr.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={sourceAmount}
                        onChange={e => setSourceAmount(e.target.value)}
                        className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  {/* To Currency Result */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">
                      {payoutMode === 'NAIRA_BANK' ? 'To Nigerian Naira (NGN)' : `To ${targetRail.name}`}
                    </label>
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">Equivalent:</span>
                      <span className="text-sm font-black text-emerald-300 font-mono">
                        {payoutMode === 'NAIRA_BANK'
                          ? formatCurrency(targetConvertedNaira, 'NGN', { showCode: true })
                          : formatCurrency(targetRailConvertedAmount, targetRail.currency, { showCode: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-850 flex justify-between">
                  <span>Exchange Rate Applied:</span>
                  <span className="text-slate-300">
                    1 {sourceCurrency} ≈{' '}
                    {payoutMode === 'NAIRA_BANK'
                      ? `${(targetConvertedNaira / parsedSourceAmount).toLocaleString()} NGN`
                      : `${(targetRailConvertedAmount / parsedSourceAmount).toFixed(2)} ${targetRail.currency}`}
                  </span>
                </div>
              </div>

              {/* Mode-Specific Bank & Account Details */}
              {payoutMode === 'NAIRA_BANK' ? (
                <form onSubmit={handleExecuteBankPayout} className="space-y-3 p-4 bg-slate-850/80 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-700/60">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-200">
                      Nigerian Bank Account Details (NIBSS Direct)
                    </h4>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">
                      Select Nigerian Bank
                    </label>
                    <select
                      value={selectedBankCode}
                      onChange={e => setSelectedBankCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {NIGERIAN_BANKS.map(bank => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">
                      10-Digit NUBAN Account Number
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 tracking-wider focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. 0123456789"
                      required
                    />
                  </div>

                  {/* Auto-resolved Account Name */}
                  {isResolvingAccount ? (
                    <div className="p-2 bg-slate-900 rounded-lg text-[11px] text-slate-400 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                      <span>Resolving NUBAN bank account with Central Bank switch...</span>
                    </div>
                  ) : resolvedAccountName ? (
                    <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-bold">{resolvedAccountName}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono">
                        VERIFIED
                      </span>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-98 transition-all disabled:opacity-50 mt-2"
                  >
                    <Banknote className="w-4 h-4" />
                    {isProcessing
                      ? 'Executing Payout...'
                      : `Payout ₦${targetConvertedNaira.toLocaleString()} NGN to Bank Account`}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleExecuteBankPayout} className="space-y-3 p-4 bg-slate-850/80 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-700/60">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-200">
                      Designated Alumni Admin Payout Rail
                    </h4>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">
                      Designated Payout Destination
                    </label>
                    <select
                      value={designatedRailId}
                      onChange={e => setDesignatedRailId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {DESIGNATED_PAYOUT_RAILS.map(rail => (
                        <option key={rail.id} value={rail.id}>
                          {rail.flag} {rail.name} ({rail.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">
                      Admin Beneficiary / Account Routing Details
                    </label>
                    <input
                      type="text"
                      value={designatedBeneficiaryInfo}
                      onChange={e => setDesignatedBeneficiaryInfo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                      placeholder="e.g. IBAN, Sort Code, Routing Number or Escrow Key"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 active:scale-98 transition-all disabled:opacity-50 mt-2"
                  >
                    <Globe className="w-4 h-4" />
                    {isProcessing
                      ? 'Executing Settlement...'
                      : `Transfer ${formatCurrency(targetRailConvertedAmount, targetRail.currency, { showCode: true })}`}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2 SUCCESS RECEIPT */}
          {activeSubTab === 'CONVERTER' && payoutSuccessData && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/50 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-100">
                  Bank Conversion & Payout Successful
                </h4>
                <p className="text-xs text-slate-300">
                  Funds converted and dispatched via direct settlement switch.
                </p>
              </div>

              {/* Payout Receipt Card */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <div className="font-bold text-slate-100 text-sm">
                      FX SETTLEMENT CLEARANCE
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Gateway: NIBSS / Zebra Global
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] font-bold">
                    DISPATCHED / INSTANT
                  </span>
                </div>

                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ref Code:</span>
                    <span className="font-bold text-slate-100">{payoutSuccessData.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Source Amount:</span>
                    <span>{payoutSuccessData.sourceAmount} {payoutSuccessData.sourceCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Converted Amount:</span>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(payoutSuccessData.targetAmount, payoutSuccessData.targetCurrency, { showCode: true })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Destination:</span>
                    <span>{payoutSuccessData.destinationBank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Beneficiary:</span>
                    <span className="text-slate-200">{payoutSuccessData.accountName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Rate Applied:</span>
                    <span>{payoutSuccessData.exchangeRate}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  TelegramSdkWrapper.haptic('selection');
                  setPayoutSuccessData(null);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Execute Another Payout
              </button>
            </div>
          )}

          {/* TAB 1 SUCCESS: DIGITAL CLEARANCE RECEIPT */}
          {activeSubTab === 'PAY' && successReceipt && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/50 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-100">
                  Payment Verified & Settled
                </h4>
                <p className="text-xs text-slate-300">
                  Thank you for your contribution to {institution?.name || 'the Alumni Association'}.
                </p>
              </div>

              {/* Official Receipt Card */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <div className="font-bold text-slate-100 text-sm">
                      {institution?.shortName || 'ALUMNI'} CLEARANCE
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Gateway: zebrawallet.org
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] font-bold">
                    PAID / VERIFIED
                  </span>
                </div>

                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Receipt No:</span>
                    <span className="font-bold text-slate-100">{successReceipt.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zebra TxRef:</span>
                    <span>{successReceipt.gatewayRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Purpose:</span>
                    <span>{successReceipt.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal:</span>
                    <span>${successReceipt.subtotal.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Platform Fee (1.5%):</span>
                    <span>${successReceipt.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>University Levy (0.5%):</span>
                    <span>${successReceipt.developmentSurcharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 text-emerald-400 font-bold text-sm">
                    <span>Total Settled:</span>
                    <span>
                      ${successReceipt.totalAmount.toFixed(2)} USD (≈ {formatCurrency(convertCurrency(successReceipt.totalAmount, 'USD', selectedCurrency), selectedCurrency, { showCode: true })})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    TelegramSdkWrapper.haptic('selection');
                    setSuccessReceipt(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Make Another Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    TelegramSdkWrapper.haptic('selection');
                    setActiveSubTab('HISTORY');
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow"
                >
                  <History className="w-3.5 h-3.5" /> View Ledger
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTION HISTORY */}
          {activeSubTab === 'HISTORY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Audit Ledger ({transactions.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Immutable Cryptographic Records
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No recorded transactions yet</p>
                  <p className="text-[11px] text-slate-500">
                    Your payments and dues clearances will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-xs text-slate-200 truncate">
                            {tx.title}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="font-mono">{tx.receiptNumber}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-xs text-emerald-400">
                            +${tx.totalAmount.toFixed(2)} USD
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {formatCurrency(convertCurrency(tx.totalAmount, 'USD', selectedCurrency), selectedCurrency)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px]">
                        <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded font-mono">
                          {tx.category}
                        </span>
                        <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> SETTLED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TOP UP */}
          {activeSubTab === 'TOPUP' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-100">
                    Instant ZebraWallet Top-Up
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ZebraWallet (<a href="https://zebrawallet.org" target="_blank" rel="noreferrer" className="text-emerald-400 underline">zebrawallet.org</a>) enables rapid wallet funding using bank transfers, debit cards, USSD, or crypto for seamless dues settlement.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Quick Deposit Packages (ZebraWallet)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 50, 100, 200, 500, 1000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => handleSimulateTopUp(amount)}
                      disabled={isProcessing}
                      className="p-3 bg-slate-850 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/80 rounded-xl text-center space-y-1 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <div className="font-bold text-sm text-slate-100">${amount}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ≈ {formatCurrency(convertCurrency(amount, 'USD', 'NGN'), 'NGN')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Payment Gateways & Channels Card */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-100">
                      Other Payment Gateways & Channels
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                    Multi-Rail
                  </span>
                </div>

                {/* 1. Nigerian Local Gateways */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>🇳🇬</span> Nigerian Local Gateways
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Instant Naira Settlement</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Paystack */}
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-blue-500/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-xs font-mono">
                            P
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">Paystack</div>
                            <div className="text-[10px] text-slate-400">Cards, Transfer, USSD, Apple Pay</div>
                          </div>
                        </div>
                        <span className="text-[9px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800 font-mono">
                          Local NGN
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSimulateTopUp(50)}
                        disabled={isProcessing}
                        className="w-full py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                      >
                        <Zap className="w-3 h-3 text-blue-400" /> Pay with Paystack
                      </button>
                    </div>

                    {/* Flutterwave */}
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-amber-500/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs font-mono">
                            F
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">Flutterwave</div>
                            <div className="text-[10px] text-slate-400">NUBAN, Cards, Mobile Money</div>
                          </div>
                        </div>
                        <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800 font-mono">
                          Pan-Africa
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSimulateTopUp(50)}
                        disabled={isProcessing}
                        className="w-full py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                      >
                        <Zap className="w-3 h-3 text-amber-400" /> Pay with Flutterwave
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. International Gateways */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>🌐</span> International Gateways
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Global Card & Wire</span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-indigo-500/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black text-xs font-mono">
                          S
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">Stripe Global Checkout</div>
                          <div className="text-[10px] text-slate-400">Visa, Mastercard, Amex, Apple Pay, Google Pay</div>
                        </div>
                      </div>
                      <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800 font-mono">
                        USD / GBP / EUR
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSimulateTopUp(100)}
                      disabled={isProcessing}
                      className="w-full py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                    >
                      <Globe className="w-3 h-3 text-indigo-400" /> Pay with Stripe International
                    </button>
                  </div>
                </div>

                {/* 3. Direct Channels: Bank Transfer, Credit Card, USSD & Crypto */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-300">
                    Direct Payment Channels
                  </div>

                  {/* Dedicated Virtual NUBAN */}
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-cyan-400" /> Dedicated Virtual NUBAN Account
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                        Zero Fee Transfer
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Wema Bank / ALAT</div>
                        <div className="font-bold text-slate-100 text-sm tracking-wider">
                          9941{String(currentUser.tgUserId).slice(-6).padStart(6, '0')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {institution?.shortName || 'ALUMNI'} • {currentUser.tgFirstName} {currentUser.tgLastName || ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          TelegramSdkWrapper.haptic('medium');
                          const acc = `9941${String(currentUser.tgUserId).slice(-6).padStart(6, '0')}`;
                          navigator.clipboard.writeText(acc);
                          setCopiedNuban(true);
                          setTimeout(() => setCopiedNuban(false), 3000);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[11px] flex items-center gap-1 transition-all active:scale-95"
                      >
                        {copiedNuban ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Copy Acc</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Grid for USSD, Card, Crypto */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <CreditCard className="w-4 h-4 text-emerald-400 mx-auto" />
                      <div className="font-bold text-[11px] text-slate-200">Debit / Card</div>
                      <div className="text-[9px] text-slate-400">Verve, Visa, MC</div>
                    </div>

                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <Smartphone className="w-4 h-4 text-cyan-400 mx-auto" />
                      <div className="font-bold text-[11px] text-slate-200">USSD Banking</div>
                      <div className="text-[9px] text-slate-400 font-mono">*737# / *894#</div>
                    </div>

                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <Coins className="w-4 h-4 text-amber-400 mx-auto" />
                      <div className="font-bold text-[11px] text-slate-200">USDT Stablecoin</div>
                      <div className="text-[9px] text-slate-400">TRC20 / ERC20</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
