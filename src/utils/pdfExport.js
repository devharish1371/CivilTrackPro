import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Formatters ────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const statusLabel = (s) => s === 'completed' ? 'Completed' : s === 'in_progress' ? 'In Progress' : 'Yet to Start';

// ─── Header / Footer ────────────────────────────────────────────────────────
function addHeader(doc, title, subtitle = '') {
  const W = doc.internal.pageSize.getWidth();
  // Dark navy banner
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, W, 30, 'F');
  // Cyan accent bar
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 30, W, 1.5, 'F');
  // Logo text
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CivilTrack Pro', 14, 14);
  // Title
  doc.setTextColor(200, 220, 240);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 23);
  if (subtitle) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(subtitle, 14, 28);
  }
  // Date top-right
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, W - 14, 14, { align: 'right' });
}

function addFooter(doc, extraNote = '') {
  const pages = doc.internal.getNumberOfPages();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(240, 244, 248);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.text(`CivilTrack Pro  |  ${extraNote || 'Confidential Report'}`, 14, H - 4.5);
    doc.text(`Page ${i} of ${pages}`, W / 2, H - 4.5, { align: 'center' });
    doc.text(new Date().toLocaleDateString('en-IN'), W - 14, H - 4.5, { align: 'right' });
  }
}

// ─── Summary box ────────────────────────────────────────────────────────────
function addSummaryBox(doc, items, startY) {
  const W = doc.internal.pageSize.getWidth();
  const colW = (W - 28) / items.length;
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(220, 228, 240);
  doc.roundedRect(14, startY, W - 28, 18, 2, 2, 'FD');
  items.forEach((item, idx) => {
    const x = 14 + idx * colW + colW / 2;
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x, startY + 5.5, { align: 'center' });
    doc.setFontSize(9.5);
    doc.setTextColor(item.color ? item.color[0] : 15, item.color ? item.color[1] : 23, item.color ? item.color[2] : 42);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x, startY + 13.5, { align: 'center' });
  });
}

// ─── Shared table styles ─────────────────────────────────────────────────────
const headStyles = { fillColor: [10, 15, 30], textColor: [200, 220, 240], fontStyle: 'bold', fontSize: 7.5, cellPadding: 3 };
const bodyStyles = { fontSize: 7.5, cellPadding: 3, textColor: [30, 40, 50], lineColor: [220, 228, 240], lineWidth: 0.1 };
const altRowStyles = { fillColor: [247, 250, 253] };

// ═══════════════════════════════════════════════════════════════════════════
//  1. PROJECT LIST PDF  (landscape A4, 2-table approach: info + financials)
// ═══════════════════════════════════════════════════════════════════════════
export function generateProjectListPDF(projects, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(); // 297

  // Filter label
  const parts = [];
  if (filters.year) parts.push(`Year: ${filters.year}`);
  if (filters.scheme) parts.push(`Scheme: ${filters.scheme}`);
  if (filters.status) parts.push(`Status: ${filters.status}`);
  if (filters.constituency) parts.push(`Constituency: ${filters.constituency}`);
  const filterText = parts.length ? parts.join('  |  ') : 'All Projects';

  // ── PAGE 1: Project / Scheme Info ──────────────────────────────────────
  addHeader(doc, `Project Report — ${filterText}`, `Total Projects: ${projects.length}`);

  const infoRows = projects.map((p, i) => [
    i + 1,
    p.projectName || '—',
    p.category || '—',
    p.yearOfSanction || '—',
    p.constituency || '—',
    p.scheme || '—',
    p.goNumber || '—',
    fmtDate(p.goDate),
    p.contractorName || '—',
    statusLabel(p.statusOfWork),
    `${p.progress || 0}%`,
    p.juniorEngineer || '—',
    p.assistantEngineer || '—',
  ]);

  autoTable(doc, {
    startY: 36,
    head: [['#', 'Project Name', 'Category', 'Year', 'Constituency', 'Scheme', 'GO No', 'GO Date', 'Contractor', 'Status', 'Progress', 'Jr. Engineer', 'Asst. Engineer']],
    body: infoRows,
    styles: bodyStyles,
    headStyles,
    alternateRowStyles: altRowStyles,
    tableWidth: W - 28,
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 62 },   // Project Name — wider
      2: { cellWidth: 16 },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
      6: { cellWidth: 22 },
      7: { cellWidth: 20 },
      8: { cellWidth: 22 },
      9: { cellWidth: 18, halign: 'center' },
      10: { cellWidth: 14, halign: 'center' },
      11: { cellWidth: 20 },
      12: { cellWidth: 20 },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 9) {
        const v = data.cell.raw;
        if (v === 'Completed') data.cell.styles.textColor = [16, 185, 129];
        else if (v === 'In Progress') data.cell.styles.textColor = [245, 158, 11];
        else data.cell.styles.textColor = [100, 116, 139];
      }
    }
  });

  // ── PAGE 2: Financial Summary ──────────────────────────────────────────
  doc.addPage();
  addHeader(doc, `Financial Summary — ${filterText}`, `Total Projects: ${projects.length}`);

  const totalS = projects.reduce((s, p) => s + (p.sanctionedAmount || 0), 0);
  const totalE = projects.reduce((s, p) => s + (p.expenditureIncurred || 0), 0);
  const totalD = projects.reduce((s, p) => s + (p.deductions || 0), 0);
  const totalU = totalE + totalD;

  // Summary strip
  addSummaryBox(doc, [
    { label: 'Total Projects', value: String(projects.length) },
    { label: 'Total Sanctioned', value: fmt(totalS), color: [6, 182, 212] },
    { label: 'Total Expenditure', value: fmt(totalE), color: [245, 158, 11] },
    { label: 'Total Deductions', value: fmt(totalD), color: [245, 158, 11] },
    { label: 'Total Utilised', value: fmt(totalU), color: [139, 92, 246] },
    { label: 'Balance', value: fmt(totalS - totalU), color: totalS - totalU < 0 ? [244, 63, 94] : [16, 185, 129] },
  ], 36);

  const finRows = projects.map((p, i) => {
    const utilised = (p.expenditureIncurred || 0) + (p.deductions || 0);
    const balance = (p.sanctionedAmount || 0) - utilised;
    return [
      i + 1,
      p.projectName || '—',
      p.constituency || '—',
      p.scheme || '—',
      fmt(p.sanctionedAmount),
      fmt(p.tenderedCost),
      fmt(p.expenditureIncurred),
      fmt(p.deductions || 0),
      fmt(utilised),
      fmt(balance),
      `${p.progress || 0}%`,
      statusLabel(p.statusOfWork),
    ];
  });

  autoTable(doc, {
    startY: 60,
    head: [['#', 'Project Name', 'Constituency', 'Scheme', 'Sanctioned (₹)', 'Tendered (₹)', 'Expenditure (₹)', 'Deductions (₹)', 'Utilised (₹)', 'Balance (₹)', 'Progress', 'Status']],
    body: finRows,
    styles: bodyStyles,
    headStyles,
    alternateRowStyles: altRowStyles,
    tableWidth: W - 28,
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 62 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18 },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 26, halign: 'right' },
      9: { cellWidth: 26, halign: 'right' },
      10: { cellWidth: 12, halign: 'center' },
      11: { cellWidth: 18, halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body') {
        // Balance column — color red if negative
        if (data.column.index === 9) {
          const raw = data.cell.raw;
          if (raw && raw.toString().startsWith('-')) data.cell.styles.textColor = [244, 63, 94];
          else data.cell.styles.textColor = [16, 185, 129];
        }
        if (data.column.index === 11) {
          const v = data.cell.raw;
          if (v === 'Completed') data.cell.styles.textColor = [16, 185, 129];
          else if (v === 'In Progress') data.cell.styles.textColor = [245, 158, 11];
          else data.cell.styles.textColor = [100, 116, 139];
        }
      }
    }
  });

  addFooter(doc, `Project Report — ${filterText}`);
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
//  2. PROJECT DETAIL PDF  (portrait A4, grid layout with tables per section)
// ═══════════════════════════════════════════════════════════════════════════
export function generateProjectDetailPDF(project) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const p = project;
  const W = doc.internal.pageSize.getWidth(); // 210
  const utilised = (p.expenditureIncurred || 0) + (p.deductions || 0);
  const balance = (p.sanctionedAmount || 0) - utilised;

  addHeader(doc, 'Project Detail Report', p.projectName || '');

  // Status + progress strip
  const statusColor = p.statusOfWork === 'completed' ? [16, 185, 129] : p.statusOfWork === 'in_progress' ? [245, 158, 11] : [100, 116, 139];
  doc.setFillColor(...statusColor);
  doc.rect(14, 34, 4, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...statusColor);
  doc.text(statusLabel(p.statusOfWork), 21, 39);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Progress: ${p.progress || 0}%`, 21, 44);

  let currentY = 48;

  // Helper: 2-column table section
  const sectionTable = (title, fields) => {
    // Section heading
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 182, 212);
    doc.text(title, 14, currentY);
    doc.setFillColor(6, 182, 212);
    doc.rect(14, currentY + 1, W - 28, 0.4, 'F');
    currentY += 5;

    // Build rows in pairs (2 label-value per row)
    const rows = [];
    for (let i = 0; i < fields.length; i += 2) {
      const left = fields[i];
      const right = fields[i + 1];
      rows.push([
        left[0], left[1],
        right ? right[0] : '', right ? right[1] : ''
      ]);
    }

    autoTable(doc, {
      startY: currentY,
      body: rows,
      styles: { fontSize: 8, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, textColor: [30, 40, 50] },
      alternateRowStyles: { fillColor: [247, 250, 253] },
      tableWidth: W - 28,
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold', textColor: [80, 95, 115] },
        1: { cellWidth: (W - 28) / 2 - 40 },
        2: { cellWidth: 40, fontStyle: 'bold', textColor: [80, 95, 115] },
        3: { cellWidth: (W - 28) / 2 - 40 },
      },
      tableLineColor: [220, 228, 240],
      tableLineWidth: 0.1,
    });
    currentY = doc.lastAutoTable.finalY + 5;
  };

  // ── Section 1: Sanction & GO ──────────────────────────────────────────
  sectionTable('SANCTION & GO DETAILS', [
    ['Project Name', p.projectName || '—'],
    ['Year of Sanction', p.yearOfSanction || '—'],
    ['Constituency', p.constituency || '—'],
    ['Scheme', p.scheme || '—'],
    ['Category', p.category || '—'],
    ['Phase', p.phase || '—'],
    ['GO Number', p.goNumber || '—'],
    ['GO Date', fmtDate(p.goDate)],
  ]);

  // ── Section 2: Financial ──────────────────────────────────────────────
  sectionTable('FINANCIAL DETAILS', [
    ['Sanctioned Amount', fmt(p.sanctionedAmount)],
    ['Tendered Cost', fmt(p.tenderedCost)],
    ['Expenditure Incurred', fmt(p.expenditureIncurred)],
    ['Deductions', fmt(p.deductions || 0)],
    ['Total Utilised', fmt(utilised)],
    ['Balance', fmt(balance)],
  ]);

  // Utilisation bar
  if (p.sanctionedAmount > 0) {
    const pct = Math.min(Math.round((utilised / p.sanctionedAmount) * 100), 100);
    doc.setFontSize(7.5);
    doc.setTextColor(80, 95, 115);
    doc.setFont('helvetica', 'bold');
    doc.text(`Utilisation: ${pct}%`, 14, currentY);
    currentY += 3;
    const barW = W - 28;
    doc.setFillColor(220, 228, 240);
    doc.roundedRect(14, currentY, barW, 4, 1, 1, 'F');
    const barColor = pct > 90 ? [244, 63, 94] : pct > 60 ? [245, 158, 11] : [16, 185, 129];
    doc.setFillColor(...barColor);
    doc.roundedRect(14, currentY, barW * pct / 100, 4, 1, 1, 'F');
    currentY += 9;
  }

  // ── Section 3: Timeline ───────────────────────────────────────────────
  sectionTable('TIMELINE', [
    ['Contractor', p.contractorName || '—'],
    ['Work Order Date', fmtDate(p.workOrderDate)],
    ['Contract Start', fmtDate(p.dateOfStartContract)],
    ['Contract Completion', fmtDate(p.dateOfCompletionContract)],
    ['Actual Start', fmtDate(p.actualDateOfStart)],
    ['Actual Completion', fmtDate(p.actualDateOfCompletion)],
    ['Extension of Time', p.extensionOfTime || 'None'],
    ['Status', statusLabel(p.statusOfWork)],
  ]);

  // ── Section 4: Guarantee & Personnel ─────────────────────────────────
  sectionTable('GUARANTEE & PERSONNEL', [
    ['Performance Guarantee', fmtDate(p.performanceGuaranteeDate)],
    ['Expiry Date', fmtDate(p.expiryDate)],
    ['Junior Engineer', p.juniorEngineer || '—'],
    ['Assistant Engineer', p.assistantEngineer || '—'],
  ]);

  // ── Section 5: Security Deposit ───────────────────────────────────────
  sectionTable('SECURITY DEPOSIT', [
    ['Security Amount', fmt(p.securityAmount || 0)],
    ['Security Deducted On', fmtDate(p.securityDepositDeductedDate)],
    ['Security Release Date', fmtDate(p.securityDepositReleaseDate)],
    ['UC Sent On', fmtDate(p.ucSentDate)],
    ['M Book Number', p.mBookNumber || '—'],
    ['Audit Register No', p.workAuditRegisterNo || '—'],
  ]);

  // ── Section 6: Location ───────────────────────────────────────────────
  if (p.latitude && p.longitude && Number(p.latitude) !== 0) {
    sectionTable('GEO-LOCATION', [
      ['Latitude', p.latitude],
      ['Longitude', p.longitude],
      ['Coordinates', `${p.latitude}, ${p.longitude}`],
    ]);
  }

  // ── Section 7: Physical Parameters & Notes ────────────────────────────
  if (p.physicalParametersNotes || p.notes) {
    const textSections = [];
    if (p.physicalParametersNotes) {
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(6, 182, 212);
      doc.text('PHYSICAL PARAMETERS', 14, currentY);
      doc.setFillColor(6, 182, 212); doc.rect(14, currentY + 1, W - 28, 0.4, 'F');
      currentY += 6;
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(50);
      const lines = doc.splitTextToSize(p.physicalParametersNotes, W - 28);
      doc.text(lines, 14, currentY);
      currentY += lines.length * 4 + 5;
    }
    if (p.notes) {
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(6, 182, 212);
      doc.text('NOTES / REMARKS', 14, currentY);
      doc.setFillColor(6, 182, 212); doc.rect(14, currentY + 1, W - 28, 0.4, 'F');
      currentY += 6;
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(50);
      const lines = doc.splitTextToSize(p.notes, W - 28);
      doc.text(lines, 14, currentY);
    }
  }

  addFooter(doc, p.projectName || 'Project Detail');
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
//  3. ALERTS PDF  (portrait A4, clean action-ready layout)
// ═══════════════════════════════════════════════════════════════════════════
export function generateAlertsPDF(alerts) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const critical = alerts.filter(a => a.type === 'danger');
  const warnings = alerts.filter(a => a.type !== 'danger');

  addHeader(doc, 'Active Alerts Report', `Requires Immediate Action — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`);

  // Summary strip
  addSummaryBox(doc, [
    { label: 'Total Alerts', value: String(alerts.length) },
    { label: 'Critical', value: String(critical.length), color: [244, 63, 94] },
    { label: 'Warnings', value: String(warnings.length), color: [245, 158, 11] },
  ], 36);

  const rows = alerts.map((a, i) => [
    i + 1,
    a.type === 'danger' ? 'CRITICAL' : 'WARNING',
    a.title || '—',
    a.projectName || '—',
    a.delayText || '—',
    fmtDate(a.date),
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['#', 'Severity', 'Alert Type', 'Project Name / Work', 'Timeline Delay', 'Date']],
    body: rows,
    styles: { ...bodyStyles, fontSize: 8.5, cellPadding: 3.5 },
    headStyles: { ...headStyles, fontSize: 8.5 },
    alternateRowStyles: altRowStyles,
    tableWidth: W - 28,
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 76 },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 1) {
        if (data.cell.raw === 'CRITICAL') {
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fillColor = [244, 63, 94];
        } else {
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fillColor = [245, 158, 11];
        }
      }
      // Highlight delay in red if overdue
      if (data.section === 'body' && data.column.index === 4) {
        const v = String(data.cell.raw || '');
        if (v.toLowerCase().startsWith('overdue') || v.toLowerCase().startsWith('expired')) {
          data.cell.styles.textColor = [244, 63, 94];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 8;
  // Note box
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(244, 63, 94);
  doc.roundedRect(14, finalY, W - 28, 14, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(244, 63, 94);
  doc.text('⚠ Action Required:', 18, finalY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('Please review the above alerts and take appropriate action. Critical items require immediate attention.', 18, finalY + 11);

  addFooter(doc, 'Active Alerts — CivilTrack Pro');
  return doc;
}

// ─── Export helpers ──────────────────────────────────────────────────────────
export function savePDF(doc, filename) { doc.save(filename); }
export function sharePDF(doc, filename) {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.share && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'CivilTrack Pro Report' });
  } else {
    savePDF(doc, filename);
  }
}
