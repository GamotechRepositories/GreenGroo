import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Landmark,
  FileText,
  Receipt,
  Scale,
  ArrowLeftRight,
  Layers,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Calendar,
  Building2,
  CreditCard,
  PieChart,
  HelpCircle,
  Printer,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  AlertTriangle,
  Send,
  Loader2,
  ShieldCheck,
  Percent,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Compass,
  Sparkles,
  Wallet,
} from 'lucide-react';
import apiClient from '../../api/client';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';

export function inr(val) {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

const SECTIONS = [
  {
    id: 'estimations',
    label: 'Estimations & Quotations',
    icon: FileText,
    badge: 'Sales',
    description: 'Draft invoices & future quotation estimates',
    subTabs: [{ id: 'estimations', label: 'Estimations & Quotations', icon: FileText }],
  },
  {
    id: 'taxes',
    label: 'Taxation & Compliance',
    icon: Receipt,
    badge: 'Tax & GST',
    description: 'Regional tax rates, multi-state zones, categories, and agency payments',
    subTabs: [
      { id: 'tax-rates', label: 'Tax Rates', icon: Percent },
      { id: 'tax-zones', label: 'Tax Zones', icon: Building2 },
      { id: 'tax-categories', label: 'Tax Categories', icon: Layers },
      { id: 'tax-payments', label: 'Tax Payments & Agencies', icon: Landmark },
    ],
  },
  {
    id: 'transactions',
    label: 'Expenses & Purchases',
    icon: ShoppingCart,
    badge: 'Spend',
    description: 'Expense transactions & purchase tracking with visual diagrams',
    subTabs: [
      { id: 'expenses', label: 'Expense Transactions', icon: Wallet },
      { id: 'purchases', label: 'Purchase Transactions', icon: ShoppingCart },
    ],
  },
  {
    id: 'bookkeeping',
    label: 'Double-Entry & Accounts',
    icon: Scale,
    badge: 'General Ledger',
    description: 'Balanced journals, customers, vendors, accounts & internal transfers',
    subTabs: [
      { id: 'journals', label: 'Journals (Double-Entry)', icon: Scale },
      { id: 'contacts', label: 'Customers & Vendors', icon: Users },
      { id: 'accounts', label: 'Chart of Accounts', icon: Layers },
      { id: 'transfers', label: 'Internal Cash Transfers', icon: ArrowLeftRight },
    ],
  },
  {
    id: 'reports',
    label: 'Financial Statements & Reports',
    icon: BarChart3,
    badge: 'Statutory Reports',
    description: 'Ledger, Trial Balance, Income Statement, Tax Report, Balance Sheet',
    subTabs: [
      { id: 'ledger', label: 'Ledger Reports', icon: FileText },
      { id: 'trial-balance', label: 'Trial Balance', icon: CheckCircle2 },
      { id: 'income-statement', label: 'Income Statement (P&L)', icon: TrendingUp },
      { id: 'sales-tax', label: 'Sales Tax Report', icon: Receipt },
      { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale },
    ],
  },
];

export default function FinanceManagement() {
  const { section: routeSection } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current active section & subTab from URL
  const queryParams = new URLSearchParams(location.search);
  const queryTab = queryParams.get('tab');

  const [activeSectionId, setActiveSectionId] = useState(() => {
    if (routeSection && SECTIONS.some((s) => s.id === routeSection)) return routeSection;
    if (queryTab) {
      const parent = SECTIONS.find((s) => s.subTabs.some((t) => t.id === queryTab));
      if (parent) return parent.id;
    }
    return 'estimations';
  });

  const currentSection = useMemo(() => {
    return SECTIONS.find((s) => s.id === activeSectionId) || SECTIONS[0];
  }, [activeSectionId]);

  const [activeSubTabId, setActiveSubTabId] = useState(() => {
    if (queryTab && currentSection.subTabs.some((t) => t.id === queryTab)) return queryTab;
    return currentSection.subTabs[0]?.id;
  });

  // Keep subTab in sync when section changes
  useEffect(() => {
    if (!currentSection.subTabs.some((t) => t.id === activeSubTabId)) {
      setActiveSubTabId(currentSection.subTabs[0]?.id);
    }
  }, [currentSection]);

  // Synchronize when routeSection or queryTab changes from navigation
  useEffect(() => {
    if (routeSection) {
      const directSec = SECTIONS.find((s) => s.id === routeSection);
      if (directSec) {
        setActiveSectionId(directSec.id);
        if (queryTab && directSec.subTabs.some((t) => t.id === queryTab)) {
          setActiveSubTabId(queryTab);
        } else {
          setActiveSubTabId(directSec.subTabs[0]?.id);
        }
        return;
      }
      const parentSec = SECTIONS.find((s) => s.subTabs.some((t) => t.id === routeSection));
      if (parentSec) {
        setActiveSectionId(parentSec.id);
        setActiveSubTabId(routeSection);
        return;
      }
    }
    if (queryTab) {
      const parent = SECTIONS.find((s) => s.subTabs.some((t) => t.id === queryTab));
      if (parent) {
        setActiveSectionId(parent.id);
        setActiveSubTabId(queryTab);
      }
    }
  }, [routeSection, queryTab]);

  // Dropdown menu interactive states
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);
  const [isQuickJumpOpen, setIsQuickJumpOpen] = useState(false);
  const navContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target)) {
        setIsModuleMenuOpen(false);
        setIsQuickJumpOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Data states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Estimations state
  const [estimations, setEstimations] = useState([]);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [estimateForm, setEstimateForm] = useState({
    customerName: '',
    customerEmail: '',
    customerMobile: '',
    company: '',
    date: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    items: [{ name: '', description: '', quantity: 1, unitPrice: 0, taxRate: 5, taxAmount: 0, total: 0 }],
    discount: 0,
    status: 'draft',
    notes: '',
    terms: 'Payment due within 15 days of invoice date.',
  });

  // 2. Taxes state
  const [taxRates, setTaxRates] = useState([]);
  const [taxZones, setTaxZones] = useState([]);
  const [taxCategories, setTaxCategories] = useState([]);
  const [taxAgencies, setTaxAgencies] = useState([]);
  const [taxPayments, setTaxPayments] = useState([]);

  // Modals for taxes
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateForm, setRateForm] = useState({ name: '', rate: '', type: 'percentage', zone: '', agency: '', description: '' });

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: '', code: '', regionsText: '', defaultRate: '', description: '' });

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', code: '', standardRate: '', taxType: 'GST', description: '' });

  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [agencyForm, setAgencyForm] = useState({ name: '', registrationNumber: '', jurisdiction: 'National', filingFrequency: 'monthly', contactEmail: '', contactPhone: '' });

  const [isTaxPayModalOpen, setIsTaxPayModalOpen] = useState(false);
  const [taxPayForm, setTaxPayForm] = useState({ agencyName: '', period: `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`, amountPaid: '', paymentMethod: 'bank_transfer', challanNumber: '', notes: '' });

  // 3. Expenses & Purchases state
  const [expenses, setExpenses] = useState([]);
  const [expenseStats, setExpenseStats] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: '',
    amount: '',
    taxAmount: 0,
    paymentType: 'cash',
    vendorName: '',
    receiptNumber: '',
    date: new Date().toISOString().slice(0, 10),
    installmentDetails: { totalInstallments: 1, currentInstallment: 1, installmentAmount: 0, frequency: 'Monthly' },
    notes: '',
  });

  const [purchases, setPurchases] = useState([]);
  const [purchaseSummary, setPurchaseSummary] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    vendorName: '',
    totalAmount: '',
    amountPaid: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    items: [],
    notes: '',
  });

  // 4. Bookkeeping (Journals, Accounts, Contacts, Transfers)
  const [accounts, setAccounts] = useState([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'asset', subType: 'current', balance: 0, description: '' });

  const [journals, setJournals] = useState([]);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    reference: '',
    memo: '',
    entries: [
      { accountCode: '', accountName: '', type: 'debit', amount: '', description: '' },
      { accountCode: '', accountName: '', type: 'credit', amount: '', description: '' },
    ],
  });

  const [contacts, setContacts] = useState([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    type: 'customer',
    name: '',
    company: '',
    email: '',
    mobile: '',
    website: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' },
    taxNumber: '',
    openingBalance: 0,
    notes: '',
  });

  const [transfers, setTransfers] = useState([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromAccountCode: '',
    toAccountCode: '',
    amount: '',
    transferFee: 0,
    date: new Date().toISOString().slice(0, 10),
    reference: '',
    notes: '',
  });

  // 5. Reports state
  const [ledgerReport, setLedgerReport] = useState(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState('');
  const [trialBalance, setTrialBalance] = useState(null);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [salesTaxReport, setSalesTaxReport] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);

  // Load data based on active subTab
  const loadTabContent = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeSubTabId === 'estimations') {
        const res = await apiClient.get('/admin-ops/finance/estimations');
        setEstimations(res.data?.data || []);
      } else if (activeSubTabId === 'tax-rates') {
        const res = await apiClient.get('/admin-ops/finance/tax-rates');
        setTaxRates(res.data?.data || []);
      } else if (activeSubTabId === 'tax-zones') {
        const res = await apiClient.get('/admin-ops/finance/tax-zones');
        setTaxZones(res.data?.data || []);
      } else if (activeSubTabId === 'tax-categories') {
        const res = await apiClient.get('/admin-ops/finance/tax-categories');
        setTaxCategories(res.data?.data || []);
      } else if (activeSubTabId === 'tax-payments') {
        const [agenciesRes, paymentsRes] = await Promise.all([
          apiClient.get('/admin-ops/finance/tax-agencies'),
          apiClient.get('/admin-ops/finance/tax-payments'),
        ]);
        setTaxAgencies(agenciesRes.data?.data || []);
        setTaxPayments(paymentsRes.data?.data || []);
      } else if (activeSubTabId === 'expenses') {
        const res = await apiClient.get('/admin-ops/finance/expenses');
        setExpenses(res.data?.data || []);
        setExpenseStats(res.data?.stats || null);
      } else if (activeSubTabId === 'purchases') {
        const res = await apiClient.get('/admin-ops/finance/purchases');
        setPurchases(res.data?.data || []);
        setPurchaseSummary(res.data?.summary || null);
      } else if (activeSubTabId === 'journals') {
        const [jRes, accRes] = await Promise.all([
          apiClient.get('/admin-ops/finance/journals'),
          apiClient.get('/admin-ops/finance/accounts'),
        ]);
        setJournals(jRes.data?.data || []);
        setAccounts(accRes.data?.data || []);
      } else if (activeSubTabId === 'contacts') {
        const res = await apiClient.get('/admin-ops/finance/contacts');
        setContacts(res.data?.data || []);
      } else if (activeSubTabId === 'accounts') {
        const res = await apiClient.get('/admin-ops/finance/accounts');
        setAccounts(res.data?.data || []);
      } else if (activeSubTabId === 'transfers') {
        const [tRes, accRes] = await Promise.all([
          apiClient.get('/admin-ops/finance/transfers'),
          apiClient.get('/admin-ops/finance/accounts'),
        ]);
        setTransfers(tRes.data?.data || []);
        setAccounts(accRes.data?.data || []);
      } else if (activeSubTabId === 'ledger') {
        const res = await apiClient.get('/admin-ops/finance/reports/ledger', {
          params: selectedLedgerAccount ? { accountCode: selectedLedgerAccount } : {},
        });
        setLedgerReport(res.data?.data || null);
        if (!selectedLedgerAccount && res.data?.data?.account?.code) {
          setSelectedLedgerAccount(res.data.data.account.code);
        }
      } else if (activeSubTabId === 'trial-balance') {
        const res = await apiClient.get('/admin-ops/finance/reports/trial-balance');
        setTrialBalance(res.data?.data || null);
      } else if (activeSubTabId === 'income-statement') {
        const res = await apiClient.get('/admin-ops/finance/reports/income-statement');
        setIncomeStatement(res.data?.data || null);
      } else if (activeSubTabId === 'sales-tax') {
        const res = await apiClient.get('/admin-ops/finance/reports/sales-tax');
        setSalesTaxReport(res.data?.data || null);
      } else if (activeSubTabId === 'balance-sheet') {
        const res = await apiClient.get('/admin-ops/finance/reports/balance-sheet');
        setBalanceSheet(res.data?.data || null);
      }
    } catch (err) {
      console.error('Failed to load finance data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabContent();
  }, [activeSubTabId, selectedLedgerAccount]);

  const handleSectionSelect = (newSectionId) => {
    setActiveSectionId(newSectionId);
    setIsModuleMenuOpen(false);
    setIsQuickJumpOpen(false);
    const targetSection = SECTIONS.find((s) => s.id === newSectionId);
    if (targetSection && targetSection.subTabs.length > 0) {
      setActiveSubTabId(targetSection.subTabs[0].id);
      navigate(`/finance/${newSectionId}?tab=${targetSection.subTabs[0].id}`, { replace: true });
    }
  };

  const handleSubTabSelect = (tabId) => {
    setActiveSubTabId(tabId);
    setIsModuleMenuOpen(false);
    setIsQuickJumpOpen(false);
    navigate(`/finance/${activeSectionId}?tab=${tabId}`, { replace: true });
  };

  const handleQuickJump = (secId, tabId) => {
    setActiveSectionId(secId);
    setActiveSubTabId(tabId);
    setIsModuleMenuOpen(false);
    setIsQuickJumpOpen(false);
    navigate(`/finance/${secId}?tab=${tabId}`, { replace: true });
  };

  // Helper for Journal debits/credits calculation & validation
  const journalBalanceCheck = useMemo(() => {
    const debits = journalForm.entries
      .filter((e) => e.type === 'debit')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const credits = journalForm.entries
      .filter((e) => e.type === 'credit')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const diff = Math.abs(debits - credits);
    const isBalanced = diff < 0.01 && debits > 0;
    return { debits, credits, diff, isBalanced };
  }, [journalForm.entries]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={PAGE_KICKER}>Accounting & Financial Operations</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Enterprise Suite
            </span>
          </div>
          <h1 className={`${PAGE_TITLE} mt-1 flex items-center gap-2.5`}>
            <Landmark className="h-7 w-7 text-emerald-600" />
            Finance Management
          </h1>
          <p className={`${PAGE_SUB} mt-1`}>
            Estimations, multi-zone taxes, expenses, double-entry journals, chart of accounts, and official financial reports
          </p>
        </div>

        {/* Action button & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadTabContent}
            disabled={loading}
            className={`${BTN} gap-1.5`}
            title="Refresh active view"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Interactive Custom Dropdown Navigation & Feature Switcher */}
      <div ref={navContainerRef} className={`${PANEL} p-4 sm:p-5 space-y-4 border border-slate-200/90 shadow-2xs relative`}>
        {/* Top Control Bar: Active Module Custom Selector + Quick Feature Jump Menu */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Custom Module Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsModuleMenuOpen((v) => !v);
                  setIsQuickJumpOpen(false);
                }}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:from-emerald-800 hover:to-teal-900 transition active:scale-[0.99] ring-1 ring-emerald-500/20"
              >
                {(() => {
                  const CurrentIcon = currentSection.icon || Landmark;
                  return <CurrentIcon className="h-4 w-4 text-emerald-200" />;
                })()}
                <span>{currentSection.label}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-50">
                  {currentSection.badge}
                </span>
                <ChevronDown className={`h-4 w-4 text-emerald-200 transition-transform ${isModuleMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Module Menu Popover */}
              {isModuleMenuOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Finance Modules
                  </div>
                  <div className="space-y-1">
                    {SECTIONS.map((sec) => {
                      const SecIcon = sec.icon;
                      const isSelected = sec.id === activeSectionId;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => handleSectionSelect(sec.id)}
                          className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`mt-0.5 rounded-lg p-1.5 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <SecIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-sm font-bold">{sec.label}</span>
                              <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{sec.badge}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{sec.description}</p>
                          </div>
                          {isSelected && <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Feature Jump Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsQuickJumpOpen((v) => !v);
                  setIsModuleMenuOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
              >
                <Compass className="h-3.5 w-3.5 text-emerald-600" />
                <span>Jump to Feature...</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isQuickJumpOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Quick Jump Menu Popover */}
              {isQuickJumpOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-88 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 max-h-96 overflow-y-auto admin-scrollbar animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    All Finance Features
                  </div>
                  {SECTIONS.map((sec) => (
                    <div key={sec.id} className="py-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {sec.label}
                      </div>
                      {sec.subTabs.map((sub) => {
                        const SubIcon = sub.icon || sec.icon;
                        const isCurrent = activeSectionId === sec.id && activeSubTabId === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleQuickJump(sec.id, sub.id)}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs text-left transition ${
                              isCurrent ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <SubIcon className={`h-3.5 w-3.5 ${isCurrent ? 'text-emerald-700' : 'text-slate-400'}`} />
                            <span className="flex-1 truncate">{sub.label}</span>
                            {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Module Description & Breadcrumb Info */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="hidden sm:inline font-semibold text-slate-700">{currentSection.label}</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="line-clamp-1">{currentSection.description}</span>
          </div>
        </div>

        {/* Sub-Tabs Row: Modern Pill Buttons with Icons & Badge */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 admin-scrollbar">
          {currentSection.subTabs.map((tab) => {
            const isSelected = activeSubTabId === tab.id;
            const TabIcon = tab.icon || currentSection.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSubTabSelect(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap active:scale-[0.98] ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <TabIcon className={`h-3.5 w-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Error Notice */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Unable to load data</p>
          <p className="mt-0.5 text-xs">{error}</p>
        </div>
      )}

      {/* TAB 1: ESTIMATIONS & DRAFT QUOTES */}
      {activeSubTabId === 'estimations' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Estimations & Draft Quotations</h3>
              <p className="text-xs text-slate-500">Create, send, and convert draft quotes to invoices for future client orders</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEstimateModalOpen(true)}
              className={`${BTN_PRIMARY} gap-1.5`}
            >
              <Plus className="h-4 w-4" />
              <span>New Estimate / Quote</span>
            </button>
          </div>

          {/* Quick Estimations KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={`${PANEL} p-4 border border-slate-200/80`}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Quotations</p>
              <h4 className="mt-1 text-2xl font-extrabold text-slate-900">{estimations.length}</h4>
            </div>
            <div className={`${PANEL} p-4 border border-slate-200/80`}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Drafts Pending</p>
              <h4 className="mt-1 text-2xl font-extrabold text-amber-600">{estimations.filter(e => e.status === 'draft').length}</h4>
            </div>
            <div className={`${PANEL} p-4 border border-slate-200/80`}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accepted / Converted</p>
              <h4 className="mt-1 text-2xl font-extrabold text-emerald-700">{estimations.filter(e => ['accepted', 'converted'].includes(e.status)).length}</h4>
            </div>
            <div className={`${PANEL} p-4 border border-slate-200/80`}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Value</p>
              <h4 className="mt-1 text-2xl font-extrabold text-slate-900">{inr(estimations.reduce((s, e) => s + (e.grandTotal || 0), 0))}</h4>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
          ) : estimations.length === 0 ? (
            <div className={`${PANEL} p-12 text-center`}>
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-base font-bold text-slate-800">No Estimations Created Yet</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">Generate itemized price estimates and draft quotation proposals for B2B buyers.</p>
              <button
                type="button"
                onClick={() => setIsEstimateModalOpen(true)}
                className={`${BTN_PRIMARY} mt-4 gap-1.5`}
              >
                <Plus className="h-4 w-4" />
                <span>Create First Estimate</span>
              </button>
            </div>
          ) : (
            <div className={`${PANEL} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F2F2F2]">
                    <tr>
                      {['Estimate #', 'Customer / Company', 'Date', 'Items', 'Grand Total', 'Status', 'Actions'].map((h) => (
                        <th key={h} className={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estimations.map((est) => (
                      <tr key={est._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-800">{est.estimateNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{est.customerName}</p>
                          {est.company && <p className="text-xs text-slate-500">{est.company}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{new Date(est.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{est.items?.length || 0} line items</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{inr(est.grandTotal)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            est.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            est.status === 'sent' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            est.status === 'converted' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {est.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                await apiClient.put(`/admin-ops/finance/estimations/${est._id}`, { status: 'accepted' });
                                loadTabContent();
                              }}
                              className={`${BTN} text-xs text-emerald-700`}
                              title="Mark Accepted"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!window.confirm('Delete this estimation?')) return;
                                await apiClient.delete(`/admin-ops/finance/estimations/${est._id}`);
                                loadTabContent();
                              }}
                              className={`${BTN} p-1.5 text-slate-400 hover:text-rose-600`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TAX RATES */}
      {activeSubTabId === 'tax-rates' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tax Rates</h3>
              <p className="text-xs text-slate-500">Add and manage tax rates for different geographical regions and product slabs</p>
            </div>
            <button type="button" onClick={() => setIsRateModalOpen(true)} className={`${BTN_PRIMARY} gap-1.5`}>
              <Plus className="h-4 w-4" /> Add Tax Rate
            </button>
          </div>

          <div className={`${PANEL} overflow-hidden`}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]">
                <tr>
                  {['Tax Name', 'Rate (%)', 'Type', 'Tax Zone', 'Tax Agency', 'Status', 'Actions'].map((h) => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxRates.map((tr) => (
                  <tr key={tr._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{tr.name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">{tr.rate}%</td>
                    <td className="px-4 py-3 text-xs capitalize text-slate-600">{tr.type}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{tr.zone || 'All Zones'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{tr.agency || 'CBIC'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        {tr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('Delete this tax rate?')) return;
                          await apiClient.delete(`/admin-ops/finance/tax-rates/${tr._id}`);
                          loadTabContent();
                        }}
                        className={`${BTN} p-1.5 text-slate-400 hover:text-rose-600`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TAX ZONES */}
      {activeSubTabId === 'tax-zones' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tax Zones</h3>
              <p className="text-xs text-slate-500">Create tax zones and rates for multiple states, territories, or darkstore branches</p>
            </div>
            <button type="button" onClick={() => setIsZoneModalOpen(true)} className={`${BTN_PRIMARY} gap-1.5`}>
              <Plus className="h-4 w-4" /> Add Tax Zone
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {taxZones.map((z) => (
              <div key={z._id} className={`${PANEL} p-5 space-y-3`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800 border border-emerald-200">
                      {z.code}
                    </span>
                    <h4 className="mt-1 text-base font-bold text-slate-900">{z.name}</h4>
                  </div>
                  <span className="text-xs font-bold text-slate-600">Default: {z.defaultRate}%</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(z.regions || []).map((r) => (
                    <span key={r} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {r}
                    </span>
                  ))}
                </div>
                {z.description && <p className="text-xs text-slate-500">{z.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TAX CATEGORIES */}
      {activeSubTabId === 'tax-categories' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tax Categories</h3>
              <p className="text-xs text-slate-500">Country-specific tax category structures (Fresh Produce 0%, Packaged Food 5%, Standard Goods 18%)</p>
            </div>
            <button type="button" onClick={() => setIsCatModalOpen(true)} className={`${BTN_PRIMARY} gap-1.5`}>
              <Plus className="h-4 w-4" /> Add Category
            </button>
          </div>

          <div className={`${PANEL} overflow-hidden`}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]">
                <tr>
                  {['Category Name', 'Code', 'Standard Rate (%)', 'Tax Structure', 'Description'].map((h) => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxCategories.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-800">{c.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{c.standardRate}%</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.taxType}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TAX PAYMENTS & AGENCIES */}
      {activeSubTabId === 'tax-payments' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tax Payments & Agencies</h3>
              <p className="text-xs text-slate-500">Pay differing tax rates and manage remittal payments to government tax authorities</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsAgencyModalOpen(true)} className={`${BTN} gap-1.5`}>
                <Plus className="h-4 w-4" /> Add Agency
              </button>
              <button type="button" onClick={() => setIsTaxPayModalOpen(true)} className={`${BTN_PRIMARY} gap-1.5`}>
                <Plus className="h-4 w-4" /> Record Tax Payment
              </button>
            </div>
          </div>

          {/* Agencies Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Registered Tax Agencies</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {taxAgencies.map((a) => (
                <div key={a._id} className={`${PANEL} p-4 space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                      {a.filingFrequency}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">{a.jurisdiction}</span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">{a.name}</h5>
                  <p className="font-mono text-xs text-slate-600">Reg: {a.registrationNumber || 'Pending'}</p>
                  <p className="text-xs text-slate-500">{a.contactEmail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Payments History Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Tax Remittance Records</h4>
            <div className={`${PANEL} overflow-hidden`}>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F2F2F2]">
                  <tr>
                    {['Ref #', 'Tax Agency', 'Period', 'Amount Paid', 'Date', 'Method', 'Challan #'].map((h) => (
                      <th key={h} className={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {taxPayments.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No tax payment entries recorded yet</td></tr>
                  ) : taxPayments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-800">{p.paymentNumber}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{p.agencyName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{p.period}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">{inr(p.amountPaid)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-xs capitalize text-slate-600">{p.paymentMethod?.replace('_', ' ')}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.challanNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TRACK EXPENSE TRANSACTIONS */}
      {activeSubTabId === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Expense Transactions</h3>
              <p className="text-xs text-slate-500">Handle cash, credit, or installment expense transactions with full tracking</p>
            </div>
            <button type="button" onClick={() => setIsExpenseModalOpen(true)} className={`${BTN_PRIMARY} gap-1.5`}>
              <Plus className="h-4 w-4" /> Record Expense
            </button>
          </div>

          {/* Quick Expense KPI stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className={`${PANEL} p-4`}>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Expenses</p>
              <h4 className="mt-1 text-2xl font-bold text-slate-900">{inr(expenseStats?.totalAmount || 0)}</h4>
            </div>
            <div className={`${PANEL} p-4`}>
              <p className="text-xs font-semibold text-slate-500 uppercase">Cash Transactions</p>
              <h4 className="mt-1 text-2xl font-bold text-emerald-700">{expenseStats?.cashCount || 0}</h4>
            </div>
            <div className={`${PANEL} p-4`}>
              <p className="text-xs font-semibold text-slate-500 uppercase">Credit / Accounts Payable</p>
              <h4 className="mt-1 text-2xl font-bold text-blue-700">{expenseStats?.creditCount || 0}</h4>
            </div>
            <div className={`${PANEL} p-4`}>
              <p className="text-xs font-semibold text-slate-500 uppercase">Installments Active</p>
              <h4 className="mt-1 text-2xl font-bold text-purple-700">{expenseStats?.installmentCount || 0}</h4>
            </div>
          </div>

          <div className={`${PANEL} overflow-hidden`}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]">
                <tr>
                  {['Expense #', 'Title / Category', 'Payment Method', 'Amount', 'Tax Included', 'Date', 'Vendor'].map((h) => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No expense records logged</td></tr>
                ) : expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{exp.expenseNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{exp.title}</p>
                      <p className="text-xs text-slate-500">{exp.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        exp.paymentType === 'installment' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        exp.paymentType === 'credit' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {exp.paymentType}
                        {exp.paymentType === 'installment' && exp.installmentDetails?.totalInstallments ? ` (${exp.installmentDetails.totalInstallments}x)` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{inr(exp.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inr(exp.taxAmount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{exp.vendorName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: PURCHASE TRANSACTIONS WITH DIAGRAMS */}
      {activeSubTabId === 'purchases' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Purchase Transactions</h3>
              <p className="text-xs text-slate-500">Outstanding, paid, over-due, and partial purchase amounts with visual breakdown diagrams</p>
            </div>
            <button type="button" onClick={() => setIsPurchaseModalOpen(true)} className={`${BTN_PRIMARY} gap-1.5`}>
              <Plus className="h-4 w-4" /> New Purchase Order
            </button>
          </div>

          {/* Visual Diagram: Distribution & Bars */}
          {purchaseSummary && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Diagram Card 1: Total Volume */}
              <div className={`${PANEL} p-5 flex flex-col justify-between`}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Purchase Commitment</p>
                  <h4 className="mt-2 text-3xl font-extrabold text-slate-900">{inr(purchaseSummary.totalPurchases)}</h4>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Settled / Paid:</span>
                      <span className="font-bold text-emerald-700">{inr(purchaseSummary.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Balance Due:</span>
                      <span className="font-bold text-rose-600">{inr(purchaseSummary.totalBalanceDue)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Settlement Rate</span>
                  <span className="font-bold text-emerald-700">
                    {purchaseSummary.totalPurchases > 0 ? Math.round((purchaseSummary.totalPaid / purchaseSummary.totalPurchases) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Diagram Card 2: Visual Distribution Bar Diagram */}
              <div className={`${PANEL} p-5 lg:col-span-2 space-y-4`}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <PieChart className="h-4 w-4 text-emerald-600" />
                  Visual Breakdown Diagram (Status Distribution)
                </p>

                {/* Multi-segment Progress Bar Diagram */}
                <div className="w-full bg-slate-100 h-6 rounded-xl overflow-hidden flex shadow-inner">
                  {purchaseSummary.diagramData.map((d) => {
                    const pct = purchaseSummary.totalPurchases > 0 ? (d.value / purchaseSummary.totalPurchases) * 100 : 0;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={d.name}
                        style={{ width: `${pct}%`, backgroundColor: d.color }}
                        className="h-full transition-all duration-500"
                        title={`${d.name}: ${inr(d.value)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Diagram Legend Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {purchaseSummary.diagramData.map((d) => (
                    <div key={d.name} className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs font-bold text-slate-800 truncate">{d.name}</span>
                      </div>
                      <p className="mt-1 text-sm font-extrabold text-slate-900">{inr(d.value)}</p>
                      <p className="text-[11px] text-slate-500">{d.count} POs</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Purchase Orders Table */}
          <div className={`${PANEL} overflow-hidden`}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]">
                <tr>
                  {['PO #', 'Vendor Name', 'Total Amount', 'Paid', 'Balance Due', 'Due Date', 'Status'].map((h) => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No purchase records found</td></tr>
                ) : purchases.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{po.purchaseNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{po.vendorName}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{inr(po.totalAmount)}</td>
                    <td className="px-4 py-3 text-xs text-emerald-700 font-semibold">{inr(po.amountPaid)}</td>
                    <td className="px-4 py-3 font-bold text-rose-600">{inr(po.balanceDue)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{po.dueDate ? new Date(po.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        po.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        po.status === 'partial' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        po.status === 'overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: DOUBLE-ENTRY JOURNALS */}
      {activeSubTabId === 'journals' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Journals (Double-Entry System)</h3>
              <p className="text-xs text-slate-500">Logic-based double entry form that enforces balanced debits and credits to prevent submission errors</p>
            </div>
            <button type="button" onClick={() => setIsJournalModalOpen(true)} className={`${BTN_PRIMARY} gap-1.5`}>
              <Plus className="h-4 w-4" /> New Journal Entry
            </button>
          </div>

          {/* Journals Summary KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={`${PANEL} p-4 border border-slate-200/80`}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Posted Journals</p>
              <h4 className="mt-1 text-2xl font-extrabold text-slate-900">{journals.length}</h4>
            </div>
            <div className={`${PANEL} p-4 border border-slate-200/80`}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accounting Accuracy</p>
              <h4 className="mt-1 text-2xl font-extrabold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5" /> 100%
              </h4>
            </div>
            <div className={`${PANEL} p-4 border border-slate-200/80`}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Debits</p>
              <h4 className="mt-1 text-2xl font-extrabold text-slate-900">{inr(journals.reduce((s, j) => s + (j.totalDebit || 0), 0))}</h4>
            </div>
            <div className={`${PANEL} p-4 border border-slate-200/80`}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Credits</p>
              <h4 className="mt-1 text-2xl font-extrabold text-slate-900">{inr(journals.reduce((s, j) => s + (j.totalCredit || 0), 0))}</h4>
            </div>
          </div>

          <div className={`${PANEL} overflow-hidden`}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]">
                <tr>
                  {['Journal #', 'Date', 'Memo', 'Lines / Accounts', 'Debit Total', 'Credit Total', 'Status'].map((h) => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journals.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No journal entries recorded</td></tr>
                ) : journals.map((j) => (
                  <tr key={j._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-800">{j.journalNumber}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{new Date(j.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{j.memo}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {(j.entries || []).map((e, idx) => (
                        <div key={idx} className="text-[11px] truncate max-w-xs">
                          {e.type.toUpperCase()}: {e.accountName} ({inr(e.amount)})
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{inr(j.totalDebit)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{inr(j.totalCredit)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        <Check className="h-3 w-3" /> Balanced
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: CUSTOMERS & VENDORS */}
      {activeSubTabId === 'contacts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Customers & Vendors</h3>
              <p className="text-xs text-slate-500">Advanced fields: email, mobile, company, tax identifier (GSTIN), address, opening balances</p>
            </div>
            <button type="button" onClick={() => setIsContactModalOpen(true)} className={`${BTN_PRIMARY} gap-1.5`}>
              <Plus className="h-4 w-4" /> Add Customer / Vendor
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {contacts.map((c) => (
              <div key={c._id} className={`${PANEL} p-4 space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    c.type === 'customer' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    c.type === 'vendor' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {c.type}
                  </span>
                  <span className="text-xs font-bold text-slate-700">{inr(c.currentBalance || c.openingBalance)}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                {c.company && <p className="text-xs font-medium text-emerald-700">{c.company}</p>}
                <div className="text-xs text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                  <p>{c.email || 'No email'}</p>
                  <p>{c.mobile || 'No mobile'}</p>
                  {c.taxNumber && <p className="font-mono text-slate-700">GSTIN: {c.taxNumber}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: PRELOADED CHART OF ACCOUNTS */}
      {activeSubTabId === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Chart of Accounts</h3>
              <p className="text-xs text-slate-500">Preloaded standard accounts (Assets, Liabilities, Equity, Revenue, COGS, Expenses) + custom accounts</p>
            </div>
            <button type="button" onClick={() => setIsAccountModalOpen(true)} className={`${BTN_PRIMARY} gap-1.5`}>
              <Plus className="h-4 w-4" /> Add Custom Account
            </button>
          </div>

          <div className={`${PANEL} overflow-hidden`}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]">
                <tr>
                  {['Code', 'Account Name', 'Type', 'Sub-Type', 'Current Balance', 'Preloaded', 'Description'].map((h) => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-800">{acc.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{acc.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold uppercase ${
                        acc.type === 'asset' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        acc.type === 'liability' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        acc.type === 'equity' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        acc.type === 'revenue' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-slate-600">{acc.subType}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{inr(acc.balance)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{acc.isPreloaded ? 'Yes (Default)' : 'Custom'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{acc.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 11: INTERNAL CASH TRANSFERS */}
      {activeSubTabId === 'transfers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Internal Cash Transfers</h3>
              <p className="text-xs text-slate-500">Keep cash on hand and bank current accounts fully synchronized with transfer control</p>
            </div>
            <button type="button" onClick={() => setIsTransferModalOpen(true)} className={`${BTN_PRIMARY} gap-1.5`}>
              <Plus className="h-4 w-4" /> Transfer Funds
            </button>
          </div>

          <div className={`${PANEL} overflow-hidden`}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]">
                <tr>
                  {['Transfer #', 'From Account', 'To Account', 'Amount', 'Fee', 'Date', 'Reference'].map((h) => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No transfer history</td></tr>
                ) : transfers.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{t.transferNumber}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{t.fromAccountName}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{t.toAccountName}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">{inr(t.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inr(t.transferFee)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{new Date(t.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{t.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 12: LEDGER REPORTS */}
      {activeSubTabId === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Ledger Reports</h3>
              <p className="text-xs text-slate-500">View latest balance and transaction history of any account, filterable by date range</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Select Account:</span>
              <select
                value={selectedLedgerAccount}
                onChange={(e) => setSelectedLedgerAccount(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
              >
                {(ledgerReport?.accounts || []).map((acc) => (
                  <option key={acc.code} value={acc.code}>
                    {acc.code} - {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {ledgerReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Account Balance</p>
                  <h4 className="mt-1 text-2xl font-bold text-slate-900">{inr(ledgerReport.currentBalance)}</h4>
                  <p className="text-xs text-emerald-600 font-medium">{ledgerReport.account?.name}</p>
                </div>
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Period Total Debits</p>
                  <h4 className="mt-1 text-2xl font-bold text-blue-700">{inr(ledgerReport.totalDebits)}</h4>
                </div>
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Period Total Credits</p>
                  <h4 className="mt-1 text-2xl font-bold text-purple-700">{inr(ledgerReport.totalCredits)}</h4>
                </div>
              </div>

              <div className={`${PANEL} overflow-hidden`}>
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F2F2F2]">
                    <tr>
                      {['Date', 'Journal #', 'Description / Memo', 'Debit', 'Credit', 'Running Balance'].map((h) => (
                        <th key={h} className={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerReport.movements?.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No journal postings for this account</td></tr>
                    ) : ledgerReport.movements?.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 text-xs text-slate-600">{new Date(m.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">{m.journalNumber}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{m.memo}</td>
                        <td className="px-4 py-3 font-mono text-emerald-700">{m.debit > 0 ? inr(m.debit) : '—'}</td>
                        <td className="px-4 py-3 font-mono text-purple-700">{m.credit > 0 ? inr(m.credit) : '—'}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{inr(m.runningBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 13: TRIAL BALANCE */}
      {activeSubTabId === 'trial-balance' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Trial Balance</h3>
              <p className="text-xs text-slate-500">Check mathematical accuracy — Debit and Credit totals must match</p>
            </div>
            {trialBalance && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                trialBalance.isBalanced
                  ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                  : 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
              }`}>
                {trialBalance.isBalanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {trialBalance.isBalanced ? 'Balanced & Mathematically Verified' : 'Imbalance Detected'}
              </span>
            )}
          </div>

          {trialBalance && (
            <div className={`${PANEL} overflow-hidden`}>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F2F2F2]">
                  <tr>
                    {['Account Code', 'Account Title', 'Type', 'Debit (₹)', 'Credit (₹)'].map((h) => (
                      <th key={h} className={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalance.rows?.map((row) => (
                    <tr key={row.code} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{row.code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-xs capitalize text-slate-600">{row.type}</td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{row.debit > 0 ? inr(row.debit) : '—'}</td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{row.credit > 0 ? inr(row.credit) : '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
                    <td colSpan={3} className="px-4 py-3 text-right uppercase text-xs tracking-wider text-slate-700">Total Sum:</td>
                    <td className="px-4 py-3 font-mono text-emerald-800 text-base">{inr(trialBalance.totalDebit)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-800 text-base">{inr(trialBalance.totalCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 14: INCOME STATEMENT */}
      {activeSubTabId === 'income-statement' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Income Statement (P&L)</h3>
              <p className="text-xs text-slate-500">Spending by account, sales revenue, gross margin, and net profit or loss at a glance</p>
            </div>
            {incomeStatement && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                Net Profit Margin: {incomeStatement.profitMargin}%
              </span>
            )}
          </div>

          {incomeStatement && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Gross Sales Revenue</p>
                  <h4 className="mt-1 text-2xl font-bold text-emerald-700">{inr(incomeStatement.totalRevenue)}</h4>
                </div>
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Cost of Goods Sold (COGS)</p>
                  <h4 className="mt-1 text-2xl font-bold text-rose-600">{inr(incomeStatement.cogsTotal)}</h4>
                </div>
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Operating Expenses</p>
                  <h4 className="mt-1 text-2xl font-bold text-amber-700">{inr(incomeStatement.operatingExpenses)}</h4>
                </div>
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Net Income / Profit</p>
                  <h4 className={`mt-1 text-2xl font-bold ${incomeStatement.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {inr(incomeStatement.netIncome)}
                  </h4>
                </div>
              </div>

              {/* Account Breakdown */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className={`${PANEL} p-5 space-y-3`}>
                  <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                    <span>Revenue Accounts</span>
                    <span className="text-emerald-700 font-mono">{inr(incomeStatement.totalRevenue)}</span>
                  </h4>
                  {incomeStatement.revenueAccounts?.map((acc) => (
                    <div key={acc.code} className="flex justify-between text-xs py-1">
                      <span className="text-slate-700 font-medium">{acc.code} - {acc.name}</span>
                      <span className="font-bold text-slate-900">{inr(acc.balance)}</span>
                    </div>
                  ))}
                </div>

                <div className={`${PANEL} p-5 space-y-3`}>
                  <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                    <span>Expense Accounts</span>
                    <span className="text-rose-600 font-mono">{inr(incomeStatement.totalExpenses)}</span>
                  </h4>
                  {incomeStatement.expenseAccounts?.map((acc) => (
                    <div key={acc.code} className="flex justify-between text-xs py-1">
                      <span className="text-slate-700 font-medium">{acc.code} - {acc.name}</span>
                      <span className="font-bold text-slate-900">{inr(acc.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 15: SALES TAX REPORT */}
      {activeSubTabId === 'sales-tax' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sales Tax Report</h3>
              <p className="text-xs text-slate-500">Automatically calculated sales tax report with input tax credit for government agencies</p>
            </div>
            {salesTaxReport && (
              <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold">
                Status: {salesTaxReport.filingStatus}
              </span>
            )}
          </div>

          {salesTaxReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Output Tax (Sales)</p>
                  <h4 className="mt-1 text-2xl font-bold text-slate-900">{inr(salesTaxReport.outputTaxCollected)}</h4>
                </div>
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Input Tax Credit (ITC)</p>
                  <h4 className="mt-1 text-2xl font-bold text-emerald-700">{inr(salesTaxReport.inputTaxCredit)}</h4>
                </div>
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Tax Paid via Challans</p>
                  <h4 className="mt-1 text-2xl font-bold text-blue-700">{inr(salesTaxReport.totalTaxPaidToAgencies)}</h4>
                </div>
                <div className={`${PANEL} p-4`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Net Tax Payable</p>
                  <h4 className="mt-1 text-2xl font-bold text-rose-600">{inr(salesTaxReport.netTaxPayable)}</h4>
                </div>
              </div>

              {/* Rate Breakdown Table */}
              <div className={`${PANEL} overflow-hidden`}>
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F2F2F2]">
                    <tr>
                      {['Tax Slab', 'Rate (%)', 'Taxable Turnover', 'Output Tax Collected'].map((h) => (
                        <th key={h} className={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesTaxReport.breakdownByRate?.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900">{r.name}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{r.rate}%</td>
                        <td className="px-4 py-3 font-mono">{inr(r.taxableAmount)}</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-800">{inr(r.taxCollected)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 16: BALANCE SHEET */}
      {activeSubTabId === 'balance-sheet' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Balance Sheet</h3>
              <p className="text-xs text-slate-500">Analyze financial condition through Assets, Liabilities, and Equity (Assets = Liabilities + Equity)</p>
            </div>
            {balanceSheet && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                balanceSheet.isBalanced
                  ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                  : 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
              }`}>
                {balanceSheet.isBalanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {balanceSheet.isBalanced ? 'Equation Balanced (A = L + E)' : 'Discrepancy in Accounting Equation'}
              </span>
            )}
          </div>

          {balanceSheet && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className={`${PANEL} p-4 border-l-4 border-l-emerald-600`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Assets</p>
                  <h4 className="mt-1 text-2xl font-bold text-emerald-700">{inr(balanceSheet.totalAssets)}</h4>
                </div>
                <div className={`${PANEL} p-4 border-l-4 border-l-rose-600`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Liabilities</p>
                  <h4 className="mt-1 text-2xl font-bold text-rose-700">{inr(balanceSheet.totalLiabilities)}</h4>
                </div>
                <div className={`${PANEL} p-4 border-l-4 border-l-purple-600`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Equity</p>
                  <h4 className="mt-1 text-2xl font-bold text-purple-700">{inr(balanceSheet.totalEquity)}</h4>
                </div>
              </div>

              {/* Assets vs Liabilities & Equity Side-by-Side */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Assets Column */}
                <div className={`${PANEL} p-5 space-y-3`}>
                  <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                    <span>Assets (Resources Owned)</span>
                    <span className="font-bold font-mono text-emerald-700">{inr(balanceSheet.totalAssets)}</span>
                  </h4>
                  {balanceSheet.assets?.map((a) => (
                    <div key={a.code} className="flex justify-between text-xs py-1">
                      <span className="text-slate-700 font-medium">{a.code} - {a.name}</span>
                      <span className="font-bold text-slate-900">{inr(a.balance)}</span>
                    </div>
                  ))}
                </div>

                {/* Liabilities & Equity Column */}
                <div className={`${PANEL} p-5 space-y-4`}>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                      <span>Liabilities (Amounts Owed)</span>
                      <span className="font-bold font-mono text-rose-700">{inr(balanceSheet.totalLiabilities)}</span>
                    </h4>
                    {balanceSheet.liabilities?.map((l) => (
                      <div key={l.code} className="flex justify-between text-xs py-1">
                        <span className="text-slate-700 font-medium">{l.code} - {l.name}</span>
                        <span className="font-bold text-slate-900">{inr(l.balance)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                      <span>Equity & Retained Capital</span>
                      <span className="font-bold font-mono text-purple-700">{inr(balanceSheet.totalEquity)}</span>
                    </h4>
                    {balanceSheet.equity?.map((e) => (
                      <div key={e.code} className="flex justify-between text-xs py-1">
                        <span className="text-slate-700 font-medium">{e.code} - {e.name}</span>
                        <span className="font-bold text-slate-900">{inr(e.balance)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between text-xs font-bold text-slate-900">
                    <span>Total Liabilities & Equity:</span>
                    <span className="font-mono text-emerald-800">{inr(balanceSheet.totalLiabilitiesAndEquity)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE ESTIMATION / QUOTE */}
      {/* ------------------------------------------------------------- */}
      {isEstimateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">New Quotation / Estimate</h3>
              </div>
              <button type="button" onClick={() => setIsEstimateModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiClient.post('/admin-ops/finance/estimations', estimateForm);
                  setIsEstimateModalOpen(false);
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to save estimate');
                }
              }}
              className="p-6 overflow-y-auto space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Client / Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={estimateForm.customerName}
                    onChange={(e) => setEstimateForm({ ...estimateForm, customerName: e.target.value })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Company Name</label>
                  <input
                    type="text"
                    value={estimateForm.company}
                    onChange={(e) => setEstimateForm({ ...estimateForm, company: e.target.value })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Client Email</label>
                  <input
                    type="email"
                    value={estimateForm.customerEmail}
                    onChange={(e) => setEstimateForm({ ...estimateForm, customerEmail: e.target.value })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Mobile Phone</label>
                  <input
                    type="text"
                    value={estimateForm.customerMobile}
                    onChange={(e) => setEstimateForm({ ...estimateForm, customerMobile: e.target.value })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
              </div>

              {/* Dynamic Line items */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Itemized Products / Services</label>
                <div className="space-y-2">
                  {estimateForm.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="text"
                        placeholder="Item name"
                        required
                        value={it.name}
                        onChange={(e) => {
                          const next = [...estimateForm.items];
                          next[idx].name = e.target.value;
                          setEstimateForm({ ...estimateForm, items: next });
                        }}
                        className={`${INPUT} col-span-5 text-xs`}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        required
                        min="1"
                        value={it.quantity}
                        onChange={(e) => {
                          const next = [...estimateForm.items];
                          next[idx].quantity = Number(e.target.value);
                          next[idx].taxAmount = Math.round(next[idx].quantity * next[idx].unitPrice * (next[idx].taxRate / 100));
                          next[idx].total = (next[idx].quantity * next[idx].unitPrice) + next[idx].taxAmount;
                          setEstimateForm({ ...estimateForm, items: next });
                        }}
                        className={`${INPUT} col-span-2 text-xs`}
                      />
                      <input
                        type="number"
                        placeholder="Unit ₹"
                        required
                        min="0"
                        value={it.unitPrice}
                        onChange={(e) => {
                          const next = [...estimateForm.items];
                          next[idx].unitPrice = Number(e.target.value);
                          next[idx].taxAmount = Math.round(next[idx].quantity * next[idx].unitPrice * (next[idx].taxRate / 100));
                          next[idx].total = (next[idx].quantity * next[idx].unitPrice) + next[idx].taxAmount;
                          setEstimateForm({ ...estimateForm, items: next });
                        }}
                        className={`${INPUT} col-span-2 text-xs`}
                      />
                      <span className="col-span-2 text-xs font-bold font-mono text-slate-800">{inr(it.total)}</span>
                      {estimateForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEstimateForm({ ...estimateForm, items: estimateForm.items.filter((_, i) => i !== idx) })}
                          className="col-span-1 text-slate-400 hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEstimateForm({
                      ...estimateForm,
                      items: [...estimateForm.items, { name: '', description: '', quantity: 1, unitPrice: 0, taxRate: 5, taxAmount: 0, total: 0 }],
                    })}
                    className={`${BTN} text-xs gap-1`}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Row
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsEstimateModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" className={BTN_PRIMARY}>Save Estimate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: LOGIC-BASED DOUBLE-ENTRY JOURNAL ENTRY (23) */}
      {/* ------------------------------------------------------------- */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">New Double-Entry Journal Entry</h3>
              </div>
              <button type="button" onClick={() => setIsJournalModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!journalBalanceCheck.isBalanced) {
                  alert('Debits and Credits must balance before submitting!');
                  return;
                }
                try {
                  await apiClient.post('/admin-ops/finance/journals', journalForm);
                  setIsJournalModalOpen(false);
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to post journal entry');
                }
              }}
              className="p-6 overflow-y-auto space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700">Memo / Description *</label>
                <input
                  type="text"
                  required
                  value={journalForm.memo}
                  onChange={(e) => setJournalForm({ ...journalForm, memo: e.target.value })}
                  placeholder="e.g. Bulk produce sales settlement / Monthly warehouse rent payment"
                  className={`${INPUT} mt-1`}
                />
              </div>

              {/* Dynamic Debit / Credit Lines */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Journal Lines</label>
                {journalForm.entries.map((entry, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <select
                      value={entry.accountCode}
                      onChange={(e) => {
                        const acc = accounts.find((a) => a.code === e.target.value);
                        const next = [...journalForm.entries];
                        next[idx].accountCode = e.target.value;
                        next[idx].accountName = acc ? acc.name : '';
                        setJournalForm({ ...journalForm, entries: next });
                      }}
                      className={`${INPUT} col-span-5 text-xs`}
                    >
                      <option value="">Select Account...</option>
                      {accounts.map((a) => (
                        <option key={a.code} value={a.code}>
                          {a.code} - {a.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={entry.type}
                      onChange={(e) => {
                        const next = [...journalForm.entries];
                        next[idx].type = e.target.value;
                        setJournalForm({ ...journalForm, entries: next });
                      }}
                      className={`${INPUT} col-span-3 text-xs font-bold ${entry.type === 'debit' ? 'text-emerald-700' : 'text-purple-700'}`}
                    >
                      <option value="debit">DEBIT</option>
                      <option value="credit">CREDIT</option>
                    </select>

                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="Amount ₹"
                      value={entry.amount || ''}
                      onChange={(e) => {
                        const next = [...journalForm.entries];
                        next[idx].amount = Number(e.target.value);
                        setJournalForm({ ...journalForm, entries: next });
                      }}
                      className={`${INPUT} col-span-3 text-xs font-mono font-bold`}
                    />

                    {journalForm.entries.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setJournalForm({ ...journalForm, entries: journalForm.entries.filter((_, i) => i !== idx) })}
                        className="col-span-1 text-slate-400 hover:text-rose-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setJournalForm({
                    ...journalForm,
                    entries: [
                      ...journalForm.entries,
                      { accountCode: accounts[0]?.code || '1010', accountName: accounts[0]?.name || 'Cash', type: 'debit', amount: 0, description: '' },
                    ],
                  })}
                  className={`${BTN} text-xs gap-1`}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Journal Line
                </button>
              </div>

              {/* Logic-based balance indicator */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                journalBalanceCheck.isBalanced
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div>
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    {journalBalanceCheck.isBalanced ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
                    {journalBalanceCheck.isBalanced ? 'Journal Entry is Balanced' : `Imbalance: ${inr(journalBalanceCheck.diff)}`}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Total Debits: <span className="font-bold">{inr(journalBalanceCheck.debits)}</span> • Total Credits: <span className="font-bold">{inr(journalBalanceCheck.credits)}</span>
                  </p>
                </div>

                {!journalBalanceCheck.isBalanced && (
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg">
                    Cannot Submit
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsJournalModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" disabled={!journalBalanceCheck.isBalanced} className={`${BTN_PRIMARY} disabled:opacity-50`}>
                  Post Balanced Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: RECORD EXPENSE TRANSACTION (21) */}
      {/* ------------------------------------------------------------- */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Record Expense Transaction</h3>
              </div>
              <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiClient.post('/admin-ops/finance/expenses', expenseForm);
                  setIsExpenseModalOpen(false);
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to save expense');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Cold storage electricity / Packaging boxes"
                  className={`${INPUT} mt-1`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expenseForm.amount || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Payment Type</label>
                  <select
                    value={expenseForm.paymentType}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentType: e.target.value })}
                    className={`${INPUT} mt-1`}
                  >
                    <option value="cash">Cash on Hand</option>
                    <option value="credit">Credit / Payable</option>
                    <option value="installment">Installment Plan</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {expenseForm.paymentType === 'installment' && (
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-purple-900">Total Installments</label>
                    <input
                      type="number"
                      min="2"
                      max="48"
                      value={expenseForm.installmentDetails.totalInstallments}
                      onChange={(e) => setExpenseForm({
                        ...expenseForm,
                        installmentDetails: { ...expenseForm.installmentDetails, totalInstallments: Number(e.target.value) },
                      })}
                      className={`${INPUT} mt-1 text-xs`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-900">Frequency</label>
                    <select
                      value={expenseForm.installmentDetails.frequency}
                      onChange={(e) => setExpenseForm({
                        ...expenseForm,
                        installmentDetails: { ...expenseForm.installmentDetails, frequency: e.target.value },
                      })}
                      className={`${INPUT} mt-1 text-xs`}
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700">Vendor / Supplier Name</label>
                <input
                  type="text"
                  value={expenseForm.vendorName}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })}
                  placeholder="e.g. Mahavira Packaging Ltd"
                  className={`${INPUT} mt-1`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" className={BTN_PRIMARY}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: NEW PURCHASE ORDER (22) */}
      {/* ------------------------------------------------------------- */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">New Purchase Order</h3>
              </div>
              <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload = {
                    vendorName: purchaseForm.vendorName?.trim(),
                    totalAmount: Math.max(0, Number(purchaseForm.totalAmount) || 0),
                    amountPaid: Math.max(0, Number(purchaseForm.amountPaid) || 0),
                    purchaseDate: purchaseForm.purchaseDate || new Date().toISOString().slice(0, 10),
                    dueDate: purchaseForm.dueDate ? purchaseForm.dueDate : undefined,
                    items: (purchaseForm.items || []).filter((it) => it && it.name && it.name.trim()),
                    notes: purchaseForm.notes || '',
                  };
                  await apiClient.post('/admin-ops/finance/purchases', payload);
                  setIsPurchaseModalOpen(false);
                  setPurchaseForm({
                    vendorName: '',
                    totalAmount: '',
                    amountPaid: '',
                    purchaseDate: new Date().toISOString().slice(0, 10),
                    dueDate: '',
                    items: [],
                    notes: '',
                  });
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to save purchase');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700">Vendor / Farmer Name *</label>
                <input
                  type="text"
                  required
                  value={purchaseForm.vendorName}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorName: e.target.value })}
                  placeholder="e.g. Nashik Organic Farmers Cluster"
                  className={`${INPUT} mt-1`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Total Purchase (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={purchaseForm.totalAmount || ''}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, totalAmount: Number(e.target.value) })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Amount Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={purchaseForm.amountPaid || ''}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, amountPaid: Number(e.target.value) })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Payment Due Date</label>
                <input
                  type="date"
                  value={purchaseForm.dueDate}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, dueDate: e.target.value })}
                  className={`${INPUT} mt-1`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" className={BTN_PRIMARY}>Save Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD TAX RATE (17) */}
      {/* ------------------------------------------------------------- */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Add New Tax Rate</h3>
              <button type="button" onClick={() => setIsRateModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiClient.post('/admin-ops/finance/tax-rates', rateForm);
                  setIsRateModalOpen(false);
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to save tax rate');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700">Rate Name *</label>
                <input
                  type="text"
                  required
                  value={rateForm.name}
                  onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })}
                  placeholder="e.g. GST 18%, State VAT 5%"
                  className={`${INPUT} mt-1`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Percentage Rate (%) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.1"
                  value={rateForm.rate}
                  onChange={(e) => setRateForm({ ...rateForm, rate: Number(e.target.value) })}
                  className={`${INPUT} mt-1`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsRateModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" className={BTN_PRIMARY}>Save Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD TAX ZONE (18) */}
      {/* ------------------------------------------------------------- */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Add Tax Zone</h3>
              <button type="button" onClick={() => setIsZoneModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const regions = zoneForm.regionsText.split(',').map((s) => s.trim()).filter(Boolean);
                  await apiClient.post('/admin-ops/finance/tax-zones', { ...zoneForm, regions });
                  setIsZoneModalOpen(false);
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to save tax zone');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700">Zone Name *</label>
                <input
                  type="text"
                  required
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  placeholder="e.g. North Zone (Delhi, Punjab)"
                  className={`${INPUT} mt-1`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Zone Code *</label>
                <input
                  type="text"
                  required
                  value={zoneForm.code}
                  onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ZONE-NORTH"
                  className={`${INPUT} mt-1 uppercase font-mono`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">States / Branches (comma-separated)</label>
                <input
                  type="text"
                  value={zoneForm.regionsText}
                  onChange={(e) => setZoneForm({ ...zoneForm, regionsText: e.target.value })}
                  placeholder="Delhi, Punjab, Haryana"
                  className={`${INPUT} mt-1`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsZoneModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" className={BTN_PRIMARY}>Save Zone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD TAX CATEGORY (19) */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Add Tax Category</h3>
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiClient.post('/admin-ops/finance/tax-categories', catForm);
                  setIsCatModalOpen(false);
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to save tax category');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Agricultural Produce / Processed Food"
                  className={`${INPUT} mt-1`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Code *</label>
                  <input
                    type="text"
                    required
                    value={catForm.code}
                    onChange={(e) => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. TC-AGRI-0"
                    className={`${INPUT} mt-1 font-mono uppercase`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Standard Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={catForm.standardRate}
                    onChange={(e) => setCatForm({ ...catForm, standardRate: Number(e.target.value) })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsCatModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" className={BTN_PRIMARY}>Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: RECORD TAX PAYMENT (20) */}
      {isTaxPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Record Tax Payment</h3>
              <button type="button" onClick={() => setIsTaxPayModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiClient.post('/admin-ops/finance/tax-payments', taxPayForm);
                  setIsTaxPayModalOpen(false);
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to record tax payment');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700">Tax Agency *</label>
                <select
                  value={taxPayForm.agencyName}
                  required
                  onChange={(e) => setTaxPayForm({ ...taxPayForm, agencyName: e.target.value })}
                  className={`${INPUT} mt-1`}
                >
                  <option value="">-- Select Agency --</option>
                  {taxAgencies.map((a) => (
                    <option key={a._id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Filing Period</label>
                  <input
                    type="text"
                    value={taxPayForm.period}
                    onChange={(e) => setTaxPayForm({ ...taxPayForm, period: e.target.value })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={taxPayForm.amountPaid || ''}
                    onChange={(e) => setTaxPayForm({ ...taxPayForm, amountPaid: Number(e.target.value) })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Challan / Reference #</label>
                <input
                  type="text"
                  value={taxPayForm.challanNumber}
                  onChange={(e) => setTaxPayForm({ ...taxPayForm, challanNumber: e.target.value })}
                  placeholder="e.g. CIN-GST-2026-99120"
                  className={`${INPUT} mt-1 font-mono`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsTaxPayModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" className={BTN_PRIMARY}>Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD CUSTOM ACCOUNT (25) */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Create Custom Account</h3>
              <button type="button" onClick={() => setIsAccountModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiClient.post('/admin-ops/finance/accounts', accountForm);
                  setIsAccountModalOpen(false);
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to create account');
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Account Code *</label>
                  <input
                    type="text"
                    required
                    value={accountForm.code}
                    onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                    placeholder="e.g. 1025"
                    className={`${INPUT} mt-1 font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Account Type *</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    className={`${INPUT} mt-1 font-semibold`}
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Account Name *</label>
                <input
                  type="text"
                  required
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="e.g. ICICI Secondary Current Account"
                  className={`${INPUT} mt-1`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" className={BTN_PRIMARY}>Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD CUSTOMER / VENDOR CONTACT (24) */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Add Customer / Vendor</h3>
              <button type="button" onClick={() => setIsContactModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiClient.post('/admin-ops/finance/contacts', contactForm);
                  setIsContactModalOpen(false);
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to save contact');
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Contact Type</label>
                  <select
                    value={contactForm.type}
                    onChange={(e) => setContactForm({ ...contactForm, type: e.target.value })}
                    className={`${INPUT} mt-1 font-bold`}
                  >
                    <option value="customer">Customer (B2B)</option>
                    <option value="vendor">Vendor / Supplier</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Company Name</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={contactForm.taxNumber}
                    onChange={(e) => setContactForm({ ...contactForm, taxNumber: e.target.value.toUpperCase() })}
                    placeholder="27AAAAA0000A1Z5"
                    className={`${INPUT} mt-1 font-mono uppercase`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Mobile Phone</label>
                  <input
                    type="text"
                    value={contactForm.mobile}
                    onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsContactModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" className={BTN_PRIMARY}>Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: INTERNAL CASH TRANSFER (26) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Internal Cash & Bank Transfer</h3>
              </div>
              <button type="button" onClick={() => setIsTransferModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiClient.post('/admin-ops/finance/transfers', transferForm);
                  setIsTransferModalOpen(false);
                  loadTabContent();
                } catch (err) {
                  alert(err?.response?.data?.message || err.message || 'Failed to execute transfer');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700">From Account (Source) *</label>
                <select
                  value={transferForm.fromAccountCode}
                  onChange={(e) => setTransferForm({ ...transferForm, fromAccountCode: e.target.value })}
                  className={`${INPUT} mt-1 font-semibold`}
                >
                  <option value="">-- Select Source Account --</option>
                  {accounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name} ({inr(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">To Account (Destination) *</label>
                <select
                  value={transferForm.toAccountCode}
                  onChange={(e) => setTransferForm({ ...transferForm, toAccountCode: e.target.value })}
                  className={`${INPUT} mt-1 font-semibold`}
                >
                  <option value="">-- Select Destination Account --</option>
                  {accounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name} ({inr(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={transferForm.amount || ''}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: Number(e.target.value) })}
                    className={`${INPUT} mt-1 font-mono font-bold`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Transfer Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={transferForm.transferFee}
                    onChange={(e) => setTransferForm({ ...transferForm, transferFee: Number(e.target.value) })}
                    className={`${INPUT} mt-1`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Reference / UTR / Cheque #</label>
                <input
                  type="text"
                  value={transferForm.reference}
                  onChange={(e) => setTransferForm({ ...transferForm, reference: e.target.value })}
                  placeholder="e.g. UTR-HDFC-99128"
                  className={`${INPUT} mt-1 font-mono`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className={BTN}>Cancel</button>
                <button type="submit" className={BTN_PRIMARY}>Transfer & Synchronize</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
