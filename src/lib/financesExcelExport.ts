import ExcelJS from 'exceljs';
import { ChurchConfig, FinancialTransaction, Member } from '../types';

export const exportFinancesToExcel = async (
  transactions: FinancialTransaction[],
  config: ChurchConfig,
  members: Member[] = []
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.name || 'Iglesia Central';
  workbook.lastModifiedBy = config.pastorName || 'Tesorería Eclesial';
  workbook.created = new Date();
  workbook.modified = new Date();

  const churchName = (config.name || 'IGLESIA CENTRAL MONTE SINAÍ').toUpperCase();
  const pastorName = config.pastorName || 'Administración Pastoral';
  const slogan = config.verse || config.slogan || 'Fe, Esperanza y Amor';
  const currencySymbol = config.currencySymbol || '$';
  const emissionDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateStr = new Date().toISOString().split('T')[0];

  // Number Format Patterns
  const currencyFmt = `"${currencySymbol}"#,##0.00;[Red]("${currencySymbol}"#,##0.00);"${currencySymbol}"0.00`;
  const percentFmt = '0.0%';
  const dateFmt = 'yyyy-mm-dd';

  // Common Color Palettes (ARGB Hex)
  const colors = {
    navyDark: 'FF0F172A',
    navyHeader: 'FF1E293B',
    navyAccent: 'FF1E3A8A',
    navyLight: 'FFF1F5F9',
    emeraldDark: 'FF065F46',
    emeraldMed: 'FF059669',
    emeraldLight: 'FFECFDF5',
    emeraldBorder: 'FFA7F3D0',
    redDark: 'FF991B1B',
    redMed: 'FFDC2626',
    redLight: 'FFFFF1F2',
    redBorder: 'FFFECDD3',
    blueDark: 'FF1E40AF',
    blueLight: 'FFEFF6FF',
    amberDark: 'FFB45309',
    amberLight: 'FFFFFBEB',
    indigoDark: 'FF3730A3',
    indigoLight: 'FFEEF2FF',
    zebraRow: 'FFF8FAFC',
    borderLight: 'FFE2E8F0',
    borderDark: 'FF94A3B8',
    white: 'FFFFFFFF',
    textDark: 'FF1E293B',
    textMuted: 'FF64748B',
  };

  // Border presets
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: colors.borderLight } },
    bottom: { style: 'thin', color: { argb: colors.borderLight } },
    left: { style: 'thin', color: { argb: colors.borderLight } },
    right: { style: 'thin', color: { argb: colors.borderLight } },
  };

  const accountingTotalBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: colors.navyDark } },
    bottom: { style: 'double', color: { argb: colors.navyDark } },
  };

  // Data breakdown
  const incomes = transactions.filter((t) => t.type !== 'Egreso/Gasto');
  const expenses = transactions.filter((t) => t.type === 'Egreso/Gasto');
  const totalIncome = incomes.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  // Category Aggregations
  const categoryMap: Record<string, { income: number; expense: number; count: number }> = {};
  transactions.forEach((t) => {
    const cat = t.category || 'General';
    if (!categoryMap[cat]) categoryMap[cat] = { income: 0, expense: 0, count: 0 };
    categoryMap[cat].count++;
    if (t.type === 'Egreso/Gasto') {
      categoryMap[cat].expense += Number(t.amount || 0);
    } else {
      categoryMap[cat].income += Number(t.amount || 0);
    }
  });

  // Payment Method Aggregations
  const paymentMap: Record<string, { income: number; expense: number; total: number; count: number }> = {};
  transactions.forEach((t) => {
    const m = t.paymentMethod || 'Efectivo';
    if (!paymentMap[m]) paymentMap[m] = { income: 0, expense: 0, total: 0, count: 0 };
    paymentMap[m].count++;
    const amt = Number(t.amount || 0);
    if (t.type === 'Egreso/Gasto') {
      paymentMap[m].expense += amt;
    } else {
      paymentMap[m].income += amt;
    }
    paymentMap[m].total += amt;
  });

  // Member Contribution Aggregations
  const memberDonations: Record<string, { name: string; tithes: number; offerings: number; others: number; total: number; count: number; lastDate: string }> = {};
  incomes.forEach((t) => {
    const name = t.memberName || 'Congregación General / Anónimo';
    if (!memberDonations[name]) {
      memberDonations[name] = { name, tithes: 0, offerings: 0, others: 0, total: 0, count: 0, lastDate: t.date };
    }
    const amt = Number(t.amount || 0);
    memberDonations[name].count++;
    memberDonations[name].total += amt;
    if (t.type === 'Diezmo') memberDonations[name].tithes += amt;
    else if (t.type === 'Ofrenda General' || t.type === 'Ofrenda Especial') memberDonations[name].offerings += amt;
    else memberDonations[name].others += amt;
    if (t.date > memberDonations[name].lastDate) {
      memberDonations[name].lastDate = t.date;
    }
  });

  // =========================================================================
  // HOJA 1: RESUMEN EJECUTIVO Y ESTADO DE RESULTADOS
  // =========================================================================
  const ws1 = workbook.addWorksheet('Resumen Financiero', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: colors.navyAccent } },
  });

  // Set column widths
  ws1.columns = [
    { width: 4 },  // A (margin)
    { width: 34 }, // B (Concepto / Nombre)
    { width: 22 }, // C (Ingresos / Valores)
    { width: 22 }, // D (Egresos / Comparativa)
    { width: 22 }, // E (Neto / Variación)
    { width: 20 }, // F (Estado / %)
    { width: 4 },  // G (margin)
  ];

  // 1. Header Banner
  ws1.mergeCells('B2:F2');
  const titleCell = ws1.getCell('B2');
  titleCell.value = `${churchName} - INFORME GENERAL DE FINANZAS`;
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: colors.white } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyDark } };
  ws1.getRow(2).height = 34;

  ws1.mergeCells('B3:F3');
  const subTitleCell = ws1.getCell('B3');
  subTitleCell.value = 'ESTADO DE RESULTADOS, EJECUCIÓN PRESUPUESTARIA Y CONTROL DE MAYORDOMÍA';
  subTitleCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colors.white } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyHeader } };
  ws1.getRow(3).height = 20;

  // Metadata Card
  ws1.mergeCells('B4:C4');
  ws1.getCell('B4').value = `Pastor General: ${pastorName}`;
  ws1.getCell('B4').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.textDark } };

  ws1.mergeCells('D4:F4');
  ws1.getCell('D4').value = `Fecha de Emisión: ${emissionDate}`;
  ws1.getCell('D4').font = { name: 'Segoe UI', size: 9, color: { argb: colors.textMuted } };
  ws1.getCell('D4').alignment = { horizontal: 'right' };

  ws1.mergeCells('B5:C5');
  ws1.getCell('B5').value = `Lema: "${slogan}"`;
  ws1.getCell('B5').font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: colors.textMuted } };

  ws1.mergeCells('D5:F5');
  ws1.getCell('D5').value = `Moneda: ${currencySymbol} (Local) | Auditado: Sí`;
  ws1.getCell('D5').font = { name: 'Segoe UI', size: 9, color: { argb: colors.textMuted } };
  ws1.getCell('D5').alignment = { horizontal: 'right' };
  ws1.getRow(4).height = 18;
  ws1.getRow(5).height = 18;

  // Blank row
  ws1.getRow(6).height = 10;

  // 2. Executive Indicator Cards (Row 7 to 9)
  // Card 1: Total Ingresos (B7:B9)
  ws1.getCell('B7').value = 'TOTAL INGRESOS';
  ws1.getCell('B7').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.emeraldDark } };
  ws1.getCell('B7').alignment = { horizontal: 'center' };
  ws1.getCell('B7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldLight } };

  ws1.getCell('B8').value = totalIncome;
  ws1.getCell('B8').font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: colors.emeraldDark } };
  ws1.getCell('B8').numFmt = currencyFmt;
  ws1.getCell('B8').alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell('B8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldLight } };

  ws1.getCell('B9').value = `${incomes.length} Recaudaciones`;
  ws1.getCell('B9').font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: colors.emeraldDark } };
  ws1.getCell('B9').alignment = { horizontal: 'center' };
  ws1.getCell('B9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldLight } };

  // Card 2: Total Egresos (C7:C9)
  ws1.getCell('C7').value = 'TOTAL EGRESOS';
  ws1.getCell('C7').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.redDark } };
  ws1.getCell('C7').alignment = { horizontal: 'center' };
  ws1.getCell('C7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redLight } };

  ws1.getCell('C8').value = totalExpense;
  ws1.getCell('C8').font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: colors.redDark } };
  ws1.getCell('C8').numFmt = currencyFmt;
  ws1.getCell('C8').alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell('C8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redLight } };

  ws1.getCell('C9').value = `${expenses.length} Desembolsos`;
  ws1.getCell('C9').font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: colors.redDark } };
  ws1.getCell('C9').alignment = { horizontal: 'center' };
  ws1.getCell('C9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redLight } };

  // Card 3: Superávit / Balance Neto (D7:D9)
  ws1.getCell('D7').value = 'SUPERÁVIT / BALANCE';
  ws1.getCell('D7').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.blueDark } };
  ws1.getCell('D7').alignment = { horizontal: 'center' };
  ws1.getCell('D7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.blueLight } };

  ws1.getCell('D8').value = netBalance;
  ws1.getCell('D8').font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: netBalance >= 0 ? colors.blueDark : colors.redDark } };
  ws1.getCell('D8').numFmt = currencyFmt;
  ws1.getCell('D8').alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell('D8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.blueLight } };

  ws1.getCell('D9').value = netBalance >= 0 ? 'Favorable / Superávit' : 'Déficit del Período';
  ws1.getCell('D9').font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: netBalance >= 0 ? colors.blueDark : colors.redDark } };
  ws1.getCell('D9').alignment = { horizontal: 'center' };
  ws1.getCell('D9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.blueLight } };

  // Card 4: Cobertura Operativa (E7:F9 merged)
  ws1.mergeCells('E7:F7');
  ws1.getCell('E7').value = 'MARGEN DE AHORRO / RESERVA';
  ws1.getCell('E7').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.amberDark } };
  ws1.getCell('E7').alignment = { horizontal: 'center' };
  ws1.getCell('E7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.amberLight } };

  ws1.mergeCells('E8:F8');
  const ratio = totalIncome > 0 ? (netBalance / totalIncome) : 0;
  ws1.getCell('E8').value = ratio;
  ws1.getCell('E8').font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: colors.amberDark } };
  ws1.getCell('E8').numFmt = percentFmt;
  ws1.getCell('E8').alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell('E8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.amberLight } };

  ws1.mergeCells('E9:F9');
  ws1.getCell('E9').value = `${transactions.length} Movimientos Totales`;
  ws1.getCell('E9').font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: colors.amberDark } };
  ws1.getCell('E9').alignment = { horizontal: 'center' };
  ws1.getCell('E9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.amberLight } };

  // Apply borders to cards
  ['B', 'C', 'D'].forEach((col) => {
    [7, 8, 9].forEach((r) => {
      ws1.getCell(`${col}${r}`).border = thinBorder;
    });
  });
  [7, 8, 9].forEach((r) => {
    ws1.getCell(`E${r}`).border = thinBorder;
    ws1.getCell(`F${r}`).border = thinBorder;
  });

  // 3. Estado de Resultados Consolidado Table
  let currentRow = 11;
  ws1.mergeCells(`B${currentRow}:F${currentRow}`);
  const secTitle1 = ws1.getCell(`B${currentRow}`);
  secTitle1.value = '1. ESTADO CONSOLIDADO DE INGRESOS Y EGRESOS';
  secTitle1.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.navyDark } };
  secTitle1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  secTitle1.border = thinBorder;
  ws1.getRow(currentRow).height = 22;

  currentRow++;
  // Table Headers
  const tableHeaders1 = ['Categoría / Rubro Presupuestario', 'Total Ingresos', 'Total Egresos', 'Saldo Neto', 'Rendimiento'];
  ['B', 'C', 'D', 'E', 'F'].forEach((col, idx) => {
    const cell = ws1.getCell(`${col}${currentRow}`);
    cell.value = tableHeaders1[idx];
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.white } };
    cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyHeader } };
    cell.border = thinBorder;
  });
  ws1.getRow(currentRow).height = 24;

  const categories = Object.entries(categoryMap);
  const dataStartRow = currentRow + 1;

  categories.forEach(([catName, stats], i) => {
    currentRow++;
    const isZebra = i % 2 === 1;
    const rowBg = isZebra ? colors.zebraRow : colors.white;

    const cellB = ws1.getCell(`B${currentRow}`);
    cellB.value = catName;
    cellB.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.textDark } };
    cellB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cellB.border = thinBorder;

    const cellC = ws1.getCell(`C${currentRow}`);
    cellC.value = stats.income;
    cellC.numFmt = currencyFmt;
    cellC.font = { name: 'Segoe UI', size: 9, color: { argb: colors.textDark } };
    cellC.alignment = { horizontal: 'right' };
    cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cellC.border = thinBorder;

    const cellD = ws1.getCell(`D${currentRow}`);
    cellD.value = stats.expense;
    cellD.numFmt = currencyFmt;
    cellD.font = { name: 'Segoe UI', size: 9, color: { argb: colors.textDark } };
    cellD.alignment = { horizontal: 'right' };
    cellD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cellD.border = thinBorder;

    const cellE = ws1.getCell(`E${currentRow}`);
    cellE.value = { formula: `C${currentRow}-D${currentRow}`, result: stats.income - stats.expense };
    cellE.numFmt = currencyFmt;
    cellE.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: stats.income - stats.expense >= 0 ? colors.emeraldDark : colors.redDark } };
    cellE.alignment = { horizontal: 'right' };
    cellE.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cellE.border = thinBorder;

    const cellF = ws1.getCell(`F${currentRow}`);
    cellF.value = stats.income > 0 ? { formula: `IF(C${currentRow}>0, E${currentRow}/C${currentRow}, 0)`, result: (stats.income - stats.expense) / stats.income } : 0;
    cellF.numFmt = percentFmt;
    cellF.font = { name: 'Segoe UI', size: 9, color: { argb: colors.textMuted } };
    cellF.alignment = { horizontal: 'right' };
    cellF.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cellF.border = thinBorder;

    ws1.getRow(currentRow).height = 20;
  });

  const dataEndRow = currentRow;

  // Totals Row
  currentRow++;
  const totalLabel = ws1.getCell(`B${currentRow}`);
  totalLabel.value = 'TOTALES CONSOLIDADOS';
  totalLabel.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.navyDark } };
  totalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  totalLabel.border = accountingTotalBorder;

  const totalIncCell = ws1.getCell(`C${currentRow}`);
  totalIncCell.value = { formula: `SUM(C${dataStartRow}:C${dataEndRow})`, result: totalIncome };
  totalIncCell.numFmt = currencyFmt;
  totalIncCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colors.emeraldDark } };
  totalIncCell.alignment = { horizontal: 'right' };
  totalIncCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  totalIncCell.border = accountingTotalBorder;

  const totalExpCell = ws1.getCell(`D${currentRow}`);
  totalExpCell.value = { formula: `SUM(D${dataStartRow}:D${dataEndRow})`, result: totalExpense };
  totalExpCell.numFmt = currencyFmt;
  totalExpCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colors.redDark } };
  totalExpCell.alignment = { horizontal: 'right' };
  totalExpCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  totalExpCell.border = accountingTotalBorder;

  const totalNetCell = ws1.getCell(`E${currentRow}`);
  totalNetCell.value = { formula: `C${currentRow}-D${currentRow}`, result: netBalance };
  totalNetCell.numFmt = currencyFmt;
  totalNetCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: netBalance >= 0 ? colors.emeraldDark : colors.redDark } };
  totalNetCell.alignment = { horizontal: 'right' };
  totalNetCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  totalNetCell.border = accountingTotalBorder;

  const totalPctCell = ws1.getCell(`F${currentRow}`);
  totalPctCell.value = { formula: `IF(C${currentRow}>0, E${currentRow}/C${currentRow}, 0)`, result: ratio };
  totalPctCell.numFmt = percentFmt;
  totalPctCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.navyDark } };
  totalPctCell.alignment = { horizontal: 'right' };
  totalPctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  totalPctCell.border = accountingTotalBorder;
  ws1.getRow(currentRow).height = 24;

  // 4. Métodos de Pago
  currentRow += 2;
  ws1.mergeCells(`B${currentRow}:F${currentRow}`);
  const secTitle2 = ws1.getCell(`B${currentRow}`);
  secTitle2.value = '2. DISTRIBUCIÓN POR MÉTODO DE PAGO Y CAJA';
  secTitle2.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.navyDark } };
  secTitle2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  secTitle2.border = thinBorder;
  ws1.getRow(currentRow).height = 22;

  currentRow++;
  const paymentHeaders = ['Método / Vía de Pago', 'Monto Ingresos', 'Monto Egresos', 'Flujo Total Movido', '% Participación'];
  ['B', 'C', 'D', 'E', 'F'].forEach((col, idx) => {
    const cell = ws1.getCell(`${col}${currentRow}`);
    cell.value = paymentHeaders[idx];
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.white } };
    cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyHeader } };
    cell.border = thinBorder;
  });
  ws1.getRow(currentRow).height = 22;

  const paymentStartRow = currentRow + 1;
  const totalVolume = totalIncome + totalExpense;

  Object.entries(paymentMap).forEach(([methodName, pstats], i) => {
    currentRow++;
    const isZebra = i % 2 === 1;
    const rowBg = isZebra ? colors.zebraRow : colors.white;

    const cellB = ws1.getCell(`B${currentRow}`);
    cellB.value = methodName;
    cellB.font = { name: 'Segoe UI', size: 9, color: { argb: colors.textDark } };
    cellB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cellB.border = thinBorder;

    const cellC = ws1.getCell(`C${currentRow}`);
    cellC.value = pstats.income;
    cellC.numFmt = currencyFmt;
    cellC.alignment = { horizontal: 'right' };
    cellC.font = { name: 'Segoe UI', size: 9, color: { argb: colors.textDark } };
    cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cellC.border = thinBorder;

    const cellD = ws1.getCell(`D${currentRow}`);
    cellD.value = pstats.expense;
    cellD.numFmt = currencyFmt;
    cellD.alignment = { horizontal: 'right' };
    cellD.font = { name: 'Segoe UI', size: 9, color: { argb: colors.textDark } };
    cellD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cellD.border = thinBorder;

    const cellE = ws1.getCell(`E${currentRow}`);
    cellE.value = { formula: `C${currentRow}+D${currentRow}`, result: pstats.total };
    cellE.numFmt = currencyFmt;
    cellE.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.textDark } };
    cellE.alignment = { horizontal: 'right' };
    cellE.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cellE.border = thinBorder;

    const cellF = ws1.getCell(`F${currentRow}`);
    cellF.value = totalVolume > 0 ? pstats.total / totalVolume : 0;
    cellF.numFmt = percentFmt;
    cellF.alignment = { horizontal: 'right' };
    cellF.font = { name: 'Segoe UI', size: 9, color: { argb: colors.textMuted } };
    cellF.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cellF.border = thinBorder;

    ws1.getRow(currentRow).height = 19;
  });

  const paymentEndRow = currentRow;

  // Payment Totals
  currentRow++;
  ws1.getCell(`B${currentRow}`).value = 'TOTAL CAJA & BANCOS';
  ws1.getCell(`B${currentRow}`).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.navyDark } };
  ws1.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  ws1.getCell(`B${currentRow}`).border = accountingTotalBorder;

  const pTotInc = ws1.getCell(`C${currentRow}`);
  pTotInc.value = { formula: `SUM(C${paymentStartRow}:C${paymentEndRow})`, result: totalIncome };
  pTotInc.numFmt = currencyFmt;
  pTotInc.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.emeraldDark } };
  pTotInc.alignment = { horizontal: 'right' };
  pTotInc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  pTotInc.border = accountingTotalBorder;

  const pTotExp = ws1.getCell(`D${currentRow}`);
  pTotExp.value = { formula: `SUM(D${paymentStartRow}:D${paymentEndRow})`, result: totalExpense };
  pTotExp.numFmt = currencyFmt;
  pTotExp.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.redDark } };
  pTotExp.alignment = { horizontal: 'right' };
  pTotExp.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  pTotExp.border = accountingTotalBorder;

  const pTotVol = ws1.getCell(`E${currentRow}`);
  pTotVol.value = { formula: `SUM(E${paymentStartRow}:E${paymentEndRow})`, result: totalVolume };
  pTotVol.numFmt = currencyFmt;
  pTotVol.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.navyDark } };
  pTotVol.alignment = { horizontal: 'right' };
  pTotVol.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  pTotVol.border = accountingTotalBorder;

  const pTotPct = ws1.getCell(`F${currentRow}`);
  pTotPct.value = 1.0;
  pTotPct.numFmt = percentFmt;
  pTotPct.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.navyDark } };
  pTotPct.alignment = { horizontal: 'right' };
  pTotPct.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyLight } };
  pTotPct.border = accountingTotalBorder;
  ws1.getRow(currentRow).height = 22;

  // 5. Sign-off and Audit Block
  currentRow += 3;
  ws1.getCell(`B${currentRow}`).value = '_______________________________';
  ws1.getCell(`B${currentRow}`).font = { name: 'Segoe UI', size: 9, color: { argb: colors.textMuted } };
  ws1.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };

  ws1.mergeCells(`C${currentRow}:D${currentRow}`);
  ws1.getCell(`C${currentRow}`).value = '_______________________________';
  ws1.getCell(`C${currentRow}`).font = { name: 'Segoe UI', size: 9, color: { argb: colors.textMuted } };
  ws1.getCell(`C${currentRow}`).alignment = { horizontal: 'center' };

  ws1.mergeCells(`E${currentRow}:F${currentRow}`);
  ws1.getCell(`E${currentRow}`).value = '_______________________________';
  ws1.getCell(`E${currentRow}`).font = { name: 'Segoe UI', size: 9, color: { argb: colors.textMuted } };
  ws1.getCell(`E${currentRow}`).alignment = { horizontal: 'center' };

  currentRow++;
  ws1.getCell(`B${currentRow}`).value = pastorName;
  ws1.getCell(`B${currentRow}`).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.navyDark } };
  ws1.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };

  ws1.mergeCells(`C${currentRow}:D${currentRow}`);
  ws1.getCell(`C${currentRow}`).value = 'Tesorero General / Administrador';
  ws1.getCell(`C${currentRow}`).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.navyDark } };
  ws1.getCell(`C${currentRow}`).alignment = { horizontal: 'center' };

  ws1.mergeCells(`E${currentRow}:F${currentRow}`);
  ws1.getCell(`E${currentRow}`).value = 'Comité de Auditoría / Revisor Fiscal';
  ws1.getCell(`E${currentRow}`).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.navyDark } };
  ws1.getCell(`E${currentRow}`).alignment = { horizontal: 'center' };

  currentRow++;
  ws1.getCell(`B${currentRow}`).value = 'Pastor Presidente';
  ws1.getCell(`B${currentRow}`).font = { name: 'Segoe UI', size: 8, color: { argb: colors.textMuted } };
  ws1.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };

  ws1.mergeCells(`C${currentRow}:D${currentRow}`);
  ws1.getCell(`C${currentRow}`).value = 'Firma y Sello de Tesorería';
  ws1.getCell(`C${currentRow}`).font = { name: 'Segoe UI', size: 8, color: { argb: colors.textMuted } };
  ws1.getCell(`C${currentRow}`).alignment = { horizontal: 'center' };

  ws1.mergeCells(`E${currentRow}:F${currentRow}`);
  ws1.getCell(`E${currentRow}`).value = 'Verificación Contable';
  ws1.getCell(`E${currentRow}`).font = { name: 'Segoe UI', size: 8, color: { argb: colors.textMuted } };
  ws1.getCell(`E${currentRow}`).alignment = { horizontal: 'center' };

  // =========================================================================
  // HOJA 2: LIBRO DIARIO DE INGRESOS Y DIEZMOS
  // =========================================================================
  const ws2 = workbook.addWorksheet('Ingresos y Diezmos', {
    views: [{ state: 'frozen', ySplit: 4 }],
    properties: { tabColor: { argb: colors.emeraldMed } },
  });

  ws2.columns = [
    { key: 'receipt', width: 18 },    // A: Folio
    { key: 'date', width: 14 },       // B: Fecha
    { key: 'type', width: 18 },       // C: Tipo
    { key: 'category', width: 26 },   // D: Categoría
    { key: 'member', width: 30 },     // E: Feligrés
    { key: 'payment', width: 20 },    // F: Método
    { key: 'status', width: 14 },     // G: Estado
    { key: 'amount', width: 18 },     // H: Monto
    { key: 'notes', width: 38 },      // I: Descripción
  ];

  // Header Banner
  ws2.mergeCells('A1:I1');
  const ws2Title = ws2.getCell('A1');
  ws2Title.value = `${churchName} • LIBRO DIARIO DE INGRESOS, DIEZMOS Y OFRENDAS`;
  ws2Title.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: colors.white } };
  ws2Title.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldDark } };
  ws2.getRow(1).height = 30;

  ws2.mergeCells('A2:I2');
  const ws2Sub = ws2.getCell('A2');
  ws2Sub.value = `Registros auditados al ${emissionDate} | Moneda oficial: ${currencySymbol}`;
  ws2Sub.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: colors.white } };
  ws2Sub.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws2Sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldMed } };
  ws2.getRow(2).height = 18;

  ws2.getRow(3).height = 8;

  // Table Column Headers (Row 4)
  const incHeaders = [
    'N° Recibo / Folio',
    'Fecha Registro',
    'Tipo de Ingreso',
    'Categoría Presupuestaria',
    'Feligrés / Aportante',
    'Método de Pago',
    'Estado',
    `Monto (${currencySymbol})`,
    'Concepto / Detalle',
  ];

  incHeaders.forEach((title, idx) => {
    const cell = ws2.getRow(4).getCell(idx + 1);
    cell.value = title;
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.white } };
    cell.alignment = { horizontal: idx === 7 ? 'right' : (idx === 1 || idx === 6 ? 'center' : 'left'), vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldDark } };
    cell.border = thinBorder;
  });
  ws2.getRow(4).height = 24;

  // Auto-filter
  ws2.autoFilter = { from: 'A4', to: `I${Math.max(5, incomes.length + 4)}` };

  // Data rows
  let incRowIdx = 5;
  incomes.forEach((t, idx) => {
    const row = ws2.getRow(incRowIdx);
    const isZebra = idx % 2 === 1;
    const bg = isZebra ? colors.zebraRow : colors.white;

    row.getCell(1).value = t.receiptNumber || t.id;
    row.getCell(1).alignment = { horizontal: 'center' };

    row.getCell(2).value = t.date;
    row.getCell(2).numFmt = dateFmt;
    row.getCell(2).alignment = { horizontal: 'center' };

    row.getCell(3).value = t.type;
    row.getCell(3).font = { name: 'Segoe UI', size: 9, bold: t.type === 'Diezmo', color: { argb: colors.textDark } };

    row.getCell(4).value = t.category || 'Diezmos y Ofrendas';
    row.getCell(5).value = t.memberName || 'Congregación General';
    row.getCell(5).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.textDark } };

    row.getCell(6).value = t.paymentMethod || 'Efectivo';
    row.getCell(7).value = t.status || 'Completado';
    row.getCell(7).alignment = { horizontal: 'center' };

    row.getCell(8).value = Number(t.amount || 0);
    row.getCell(8).numFmt = currencyFmt;
    row.getCell(8).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.emeraldDark } };
    row.getCell(8).alignment = { horizontal: 'right' };

    row.getCell(9).value = t.description || '';

    // Apply styles
    for (let c = 1; c <= 9; c++) {
      const cell = row.getCell(c);
      if (!cell.font) cell.font = { name: 'Segoe UI', size: 9, color: { argb: colors.textDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    }

    row.height = 20;
    incRowIdx++;
  });

  // Total Row
  const incTotalRow = ws2.getRow(incRowIdx);
  incTotalRow.getCell(6).value = 'TOTAL INGRESOS:';
  incTotalRow.getCell(6).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colors.emeraldDark } };
  incTotalRow.getCell(6).alignment = { horizontal: 'right' };
  incTotalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldLight } };
  incTotalRow.getCell(6).border = accountingTotalBorder;

  incTotalRow.getCell(7).value = `${incomes.length} ops`;
  incTotalRow.getCell(7).font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: colors.emeraldDark } };
  incTotalRow.getCell(7).alignment = { horizontal: 'center' };
  incTotalRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldLight } };
  incTotalRow.getCell(7).border = accountingTotalBorder;

  const incSumCell = incTotalRow.getCell(8);
  incSumCell.value = { formula: `SUM(H5:H${Math.max(5, incRowIdx - 1)})`, result: totalIncome };
  incSumCell.numFmt = currencyFmt;
  incSumCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.emeraldDark } };
  incSumCell.alignment = { horizontal: 'right' };
  incSumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldLight } };
  incSumCell.border = accountingTotalBorder;

  for (let c = 1; c <= 5; c++) {
    const cell = incTotalRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldLight } };
    cell.border = accountingTotalBorder;
  }
  incTotalRow.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emeraldLight } };
  incTotalRow.getCell(9).border = accountingTotalBorder;
  incTotalRow.height = 25;

  // =========================================================================
  // HOJA 3: LIBRO DIARIO DE EGRESOS Y GASTOS
  // =========================================================================
  const ws3 = workbook.addWorksheet('Egresos y Gastos', {
    views: [{ state: 'frozen', ySplit: 4 }],
    properties: { tabColor: { argb: colors.redMed } },
  });

  ws3.columns = [
    { key: 'voucher', width: 20 },   // A: Folio
    { key: 'date', width: 14 },      // B: Fecha
    { key: 'category', width: 26 },  // C: Categoría
    { key: 'dept', width: 26 },      // D: Ministerio
    { key: 'payee', width: 28 },     // E: Beneficiario
    { key: 'payment', width: 18 },   // F: Método
    { key: 'status', width: 14 },    // G: Estado
    { key: 'amount', width: 18 },    // H: Monto
    { key: 'notes', width: 42 },     // I: Justificación
  ];

  // Header Banner
  ws3.mergeCells('A1:I1');
  const ws3Title = ws3.getCell('A1');
  ws3Title.value = `${churchName} • LIBRO DIARIO DE EGRESOS, GASTOS Y SERVICIOS`;
  ws3Title.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: colors.white } };
  ws3Title.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws3Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redDark } };
  ws3.getRow(1).height = 30;

  ws3.mergeCells('A2:I2');
  const ws3Sub = ws3.getCell('A2');
  ws3Sub.value = `Registros de egreso y comprobantes al ${emissionDate} | Moneda oficial: ${currencySymbol}`;
  ws3Sub.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: colors.white } };
  ws3Sub.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws3Sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redMed } };
  ws3.getRow(2).height = 18;

  ws3.getRow(3).height = 8;

  // Table Column Headers (Row 4)
  const expHeaders = [
    'N° Comprobante / Folio',
    'Fecha Desembolso',
    'Categoría de Gasto',
    'Departamento / Solicitante',
    'Beneficiario / Proveedor',
    'Método de Pago',
    'Estado',
    `Monto (${currencySymbol})`,
    'Justificación / Concepto',
  ];

  expHeaders.forEach((title, idx) => {
    const cell = ws3.getRow(4).getCell(idx + 1);
    cell.value = title;
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.white } };
    cell.alignment = { horizontal: idx === 7 ? 'right' : (idx === 1 || idx === 6 ? 'center' : 'left'), vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redDark } };
    cell.border = thinBorder;
  });
  ws3.getRow(4).height = 24;

  // Auto-filter
  ws3.autoFilter = { from: 'A4', to: `I${Math.max(5, expenses.length + 4)}` };

  // Data rows
  let expRowIdx = 5;
  expenses.forEach((t, idx) => {
    const row = ws3.getRow(expRowIdx);
    const isZebra = idx % 2 === 1;
    const bg = isZebra ? colors.zebraRow : colors.white;

    row.getCell(1).value = t.receiptNumber || t.id;
    row.getCell(1).alignment = { horizontal: 'center' };

    row.getCell(2).value = t.date;
    row.getCell(2).numFmt = dateFmt;
    row.getCell(2).alignment = { horizontal: 'center' };

    row.getCell(3).value = t.category || 'Gastos Operativos';
    row.getCell(3).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.textDark } };

    row.getCell(4).value = 'Tesorería & Administración';
    row.getCell(5).value = t.memberName || 'Proveedor / Responsable';
    row.getCell(6).value = t.paymentMethod || 'Efectivo';
    row.getCell(7).value = t.status || 'Completado';
    row.getCell(7).alignment = { horizontal: 'center' };

    row.getCell(8).value = Number(t.amount || 0);
    row.getCell(8).numFmt = currencyFmt;
    row.getCell(8).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.redDark } };
    row.getCell(8).alignment = { horizontal: 'right' };

    row.getCell(9).value = t.description || '';

    // Apply styles
    for (let c = 1; c <= 9; c++) {
      const cell = row.getCell(c);
      if (!cell.font) cell.font = { name: 'Segoe UI', size: 9, color: { argb: colors.textDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    }

    row.height = 20;
    expRowIdx++;
  });

  // Total Row
  const expTotalRow = ws3.getRow(expRowIdx);
  expTotalRow.getCell(6).value = 'TOTAL EGRESOS:';
  expTotalRow.getCell(6).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colors.redDark } };
  expTotalRow.getCell(6).alignment = { horizontal: 'right' };
  expTotalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redLight } };
  expTotalRow.getCell(6).border = accountingTotalBorder;

  expTotalRow.getCell(7).value = `${expenses.length} ops`;
  expTotalRow.getCell(7).font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: colors.redDark } };
  expTotalRow.getCell(7).alignment = { horizontal: 'center' };
  expTotalRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redLight } };
  expTotalRow.getCell(7).border = accountingTotalBorder;

  const expSumCell = expTotalRow.getCell(8);
  expSumCell.value = { formula: `SUM(H5:H${Math.max(5, expRowIdx - 1)})`, result: totalExpense };
  expSumCell.numFmt = currencyFmt;
  expSumCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.redDark } };
  expSumCell.alignment = { horizontal: 'right' };
  expSumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redLight } };
  expSumCell.border = accountingTotalBorder;

  for (let c = 1; c <= 5; c++) {
    const cell = expTotalRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redLight } };
    cell.border = accountingTotalBorder;
  }
  expTotalRow.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.redLight } };
  expTotalRow.getCell(9).border = accountingTotalBorder;
  expTotalRow.height = 25;

  // =========================================================================
  // HOJA 4: APORTES POR FELIGRÉS (MAYORDOMÍA INDIVIDUAL)
  // =========================================================================
  const ws4 = workbook.addWorksheet('Aportes por Feligrés', {
    views: [{ state: 'frozen', ySplit: 4 }],
    properties: { tabColor: { argb: colors.indigoDark } },
  });

  ws4.columns = [
    { key: 'name', width: 34 },        // A: Feligrés
    { key: 'tithes', width: 20 },      // B: Diezmos
    { key: 'offerings', width: 20 },   // C: Ofrendas
    { key: 'others', width: 20 },      // D: Especiales
    { key: 'total', width: 22 },       // E: Total Aportado
    { key: 'count', width: 16 },       // F: N° Aportes
    { key: 'lastDate', width: 16 },    // G: Último Aporte
  ];

  // Header Banner
  ws4.mergeCells('A1:G1');
  const ws4Title = ws4.getCell('A1');
  ws4Title.value = `${churchName} • REPORTE CONSOLIDADO DE APORTES POR FELIGRÉS`;
  ws4Title.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: colors.white } };
  ws4Title.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws4Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.indigoDark } };
  ws4.getRow(1).height = 30;

  ws4.mergeCells('A2:G2');
  const ws4Sub = ws4.getCell('A2');
  ws4Sub.value = `Control confidencial de mayordomía eclesial | Moneda: ${currencySymbol}`;
  ws4Sub.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: colors.white } };
  ws4Sub.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws4Sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.indigoDark } };
  ws4.getRow(2).height = 18;

  ws4.getRow(3).height = 8;

  // Table Headers
  const memHeaders = [
    'Nombre del Feligrés / Donante',
    'Total Diezmos',
    'Total Ofrendas',
    'Ofrendas Especiales',
    'Aporte Total Consolidado',
    'N° Transacciones',
    'Última Fecha',
  ];

  memHeaders.forEach((title, idx) => {
    const cell = ws4.getRow(4).getCell(idx + 1);
    cell.value = title;
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.white } };
    cell.alignment = { horizontal: idx >= 1 && idx <= 4 ? 'right' : (idx >= 5 ? 'center' : 'left'), vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.indigoDark } };
    cell.border = thinBorder;
  });
  ws4.getRow(4).height = 24;

  const donationList = Object.values(memberDonations).sort((a, b) => b.total - a.total);
  ws4.autoFilter = { from: 'A4', to: `G${Math.max(5, donationList.length + 4)}` };

  let memRowIdx = 5;
  donationList.forEach((m, idx) => {
    const row = ws4.getRow(memRowIdx);
    const isZebra = idx % 2 === 1;
    const bg = isZebra ? colors.zebraRow : colors.white;

    row.getCell(1).value = m.name;
    row.getCell(1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.textDark } };

    row.getCell(2).value = m.tithes;
    row.getCell(2).numFmt = currencyFmt;
    row.getCell(2).alignment = { horizontal: 'right' };

    row.getCell(3).value = m.offerings;
    row.getCell(3).numFmt = currencyFmt;
    row.getCell(3).alignment = { horizontal: 'right' };

    row.getCell(4).value = m.others;
    row.getCell(4).numFmt = currencyFmt;
    row.getCell(4).alignment = { horizontal: 'right' };

    row.getCell(5).value = { formula: `SUM(B${memRowIdx}:D${memRowIdx})`, result: m.total };
    row.getCell(5).numFmt = currencyFmt;
    row.getCell(5).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.indigoDark } };
    row.getCell(5).alignment = { horizontal: 'right' };

    row.getCell(6).value = m.count;
    row.getCell(6).alignment = { horizontal: 'center' };

    row.getCell(7).value = m.lastDate;
    row.getCell(7).numFmt = dateFmt;
    row.getCell(7).alignment = { horizontal: 'center' };

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      if (!cell.font) cell.font = { name: 'Segoe UI', size: 9, color: { argb: colors.textDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    }

    row.height = 20;
    memRowIdx++;
  });

  // Total Row for Members
  const memTotalRow = ws4.getRow(memRowIdx);
  memTotalRow.getCell(1).value = 'TOTAL APORTES CONSOLIDADOS:';
  memTotalRow.getCell(1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: colors.indigoDark } };
  memTotalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.indigoLight } };
  memTotalRow.getCell(1).border = accountingTotalBorder;

  for (let c = 2; c <= 5; c++) {
    const colLetter = ['B', 'C', 'D', 'E'][c - 2];
    const cell = memTotalRow.getCell(c);
    cell.value = { formula: `SUM(${colLetter}5:${colLetter}${Math.max(5, memRowIdx - 1)})` };
    cell.numFmt = currencyFmt;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colors.indigoDark } };
    cell.alignment = { horizontal: 'right' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.indigoLight } };
    cell.border = accountingTotalBorder;
  }

  memTotalRow.getCell(6).value = `${incomes.length} ops`;
  memTotalRow.getCell(6).font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: colors.indigoDark } };
  memTotalRow.getCell(6).alignment = { horizontal: 'center' };
  memTotalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.indigoLight } };
  memTotalRow.getCell(6).border = accountingTotalBorder;

  memTotalRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.indigoLight } };
  memTotalRow.getCell(7).border = accountingTotalBorder;
  memTotalRow.height = 25;

  // =========================================================================
  // GENERAR Y DESCARGAR ARCHIVO EXCEL (.XLSX)
  // =========================================================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanName = (config.name || 'Iglesia').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Informe_Financiero_${cleanName}_${dateStr}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
