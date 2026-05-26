import jsPDF from 'jspdf';
import 'jspdf-autotable';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

function addHeader(doc, title) {
  doc.setFillColor(10,15,30); doc.rect(0,0,297,28,'F');
  doc.setTextColor(6,182,212); doc.setFontSize(18); doc.setFont('helvetica','bold');
  doc.text('CivilTrack Pro', 14, 14);
  doc.setTextColor(148,163,184); doc.setFontSize(10); doc.text(title, 14, 22);
  doc.setFontSize(9); doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 270, 14, { align:'right' });
}

function addFooter(doc) {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(100); doc.text(`Page ${i} of ${pages}`, doc.internal.pageSize.getWidth()/2, doc.internal.pageSize.getHeight()-8, { align:'center' }); }
}

export function generateProjectListPDF(projects, filters = {}) {
  const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
  let filterText = 'All Projects';
  const parts = [];
  if (filters.year) parts.push(`Year: ${filters.year}`);
  if (filters.scheme) parts.push(`Scheme: ${filters.scheme}`);
  if (filters.status) parts.push(`Status: ${filters.status}`);
  if (filters.constituency) parts.push(`Constituency: ${filters.constituency}`);
  if (parts.length) filterText = parts.join(' | ');
  addHeader(doc, `Project Report — ${filterText}`);

  const rows = projects.map((p, i) => {
    const utilised = (p.expenditureIncurred||0) + (p.deductions||0);
    return [
      i+1, p.projectName, p.category||'', p.yearOfSanction, p.constituency, p.scheme,
      p.goNumber||'', fmt(p.sanctionedAmount),
      fmt(p.expenditureIncurred), fmt(p.deductions||0), fmt(utilised),
      fmt(p.sanctionedAmount - utilised), `${p.progress}%`,
      p.statusOfWork==='completed'?'Completed':p.statusOfWork==='in_progress'?'In Progress':'Yet to Start',
      p.juniorEngineer, p.assistantEngineer
    ];
  });

  doc.autoTable({
    startY: 32,
    head: [['#','Project','Category','Year','Constituency','Scheme','GO No','Sanctioned','Expenditure','Deductions','Utilised','Balance','Progress','Status','JE','AE']],
    body: rows,
    styles: { fontSize:6.5, cellPadding:2, textColor:[30,30,30] },
    headStyles: { fillColor:[10,15,30], textColor:[200,220,240], fontSize:6.5 },
    alternateRowStyles: { fillColor:[240,245,250] },
    columnStyles: { 1:{ cellWidth:30 }, 2:{ cellWidth:15 }, 7:{halign:'right'}, 8:{halign:'right'}, 9:{halign:'right'}, 10:{halign:'right'}, 11:{halign:'right'} },
  });

  const totalS = projects.reduce((s,p) => s+(p.sanctionedAmount||0), 0);
  const totalE = projects.reduce((s,p) => s+(p.expenditureIncurred||0), 0);
  const totalD = projects.reduce((s,p) => s+(p.deductions||0), 0);
  const y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10); doc.setTextColor(30); doc.setFont('helvetica','bold'); doc.text('Summary', 14, y);
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  doc.text(`Projects: ${projects.length}  |  Sanctioned: ${fmt(totalS)}  |  Expenditure: ${fmt(totalE)}  |  Deductions: ${fmt(totalD)}  |  Balance: ${fmt(totalS-totalE-totalD)}`, 14, y+6);
  addFooter(doc);
  return doc;
}

export function generateProjectDetailPDF(project) {
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const p = project;
  addHeader(doc, `Project Detail — ${p.projectName}`);

  let y = 36;
  const section = (title, fields) => {
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(6,182,212);
    doc.text(title, 14, y); y += 6;
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(60);
    fields.forEach(([label, value]) => {
      doc.setFont('helvetica','bold'); doc.text(`${label}:`, 14, y);
      doc.setFont('helvetica','normal'); doc.text(String(value||'—'), 75, y); y += 5;
    });
    y += 4;
  };

  const utilised = (p.expenditureIncurred||0) + (p.deductions||0);
  section('Project Information', [
    ['Project Name', p.projectName], ['Category', p.category], ['Year', p.yearOfSanction], ['Constituency', p.constituency],
    ['Scheme', p.scheme], ['GO Number', p.goNumber], ['GO Date', fmtDate(p.goDate)],
    ['Contractor', p.contractorName], ['Status', p.statusOfWork], ['Progress', `${p.progress}%`],
  ]);
  section('Financial', [
    ['Sanctioned', fmt(p.sanctionedAmount)],
    ['Tendered Cost', fmt(p.tenderedCost)], ['Expenditure', fmt(p.expenditureIncurred)],
    ['Deductions', fmt(p.deductions||0)], ['Utilised', fmt(utilised)],
    ['Balance', fmt(p.sanctionedAmount - utilised)],
  ]);
  section('Timeline', [
    ['Work Order', fmtDate(p.workOrderDate)], ['Start (Contract)', fmtDate(p.dateOfStartContract)],
    ['Completion (Contract)', fmtDate(p.dateOfCompletionContract)],
    ['Actual Start', fmtDate(p.actualDateOfStart)], ['Actual Completion', fmtDate(p.actualDateOfCompletion)],
    ['Extension', p.extensionOfTime||'None'],
  ]);
  section('Physical Parameters', [
    ['UC Sent On', fmtDate(p.ucSentDate)], ['Security Release', fmtDate(p.securityDepositReleaseDate)],
    ['Security Deducted On', fmtDate(p.securityDepositDeductedDate)],
    ['Security Amount', fmt(p.securityAmount||0)], ['M Book No', p.mBookNumber],
    ['Audit Register No', p.workAuditRegisterNo],
  ]);
  section('Guarantee & Personnel', [
    ['Performance Guarantee', fmtDate(p.performanceGuaranteeDate)], ['Expiry Date', fmtDate(p.expiryDate)],
    ['Junior Engineer', p.juniorEngineer], ['Assistant Engineer', p.assistantEngineer],
  ]);
  if (p.latitude && p.longitude) section('Location', [['Coordinates', `${p.latitude}, ${p.longitude}`]]);
  if (p.notes) section('Notes', [['', p.notes]]);
  addFooter(doc);
  return doc;
}

export function savePDF(doc, filename) { doc.save(filename); }
export function sharePDF(doc, filename) {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type:'application/pdf' });
  if (navigator.share && navigator.canShare({ files:[file] })) navigator.share({ files:[file], title:'CivilTrack Pro Report' });
  else savePDF(doc, filename);
}
