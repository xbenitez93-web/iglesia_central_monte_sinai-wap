import React, { useState, useEffect } from 'react';
import {
  ChurchConfig,
  CoopAccount,
  CoopTransaction,
  EventRegistration,
  Family,
  Member,
  MicroLoan,
  SpecialCoopEvent,
} from '../types';
import {
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  DollarSign,
  Heart,
  X,
  CreditCard,
  Tent,
  Users,
  Calendar,
  Sparkles,
  Receipt,
  UserCheck,
  Trash2,
  CheckSquare,
  Square,
  Baby,
  User,
  Check,
  Info,
  Edit3,
  MapPin,
  Tag,
  Save,
} from 'lucide-react';
import { PageHeroBanner } from './PageHeroBanner';
import { getActivePageThemeColor } from '../lib/pageTheme';

export interface FamilyAttendeeSelection {
  memberId: string;
  fullName: string;
  photoUrl?: string;
  isChild: boolean;
  age: number | null;
  role?: string;
  isAttending: boolean;
}

export const getFamilyMembers = (fam: Family, allMembers: Member[]): Member[] => {
  if (!fam) return [];
  return allMembers.filter((m) => {
    if (m.familyId && m.familyId === fam.id) return true;
    if (fam.memberIds && Array.isArray(fam.memberIds) && fam.memberIds.includes(m.id)) return true;
    if (
      m.familyName &&
      fam.familyName &&
      (m.familyName || '').trim().toLowerCase() === (fam.familyName || '').trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  });
};

interface CoopViewProps {
  coopAccounts: CoopAccount[];
  coopTransactions: CoopTransaction[];
  microLoans: MicroLoan[];
  members: Member[];
  families?: Family[];
  config: ChurchConfig;
  specialEvents?: SpecialCoopEvent[];
  eventRegistrations?: EventRegistration[];
  onAddAccount: (account: Omit<CoopAccount, 'id'>) => void;
  onDeleteAccount?: (accountId: string) => void;
  onAddCoopTransaction: (tx: Omit<CoopTransaction, 'id'>) => void;
  onDeleteCoopTransaction?: (txId: string) => void;
  onRequestLoan: (loan: Omit<MicroLoan, 'id'>) => void;
  onUpdateLoanStatus: (loanId: string, status: MicroLoan['status']) => void;
  onMakeLoanPayment: (loanId: string, amount: number) => void;
  onDeleteLoan?: (loanId: string) => void;
  onAddSpecialEvent?: (event: Omit<SpecialCoopEvent, 'id'>) => void;
  onUpdateSpecialEvent?: (event: SpecialCoopEvent) => void;
  onDeleteSpecialEvent?: (eventId: string) => void;
  onRegisterForEvent?: (reg: Omit<EventRegistration, 'id'>) => void;
  onUpdateEventRegistration?: (reg: EventRegistration) => void;
  onDeleteEventRegistration?: (regId: string) => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig) => void;
}

export const CoopView: React.FC<CoopViewProps> = ({
  coopAccounts,
  coopTransactions,
  microLoans,
  members,
  families = [],
  config,
  specialEvents = [],
  eventRegistrations = [],
  onAddAccount,
  onDeleteAccount,
  onAddCoopTransaction,
  onDeleteCoopTransaction,
  onRequestLoan,
  onUpdateLoanStatus,
  onMakeLoanPayment,
  onDeleteLoan,
  onAddSpecialEvent,
  onUpdateSpecialEvent,
  onDeleteSpecialEvent,
  onRegisterForEvent,
  onUpdateEventRegistration,
  onDeleteEventRegistration,
  onUpdateConfig,
}) => {
  const [subTab, setSubTab] = useState<'accounts' | 'loans' | 'transactions' | 'campamentos'>('campamentos');
  const pageColor = getActivePageThemeColor('coop', config);

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEditRegModalOpen, setIsEditRegModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<EventRegistration | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editingEventForm, setEditingEventForm] = useState<SpecialCoopEvent | null>(null);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<MicroLoan | null>(null);

  // Delete Confirmation Target Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'event' | 'registration' | 'account' | 'loan' | 'transaction';
    id: string;
    title: string;
    description: string;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    const { type, id } = deleteConfirmTarget;
    if (type === 'event' && onDeleteSpecialEvent) {
      onDeleteSpecialEvent(id);
      if (selectedEventId === id) {
        const remaining = specialEvents.filter((e) => e.id !== id);
        setSelectedEventId(remaining.length > 0 ? remaining[0].id : '');
      }
      setIsEditEventModalOpen(false);
      setEditingEventForm(null);
    } else if (type === 'registration' && onDeleteEventRegistration) {
      onDeleteEventRegistration(id);
      setIsEditRegModalOpen(false);
      setEditingReg(null);
    } else if (type === 'account' && onDeleteAccount) {
      onDeleteAccount(id);
    } else if (type === 'loan' && onDeleteLoan) {
      onDeleteLoan(id);
    } else if (type === 'transaction' && onDeleteCoopTransaction) {
      onDeleteCoopTransaction(id);
    }
    setDeleteConfirmTarget(null);
  };

  // Forms data
  const [accountTypeMode, setAccountTypeMode] = useState<'member' | 'family'>('member');
  const [accountFormData, setAccountFormData] = useState({
    memberId: '',
    familyId: '',
    initialDeposit: '',
  });

  const [depositFormData, setDepositFormData] = useState({
    accountId: '',
    type: 'Depósito' as 'Depósito' | 'Retiro',
    amount: '',
    notes: '',
  });

  const [loanTypeMode, setLoanTypeMode] = useState<'member' | 'family'>('member');
  const [loanFormData, setLoanFormData] = useState({
    memberId: '',
    familyId: '',
    amount: '',
    purpose: '',
    installmentMonths: 6,
    interestRatePercentage: 1.0,
  });

  // Helper to calculate age from birthDate
  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return null;
    const birth = new Date(birthDateString);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Event Registration Form Data
  const [selectedEventId, setSelectedEventId] = useState<string>(
    specialEvents[0]?.id || ''
  );
  const [registrationMode, setRegistrationMode] = useState<'member' | 'family' | 'custom'>('family');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');

  // Sychronized family attendees selection roster
  const [familyAttendees, setFamilyAttendees] = useState<FamilyAttendeeSelection[]>([]);
  const [extraAdultsCount, setExtraAdultsCount] = useState<number>(0);
  const [extraChildrenCount, setExtraChildrenCount] = useState<number>(0);

  const [registrationForm, setRegistrationForm] = useState({
    memberName: '',
    adultsCount: 1,
    childrenCount: 0,
    paymentMethod: 'Efectivo' as any,
    notes: '',
  });

  // Calculate synchronized attendee counts and notes
  const syncFamilyCalculations = (
    attendees: FamilyAttendeeSelection[],
    extraAdults: number,
    extraChildren: number,
    fam: Family
  ) => {
    const attending = attendees.filter((a) => a.isAttending);
    const familyAdults = attending.filter((a) => !a.isChild).length;
    const familyChildren = attending.filter((a) => a.isChild).length;

    const totalAdults = familyAdults + extraAdults;
    const totalChildren = familyChildren + extraChildren;

    const names = attending
      .map((a) => `${a.fullName} (${a.isChild ? 'Niño' : 'Adulto'})`)
      .join(', ');

    const extras = [];
    if (extraAdults > 0) extras.push(`+${extraAdults} adulto(s) extra`);
    if (extraChildren > 0) extras.push(`+${extraChildren} niño(s) extra`);
    const extraLabel = extras.length > 0 ? ` [${extras.join(', ')}]` : '';

    setRegistrationForm((prev) => ({
      ...prev,
      memberName: `Familia ${fam.familyName}`,
      adultsCount: Math.max(0, totalAdults),
      childrenCount: Math.max(0, totalChildren),
      notes: `Núcleo familiar: ${fam.familyName} (${attending.length + extraAdults + extraChildren} participantes: ${names || 'Ninguno seleccionado'}${extraLabel})${fam.phone ? ` • Tel: ${fam.phone}` : ''}`,
    }));
  };

  const handleSelectMemberForReg = (memberId: string) => {
    setSelectedMemberId(memberId);
    setSelectedFamilyId('');
    setFamilyAttendees([]);
    const m = members.find((mem) => mem.id === memberId);
    if (m) {
      const roles = m.ministryRoles && m.ministryRoles.length > 0 ? m.ministryRoles.join(', ') : 'Miembro';
      const famInfo = m.familyName ? ` • Familia: ${m.familyName}` : '';
      setRegistrationForm((prev) => ({
        ...prev,
        memberName: m.fullName,
        adultsCount: 1,
        childrenCount: 0,
        notes: m.phone ? `Tel: ${m.phone} • Ministerio: ${roles}${famInfo}` : `Ministerio: ${roles}${famInfo}`,
      }));
    }
  };

  const handleSelectFamilyForReg = (familyId: string) => {
    setSelectedFamilyId(familyId);
    setSelectedMemberId('');
    const fam = families.find((f) => f.id === familyId);
    if (fam) {
      const familyMembers = getFamilyMembers(fam, members);
      const attendees: FamilyAttendeeSelection[] = familyMembers.map((m) => {
        const age = calculateAge(m.birthDate);
        const isChild = age !== null && age < 13;
        return {
          memberId: m.id,
          fullName: m.fullName,
          photoUrl: m.photoUrl,
          isChild,
          age,
          role: m.ministryRoles && m.ministryRoles.length > 0 ? m.ministryRoles[0] : undefined,
          isAttending: true,
        };
      });

      setFamilyAttendees(attendees);
      setExtraAdultsCount(0);
      setExtraChildrenCount(0);
      syncFamilyCalculations(attendees, 0, 0, fam);
    } else {
      setFamilyAttendees([]);
      setExtraAdultsCount(0);
      setExtraChildrenCount(0);
    }
  };

  const toggleAttendeeAttendance = (memberId: string) => {
    const fam = families.find((f) => f.id === selectedFamilyId);
    if (!fam) return;

    const updated = familyAttendees.map((a) =>
      a.memberId === memberId ? { ...a, isAttending: !a.isAttending } : a
    );
    setFamilyAttendees(updated);
    syncFamilyCalculations(updated, extraAdultsCount, extraChildrenCount, fam);
  };

  const toggleAttendeeAgeCategory = (memberId: string) => {
    const fam = families.find((f) => f.id === selectedFamilyId);
    if (!fam) return;

    const updated = familyAttendees.map((a) =>
      a.memberId === memberId ? { ...a, isChild: !a.isChild } : a
    );
    setFamilyAttendees(updated);
    syncFamilyCalculations(updated, extraAdultsCount, extraChildrenCount, fam);
  };

  const setAllAttendeesStatus = (status: boolean) => {
    const fam = families.find((f) => f.id === selectedFamilyId);
    if (!fam) return;

    const updated = familyAttendees.map((a) => ({ ...a, isAttending: status }));
    setFamilyAttendees(updated);
    syncFamilyCalculations(updated, extraAdultsCount, extraChildrenCount, fam);
  };

  const handleExtraAdultsChange = (val: number) => {
    const count = Math.max(0, val);
    setExtraAdultsCount(count);
    const fam = families.find((f) => f.id === selectedFamilyId);
    if (fam) {
      syncFamilyCalculations(familyAttendees, count, extraChildrenCount, fam);
    }
  };

  const handleExtraChildrenChange = (val: number) => {
    const count = Math.max(0, val);
    setExtraChildrenCount(count);
    const fam = families.find((f) => f.id === selectedFamilyId);
    if (fam) {
      syncFamilyCalculations(familyAttendees, extraAdultsCount, count, fam);
    }
  };

  // Keep family attendees synchronized if members prop updates while a family is selected
  useEffect(() => {
    if (isRegisterModalOpen && registrationMode === 'family' && selectedFamilyId) {
      const fam = families.find((f) => f.id === selectedFamilyId);
      if (fam) {
        const familyMembers = getFamilyMembers(fam, members);
        // Compare with current familyAttendees to add any new member
        const currentIds = new Set(familyAttendees.map((a) => a.memberId));
        const newMembersFound = familyMembers.filter((m) => !currentIds.has(m.id));
        const removedMembers = familyAttendees.filter(
          (a) => !familyMembers.some((m) => m.id === a.memberId)
        );

        if (newMembersFound.length > 0 || removedMembers.length > 0) {
          const updated: FamilyAttendeeSelection[] = familyMembers.map((m) => {
            const existing = familyAttendees.find((a) => a.memberId === m.id);
            if (existing) return existing;
            const age = calculateAge(m.birthDate);
            return {
              memberId: m.id,
              fullName: m.fullName,
              photoUrl: m.photoUrl,
              isChild: age !== null && age < 13,
              age,
              role: m.ministryRoles && m.ministryRoles.length > 0 ? m.ministryRoles[0] : undefined,
              isAttending: true,
            };
          });
          setFamilyAttendees(updated);
          syncFamilyCalculations(updated, extraAdultsCount, extraChildrenCount, fam);
        }
      }
    }
  }, [members, families, isRegisterModalOpen, registrationMode, selectedFamilyId]);

  // New Event Form Data
  const [newEventForm, setNewEventForm] = useState({
    title: 'Campamento de Jóvenes 2026',
    description: 'Retiro espiritual y campamento juvenil anual con talleres, dinámicas y veladas.',
    date: '2026-09-18',
    location: 'Finca Los Pinos - Valle Bendecido',
    adultPrice: 350,
    childPrice: 180,
    targetGoal: 25000,
  });

  const [paymentAmount, setPaymentAmount] = useState('');

  // Calculations
  const totalSavingsBalance = coopAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const activeLoans = microLoans.filter((l) => l.status === 'En Pago');
  const totalLoanedAmount = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0);

  const activeSpecialEvent = specialEvents.find((e) => e.id === selectedEventId) || specialEvents[0];

  const currentAdultPrice = activeSpecialEvent ? activeSpecialEvent.adultPrice : 350;
  const currentChildPrice = activeSpecialEvent ? activeSpecialEvent.childPrice : 180;

  const registrationTotalAmount =
    registrationForm.adultsCount * currentAdultPrice +
    registrationForm.childrenCount * currentChildPrice;

  const totalEventRaised = eventRegistrations
    .filter((r) => r.eventId === (activeSpecialEvent?.id || 'se1'))
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const totalParticipantsCount = eventRegistrations
    .filter((r) => r.eventId === (activeSpecialEvent?.id || 'se1'))
    .reduce((sum, r) => sum + r.adultsCount + r.childrenCount, 0);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    let id = '';
    let name = '';

    if (accountTypeMode === 'family') {
      const fam = families.find((f) => f.id === accountFormData.familyId);
      if (!fam) return;
      id = `fam_${fam.id}`;
      name = `Familia ${fam.familyName}`;
    } else {
      const member = members.find((m) => m.id === accountFormData.memberId);
      if (!member) return;
      id = member.id;
      name = member.fullName;
    }

    const initDep = Number(accountFormData.initialDeposit) || 0;

    onAddAccount({
      memberId: id,
      memberName: name,
      accountNumber: `AHO-00${100 + coopAccounts.length + 1}`,
      currentBalance: initDep,
      totalDeposited: initDep,
      totalWithdrawn: 0,
      openedDate: new Date().toISOString().split('T')[0],
      status: 'Activa',
    });

    setIsAccountModalOpen(false);
    setAccountFormData({ memberId: '', familyId: '', initialDeposit: '' });
  };

  const handleDepositWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depositFormData.amount);
    if (amount <= 0) return;

    const account = coopAccounts.find((a) => a.id === depositFormData.accountId);
    if (!account) return;

    onAddCoopTransaction({
      accountId: account.id,
      memberName: account.memberName,
      type: depositFormData.type,
      amount,
      date: new Date().toISOString().split('T')[0],
      notes: depositFormData.notes || `${depositFormData.type} en cuenta de ahorro`,
    });

    setIsDepositModalOpen(false);
    setDepositFormData({ accountId: '', type: 'Depósito', amount: '', notes: '' });
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    let id = '';
    let name = '';

    if (loanTypeMode === 'family') {
      const fam = families.find((f) => f.id === loanFormData.familyId);
      if (!fam) return;
      id = `fam_${fam.id}`;
      name = `Familia ${fam.familyName}`;
    } else {
      const member = members.find((m) => m.id === loanFormData.memberId);
      if (!member) return;
      id = member.id;
      name = member.fullName;
    }

    const amount = Number(loanFormData.amount);
    if (!id || amount <= 0) return;

    const monthlyPayment = (amount / loanFormData.installmentMonths) * (1 + loanFormData.interestRatePercentage / 100);

    onRequestLoan({
      memberId: id,
      memberName: name,
      amount,
      purpose: loanFormData.purpose,
      installmentMonths: loanFormData.installmentMonths,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      interestRatePercentage: loanFormData.interestRatePercentage,
      status: 'Solicitado',
      requestDate: new Date().toISOString().split('T')[0],
      remainingAmount: amount,
      payments: [],
    });

    setIsLoanModalOpen(false);
    setLoanFormData({
      memberId: '',
      familyId: '',
      amount: '',
      purpose: '',
      installmentMonths: 6,
      interestRatePercentage: 1.0,
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForPayment || !paymentAmount) return;

    onMakeLoanPayment(selectedLoanForPayment.id, Number(paymentAmount));
    setSelectedLoanForPayment(null);
    setPaymentAmount('');
  };

  const handleRegisterParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationForm.memberName || !onRegisterForEvent || !activeSpecialEvent) return;

    onRegisterForEvent({
      eventId: activeSpecialEvent.id,
      memberName: registrationForm.memberName,
      adultsCount: registrationForm.adultsCount,
      childrenCount: registrationForm.childrenCount,
      totalAmount: registrationTotalAmount,
      paymentMethod: registrationForm.paymentMethod,
      date: new Date().toISOString().split('T')[0],
      status: 'Pagado',
      notes: registrationForm.notes,
    });

    setIsRegisterModalOpen(false);
    setRegistrationForm({
      memberName: '',
      adultsCount: 1,
      childrenCount: 0,
      paymentMethod: 'Efectivo',
      notes: '',
    });
  };

  const handleOpenEditRegistration = (reg: EventRegistration) => {
    setEditingReg({ ...reg });
    setIsEditRegModalOpen(true);
  };

  const handleSaveEditedRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg || !onUpdateEventRegistration) return;
    onUpdateEventRegistration(editingReg);
    setIsEditRegModalOpen(false);
    setEditingReg(null);
  };

  const handleCreateNewSpecialEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddSpecialEvent) return;

    onAddSpecialEvent({
      title: newEventForm.title,
      description: newEventForm.description,
      date: newEventForm.date,
      location: newEventForm.location,
      adultPrice: Number(newEventForm.adultPrice),
      childPrice: Number(newEventForm.childPrice),
      targetGoal: Number(newEventForm.targetGoal),
      status: 'Abierto',
    });

    setIsNewEventModalOpen(false);
    setNewEventForm({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      adultPrice: 350,
      childPrice: 180,
      targetGoal: 25000,
    });
  };

  const handleOpenEditEventModal = (event: SpecialCoopEvent) => {
    setEditingEventForm({ ...event });
    setIsEditEventModalOpen(true);
  };

  const handleUpdateSpecialEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventForm || !onUpdateSpecialEvent) return;

    onUpdateSpecialEvent(editingEventForm);
    setIsEditEventModalOpen(false);
    setEditingEventForm(null);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header Banner */}
      <PageHeroBanner
        tabId="coop"
        config={config}
        icon={PiggyBank}
        defaultTitle="Minicooperativa & Eventos"
        defaultSubtitle="Fondo solidario de ahorro, préstamos comunitarios e inscripciones con cuotas para eventos como Campamento de Jóvenes."
        defaultBadge="Economía Solidaria & Campamentos"
        onUpdateConfig={onUpdateConfig}
        actionButtons={
          <>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Tent className="w-4 h-4" style={{ color: pageColor }} />
              <span>Inscribir en Evento</span>
            </button>

            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl text-white font-bold text-xs border border-white/30 shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              style={{
                backgroundColor: `${pageColor}bb`,
                borderColor: `${pageColor}80`,
              }}
            >
              <span>Depósito / Retiro</span>
            </button>
          </>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recaudación Campamento / Eventos
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {config.currencySymbol}{totalEventRaised.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <Tent className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{totalParticipantsCount} Participantes (Adultos y Niños) inscritos</p>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Fondo Total en Ahorro
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {config.currencySymbol}{totalSavingsBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <PiggyBank className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{coopAccounts.length} Cuentas de ahorro activas</p>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Créditos Solidarios
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {config.currencySymbol}{totalLoanedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <CreditCard className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{activeLoans.length} Microcréditos otorgados</p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('campamentos')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center space-x-2 ${
            subTab === 'campamentos'
              ? 'text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          style={{
            backgroundColor: subTab === 'campamentos' ? pageColor : undefined,
            boxShadow: subTab === 'campamentos' ? `0 4px 14px ${pageColor}40` : undefined,
          }}
        >
          <Tent className="w-4 h-4" />
          <span>Eventos & Campamentos ({specialEvents.length})</span>
        </button>
        <button
          onClick={() => setSubTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            subTab === 'accounts'
              ? 'text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          style={{
            backgroundColor: subTab === 'accounts' ? pageColor : undefined,
            boxShadow: subTab === 'accounts' ? `0 4px 14px ${pageColor}40` : undefined,
          }}
        >
          Cuentas de Ahorro ({coopAccounts.length})
        </button>
        <button
          onClick={() => setSubTab('loans')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            subTab === 'loans'
              ? 'text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          style={{
            backgroundColor: subTab === 'loans' ? pageColor : undefined,
            boxShadow: subTab === 'loans' ? `0 4px 14px ${pageColor}40` : undefined,
          }}
        >
          Solicitudes & Microcréditos ({microLoans.length})
        </button>
        <button
          onClick={() => setSubTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            subTab === 'transactions'
              ? 'text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          style={{
            backgroundColor: subTab === 'transactions' ? pageColor : undefined,
            boxShadow: subTab === 'transactions' ? `0 4px 14px ${pageColor}40` : undefined,
          }}
        >
          Movimientos Ahorro ({coopTransactions.length})
        </button>
      </div>

      {/* SPECIAL EVENTS / CAMPAMENTOS MODULE */}
      {subTab === 'campamentos' && (
        <div className="space-y-6">
          {/* Active Event Banner & Tariff Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-indigo-900/10 dark:from-amber-950/40 dark:to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-amber-200/80 dark:border-amber-800/60 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Tent className="w-4 h-4" />
                    Evento / Campamento Seleccionado
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {activeSpecialEvent?.title || 'Campamento de Jóvenes 2026'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {activeSpecialEvent?.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsNewEventModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-amber-300/80 dark:border-amber-700/80 shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>Nuevo Evento Recaudación</span>
                  </button>

                  {activeSpecialEvent && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditEventModal(activeSpecialEvent)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                      title="Editar Evento / Campamento"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Editar Evento</span>
                    </button>
                  )}

                  {activeSpecialEvent && onDeleteSpecialEvent && (
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteConfirmTarget({
                          type: 'event',
                          id: activeSpecialEvent.id,
                          title: `Eliminar "${activeSpecialEvent.title}"`,
                          description: 'Se moverá este evento a la papelera de reciclaje y se preservará el registro.',
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900 flex items-center space-x-1 text-xs font-semibold"
                      title="Eliminar Evento Especial"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Event Fee Prices Display (Explicitly requested by user: Adult and Child Pricing) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Tarifa Adulto</span>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {config.currencySymbol}{activeSpecialEvent ? activeSpecialEvent.adultPrice.toFixed(2) : '350.00'}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-amber-500/30" />
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Tarifa Niño</span>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {config.currencySymbol}{activeSpecialEvent ? activeSpecialEvent.childPrice.toFixed(2) : '180.00'}
                    </p>
                  </div>
                  <Sparkles className="w-8 h-8 text-indigo-500/30" />
                </div>
              </div>

              {/* Goal progress */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">
                    Recaudado: {config.currencySymbol}{totalEventRaised.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-slate-500">
                    Meta: {config.currencySymbol}{(activeSpecialEvent?.targetGoal || 25000).toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (totalEventRaised / (activeSpecialEvent?.targetGoal || 25000)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Registration Widget */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  Inscripción Rápida
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Registra congregantes con cálculo automático de valor por adultos y niños.
                </p>
              </div>

              <div className="space-y-3 bg-amber-50/50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-amber-100 dark:border-slate-700/60 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Evento:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeSpecialEvent?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Costo Adulto:</span>
                  <span className="font-bold text-amber-600">{config.currencySymbol}{activeSpecialEvent?.adultPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Costo Niño:</span>
                  <span className="font-bold text-indigo-600">{config.currencySymbol}{activeSpecialEvent?.childPrice}</span>
                </div>
              </div>

              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Inscripción</span>
              </button>
            </div>
          </div>

          {/* Registration History Table */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 overflow-hidden p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Lista de Inscritos y Cobros ({eventRegistrations.length})
              </h3>

              {specialEvents.length > 1 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-medium">Filtrar por evento:</span>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {specialEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Participante / Familia</th>
                    <th className="py-3 px-3 text-center">Adultos ({config.currencySymbol}{activeSpecialEvent?.adultPrice || 350})</th>
                    <th className="py-3 px-3 text-center">Niños ({config.currencySymbol}{activeSpecialEvent?.childPrice || 180})</th>
                    <th className="py-3 px-3 text-right">Total Pagado</th>
                    <th className="py-3 px-3">Método de Pago</th>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {eventRegistrations
                    .filter((r) => !selectedEventId || r.eventId === selectedEventId)
                    .map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                          {reg.memberName}
                          {reg.notes && (
                            <p className="text-[10px] font-normal text-slate-500">{reg.notes}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-amber-700 dark:text-amber-300">
                          {reg.adultsCount}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-indigo-600 dark:text-indigo-400">
                          {reg.childrenCount}
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                          {config.currencySymbol}{reg.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                            {reg.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 text-xs">{reg.date}</td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            {reg.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRegistration(reg)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                              title="Editar Inscripción y Cobro"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {onDeleteEventRegistration && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmTarget({
                                    type: 'registration',
                                    id: reg.id,
                                    title: `Inscripción de ${reg.memberName}`,
                                    description: `Total de ${config.currencySymbol}${reg.totalAmount.toFixed(2)} (${reg.adultsCount} adultos, ${reg.childrenCount} niños).`,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                title="Eliminar Inscripción"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNTS SUB TAB */}
      {subTab === 'accounts' && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-amber-600" />
              Directorio de Cuentas de Ahorro Hermandad ({coopAccounts.length})
            </h3>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cuenta de Ahorro</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coopAccounts.map((account) => {
              const isFamAccount = account.memberId.startsWith('fam_') || account.memberName.startsWith('Familia');
              const memberObj = members.find((m) => m.id === account.memberId);
              const familyName = isFamAccount
                ? account.memberName
                : memberObj?.familyName
                ? `Familia ${memberObj.familyName}`
                : null;

              return (
                <div
                  key={account.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                      {account.accountNumber}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {familyName && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{familyName}</span>
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        {account.status}
                      </span>
                      {onDeleteAccount && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirmTarget({
                              type: 'account',
                              id: account.id,
                              title: `Cuenta de Ahorro: ${account.accountNumber}`,
                              description: `Titular: ${account.memberName} • Saldo: ${config.currencySymbol}${account.currentBalance.toFixed(2)}.`,
                            })
                          }
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Eliminar Cuenta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                      {isFamAccount && <Users className="w-4 h-4 text-amber-600 shrink-0" />}
                      <span>{account.memberName}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">Apertura: {account.openedDate}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-500">Saldo Disponible</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {config.currencySymbol}{account.currentBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                    <div>
                      <span>Total Depositado:</span>
                      <p className="font-semibold text-emerald-600">{config.currencySymbol}{account.totalDeposited.toFixed(2)}</p>
                    </div>
                    <div>
                      <span>Total Retirado:</span>
                      <p className="font-semibold text-amber-600">{config.currencySymbol}{account.totalWithdrawn.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LOANS SUB TAB */}
      {subTab === 'loans' && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-600" />
              Microcréditos Solidarios de Hermandad ({microLoans.length})
            </h3>
            <button
              onClick={() => setIsLoanModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Solicitar Crédito</span>
            </button>
          </div>

          <div className="space-y-4">
            {microLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {loan.memberName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        loan.status === 'En Pago' || loan.status === 'Aprobado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : loan.status === 'Solicitado'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{loan.purpose}</p>
                  <p className="text-[11px] text-slate-400">
                    Solicitado: {loan.requestDate} • {loan.installmentMonths} cuotas de {config.currencySymbol}{loan.monthlyPayment.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-500">Monto Restante</span>
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {config.currencySymbol}{loan.remainingAmount.toFixed(2)}
                    </p>
                  </div>

                  {loan.status === 'Solicitado' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onUpdateLoanStatus(loan.id, 'Aprobado')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Aprobar</span>
                      </button>
                      <button
                        onClick={() => onUpdateLoanStatus(loan.id, 'Rechazado')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  )}

                  {(loan.status === 'Aprobado' || loan.status === 'En Pago') && (
                    <button
                      onClick={() => setSelectedLoanForPayment(loan)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Abonar Cuota
                    </button>
                  )}

                  {onDeleteLoan && (
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteConfirmTarget({
                          type: 'loan',
                          id: loan.id,
                          title: `Solicitud de Crédito: ${loan.memberName}`,
                          description: `Monto: ${config.currencySymbol}${loan.amount.toFixed(2)} • ${loan.purpose}.`,
                        })
                      }
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Eliminar Solicitud"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRANSACTIONS SUB TAB */}
      {subTab === 'transactions' && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Historial de Movimientos de Ahorro
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Socio / Titular</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Monto</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Notas</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {coopTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {tx.memberName}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'Depósito'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {config.currencySymbol}{tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{tx.date}</td>
                    <td className="py-3 px-3 text-slate-500">{tx.notes}</td>
                    <td className="py-3 px-3 text-center">
                      {onDeleteCoopTransaction && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirmTarget({
                              type: 'transaction',
                              id: tx.id,
                              title: `Movimiento: ${tx.type} (${config.currencySymbol}${tx.amount.toFixed(2)})`,
                              description: `Titular: ${tx.memberName} • Fecha: ${tx.date}.`,
                            })
                          }
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Eliminar Movimiento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: INSCRIPCIÓN A CAMPAMENTO / EVENTO */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl max-w-xl w-full shadow-2xl border border-white/60 dark:border-slate-800/80 my-auto max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5 shrink-0 bg-white/50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                  <Tent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Inscripción al Evento
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {activeSpecialEvent?.title || 'Campamento'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleRegisterParticipant} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              {/* Mode Selector */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Modo de Registro:
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationMode('family');
                      if (families.length > 0 && !selectedFamilyId) {
                        handleSelectFamilyForReg(families[0].id);
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      registrationMode === 'family'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Familia ({families.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationMode('member');
                      setFamilyAttendees([]);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      registrationMode === 'member'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Congregante
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationMode('custom');
                      setFamilyAttendees([]);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      registrationMode === 'custom'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Manual
                  </button>
                </div>

                {/* Member Dropdown */}
                {registrationMode === 'member' && (
                  <div className="mb-3 space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Seleccionar Miembro del Directorio:
                    </label>
                    <select
                      value={selectedMemberId}
                      onChange={(e) => handleSelectMemberForReg(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="">-- Seleccionar Congregante --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} {m.familyName ? `(Familia ${m.familyName})` : ''} {m.ministryRoles && m.ministryRoles.length > 0 ? `• ${m.ministryRoles[0]}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Family Dropdown & Synchronized Roster */}
                {registrationMode === 'family' && (
                  <div className="mb-3 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Seleccionar Núcleo Familiar Vinculado:
                      </label>
                      <select
                        value={selectedFamilyId}
                        onChange={(e) => handleSelectFamilyForReg(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/40 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="">-- Seleccionar Familia del Directorio --</option>
                        {families.map((f) => {
                          const famMembersCount = getFamilyMembers(f, members).length;
                          return (
                            <option key={f.id} value={f.id}>
                              Familia {f.familyName} ({famMembersCount} {famMembersCount === 1 ? 'integrante' : 'integrantes'})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Interactive Synchronized Family Members Roster */}
                    {selectedFamilyId && (
                      <div className="bg-amber-50/40 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-amber-200/80 dark:border-slate-700/80 space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-amber-100 dark:border-slate-700/60">
                          <div className="flex items-center space-x-1.5">
                            <Users className="w-4 h-4 text-amber-600" />
                            <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                              Integrantes Sincronizados de la Familia ({familyAttendees.length})
                            </span>
                          </div>
                          {familyAttendees.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => setAllAttendeesStatus(true)}
                                className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                              >
                                Todos
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => setAllAttendeesStatus(false)}
                                className="text-[10px] font-semibold text-slate-500 hover:underline cursor-pointer"
                              >
                                Ninguno
                              </button>
                            </div>
                          )}
                        </div>

                        {familyAttendees.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {familyAttendees.map((att) => (
                              <div
                                key={att.memberId}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                  att.isAttending
                                    ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 shadow-xs'
                                    : 'bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 truncate">
                                  <button
                                    type="button"
                                    onClick={() => toggleAttendeeAttendance(att.memberId)}
                                    className="text-amber-600 hover:text-amber-700 cursor-pointer shrink-0"
                                  >
                                    {att.isAttending ? (
                                      <CheckSquare className="w-4 h-4 text-amber-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-400" />
                                    )}
                                  </button>
                                  <div className="truncate">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate leading-tight">
                                      {att.fullName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate">
                                      {att.age !== null ? `${att.age} años` : 'Edad no especificada'}
                                      {att.role ? ` • ${att.role}` : ''}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => toggleAttendeeAgeCategory(att.memberId)}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                      att.isChild
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    }`}
                                    title="Haz clic para alternar entre Adulto y Niño"
                                  >
                                    {att.isChild ? `Niño ($${currentChildPrice})` : `Adulto ($${currentAdultPrice})`}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-white/70 dark:bg-slate-800/60 rounded-xl text-center border border-dashed border-amber-200 dark:border-slate-700">
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                              Esta familia no tiene integrantes vinculados en el Directorio todavía.
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Puedes registrar miembros en el Directorio o indicar la cantidad de asistentes abajo.
                            </p>
                          </div>
                        )}

                        {/* Extra Attendees Counters */}
                        <div className="pt-2 border-t border-amber-100 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Invitados adicionales no registrados:
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">+Adultos:</span>
                              <input
                                type="number"
                                min="0"
                                value={extraAdultsCount}
                                onChange={(e) => handleExtraAdultsChange(parseInt(e.target.value) || 0)}
                                className="w-12 px-1.5 py-0.5 text-center text-xs font-bold rounded-lg border border-amber-300 bg-white dark:bg-slate-900"
                              />
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold">+Niños:</span>
                              <input
                                type="number"
                                min="0"
                                value={extraChildrenCount}
                                onChange={(e) => handleExtraChildrenChange(parseInt(e.target.value) || 0)}
                                className="w-12 px-1.5 py-0.5 text-center text-xs font-bold rounded-lg border border-indigo-300 bg-white dark:bg-slate-900"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1">Nombre Registrado en la Inscripción *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Familia Gómez o Sofía Ramírez"
                    value={registrationForm.memberName}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, memberName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Adult and Child Counters with explicit unit prices */}
              <div className="grid grid-cols-2 gap-3 bg-amber-50/60 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-amber-200/80 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-amber-900 dark:text-amber-200 mb-1">
                    Total Adultos ({config.currencySymbol}{currentAdultPrice})
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={registrationForm.adultsCount}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        adultsCount: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 font-bold text-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                    Subtotal: {config.currencySymbol}{(registrationForm.adultsCount * currentAdultPrice).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                    Total Niños ({config.currencySymbol}{currentChildPrice})
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={registrationForm.childrenCount}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        childrenCount: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-800 font-bold text-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-1">
                    Subtotal: {config.currencySymbol}{(registrationForm.childrenCount * currentChildPrice).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Real time calculation box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[11px] uppercase tracking-wider opacity-90 font-semibold">Total a Pagar</span>
                  <p className="text-2xl font-black">{config.currencySymbol}{registrationTotalAmount.toFixed(2)}</p>
                </div>
                <div className="text-right text-[11px] opacity-90">
                  <p>{registrationForm.adultsCount} Adultos × {config.currencySymbol}{currentAdultPrice}</p>
                  <p>{registrationForm.childrenCount} Niños × {config.currencySymbol}{currentChildPrice}</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Método de Pago</label>
                <select
                  value={registrationForm.paymentMethod}
                  onChange={(e) =>
                    setRegistrationForm({ ...registrationForm, paymentMethod: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Cuenta Ahorro Minicooperativa">Cuenta Ahorro Minicooperativa</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Observaciones / Detalle de Inscripción</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Contacto de emergencia, integrantes o dieta especial"
                  value={registrationForm.notes}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                />
              </div>

              {/* Modal Sticky Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Confirmar Inscripción ({config.currencySymbol}{registrationTotalAmount.toFixed(2)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO EVENTO RECAUDACIÓN */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Crear Evento / Campamento con Cuota
              </h3>
              <button onClick={() => setIsNewEventModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSpecialEvent} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre del Evento</label>
                <input
                  type="text"
                  required
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                  placeholder="Ej. Campamento de Jóvenes 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Cuota Adultos ($)</label>
                  <input
                    type="number"
                    required
                    value={newEventForm.adultPrice}
                    onChange={(e) => setNewEventForm({ ...newEventForm, adultPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cuota Niños ($)</label>
                  <input
                    type="number"
                    required
                    value={newEventForm.childPrice}
                    onChange={(e) => setNewEventForm({ ...newEventForm, childPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newEventForm.date}
                    onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Meta de Recaudación ($)</label>
                  <input
                    type="number"
                    required
                    value={newEventForm.targetGoal}
                    onChange={(e) => setNewEventForm({ ...newEventForm, targetGoal: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Ubicación</label>
                <input
                  type="text"
                  required
                  value={newEventForm.location}
                  onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-medium text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs cursor-pointer"
                >
                  Crear Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR EVENTO / CAMPAMENTO RECAUDACIÓN */}
      {isEditEventModalOpen && editingEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <span>Editar Evento / Campamento</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditEventModalOpen(false);
                  setEditingEventForm(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSpecialEventSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre del Evento / Campamento *</label>
                <input
                  type="text"
                  required
                  value={editingEventForm.title}
                  onChange={(e) =>
                    setEditingEventForm({ ...editingEventForm, title: e.target.value })
                  }
                  placeholder="Ej. Campamento de Jóvenes 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción / Detalles adicionales</label>
                <textarea
                  rows={2}
                  value={editingEventForm.description}
                  onChange={(e) =>
                    setEditingEventForm({ ...editingEventForm, description: e.target.value })
                  }
                  placeholder="Detalles sobre el evento, requisitos o transporte..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Cuota Adultos ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingEventForm.adultPrice}
                    onChange={(e) =>
                      setEditingEventForm({
                        ...editingEventForm,
                        adultPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cuota Niños ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingEventForm.childPrice}
                    onChange={(e) =>
                      setEditingEventForm({
                        ...editingEventForm,
                        childPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={editingEventForm.date}
                    onChange={(e) =>
                      setEditingEventForm({ ...editingEventForm, date: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Meta de Recaudación ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingEventForm.targetGoal}
                    onChange={(e) =>
                      setEditingEventForm({
                        ...editingEventForm,
                        targetGoal: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Ubicación / Sede</label>
                <input
                  type="text"
                  required
                  value={editingEventForm.location}
                  onChange={(e) =>
                    setEditingEventForm({ ...editingEventForm, location: e.target.value })
                  }
                  placeholder="Ej. Finca Los Pinos"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Estado del Evento</label>
                <select
                  value={editingEventForm.status}
                  onChange={(e) =>
                    setEditingEventForm({
                      ...editingEventForm,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="Abierto">Abierto (Recibiendo Inscripciones)</option>
                  <option value="En Curso">En Curso</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>

              <div className="pt-2 flex justify-between items-center space-x-2">
                {onDeleteSpecialEvent && (
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirmTarget({
                        type: 'event',
                        id: editingEventForm.id,
                        title: `Eliminar "${editingEventForm.title}"`,
                        description: 'Se moverá este evento a la papelera de reciclaje y se preservará el registro.',
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900 flex items-center space-x-1 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}
                <div className="flex space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditEventModalOpen(false);
                      setEditingEventForm(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 font-medium text-xs cursor-pointer hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md cursor-pointer transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT MODAL */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-amber-600" />
                <span>Abrir Cuenta de Ahorro</span>
              </h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Tipo de Titular:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setAccountTypeMode('member')}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      accountTypeMode === 'member'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Congregante Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountTypeMode('family')}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      accountTypeMode === 'family'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Familia ({families.length})
                  </button>
                </div>

                {accountTypeMode === 'member' ? (
                  <div>
                    <label className="block font-semibold mb-1">Miembro Titular</label>
                    <select
                      required
                      value={accountFormData.memberId}
                      onChange={(e) => setAccountFormData({ ...accountFormData, memberId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Seleccionar Congregante...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} {m.familyName ? `(Familia ${m.familyName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold mb-1">Familia del Directorio</label>
                    <select
                      required
                      value={accountFormData.familyId}
                      onChange={(e) => setAccountFormData({ ...accountFormData, familyId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Seleccionar Familia...</option>
                      {families.map((f) => {
                        const count = getFamilyMembers(f, members).length;
                        return (
                          <option key={f.id} value={f.id}>
                            Familia {f.familyName} ({count} {count === 1 ? 'integrante' : 'integrantes'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">Depósito Inicial Opcional ({config.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={accountFormData.initialDeposit}
                  onChange={(e) => setAccountFormData({ ...accountFormData, initialDeposit: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-medium text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs cursor-pointer"
                >
                  Abrir Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Depósito o Retiro de Ahorro
              </h3>
              <button onClick={() => setIsDepositModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositWithdraw} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Cuenta de Ahorro</label>
                <select
                  required
                  value={depositFormData.accountId}
                  onChange={(e) => setDepositFormData({ ...depositFormData, accountId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Seleccionar Cuenta...</option>
                  {coopAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountNumber} - {a.memberName} (${a.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Tipo de Operación</label>
                <select
                  value={depositFormData.type}
                  onChange={(e) =>
                    setDepositFormData({ ...depositFormData, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Depósito">Depósito (+)</option>
                  <option value="Retiro">Retiro (-)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Monto ({config.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={depositFormData.amount}
                  onChange={(e) => setDepositFormData({ ...depositFormData, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Notas / Concepto</label>
                <input
                  type="text"
                  value={depositFormData.notes}
                  onChange={(e) => setDepositFormData({ ...depositFormData, notes: e.target.value })}
                  placeholder="Ej. Ahorro quincenal de hermandad"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-medium text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs cursor-pointer"
                >
                  Registrar Operación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOAN REQUEST MODAL */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-600" />
                <span>Solicitar Microcrédito Solidario</span>
              </h3>
              <button onClick={() => setIsLoanModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Tipo de Solicitante:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setLoanTypeMode('member')}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      loanTypeMode === 'member'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Congregante
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanTypeMode('family')}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      loanTypeMode === 'family'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Familia ({families.length})
                  </button>
                </div>

                {loanTypeMode === 'member' ? (
                  <div>
                    <label className="block font-semibold mb-1">Congregante Solicitante</label>
                    <select
                      required
                      value={loanFormData.memberId}
                      onChange={(e) => setLoanFormData({ ...loanFormData, memberId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Seleccionar Congregante...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} {m.familyName ? `(Familia ${m.familyName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold mb-1">Familia Solicitante</label>
                    <select
                      required
                      value={loanFormData.familyId}
                      onChange={(e) => setLoanFormData({ ...loanFormData, familyId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Seleccionar Familia...</option>
                      {families.map((f) => {
                        const count = getFamilyMembers(f, members).length;
                        return (
                          <option key={f.id} value={f.id}>
                            Familia {f.familyName} ({count} {count === 1 ? 'integrante' : 'integrantes'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">Monto del Crédito ({config.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={loanFormData.amount}
                  onChange={(e) => setLoanFormData({ ...loanFormData, amount: e.target.value })}
                  placeholder="500.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Propósito / Destino</label>
                <input
                  type="text"
                  required
                  value={loanFormData.purpose}
                  onChange={(e) => setLoanFormData({ ...loanFormData, purpose: e.target.value })}
                  placeholder="Ej. Apoyo educativo o insumos familiares"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Plazo (Meses)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={loanFormData.installmentMonths}
                    onChange={(e) =>
                      setLoanFormData({ ...loanFormData, installmentMonths: parseInt(e.target.value) || 6 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tasa Solidaria (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={loanFormData.interestRatePercentage}
                    onChange={(e) =>
                      setLoanFormData({
                        ...loanFormData,
                        interestRatePercentage: parseFloat(e.target.value) || 1.0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-medium text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs cursor-pointer"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOAN PAYMENT MODAL */}
      {selectedLoanForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Abonar a Microcrédito
              </h3>
              <button onClick={() => setSelectedLoanForPayment(null)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">{selectedLoanForPayment.memberName}</p>
              <p className="text-slate-500">Saldo actual: {config.currencySymbol}{selectedLoanForPayment.remainingAmount.toFixed(2)}</p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Monto del Abonado ({config.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={selectedLoanForPayment.monthlyPayment.toFixed(2)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForPayment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR INSCRIPCIÓN Y COBRO */}
      {isEditRegModalOpen && editingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Editar Inscripción & Cobro
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifica los datos del participante, cuotas o estado del pago
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditRegModalOpen(false);
                  setEditingReg(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedRegistration} className="space-y-4 text-xs sm:text-sm overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nombre del Participante o Familia *
                </label>
                <input
                  type="text"
                  required
                  value={editingReg.memberName}
                  onChange={(e) => setEditingReg({ ...editingReg, memberName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Cantidad Adultos
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingReg.adultsCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      const newTotal = count * currentAdultPrice + editingReg.childrenCount * currentChildPrice;
                      setEditingReg({
                        ...editingReg,
                        adultsCount: count,
                        totalAmount: newTotal,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Cantidad Niños
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingReg.childrenCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      const newTotal = editingReg.adultsCount * currentAdultPrice + count * currentChildPrice;
                      setEditingReg({
                        ...editingReg,
                        childrenCount: count,
                        totalAmount: newTotal,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Total a Cobrar / Pagado ({config.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingReg.totalAmount}
                    onChange={(e) => setEditingReg({ ...editingReg, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Método de Pago
                  </label>
                  <select
                    value={editingReg.paymentMethod}
                    onChange={(e) => setEditingReg({ ...editingReg, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Tarjeta">Tarjeta de Débito / Crédito</option>
                    <option value="Ahorro Hermandad">Cuenta Ahorro Hermandad</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Estado de Inscripción
                  </label>
                  <select
                    value={editingReg.status}
                    onChange={(e) => setEditingReg({ ...editingReg, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="Pagado">Pagado Completo</option>
                    <option value="Parcial">Pago Parcial / Anticipo</option>
                    <option value="Pendiente">Pendiente de Pago</option>
                    <option value="Inscrito">Inscrito</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Fecha de Registro
                  </label>
                  <input
                    type="date"
                    value={editingReg.date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditingReg({ ...editingReg, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={editingReg.notes || ''}
                  onChange={(e) => setEditingReg({ ...editingReg, notes: e.target.value })}
                  placeholder="Detalles sobre pagos, integrantes, alergias o transporte..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between space-x-2">
                {onDeleteEventRegistration && (
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirmTarget({
                        type: 'registration',
                        id: editingReg.id,
                        title: `Inscripción de ${editingReg.memberName}`,
                        description: '¿Deseas eliminar esta inscripción? Se enviará a la papelera.',
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition-colors flex items-center space-x-1 cursor-pointer border border-rose-200 dark:border-rose-900"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}
                <div className="flex space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditRegModalOpen(false);
                      setEditingReg(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* GLOBAL COOP DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Confirmar eliminación?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción se enviará a la papelera de reciclaje.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 space-y-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {deleteConfirmTarget.title}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {deleteConfirmTarget.description}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};