import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Formatters ────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n === null || n === undefined || n === '') return '-';
  const num = Number(n);
  if (isNaN(num)) return '-';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const formatted = abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return `${sign}Rs.${formatted}`;
};

const fmtL = (n) => {
  if (n === null || n === undefined || n === '') return '-';
  const num = Number(n);
  if (isNaN(num) || num === 0) return '0.00 L';
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (absNum >= 10000000) return `${sign}${(absNum / 10000000).toFixed(2)} Cr`;
  return `${sign}${(absNum / 100000).toFixed(2)} L`;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const statusLabel = (s) => s === 'completed' ? 'Completed' : s === 'in_progress' ? 'In Progress' : 'Yet to Start';

// ─── Ink-saving Header (no fill — just text + bottom rule) ──────────────────
function addHeader(doc, title, subtitle = '') {
  const W = doc.internal.pageSize.getWidth();

  // Top rule
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.line(14, 10, W - 14, 10);

  // App name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('CivilTrack Pro', 14, 20);

  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text(title, 14, 27);

  if (subtitle) {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 33);
  }

  const dateStr = `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(dateStr, W - 14, 20, { align: 'right' });

  // Bottom rule
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(14, 36, W - 14, 36);
}

// ─── Ink-saving Footer (no fill — just a top rule + text) ───────────────────
function addFooter(doc, note = '') {
  const pages = doc.internal.getNumberOfPages();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(14, H - 12, W - 14, H - 12);
    doc.setFontSize(7.5);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'normal');
    doc.text(`CivilTrack Pro  |  ${note || 'Confidential'}`, 14, H - 6);
    doc.text(`Page ${i} of ${pages}`, W / 2, H - 6, { align: 'center' });
    doc.text(new Date().toLocaleDateString('en-IN'), W - 14, H - 6, { align: 'right' });
  }
}

// ─── Ink-saving Summary bar (box outline + bold text, no fills) ──────────────
function addSummaryBar(doc, items, y) {
  const W = doc.internal.pageSize.getWidth();
  const totalW = W - 28;
  const colW = totalW / items.length;

  // Outer box only — no fill
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(14, y, totalW, 18);

  items.forEach((item, idx) => {
    const cx = 14 + idx * colW + colW / 2;
    if (idx > 0) {
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(14 + idx * colW, y + 2, 14 + idx * colW, y + 16);
    }
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(item.label, cx, y + 6, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(item.value, cx, y + 14, { align: 'center' });
  });
}

// ─── Ink-saving table styles (no fills, just borders + bold headers) ─────────
const HS = { fillColor: false, textColor: [0, 0, 0], fontStyle: 'bold', cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.3 };
const BS = { cellPadding: 3, textColor: [30, 30, 30], lineColor: [0, 0, 0], lineWidth: 0.2, fillColor: false };
const AR = { fillColor: false };

// ═══════════════════════════════════════════════════════════════════════════
//  PROJECT LIST PDF — A3 Landscape, Ink-Saving
// ═══════════════════════════════════════════════════════════════════════════
export function generateProjectListPDF(projects, filters = {}, selectedColumns = null) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const W = doc.internal.pageSize.getWidth(); // 420mm
  const MW = W - 24; // 12mm margins = 396mm usable width

  const parts = [];
  if (filters.year) parts.push(`Year: ${filters.year}`);
  if (filters.scheme) parts.push(`Scheme: ${filters.scheme}`);
  if (filters.status) parts.push(`Status: ${filters.status}`);
  if (filters.constituency) parts.push(`Constituency: ${filters.constituency}`);
  const filterText = parts.length ? parts.join('  |  ') : 'All Projects';

  const totalS = projects.reduce((s, p) => s + (p.sanctionedAmount || 0), 0);
  const totalE = projects.reduce((s, p) => s + (p.expenditureIncurred || 0), 0);
  const totalD = projects.reduce((s, p) => s + (p.deductions || 0), 0);
  const totalU = totalE + totalD;
  const totalBal = totalS - totalU;

  addHeader(doc, `Project Report  —  ${filterText}`, `Total Projects: ${projects.length}`);

  addSummaryBar(doc, [
    { label: 'Projects',         value: String(projects.length) },
    { label: 'Total Sanctioned', value: fmtL(totalS) },
    { label: 'Total Expenditure',value: fmtL(totalE) },
    { label: 'Total Deductions', value: fmtL(totalD) },
    { label: 'Total Utilised',   value: fmtL(totalU) },
    { label: 'Total Balance',    value: fmtL(totalBal) },
  ], 40);

  const ALL_COLS = [
    { id: 'projectName', label: 'Project Name', align: 'left' },
    { id: 'category', label: 'Category', align: 'left' },
    { id: 'yearOfSanction', label: 'Year', align: 'center' },
    { id: 'constituency', label: 'Constituency', align: 'left' },
    { id: 'villagePanchayat', label: 'Village Panchayat', align: 'left' },
    { id: 'scheme', label: 'Scheme', align: 'left' },
    { id: 'phase', label: 'Phase', align: 'left' },
    { id: 'contractorName', label: 'Contractor', align: 'left' },
    { id: 'workOrderDate', label: 'WO Date', align: 'left' },
    { id: 'completionDateContract', label: 'Comp (C)', align: 'left' },
    { id: 'actualCompletionDate', label: 'Act Comp', align: 'left' },
    { id: 'sanctionedAmount', label: 'Sanc.\n(Cr/L)', align: 'right' },
    { id: 'tenderedCost', label: 'Tender\n(Cr/L)', align: 'right' },
    { id: 'expenditureIncurred', label: 'Expend.\n(Cr/L)', align: 'right' },
    { id: 'utilisedAmount', label: 'Utilised\n(Cr/L)', align: 'right' },
    { id: 'balanceAmount', label: 'Balance\n(Cr/L)', align: 'right' },
    { id: 'statusOfWork', label: 'Status', align: 'center' },
    { id: 'ucSentDate', label: 'UC Date', align: 'center' },
    { id: 'remarks', label: 'Remarks', align: 'left' }
  ];

  const cols = selectedColumns 
    ? ALL_COLS.filter(c => selectedColumns.includes(c.id))
    : ALL_COLS.filter(c => c.id !== 'category');

  const rows = projects.map((p, i) => {
    const utilised = (p.expenditureIncurred || 0) + (p.deductions || 0);
    const balance  = (p.sanctionedAmount || 0) - utilised;
    
    const rowData = [i + 1];
    cols.forEach(c => {
      if (c.id === 'projectName') rowData.push(p.projectName || '-');
      else if (c.id === 'category') rowData.push(p.category || '-');
      else if (c.id === 'yearOfSanction') rowData.push(p.yearOfSanction || '-');
      else if (c.id === 'constituency') rowData.push(p.constituency || '-');
      else if (c.id === 'villagePanchayat') rowData.push(p.villagePanchayat || '-');
      else if (c.id === 'scheme') rowData.push(p.scheme || '-');
      else if (c.id === 'phase') rowData.push(p.phase || '-');
      else if (c.id === 'contractorName') rowData.push(p.contractorName || '-');
      else if (c.id === 'workOrderDate') rowData.push(fmtDate(p.workOrderDate));
      else if (c.id === 'completionDateContract') rowData.push(fmtDate(p.dateOfCompletionContract));
      else if (c.id === 'actualCompletionDate') rowData.push(fmtDate(p.actualDateOfCompletion));
      else if (c.id === 'sanctionedAmount') rowData.push(fmtL(p.sanctionedAmount));
      else if (c.id === 'tenderedCost') rowData.push(fmtL(p.tenderedCost));
      else if (c.id === 'expenditureIncurred') rowData.push(fmtL(p.expenditureIncurred));
      else if (c.id === 'utilisedAmount') rowData.push(fmtL(utilised));
      else if (c.id === 'balanceAmount') rowData.push(fmtL(balance));
      else if (c.id === 'statusOfWork') rowData.push(statusLabel(p.statusOfWork));
      else if (c.id === 'ucSentDate') rowData.push(fmtDate(p.ucSentDate));
      else if (c.id === 'remarks') rowData.push(p.notes || '-');
    });
    return rowData;
  });

  const headers = ['#', ...cols.map(c => c.label)];
  const colStyles = { 0: { cellWidth: 8, halign: 'center' } };
  cols.forEach((c, idx) => {
    colStyles[idx + 1] = { halign: c.align };
    if (c.id === 'remarks') colStyles[idx + 1].cellWidth = 'wrap';
  });

  let dynamicFontSize = 8;
  if (cols.length <= 6) dynamicFontSize = 11;
  else if (cols.length <= 10) dynamicFontSize = 10;
  else if (cols.length <= 14) dynamicFontSize = 9;

  autoTable(doc, {
    startY: 64,
    head: [headers],
    body: rows,
    styles: { ...BS, fontSize: dynamicFontSize, cellPadding: 2.5 },
    headStyles: { ...HS, fontSize: dynamicFontSize, cellPadding: 3 },
    alternateRowStyles: AR,
    tableWidth: MW,
    margin: { left: 12, right: 12 },
    columnStyles: colStyles,
    didParseCell(data) {
      if (data.section === 'body') {
        const colId = cols[data.column.index - 1]?.id;
        if (colId === 'utilisedAmount' || colId === 'statusOfWork') {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  addFooter(doc, `Project Report  —  ${filterText}`);
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
//  GRANTS LIST PDF — Portrait A4, Ink-Saving
// ═══════════════════════════════════════════════════════════════════════════
export function generateGrantsListPDF(grants, filters = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const MW = W - 20;

  const parts = [];
  if (filters.year) parts.push(`Year: ${filters.year}`);
  if (filters.scheme) parts.push(`Scheme: ${filters.scheme}`);
  if (filters.phase) parts.push(`Phase: ${filters.phase}`);
  if (filters.constituency) parts.push(`Constituency: ${filters.constituency}`);
  const filterText = parts.length ? parts.join('  |  ') : 'All Grants';

  const totalG = grants.reduce((s, g) => s + (g.amount || 0), 0);

  addHeader(doc, `Grants Report  —  ${filterText}`, `Total Grants: ${grants.length}`);

  addSummaryBar(doc, [
    { label: 'Grants',       value: String(grants.length) },
    { label: 'Total Amount', value: fmt(totalG) }
  ], 40);

  const rows = grants.map((g, i) => [
    i + 1,
    g.scheme || '-',
    g.constituency || '-',
    g.year || '-',
    g.phase || '-',
    g.goNumber || '-',
    g.date ? fmtDate(g.date) : '-',
    fmt(g.amount)
  ]);

  autoTable(doc, {
    startY: 64,
    head: [['#', 'Scheme', 'Constituency', 'Year', 'Phase', 'GO No', 'GO Date', 'Amount (Rs.)']],
    body: rows,
    styles: { ...BS, fontSize: 8, cellPadding: 2 },
    headStyles: { ...HS, fontSize: 8 },
    alternateRowStyles: AR,
    tableWidth: MW,
    margin: { left: 10, right: 10 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
      6: { cellWidth: 20 },
      7: { cellWidth: 35, halign: 'right' }
    }
  });

  addFooter(doc, `Grants Report  —  ${filterText}`);
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
//  PROJECT DETAIL PDF — Portrait A4, Ink-Saving, overflow-safe
// ═══════════════════════════════════════════════════════════════════════════
export function generateProjectDetailPDF(project) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const p = project;
  const W = doc.internal.pageSize.getWidth(); // 210
  const H = doc.internal.pageSize.getHeight(); // 297
  const MW = W - 28;
  const FOOTER_MARGIN = 20; // keep this many mm above footer
  const utilised = (p.expenditureIncurred || 0) + (p.deductions || 0);
  const balance  = (p.sanctionedAmount || 0) - utilised;
  const pct      = p.sanctionedAmount > 0 ? Math.min(Math.round((utilised / p.sanctionedAmount) * 100), 100) : 0;

  addHeader(doc, 'Project Detail Report', p.projectName || '');

  // Status text (no colored fill)
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text(statusLabel(p.statusOfWork), 14, 44);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80);
  doc.text(`Progress: ${p.progress || 0}%   |   Updated: ${p.updatedAt ? fmtDate(p.updatedAt) : '-'}`, 14, 50);

  let Y = 56;

  // Helper: ensure enough space before printing; if not, add a page
  const ensureSpace = (needed) => {
    if (Y + needed > H - FOOTER_MARGIN) {
      doc.addPage();
      Y = 16;
    }
  };

  // Section heading helper
  const sectionHeading = (title) => {
    ensureSpace(10);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
    doc.text(title, 14, Y);
    doc.setDrawColor(0); doc.setLineWidth(0.4);
    doc.line(14, Y + 1.5, 14 + MW, Y + 1.5);
    Y += 5;
  };

  // Helper: render a 2-column key-value section table
  const section = (title, fields) => {
    sectionHeading(title);

    const rows = [];
    for (let i = 0; i < fields.length; i += 2) {
      const L = fields[i], R = fields[i + 1];
      rows.push([L[0], String(L[1] ?? '-'), R ? R[0] : '', R ? String(R[1] ?? '-') : '']);
    }

    autoTable(doc, {
      startY: Y,
      body: rows,
      styles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: [30, 30, 30], lineColor: [0, 0, 0], lineWidth: 0.2, fillColor: false },
      alternateRowStyles: { fillColor: false },
      tableWidth: MW,
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 44, fontStyle: 'bold', textColor: [0, 0, 0] },
        1: { cellWidth: MW / 2 - 44, fillColor: false },
        2: { cellWidth: 44, fontStyle: 'bold', textColor: [0, 0, 0] },
        3: { cellWidth: MW / 2 - 44, fillColor: false },
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.2,
    });
    Y = doc.lastAutoTable.finalY + 5;
  };

  // ── 1. Sanction & GO ──────────────────────────────────────────────────
  section('1. SANCTION & GO DETAILS', [
    ['Project Name',     p.projectName],
    ['Year of Sanction', p.yearOfSanction],
    ['Constituency',     p.constituency],
    ['Scheme',           p.scheme],
    ['Category',         p.category],
    ['Phase',            p.phase],
    ['GO Number',        p.goNumber],
    ['GO Date',          fmtDate(p.goDate)],
  ]);

  // ── 2. Financial ──────────────────────────────────────────────────────
  section('2. FINANCIAL DETAILS', [
    ['Sanctioned Amount',    fmt(p.sanctionedAmount)],
    ['Tendered Cost',        fmt(p.tenderedCost)],
    ['Expenditure Incurred', fmt(p.expenditureIncurred)],
    ['Deductions',           fmt(p.deductions || 0)],
    ['Total Utilised',       fmt(utilised)],
    ['Balance',              fmt(balance)],
    ['Security Amount',      fmt(p.securityAmount || 0)],
    ['Utilisation %',        `${pct}%`],
  ]);

  // Utilisation text line (no coloured bar)
  ensureSpace(8);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text(`Utilisation: ${pct}% of Sanctioned Amount`, 14, Y);
  Y += 8;

  // ── 3. Timeline ───────────────────────────────────────────────────────
  section('3. TIMELINE', [
    ['Contractor',          p.contractorName],
    ['Work Order Date',     fmtDate(p.workOrderDate)],
    ['Contract Start Date', fmtDate(p.dateOfStartContract)],
    ['Contract Completion', fmtDate(p.dateOfCompletionContract)],
    ['Actual Start Date',   fmtDate(p.actualDateOfStart)],
    ['Actual Completion',   fmtDate(p.actualDateOfCompletion)],
    ['Extension of Time',   p.extensionOfTime || 'None'],
    ['Status',              statusLabel(p.statusOfWork)],
  ]);

  // ── 4. Guarantee & Personnel ──────────────────────────────────────────
  section('4. GUARANTEE & PERSONNEL', [
    ['Performance Guarantee', fmtDate(p.performanceGuaranteeDate)],
    ['Guarantee Expiry Date', fmtDate(p.expiryDate)],
    ['Junior Engineer',       p.juniorEngineer],
    ['Assistant Engineer',    p.assistantEngineer],
  ]);

  // ── 5. Security Deposit ───────────────────────────────────────────────
  section('5. SECURITY DEPOSIT', [
    ['Security Amount',       fmt(p.securityAmount || 0)],
    ['Security Deducted On',  fmtDate(p.securityDepositDeductedDate)],
    ['Security Release Date', fmtDate(p.securityDepositReleaseDate)],
    ['UC Sent On',            fmtDate(p.ucSentDate)],
    ['M Book Number',         p.mBookNumber],
    ['Audit Register No.',    p.workAuditRegisterNo],
  ]);

  // ── 6. Location ───────────────────────────────────────────────────────
  if (p.latitude && p.longitude && Number(p.latitude) !== 0) {
    section('6. GEO-LOCATION', [
      ['Latitude',  p.latitude],
      ['Longitude', p.longitude],
    ]);
  }

  // ── 7 & 8. Text blocks — with page-break protection ───────────────────
  const writeTextBlock = (heading, text) => {
    const lines = doc.splitTextToSize(String(text || ''), MW);
    const blockH = lines.length * 5 + 14; // heading + lines + padding
    ensureSpace(blockH);

    sectionHeading(heading);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(40);

    // Write lines one by one, adding pages as needed
    for (const line of lines) {
      if (Y > H - FOOTER_MARGIN) {
        doc.addPage();
        Y = 16;
      }
      doc.text(line, 14, Y);
      Y += 5;
    }
    Y += 4;
  };

  if (p.physicalParametersNotes) writeTextBlock('7. PHYSICAL PARAMETERS', p.physicalParametersNotes);
  if (p.notes) writeTextBlock('8. NOTES / REMARKS', p.notes);

  addFooter(doc, p.projectName || 'Project Detail');
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ALERTS PDF — Portrait A4, Ink-Saving
// ═══════════════════════════════════════════════════════════════════════════
export function generateAlertsPDF(alerts, filters = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const MW = W - 28;
  const critical = alerts.filter(a => a.type === 'danger');
  const warnings  = alerts.filter(a => a.type !== 'danger');
  const filterParts = [];

  if (filters.juniorEngineer) filterParts.push(`JE: ${filters.juniorEngineer}`);
  if (filters.assistantEngineer) filterParts.push(`AE: ${filters.assistantEngineer}`);
  const filterText = filterParts.length ? filterParts.join('  |  ') : 'All Alerts';

  addHeader(doc, 'Active Alerts Report', `${filterText}  |  Generated: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`);

  addSummaryBar(doc, [
    { label: 'Total Alerts', value: String(alerts.length) },
    { label: 'Critical',     value: String(critical.length) },
    { label: 'Warnings',     value: String(warnings.length) },
  ], 40);

  const rows = alerts.map((a, i) => [
    i + 1,
    a.type === 'danger' ? 'CRITICAL' : 'WARNING',
    a.title    || '-',
    a.projectName || '-',
    a.delayText   || '-',
    fmtDate(a.date),
  ]);

  autoTable(doc, {
    startY: 64,
    head: [['#', 'Severity', 'Alert Type', 'Project Name / Description of Work', 'Timeline Delay', 'Key Date']],
    body: rows,
    styles: { ...BS, fontSize: 8.5 },
    headStyles: { ...HS, fontSize: 8.5 },
    alternateRowStyles: AR,
    tableWidth: MW,
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 76 },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 1) {
        // Bold text only — no color fill
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [0, 0, 0];
        // Add ** prefix to distinguish visually without ink
        data.cell.raw = data.cell.raw; // keep as-is; bold + all-caps is enough
      }
      if (data.section === 'body' && data.column.index === 4) {
        const v = String(data.cell.raw || '').toLowerCase();
        if (v.startsWith('overdue') || v.startsWith('expired')) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(14, finalY, MW, 12);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text('Action Required:', 18, finalY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Please review the above alerts and take immediate action. Critical items require priority attention.', 18, finalY + 10);

  addFooter(doc, 'Active Alerts Report — CivilTrack Pro');
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPLETED WORK BY DATE RANGE PDF — A3 Landscape, Ink-Saving
//  Filters: actualDateOfCompletion within [fromDate, toDate]
// ═══════════════════════════════════════════════════════════════════════════
export function generateCompletedWorkByDateRangePDF(projects, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const W  = doc.internal.pageSize.getWidth();
  const MW = W - 24;

  const parts = [];
  if (filters.fromDate) parts.push(`From: ${fmtDate(filters.fromDate)}`);
  if (filters.toDate)   parts.push(`To: ${fmtDate(filters.toDate)}`);
  if (filters.scheme)        parts.push(`Scheme: ${filters.scheme}`);
  if (filters.constituency)  parts.push(`Constituency: ${filters.constituency}`);
  const filterText = parts.length ? parts.join('  |  ') : 'All Completed Projects';

  const totalS = projects.reduce((s, p) => s + (p.sanctionedAmount || 0), 0);
  const totalT = projects.reduce((s, p) => s + (p.tenderedCost || 0), 0);
  const totalE = projects.reduce((s, p) => s + (p.expenditureIncurred || 0), 0);
  const totalD = projects.reduce((s, p) => s + (p.deductions || 0), 0);
  const totalU = totalE + totalD;

  addHeader(doc, `Completed Work Report  —  ${filterText}`, `Total Completed Projects: ${projects.length}`);

  addSummaryBar(doc, [
    { label: 'Completed Projects', value: String(projects.length) },
    { label: 'Total Sanctioned',   value: fmtL(totalS) },
    { label: 'Total Tendered',     value: fmtL(totalT) },
    { label: 'Total Expenditure',  value: fmtL(totalE) },
    { label: 'Total Deductions',   value: fmtL(totalD) },
    { label: 'Total Utilised',     value: fmtL(totalU) },
  ], 40);

  const headers = ['#', 'Project Name', 'Category', 'Constituency', 'Scheme', 'Contractor',
    'WO Date', 'Contract Comp.', 'Actual Comp.', 'Days Diff',
    'Sanctioned\n(Cr/L)', 'Tendered\n(Cr/L)', 'Expenditure\n(Cr/L)', 'Utilised\n(Cr/L)', 'UC Date', 'Remarks'];

  const rows = projects.map((p, i) => {
    const utilised = (p.expenditureIncurred || 0) + (p.deductions || 0);
    let daysDiff = '-';
    if (p.dateOfCompletionContract && p.actualDateOfCompletion) {
      const contract = new Date(p.dateOfCompletionContract);
      const actual   = new Date(p.actualDateOfCompletion);
      const diff = Math.round((actual - contract) / (1000 * 60 * 60 * 24));
      daysDiff = diff === 0 ? 'On time' : diff > 0 ? `+${diff}d` : `${diff}d`;
    }
    return [
      i + 1,
      p.projectName || '-',
      p.category || '-',
      p.constituency || '-',
      p.scheme || '-',
      p.contractorName || '-',
      fmtDate(p.workOrderDate),
      fmtDate(p.dateOfCompletionContract),
      fmtDate(p.actualDateOfCompletion),
      daysDiff,
      fmtL(p.sanctionedAmount),
      fmtL(p.tenderedCost),
      fmtL(p.expenditureIncurred),
      fmtL(utilised),
      fmtDate(p.ucSentDate),
      p.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: 64,
    head: [headers],
    body: rows,
    styles: { ...BS, fontSize: 8, cellPadding: 2.5 },
    headStyles: { ...HS, fontSize: 8, cellPadding: 3 },
    alternateRowStyles: AR,
    tableWidth: MW,
    margin: { left: 12, right: 12 },
    columnStyles: {
      0:  { cellWidth: 8,  halign: 'center' },
      7:  { halign: 'center' },
      8:  { halign: 'center' },
      9:  { halign: 'center', fontStyle: 'bold' },
      10: { halign: 'right' },
      11: { halign: 'right' },
      12: { halign: 'right' },
      13: { halign: 'right', fontStyle: 'bold' },
      14: { halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 9) {
        const v = String(data.cell.raw || '');
        if (v.startsWith('+')) data.cell.styles.fontStyle = 'bold'; // delayed
      }
    },
  });

  addFooter(doc, `Completed Work Report  —  ${filterText}`);
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ALL WORK BY TENDERED COST RANGE PDF — A3 Landscape, Ink-Saving
//  Filters: tenderedCost within [minCost, maxCost]
// ═══════════════════════════════════════════════════════════════════════════
export function generateWorkByTenderedCostPDF(projects, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const W  = doc.internal.pageSize.getWidth();
  const MW = W - 24;

  const fmtRs = (n) => {
    if (!n) return '-';
    return `Rs.${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const parts = [];
  if (filters.minCost !== '' && filters.minCost !== undefined) parts.push(`Min: ${fmtRs(filters.minCost)}`);
  if (filters.maxCost !== '' && filters.maxCost !== undefined) parts.push(`Max: ${fmtRs(filters.maxCost)}`);
  if (filters.status)       parts.push(`Status: ${filters.status}`);
  if (filters.scheme)       parts.push(`Scheme: ${filters.scheme}`);
  if (filters.constituency) parts.push(`Constituency: ${filters.constituency}`);
  const filterText = parts.length ? parts.join('  |  ') : 'All Projects (Tendered Cost)';

  const totalS = projects.reduce((s, p) => s + (p.sanctionedAmount || 0), 0);
  const totalT = projects.reduce((s, p) => s + (p.tenderedCost || 0), 0);
  const totalE = projects.reduce((s, p) => s + (p.expenditureIncurred || 0), 0);
  const totalD = projects.reduce((s, p) => s + (p.deductions || 0), 0);
  const totalU = totalE + totalD;
  const totalBal = totalS - totalU;

  addHeader(doc, `Work Report by Tendered Cost  —  ${filterText}`, `Total Projects: ${projects.length}`);

  addSummaryBar(doc, [
    { label: 'Projects',           value: String(projects.length) },
    { label: 'Total Sanctioned',   value: fmtL(totalS) },
    { label: 'Total Tendered',     value: fmtL(totalT) },
    { label: 'Total Expenditure',  value: fmtL(totalE) },
    { label: 'Total Utilised',     value: fmtL(totalU) },
    { label: 'Total Balance',      value: fmtL(totalBal) },
  ], 40);

  const headers = ['#', 'Project Name', 'Category', 'Year', 'Constituency', 'Scheme',
    'Contractor', 'WO Date', 'Comp. Date',
    'Sanctioned\n(Cr/L)', 'Tendered\n(Cr/L)', 'Var %', 'Expenditure\n(Cr/L)',
    'Utilised\n(Cr/L)', 'Balance\n(Cr/L)', 'Status'];

  const rows = projects.map((p, i) => {
    const utilised = (p.expenditureIncurred || 0) + (p.deductions || 0);
    const balance  = (p.sanctionedAmount || 0) - utilised;
    const variation = p.sanctionedAmount && p.tenderedCost
      ? (((p.tenderedCost - p.sanctionedAmount) / p.sanctionedAmount) * 100).toFixed(1) + '%'
      : '-';
    return [
      i + 1,
      p.projectName || '-',
      p.category || '-',
      p.yearOfSanction || '-',
      p.constituency || '-',
      p.scheme || '-',
      p.contractorName || '-',
      fmtDate(p.workOrderDate),
      fmtDate(p.dateOfCompletionContract),
      fmtL(p.sanctionedAmount),
      fmtL(p.tenderedCost),
      variation,
      fmtL(p.expenditureIncurred),
      fmtL(utilised),
      fmtL(balance),
      statusLabel(p.statusOfWork),
    ];
  });

  autoTable(doc, {
    startY: 64,
    head: [headers],
    body: rows,
    styles: { ...BS, fontSize: 8, cellPadding: 2.5 },
    headStyles: { ...HS, fontSize: 8, cellPadding: 3 },
    alternateRowStyles: AR,
    tableWidth: MW,
    margin: { left: 12, right: 12 },
    columnStyles: {
      0:  { cellWidth: 8, halign: 'center' },
      3:  { cellWidth: 12, halign: 'center' },
      7:  { halign: 'center' },
      8:  { halign: 'center' },
      9:  { halign: 'right' },
      10: { halign: 'right', fontStyle: 'bold' },
      11: { halign: 'center' },
      12: { halign: 'right' },
      13: { halign: 'right', fontStyle: 'bold' },
      14: { halign: 'right' },
      15: { halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body') {
        if (data.column.index === 13 || data.column.index === 15) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  addFooter(doc, `Work Report by Tendered Cost  —  ${filterText}`);
  return doc;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
export function savePDF(doc, filename)  { doc.save(filename); }
export function sharePDF(doc, filename) {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.share && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'CivilTrack Pro Report' });
  } else {
    savePDF(doc, filename);
  }
}
