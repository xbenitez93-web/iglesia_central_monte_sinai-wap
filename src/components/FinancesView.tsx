import React, { useState } from 'react';
import { ChurchConfig, FinancialTransaction, Member, PaymentMethod, TransactionType } from '../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle,
  Receipt,
  PieChart as PieChartIcon,
  BarChart3,
  X,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PageHeroBanner } from './PageHeroBanner';
import { getActivePageThemeColor } from '../lib/pageTheme';
import { exportFinancesToExcel } from '../lib/financesExcelExport';

interface FinancesViewProps {
  transactions: FinancialTransaction[];
  members: Member[];
  config: ChurchConfig;
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAIAssistant: () => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig) => void;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  transactions,
  members,
  config,
  onAddTransaction,
  onDeleteTransaction,
  onOpenAIAssistant,
  isAddModalOpen,
  setIsAddModalOpen,
  onUpdateConfig,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const pageColor = getActivePageThemeColor('finances', config);

  // Form State
  const [formData, setFormData] = useState({
    type: 'Diezmo' as TransactionType,
    amount: '',
    category: 'Diezmos y Ofrendas',
    memberId: '',
    memberName: '',
    paymentMethod: 'Efectivo' as PaymentMethod,
    date: new Date().toISOString().split('T')[0],
    description: '',
    receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
  });

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type !== 'Egreso/Gasto')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'Egreso/Gasto')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const tithesTotal = transactions
    .filter((t) => t.type === 'Diezmo')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filtered list
  const filteredTransactions = transactions.filter((t) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (t.description || '').toLowerCase().includes(q) ||
      (t.receiptNumber ? t.receiptNumber.toLowerCase().includes(q) : false) ||
      (t.memberName ? t.memberName.toLowerCase().includes(q) : false);

    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Recharts Data Prep
  const categoryData = config.customCategories.map((cat) => {
    const total = transactions
      .filter((t) => t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat, value: total };
  }).filter((c) => c.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#ef4444'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;

    let selectedMember = members.find((m) => m.id === formData.memberId);
    let name = formData.memberName;
    if (selectedMember) {
      name = selectedMember.fullName;
    }

    onAddTransaction({
      type: formData.type,
      amount: Number(formData.amount),
      category: formData.category,
      memberId: formData.memberId || undefined,
      memberName: name || 'Congregación General',
      paymentMethod: formData.paymentMethod,
      date: formData.date,
      description: formData.description || `${formData.type} eclesial`,
      receiptNumber: formData.receiptNumber,
      status: 'Completado',
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header Banner */}
      <PageHeroBanner
        tabId="finances"
        config={config}
        icon={DollarSign}
        defaultTitle="Finanzas & Mayordomía"
        defaultSubtitle="Registro transparente de ingresos, ofrendas especiales, presupuestos de gastos y reportes contables."
        defaultBadge="Tesorería & Administración"
        onUpdateConfig={onUpdateConfig}
        actionButtons={
          <>
            <button
              onClick={async () => {
                try {
                  setIsExportingExcel(true);
                  await exportFinancesToExcel(transactions, config, members);
                } catch (error) {
                  console.error('Error al exportar finanzas a Excel:', error);
                } finally {
                  setIsExportingExcel(false);
                }
              }}
              disabled={isExportingExcel}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-medium text-xs sm:text-sm shadow-md backdrop-blur-md transition-colors cursor-pointer flex items-center space-x-2 border border-white/20"
              title="Descargar libro Excel profesional con Estados Financieros, Balance, Ingresos, Egresos y Padrón de Aportes"
            >
              <FileSpreadsheet className={`w-4 h-4 text-emerald-200 ${isExportingExcel ? 'animate-pulse' : ''}`} />
              <span>{isExportingExcel ? 'Generando Excel...' : 'Exportar Excel (.xlsx)'}</span>
            </button>

            <button
              onClick={onOpenAIAssistant}
              className="px-3.5 py-2.5 rounded-2xl bg-amber-500/90 hover:bg-amber-600 text-white font-medium text-xs sm:text-sm shadow-md backdrop-blur-md transition-colors cursor-pointer flex items-center space-x-2 border border-white/20"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Análisis Financiero IA</span>
            </button>

            <button
              onClick={() => {
                setFormData({
                  type: 'Diezmo',
                  amount: '',
                  category: 'Diezmos y Ofrendas',
                  memberId: '',
                  memberName: '',
                  paymentMethod: 'Efectivo',
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                });
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" style={{ color: pageColor }} />
              <span>Registrar Movimiento</span>
            </button>
          </>
        }
      />

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Ingresos
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {config.currencySymbol}{totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Diezmos + Ofrendas + Donaciones</p>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Egresos/Gastos
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {config.currencySymbol}{totalExpense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Servicios + Mantenimiento + Misiones</p>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Balance Neto
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${netBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
              {config.currencySymbol}{netBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <BarChart3 className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Disponible en tesorería eclesial</p>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Diezmos Registrados
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-200">
              {config.currencySymbol}{tithesTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <Receipt className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Feligresía diezmante</p>
        </div>
      </div>

      {/* Chart & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown pie chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-indigo-600" />
            Distribución por Categoría Financiera
          </h3>

          {categoryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${config.currencySymbol}${Number(value).toFixed(2)}`, 'Monto']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">Sin datos suficientes para gráfica.</p>
          )}
        </div>

        {/* Quick stewardship advice */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Recomendación de Mayordomía Parroquial
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Sostenibilidad Presupuestaria
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              El fondo eclesial mantiene un balance positivo saludable. Se sugiere destinar un 10% del remanente al fondo de asistencia social (minicooperativa) y dar mantenimiento preventivo al equipo de sonido antes de los eventos especiales de fin de año.
            </p>
          </div>

          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
            <span>¿Requieres un reporte PDF o desglose detallado para el Consejo?</span>
            <button
              onClick={onOpenAIAssistant}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer shrink-0"
            >
              Generar Informe
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar recibo, feligrés o concepto..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="all">-- Todos los Tipos --</option>
                <option value="Diezmo">Diezmos</option>
                <option value="Ofrenda General">Ofrenda General</option>
                <option value="Ofrenda Especial">Ofrenda Especial</option>
                <option value="Donación">Donación</option>
                <option value="Egreso/Gasto">Egreso / Gasto</option>
              </select>
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="all">-- Todas las Categorías --</option>
                {config.customCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => exportFinancesToExcel(filteredTransactions, config, members)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shrink-0"
            title="Exportar registros filtrados a Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Excel ({filteredTransactions.length})</span>
          </button>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Recibo / Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Donante / Concepto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type !== 'Egreso/Gasto';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <div>{tx.receiptNumber}</div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">{tx.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {tx.memberName || 'Congregación'}
                      {tx.description && <div className="text-[10px] text-slate-400 truncate max-w-xs">{tx.description}</div>}
                    </td>
                    <td className="py-3 px-4">{tx.category}</td>
                    <td className="py-3 px-4">{tx.paymentMethod}</td>
                    <td
                      className={`py-3 px-4 text-right font-bold text-sm ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{config.currencySymbol}{tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Eliminar Registro"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD TRANSACTION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Movimiento Financiero
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tipo de Movimiento</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Diezmo">Diezmo</option>
                    <option value="Ofrenda General">Ofrenda General</option>
                    <option value="Ofrenda Especial">Ofrenda Especial</option>
                    <option value="Donación">Donación</option>
                    <option value="Egreso/Gasto">Egreso / Gasto</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Monto ({config.currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              {formData.type === 'Diezmo' && (
                <div>
                  <label className="block font-semibold mb-1">Seleccionar Miembro Diezmante</label>
                  <select
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="">-- Seleccionar de la congregación --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Categoría</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {config.customCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Método de Pago</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción / Notas</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej. Diezmo del mes / Compra de insumos"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
