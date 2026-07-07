import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Formatters ────────────────────────────────────────────────────────────
// Full Indian currency format with Rs. prefix (avoids ₹ glyph issues in jsPDF)
const fmt = (n) => {
  if (n === null || n === undefined || n === '') return '-';
  const num = Number(n);
  if (isNaN(num)) return '-';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const formatted = abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return `${sign}Rs.${formatted}`;
};

// Compact Crores/Lakhs format for list tables
const fmtL = (n) => {
  if (n === null || n === undefined || n === '') return '-';
  const num = Number(n);
  if (isNaN(num) || num === 0) return '0.00 L';
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (absNum >= 10000000) {
    return `${sign}${(absNum / 10000000).toFixed(2)} Cr`;
  } else {
    return `${sign}${(absNum / 100000).toFixed(2)} L`;
  }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const statusLabel = (s) => s === 'completed' ? 'Completed' : s === 'in_progress' ? 'In Progress' : 'Yet to Start';

// ─── Header ─────────────────────────────────────────────────────────────────
function addHeader(doc, title, subtitle = '') {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, W, 32, 'F');
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 32, W, 1.5, 'F');

  doc.setTextColor(6, 182, 212);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CivilTrack Pro', 14, 14);

  doc.setTextColor(200, 220, 240);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 23);

  if (subtitle) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(subtitle, 14, 29);
  }

  const dateStr = `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(dateStr, W - 14, 14, { align: 'right' });
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function addFooter(doc, note = '') {
  const pages = doc.internal.getNumberOfPages();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(240, 244, 248);
    doc.rect(0, H - 13, W, 13, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`CivilTrack Pro  |  ${note || 'Confidential'}`, 14, H - 5);
    doc.text(`Page ${i} of ${pages}`, W / 2, H - 5, { align: 'center' });
    doc.text(new Date().toLocaleDateString('en-IN'), W - 14, H - 5, { align: 'right' });
  }
}

// ─── Summary bar ─────────────────────────────────────────────────────────────
function addSummaryBar(doc, items, y) {
  const W = doc.internal.pageSize.getWidth();
  const totalW = W - 28;
  const colW = totalW / items.length;
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(210, 220, 235);
  doc.roundedRect(14, y, totalW, 20, 2, 2, 'FD');
  items.forEach((item, idx) => {
    const cx = 14 + idx * colW + colW / 2;
    // Separator line
    if (idx > 0) {
      doc.setDrawColor(210, 220, 235);
      doc.line(14 + idx * colW, y + 3, 14 + idx * colW, y + 17);
    }
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, cx, y + 7, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    if (item.color) doc.setTextColor(...item.color);
    else doc.setTextColor(15, 23, 42);
    doc.text(item.value, cx, y + 15, { align: 'center' });
  });
}

// ─── Shared table styling ─────────────────────────────────────────────────────
const HS = { fillColor: [10, 15, 30], textColor: [200, 220, 240], fontStyle: 'bold', cellPadding: 3 };
const BS = { cellPadding: 3, textColor: [30, 40, 55], lineColor: [218, 226, 238], lineWidth: 0.15 };
const AR = { fillColor: [247, 250, 254] };

// ═══════════════════════════════════════════════════════════════════════════
//  PROJECT LIST PDF — Landscape A4, Single Compact Table
// ═══════════════════════════════════════════════════════════════════════════
export function generateProjectListPDF(projects, filters = {}) {
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
    { label: 'Projects', value: String(projects.length) },
    { label: 'Total Sanctioned', value: fmtL(totalS), color: [6, 182, 212] },
    { label: 'Total Expenditure', value: fmtL(totalE), color: [245, 158, 11] },
    { label: 'Total Deductions', value: fmtL(totalD), color: [245, 158, 11] },
    { label: 'Total Utilised', value: fmtL(totalU), color: [139, 92, 246] },
    { label: 'Total Balance', value: fmtL(totalBal), color: totalBal < 0 ? [244, 63, 94] : [16, 185, 129] },
  ], 37);

  const rows = projects.map((p, i) => {
    const utilised = (p.expenditureIncurred || 0) + (p.deductions || 0);
    const balance  = (p.sanctionedAmount || 0) - utilised;
    return [
      i + 1,
      p.projectName || '-',
      p.category || '-',
      p.yearOfSanction || '-',
      p.constituency || '-',
      p.scheme || '-',
      p.goNumber || '-',
      fmtL(p.sanctionedAmount),
      fmtL(p.expenditureIncurred),
      fmtL(p.deductions || 0),
      fmtL(utilised),
      fmtL(balance),
      `${p.progress || 0}%`,
      statusLabel(p.statusOfWork),
      p.juniorEngineer || '-',
      p.assistantEngineer || '-'
    ];
  });

  autoTable(doc, {
    startY: 63,
    head: [['#', 'Project Name', 'Category', 'Year', 'Constituency', 'Scheme', 'GO No', 'Sanctioned\n(Cr/L)', 'Expend.\n(Cr/L)', 'Deduct.\n(Cr/L)', 'Utilised\n(Cr/L)', 'Balance\n(Cr/L)', '%', 'Status', 'JE', 'AE']],
    body: rows,
    styles: { ...BS, fontSize: 8, cellPadding: 2.5 },
    headStyles: { ...HS, fontSize: 8, cellPadding: 3 },
    alternateRowStyles: AR,
    tableWidth: MW,
    margin: { left: 12, right: 12 },
    columnStyles: {
      0:  { cellWidth: 8,  halign: 'center' },
      1:  { cellWidth: 74 },
      2:  { cellWidth: 18 },
      3:  { cellWidth: 12, halign: 'center' },
      4:  { cellWidth: 26 },
      5:  { cellWidth: 24 },
      6:  { cellWidth: 24 },
      7:  { cellWidth: 22, halign: 'right' },
      8:  { cellWidth: 22, halign: 'right' },
      9:  { cellWidth: 18, halign: 'right' },
      10: { cellWidth: 22, halign: 'right' },
      11: { cellWidth: 22, halign: 'right' },
      12: { cellWidth: 10, halign: 'center' },
      13: { cellWidth: 22, halign: 'center' },
      14: { cellWidth: 28 },
      15: { cellWidth: 28 },
    },
    didParseCell(data) {
      if (data.section === 'body') {
        if (data.column.index === 11) {
          const raw = String(data.cell.raw || '');
          data.cell.styles.textColor = raw.startsWith('-') ? [244, 63, 94] : [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 13) {
          const v = data.cell.raw;
          if (v === 'Completed')   data.cell.styles.textColor = [16, 185, 129];
          else if (v === 'In Progress') data.cell.styles.textColor = [245, 158, 11];
          else data.cell.styles.textColor = [100, 116, 139];
        }
      }
    }
  });

  addFooter(doc, `Project Report  —  ${filterText}`);
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
//  GRANTS LIST PDF
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
    { label: 'Grants', value: String(grants.length) },
    { label: 'Total Amount', value: fmt(totalG), color: [6, 182, 212] }
  ], 37);

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
    startY: 63,
    head: [['#', 'Scheme', 'Constituency', 'Year', 'Phase', 'GO No', 'GO Date', 'Amount (₹)']],
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
//  PROJECT DETAIL PDF — Portrait A4, full-amount grid layout
// ═══════════════════════════════════════════════════════════════════════════
export function generateProjectDetailPDF(project) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const p = project;
  const W = doc.internal.pageSize.getWidth(); // 210
  const MW = W - 28;
  const utilised = (p.expenditureIncurred || 0) + (p.deductions || 0);
  const balance  = (p.sanctionedAmount || 0) - utilised;
  const pct      = p.sanctionedAmount > 0 ? Math.min(Math.round((utilised / p.sanctionedAmount) * 100), 100) : 0;

  addHeader(doc, 'Project Detail Report', p.projectName || '');

  // Status badge strip
  const sColor = p.statusOfWork === 'completed' ? [16,185,129] : p.statusOfWork === 'in_progress' ? [245,158,11] : [100,116,139];
  doc.setFillColor(...sColor);
  doc.roundedRect(14, 35, 4, 9, 1, 1, 'F');
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...sColor);
  doc.text(statusLabel(p.statusOfWork), 21, 40);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(100);
  doc.text(`Progress: ${p.progress || 0}%   |   Updated: ${p.updatedAt ? fmtDate(p.updatedAt) : '-'}`, 21, 45);

  let Y = 50;

  // Helper: render a 2-column key-value section table
  const section = (title, fields) => {
    doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(6,182,212);
    doc.text(title, 14, Y);
    doc.setFillColor(6,182,212); doc.rect(14, Y+1.2, MW, 0.5, 'F');
    Y += 5;

    const rows = [];
    for (let i = 0; i < fields.length; i += 2) {
      const L = fields[i],  R = fields[i+1];
      rows.push([ L[0], String(L[1] ?? '-'), R ? R[0] : '', R ? String(R[1] ?? '-') : '' ]);
    }

    autoTable(doc, {
      startY: Y,
      body: rows,
      styles: { fontSize: 8.5, cellPadding: { top:3, bottom:3, left:4, right:4 }, textColor:[30,40,55], lineColor:[218,226,238], lineWidth:0.15 },
      alternateRowStyles: AR,
      tableWidth: MW,
      margin: { left:14, right:14 },
      columnStyles: {
        0: { cellWidth: 44, fontStyle:'bold', textColor:[80,95,115] },
        1: { cellWidth: MW/2 - 44 },
        2: { cellWidth: 44, fontStyle:'bold', textColor:[80,95,115] },
        3: { cellWidth: MW/2 - 44 },
      },
      tableLineColor: [218,226,238],
      tableLineWidth: 0.15,
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
    ['Sanctioned Amount', fmt(p.sanctionedAmount)],
    ['Tendered Cost',     fmt(p.tenderedCost)],
    ['Expenditure Incurred', fmt(p.expenditureIncurred)],
    ['Deductions',        fmt(p.deductions || 0)],
    ['Total Utilised',    fmt(utilised)],
    ['Balance',           fmt(balance)],
    ['Security Amount',   fmt(p.securityAmount || 0)],
    ['Utilisation %',     `${pct}%`],
  ]);

  // Utilisation bar
  doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(80,95,115);
  doc.text(`Utilisation: ${pct}% of Sanctioned Amount`, 14, Y);
  Y += 3;
  doc.setFillColor(220,228,240); doc.roundedRect(14, Y, MW, 5, 1, 1, 'F');
  const barColor = pct > 90 ? [244,63,94] : pct > 60 ? [245,158,11] : [16,185,129];
  doc.setFillColor(...barColor); doc.roundedRect(14, Y, MW * pct / 100, 5, 1, 1, 'F');
  Y += 10;

  // ── 3. Timeline ───────────────────────────────────────────────────────
  section('3. TIMELINE', [
    ['Contractor',           p.contractorName],
    ['Work Order Date',      fmtDate(p.workOrderDate)],
    ['Contract Start Date',  fmtDate(p.dateOfStartContract)],
    ['Contract Completion',  fmtDate(p.dateOfCompletionContract)],
    ['Actual Start Date',    fmtDate(p.actualDateOfStart)],
    ['Actual Completion',    fmtDate(p.actualDateOfCompletion)],
    ['Extension of Time',    p.extensionOfTime || 'None'],
    ['Status',               statusLabel(p.statusOfWork)],
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

  // ── 7. Physical Parameters & Notes ────────────────────────────────────
  const writeTextBlock = (heading, text) => {
    doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(6,182,212);
    doc.text(heading, 14, Y);
    doc.setFillColor(6,182,212); doc.rect(14, Y+1.2, MW, 0.5, 'F');
    Y += 6;
    doc.setFontSize(8.5); doc.setFont('helvetica','normal'); doc.setTextColor(50);
    const lines = doc.splitTextToSize(text, MW);
    doc.text(lines, 14, Y);
    Y += lines.length * 5 + 5;
  };

  if (p.physicalParametersNotes) writeTextBlock('7. PHYSICAL PARAMETERS', p.physicalParametersNotes);
  if (p.notes) writeTextBlock('8. NOTES / REMARKS', p.notes);

  addFooter(doc, p.projectName || 'Project Detail');
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ALERTS PDF — Portrait A4
// ═══════════════════════════════════════════════════════════════════════════
export function generateAlertsPDF(alerts) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const MW = W - 28;
  const critical = alerts.filter(a => a.type === 'danger');
  const warnings  = alerts.filter(a => a.type !== 'danger');

  addHeader(doc, 'Active Alerts Report', `Action Required  |  Generated: ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}`);

  addSummaryBar(doc, [
    { label: 'Total Alerts', value: String(alerts.length) },
    { label: 'Critical',     value: String(critical.length), color: [244,63,94] },
    { label: 'Warnings',     value: String(warnings.length), color: [245,158,11] },
  ], 37);

  const rows = alerts.map((a, i) => [
    i + 1,
    a.type === 'danger' ? 'CRITICAL' : 'WARNING',
    a.title    || '-',
    a.projectName || '-',
    a.delayText   || '-',
    fmtDate(a.date),
  ]);

  autoTable(doc, {
    startY: 63,
    head: [['#', 'Severity', 'Alert Type', 'Project Name / Description of Work', 'Timeline Delay', 'Key Date']],
    body: rows,
    styles: { ...BS, fontSize: 8.5 },
    headStyles: { ...HS, fontSize: 8.5 },
    alternateRowStyles: AR,
    tableWidth: MW,
    margin: { left:14, right:14 },
    columnStyles: {
      0: { cellWidth: 8,  halign:'center' },
      1: { cellWidth: 22, halign:'center', fontStyle:'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 76 },
      4: { cellWidth: 26, halign:'center' },
      5: { cellWidth: 22, halign:'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 1) {
        if (data.cell.raw === 'CRITICAL') {
          data.cell.styles.fillColor  = [244,63,94];
          data.cell.styles.textColor  = [255,255,255];
        } else {
          data.cell.styles.fillColor  = [245,158,11];
          data.cell.styles.textColor  = [255,255,255];
        }
      }
      if (data.section === 'body' && data.column.index === 4) {
        const v = String(data.cell.raw || '').toLowerCase();
        if (v.startsWith('overdue') || v.startsWith('expired')) {
          data.cell.styles.textColor = [244,63,94];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setFillColor(254,242,242);
  doc.setDrawColor(244,63,94);
  doc.roundedRect(14, finalY, MW, 14, 2, 2, 'FD');
  doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(244,63,94);
  doc.text('Action Required:', 18, finalY + 6);
  doc.setFont('helvetica','normal'); doc.setTextColor(80);
  doc.text('Please review the above alerts and take immediate action. Critical items require priority attention.', 18, finalY + 11);

  addFooter(doc, 'Active Alerts Report — CivilTrack Pro');
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
