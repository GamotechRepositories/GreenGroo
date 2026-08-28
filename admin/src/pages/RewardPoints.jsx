import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Award,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Users,
  Check,
  X,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Loader2,
  Info,
  BookOpen,
  Calculator,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  DollarSign,
  GripVertical,
} from 'lucide-react';
import rewardApi from '../api/rewardApi';

const DEFAULT_TERMS = [
  "Earn 10 Reward Points for every ₹100 spent on successful orders.",
  "1 Reward Point is equivalent to ₹1.00 discount on future orders.",
  "A minimum of 10 points is required to start redeeming.",
  "You can pay up to 50% of your cart subtotal using reward points per order.",
  "Reward points are credited automatically once your order is confirmed.",
  "If an order is cancelled or refunded, any reward points used will be restored, and points earned on that order will be revoked.",
  "Reward points are non-transferable and cannot be exchanged for cash.",
  "GreenGrocc reserves the right to modify or terminate the reward points program terms at any time.",
];

export default function RewardPoints() {
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'terms' | 'ledger'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalPointsIssued: 0,
    totalPointsRedeemed: 0,
    activeLiabilityPoints: 0,
    totalUsersWithPoints: 0,
  });

  // Settings state
  const [settings, setSettings] = useState({
    enabled: true,
    earningRate: { spendAmount: 100, pointsEarned: 10 },
    minOrderAmountToEarn: 0,
    pointValueInRupees: 1.0,
    minPointsToRedeem: 10,
    maxRedemptionPercent: 50,
    maxPointsPerOrder: 1000,
    minOrderAmountToRedeem: 100,
    termsAndConditions: DEFAULT_TERMS,
    welcomeBonusPoints: 0,
  });

  const [initialSettings, setInitialSettings] = useState(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  // Simulator state
  const [simSpend, setSimSpend] = useState(1000);
  const [simPointsToUse, setSimPointsToUse] = useState(100);

  // Terms manager state
  const [editingTermIndex, setEditingTermIndex] = useState(null);
  const [editingTermText, setEditingTermText] = useState('');
  const [newTermText, setNewTermText] = useState('');

  // Ledger state
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Adjust Modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState('');

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    setSaveErrorMessage('');
    try {
      const [settingsRes, statsRes] = await Promise.all([
        rewardApi.getAdminSettings(),
        rewardApi.getAdminStats(),
      ]);

      if (settingsRes.data) {
        setSettings({
          enabled: settingsRes.data.enabled !== false,
          earningRate: settingsRes.data.earningRate || { spendAmount: 100, pointsEarned: 10 },
          minOrderAmountToEarn: settingsRes.data.minOrderAmountToEarn ?? 0,
          pointValueInRupees: settingsRes.data.pointValueInRupees ?? 1.0,
          minPointsToRedeem: settingsRes.data.minPointsToRedeem ?? 10,
          maxRedemptionPercent: settingsRes.data.maxRedemptionPercent ?? 50,
          maxPointsPerOrder: settingsRes.data.maxPointsPerOrder ?? 1000,
          minOrderAmountToRedeem: settingsRes.data.minOrderAmountToRedeem ?? 100,
          termsAndConditions: settingsRes.data.termsAndConditions?.length
            ? settingsRes.data.termsAndConditions
            : DEFAULT_TERMS,
          welcomeBonusPoints: settingsRes.data.welcomeBonusPoints ?? 0,
        });
        setInitialSettings(JSON.stringify(settingsRes.data));
      }

      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      setSaveErrorMessage(err.response?.data?.message || 'Failed to load reward settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch ledger transactions
  const loadTransactions = async (page = 1) => {
    setTransactionsLoading(true);
    try {
      const res = await rewardApi.getAdminTransactions({
        page,
        limit: 15,
        type: typeFilter,
        search: searchQuery,
      });
      setTransactions(res.data || []);
      setLedgerPage(res.page || 1);
      setLedgerTotalPages(res.totalPages || 1);
      setLedgerTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ledger') {
      loadTransactions(ledgerPage);
    }
  }, [activeTab, ledgerPage, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLedgerPage(1);
    loadTransactions(1);
  };

  // Has unsaved changes
  const hasChanges = useMemo(() => {
    if (!initialSettings) return false;
    try {
      const parsed = JSON.parse(initialSettings);
      return (
        parsed.enabled !== settings.enabled ||
        parsed.earningRate?.spendAmount !== settings.earningRate.spendAmount ||
        parsed.earningRate?.pointsEarned !== settings.earningRate.pointsEarned ||
        parsed.minOrderAmountToEarn !== settings.minOrderAmountToEarn ||
        parsed.pointValueInRupees !== settings.pointValueInRupees ||
        parsed.minPointsToRedeem !== settings.minPointsToRedeem ||
        parsed.maxRedemptionPercent !== settings.maxRedemptionPercent ||
        parsed.maxPointsPerOrder !== settings.maxPointsPerOrder ||
        parsed.minOrderAmountToRedeem !== settings.minOrderAmountToRedeem ||
        JSON.stringify(parsed.termsAndConditions) !== JSON.stringify(settings.termsAndConditions)
      );
    } catch {
      return false;
    }
  }, [settings, initialSettings]);

  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccessMessage('');
    setSaveErrorMessage('');

    try {
      const res = await rewardApi.updateAdminSettings(settings);
      setSaveSuccessMessage('Reward settings and Terms & Conditions saved successfully!');
      setInitialSettings(JSON.stringify(res.data));
      setTimeout(() => setSaveSuccessMessage(''), 4000);
    } catch (err) {
      setSaveErrorMessage(err.response?.data?.message || 'Failed to save reward settings');
    } finally {
      setSaving(false);
    }
  };

  // Terms & Conditions Actions
  const handleAddTerm = () => {
    if (!newTermText.trim()) return;
    setSettings((prev) => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, newTermText.trim()],
    }));
    setNewTermText('');
  };

  const handleRemoveTerm = (index) => {
    setSettings((prev) => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index),
    }));
  };

  const handleStartEditTerm = (index) => {
    setEditingTermIndex(index);
    setEditingTermText(settings.termsAndConditions[index] || '');
  };

  const handleSaveEditTerm = (index) => {
    if (!editingTermText.trim()) return;
    const updated = [...settings.termsAndConditions];
    updated[index] = editingTermText.trim();
    setSettings((prev) => ({
      ...prev,
      termsAndConditions: updated,
    }));
    setEditingTermIndex(null);
    setEditingTermText('');
  };

  const handleResetDefaultTerms = () => {
    if (window.confirm('Reset Terms & Conditions to recommended default rules?')) {
      setSettings((prev) => ({
        ...prev,
        termsAndConditions: [...DEFAULT_TERMS],
      }));
    }
  };

  const handleMoveTerm = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= settings.termsAndConditions.length) return;
    const updated = [...settings.termsAndConditions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setSettings((prev) => ({
      ...prev,
      termsAndConditions: updated,
    }));
  };

  // Adjust User Points Modal
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustSubmitting(true);
    setAdjustError('');
    setAdjustSuccess('');

    try {
      const res = await rewardApi.adjustUserPoints({
        userId: adjustUserId.trim(),
        points: Number(adjustPoints),
        reason: adjustReason.trim(),
      });
      setAdjustSuccess(res.message || 'Points adjusted successfully');
      setAdjustUserId('');
      setAdjustPoints('');
      setAdjustReason('');
      // Reload stats & ledger
      loadTransactions(1);
      const statsRes = await rewardApi.getAdminStats();
      if (statsRes.data) setStats(statsRes.data);
      setTimeout(() => {
        setShowAdjustModal(false);
        setAdjustSuccess('');
      }, 1500);
    } catch (err) {
      setAdjustError(err.response?.data?.message || 'Failed to adjust user points');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Simulator Calculations
  const simulatedPointsEarned = useMemo(() => {
    if (!settings.enabled || simSpend < settings.minOrderAmountToEarn) return 0;
    const spend = settings.earningRate.spendAmount || 100;
    const rate = settings.earningRate.pointsEarned || 10;
    return Math.floor((simSpend / spend) * rate);
  }, [simSpend, settings]);

  const simulatedDiscount = useMemo(() => {
    const maxDiscountAllowed = (simSpend * settings.maxRedemptionPercent) / 100;
    const maxPointsAllowed = Math.floor(maxDiscountAllowed / (settings.pointValueInRupees || 1.0));
    const effectivePoints = Math.min(simPointsToUse, maxPointsAllowed);
    return (effectivePoints * (settings.pointValueInRupees || 1.0)).toFixed(2);
  }, [simSpend, simPointsToUse, settings]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Loading Reward Points configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-500/20">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Reward Points Program
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure purchase earning rules, redemption conversion rates, caps & Terms & Conditions
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active status pill */}
          <div
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold ${
              settings.enabled
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                settings.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {settings.enabled ? 'Program Active' : 'Program Paused'}
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving || !hasChanges}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 scale-[1.02]'
                : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-75 shadow-none'
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {hasChanges ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {saveSuccessMessage && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {saveErrorMessage && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Points Issued
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {Number(stats.totalPointsIssued).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">pts</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total rewards credited on purchases
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Points Redeemed
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {Number(stats.totalPointsRedeemed).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              (₹{(Number(stats.totalPointsRedeemed) * (settings.pointValueInRupees || 1)).toLocaleString('en-IN')})
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Saved by customers on checkout
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Liability Balance
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {Number(stats.activeLiabilityPoints).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              (₹{(Number(stats.activeLiabilityPoints) * (settings.pointValueInRupees || 1)).toLocaleString('en-IN')})
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Points currently in customer wallets
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Enrolled Customers
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {Number(stats.totalUsersWithPoints).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">users</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Users holding positive point balances
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'rules'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Earning & Redemption Rules
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'terms'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          Terms & Conditions Manager
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'ledger'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Points Passbook Ledger & Adjustments
        </button>
      </div>

      {/* Tab 1: Rules & Conversion Settings */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left 2 Cols: Rule Configuration */}
          <div className="space-y-6 lg:col-span-2">
            {/* Master Toggle Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Program Status
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Toggle whether customers can earn and redeem reward points across the platform
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-7 w-13 rounded-full bg-slate-200 peer-checked:bg-emerald-600 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-0.5 after:left-[4px] after:h-6 after:w-6 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all dark:border-slate-600 after:content-['']" />
                </label>
              </div>
            </div>

            {/* Earning Rules Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Purchase Earning Rules
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Spend Threshold (₹)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">For every ₹ amount spent</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={settings.earningRate.spendAmount}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          earningRate: {
                            ...prev.earningRate,
                            spendAmount: Math.max(1, Number(e.target.value)),
                          },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Points Earned
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">Points awarded per spend unit</p>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={settings.earningRate.pointsEarned}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          earningRate: {
                            ...prev.earningRate,
                            pointsEarned: Math.max(0, Number(e.target.value)),
                          },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Effective Earning Highlight */}
              <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/60 dark:bg-amber-950/30 dark:border-amber-900/40">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <Coins className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Current Rule: Customer earns{' '}
                    <strong className="font-bold">{settings.earningRate.pointsEarned} points</strong> for every{' '}
                    <strong className="font-bold">₹{settings.earningRate.spendAmount}</strong> purchase
                    (Equivalent to {((settings.earningRate.pointsEarned * (settings.pointValueInRupees || 1) / (settings.earningRate.spendAmount || 1)) * 100).toFixed(1)}% reward back value)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Minimum Order Value to Earn Points (₹)
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Orders below this amount will not earn points (set 0 for all orders)
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={settings.minOrderAmountToEarn}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        minOrderAmountToEarn: Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Redemption Rules Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Redemption & Conversion Rules
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Point Value (1 Point = ₹ ?)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">Rupee value per 1 reward point</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.01"
                      value={settings.pointValueInRupees}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          pointValueInRupees: Math.max(0.01, Number(e.target.value)),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Minimum Points to Redeem
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">Minimum balance before redeeming</p>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={settings.minPointsToRedeem}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          minPointsToRedeem: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      pts
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Max Subtotal Discount %
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">Max % of cart payable via points</p>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.maxRedemptionPercent}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          maxRedemptionPercent: Math.min(100, Math.max(1, Number(e.target.value))),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Max Points Cap Per Order
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">Upper point limit per order (0 = no cap)</p>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={settings.maxPointsPerOrder}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          maxPointsPerOrder: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      pts
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Minimum Order Value to Redeem (₹)
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Cart subtotal required before points can be applied
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={settings.minOrderAmountToRedeem}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        minOrderAmountToRedeem: Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Live Interactive Rule Simulator */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm dark:border-slate-800/80 dark:from-slate-900/80 dark:to-slate-900/40">
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Live Rule Simulator
                </h3>
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Test how your earning & redemption rules calculate for real customer orders
              </p>

              <div className="mt-4 space-y-4">
                {/* Spend input slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Sample Order Amount</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ₹{simSpend}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="50"
                    value={simSpend}
                    onChange={(e) => setSimSpend(Number(e.target.value))}
                    className="mt-2 w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>₹100</span>
                    <span>₹5,000</span>
                    <span>₹10,000</span>
                  </div>
                </div>

                {/* Points to redeem slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Sample Points in Customer Wallet</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {simPointsToUse} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="10"
                    value={simPointsToUse}
                    onChange={(e) => setSimPointsToUse(Number(e.target.value))}
                    className="mt-2 w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0 pts</span>
                    <span>1,000 pts</span>
                    <span>2,000 pts</span>
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Points Earned on this Order:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />+{simulatedPointsEarned} pts
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Max Discount Cap ({settings.maxRedemptionPercent}%):</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ₹{((simSpend * settings.maxRedemptionPercent) / 100).toFixed(0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2 dark:border-slate-700/60">
                    <span className="font-semibold text-slate-900 dark:text-white">Applied Points Discount:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      -₹{simulatedDiscount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2 dark:border-slate-700/60">
                    <span className="font-bold text-slate-900 dark:text-white">Customer Final Pay:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      ₹{Math.max(0, simSpend - Number(simulatedDiscount)).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Recommended Settings
                  </h4>
                  <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
                    • 10 points per ₹100 gives a healthy 10% loyalty incentive.
                    <br />• A 50% max order cap ensures healthy gross margins per basket.
                    <br />• Real-time points redemption increases repeat order retention by over 30%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Terms & Conditions Manager */}
      {activeTab === 'terms' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left 2 cols: List of editable terms */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Program Terms & Conditions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Add, edit, remove, and reorder Terms and Conditions shown in the customer app
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetDefaultTerms}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset to Default
                </button>
              </div>

              {/* Add new term box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a new term or policy rule (e.g. Points expire in 1 year)..."
                  value={newTermText}
                  onChange={(e) => setNewTermText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTerm()}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </button>
              </div>

              {/* List of current terms */}
              <div className="space-y-2.5 pt-2">
                {settings.termsAndConditions.map((term, index) => (
                  <div
                    key={index}
                    className="group relative flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {index + 1}
                    </span>

                    {editingTermIndex === index ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          value={editingTermText}
                          onChange={(e) => setEditingTermText(e.target.value)}
                          className="flex-1 rounded-lg border border-emerald-500 bg-white px-3 py-1 text-sm text-slate-900 dark:bg-slate-700 dark:text-white"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditTerm(index)}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditTerm(index)}
                          className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-500"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTermIndex(null)}
                          className="rounded-lg bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-between gap-4">
                        <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                          {term}
                        </p>
                        <div className="flex shrink-0 items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleMoveTerm(index, -1)}
                            disabled={index === 0}
                            title="Move Up"
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTerm(index, 1)}
                            disabled={index === settings.termsAndConditions.length - 1}
                            title="Move Down"
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditTerm(index)}
                            title="Edit"
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTerm(index)}
                            title="Delete"
                            className="rounded-md p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right col: Customer Mobile UI Mockup Preview */}
          <div>
            <div className="sticky top-6 rounded-3xl border-4 border-slate-800 bg-slate-900 p-3 shadow-2xl">
              <div className="mx-auto h-4 w-24 rounded-full bg-slate-800 mb-3" />
              <div className="rounded-2xl bg-white p-4 dark:bg-slate-950 space-y-3 min-h-[480px]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Reward Points & T&C
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    Live Customer Preview
                  </span>
                </div>

                <div className="rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 p-3.5 text-white shadow-sm">
                  <p className="text-[10px] font-semibold opacity-90">GreenGrocc Rewards Balance</p>
                  <p className="text-xl font-black mt-0.5">250 Points</p>
                  <p className="text-[10px] font-medium opacity-90 mt-1">
                    Worth ₹250.00 discount on your orders
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Program Terms
                  </p>
                  <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {settings.termsAndConditions.map((term, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Ledger & Manual Adjustments */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Controls row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Search user name, phone, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setLedgerPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="all">All Transaction Types</option>
                <option value="earned">Earned (+)</option>
                <option value="redeemed">Redeemed (-)</option>
                <option value="refunded">Refunded (+)</option>
                <option value="reversal">Reversal (-)</option>
                <option value="admin_adjustment">Admin Adjustments</option>
              </select>

              <button
                type="button"
                onClick={() => setShowAdjustModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
              >
                <UserCheck className="h-4 w-4" />
                Manual Point Adjustment
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Points</th>
                    <th className="px-5 py-3.5">Balance After</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactionsLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                        <span className="mt-2 block text-xs">Loading ledger entries...</span>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                        No points transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isPositive = tx.points > 0;
                      return (
                        <tr
                          key={tx._id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {tx.user?.name || 'Customer'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {tx.user?.phone || 'No phone'}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                                tx.type === 'earned'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                  : tx.type === 'redeemed'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : tx.type === 'refunded'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`font-bold flex items-center gap-0.5 ${
                                isPositive
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4" />
                              )}
                              {isPositive ? `+${tx.points}` : tx.points} pts
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {tx.balanceAfter} pts
                            </span>
                          </td>
                          <td className="px-5 py-3.5 max-w-xs truncate text-xs text-slate-600 dark:text-slate-400">
                            {tx.description}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/30">
              <span className="text-xs text-slate-500">
                Total {ledgerTotal} transactions recorded
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={ledgerPage <= 1}
                  onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Page {ledgerPage} of {ledgerTotalPages}
                </span>
                <button
                  type="button"
                  disabled={ledgerPage >= ledgerTotalPages}
                  onClick={() => setLedgerPage((p) => Math.min(ledgerTotalPages, p + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Point Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                Manual Point Adjustment
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustError('');
                  setAdjustSuccess('');
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {adjustSuccess && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                {adjustSuccess}
              </div>
            )}

            {adjustError && (
              <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  User ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste User Mongo _id"
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Points Adjustment (+ to Credit, - to Debit)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50 or -20"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reason / Audit Note
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Loyalty compensation for delayed delivery"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50"
                >
                  {adjustSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
