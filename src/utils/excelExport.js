import * as XLSX from 'xlsx';
import { getUcSentStatus, getSecurityDepositReleaseStatus, getTotalExpenditure, getBalanceAmount } from './projectStatus';
import { REPORT_COLUMNS } from './pdfExport';

const n = (v) => Number(v) || 0;

export function exportProjectsToExcel(projects, options = {}) {
  const {
    contractors = [], engineers = [], schemes = [], constituencies = [],
    panchayats = [], grants = [], filename = 'CivilTrack_Projects.xlsx',
    startDate = null, endDate = null, columns = null
  } = options;

  const wb = XLSX.utils.book_new();

  const filterByDate = (items) => {
    if (!startDate && !endDate) return items;
    return items.filter(item => {
      const dt = new Date(item.updatedAt || new Date());
      if (startDate && dt < new Date(startDate)) return false;
      if (endDate && dt > new Date(endDate)) return false;
      return true;
    });
  };

  const filteredProjects = filterByDate(projects);
  const filteredContractors = filterByDate(contractors);
  const filteredEngineers = filterByDate(engineers);
  const filteredSchemes = filterByDate(schemes);
  const filteredConstituencies = filterByDate(constituencies);
  const filteredPanchayats = filterByDate(panchayats);
  const filteredGrants = filterByDate(grants);

  // Helper to extract values dynamically if columns are specified
  const getExcelValue = (p, colId) => {
    const totalExpenditure = getTotalExpenditure(p);
    const balance = getBalanceAmount(p);
    const variation = p.sanctionedAmount && p.tenderedCost ? (((p.tenderedCost - p.sanctionedAmount) / p.sanctionedAmount) * 100).toFixed(1) + '%' : '-';
    let daysDiff = '-';
    if (p.dateOfCompletionContract && p.actualDateOfCompletion) {
      const diff = Math.round((new Date(p.actualDateOfCompletion) - new Date(p.dateOfCompletionContract)) / (1000 * 60 * 60 * 24));
      daysDiff = diff === 0 ? 'On time' : diff > 0 ? `+${diff}d` : `${diff}d`;
    }

    switch (colId) {
      case 'projectName': return p.projectName || '';
      case 'category': return p.category || '';
      case 'yearOfSanction': return p.yearOfSanction || '';
      case 'constituency': return p.constituency || '';
      case 'villagePanchayat': return p.villagePanchayat || '';
      case 'scheme': return p.scheme || '';
      case 'phase': return p.phase || '';
      case 'contractorName': return p.contractorName || '';
      case 'workOrderDate': return p.workOrderDate || '';
      case 'completionDateContract': return p.dateOfCompletionContract || '';
      case 'actualCompletionDate': return p.actualDateOfCompletion || '';
      case 'daysDiff': return daysDiff;
      case 'sanctionedAmount': return n(p.sanctionedAmount);
      case 'tenderedCost': return n(p.tenderedCost);
      case 'tenderPercentage': return p.tenderPercentage ?? '';
      case 'expenditureSanctionAmount': return n(p.expenditureSanctionAmount);
      case 'contingencyExpenditure': return n(p.contingencyExpenditure);
      case 'variation': return variation;
      case 'expenditureIncurred': return n(p.expenditureIncurred);
      case 'utilisedAmount': return totalExpenditure;
      case 'balanceAmount': return balance;
      case 'statusOfWork': return p.statusOfWork === 'completed' ? 'Completed' : p.statusOfWork === 'in_progress' ? 'In Progress' : 'Yet to Start';
      case 'ucSentDate': return p.ucSentDate || '';
      case 'physicalParametersNotes': return p.physicalParametersNotes || '';
      case 'remarks': return p.notes || '';
      default: return '';
    }
  };

  // Sheet 1: All Projects
  let sortedProjects = [...filteredProjects];
  // Arrange projects in ascending order by project name if column selection is active
  if (columns) {
    sortedProjects.sort((a, b) => (a.projectName || '').localeCompare(b.projectName || ''));
  }

  const main = sortedProjects.map((p, i) => {
    if (columns) {
      const row = { 'S.No': i + 1 };
      columns.forEach(colId => {
        const colDef = REPORT_COLUMNS.find(c => c.id === colId);
        if (colDef) {
          row[colDef.label.replace('\n', ' ')] = getExcelValue(p, colId);
        }
      });
      return row;
    }

    return {
      'ID': p.id,
      'S.No': i+1, 'Project Name': p.projectName, 'Category': p.category||'', 'Phase': p.phase||'', 'Year': p.yearOfSanction,
      'Constituency': p.constituency, 'Village Panchayat': p.villagePanchayat||'', 'Scheme': p.scheme,
      'GO Number': p.goNumber||'', 'GO Date': p.goDate||'',
      'Technical Sanction Amount (₹)': n(p.technicalSanctionAmount), 'Technical Sanction No.': p.technicalSanctionNo||'',
      'Date of Tender': p.dateOfTender||'', 'Cost Put to Tender (₹)': n(p.costPutToTender),
      'Sanctioned (₹)': n(p.sanctionedAmount), 'Tendered Cost (₹)': n(p.tenderedCost),
      'Tender Percentage (%)': p.tenderPercentage ?? '', 'Expenditure Sanction Amount (₹)': n(p.expenditureSanctionAmount),
      'Contractor': p.contractorName, 'Work Order Date': p.workOrderDate||'',
      'Start (Contract)': p.dateOfStartContract||'', 'Completion (Contract)': p.dateOfCompletionContract||'',
      'Actual Start': p.actualDateOfStart||'', 'Actual Completion': p.actualDateOfCompletion||'',
      'Performance Guarantee': p.performanceGuaranteeDate||'', 'Expiry Date': p.expiryDate||'',
      'Expenditure on Work (₹)': n(p.expenditureIncurred), 'Contingency Expenditure (₹)': n(p.contingencyExpenditure),
      'Total Expenditure (₹)': getTotalExpenditure(p), 'Balance (₹)': getBalanceAmount(p),
      'Extension': p.extensionOfTime||'None',
      'Extended Completion Date': p.extendedCompletionDate||'',
      'Status': p.statusOfWork==='completed'?'Completed':p.statusOfWork==='in_progress'?'In Progress':'Yet to Start',
      'Progress (%)': p.progress, 'JE': p.juniorEngineer, 'AE': p.assistantEngineer,
      'UC Sent': getUcSentStatus(p), 'UC Sent Date': p.ucSentDate||'', 'SD Released': getSecurityDepositReleaseStatus(p), 'Security Deducted': p.securityDepositDeductedDate||'', 'Security Release': p.securityDepositReleaseDate||'',
      'Security Amount (₹)': n(p.securityAmount),
      'M Book No': p.mBookNumber||'', 'Audit Register': p.workAuditRegisterNo||'',
      'Latitude': p.latitude||'', 'Longitude': p.longitude||'',
      'Physical Parameters': p.physicalParametersNotes||'', 'Notes': p.notes||''
    };
  });
  const ws1 = XLSX.utils.json_to_sheet(main);
  ws1['!cols'] = Array(Object.keys(main[0] || {}).length).fill({ wch:16 });
  ws1['!cols'][1] = { wch:40 };
  XLSX.utils.book_append_sheet(wb, ws1, 'All Projects');

  // Contractors Sheet
  if (filteredContractors.length) {
    const wsContractors = XLSX.utils.json_to_sheet(filteredContractors.map(c => ({
      'ID': c.id, 'Name': c.name, 'Class': c.classOfContractor, 'Expiry Date': c.dateOfExpiry
    })));
    XLSX.utils.book_append_sheet(wb, wsContractors, 'Contractors');
  }

  // Engineers Sheet
  if (filteredEngineers.length) {
    const wsEngineers = XLSX.utils.json_to_sheet(filteredEngineers.map(e => ({
      'ID': e.id, 'Name': e.name, 'Type': e.designation || e.type || ''
    })));
    XLSX.utils.book_append_sheet(wb, wsEngineers, 'Engineers');
  }

  // Schemes Sheet
  if (filteredSchemes.length) {
    const wsSchemes = XLSX.utils.json_to_sheet(filteredSchemes.map(s => ({
      'ID': s.id, 'Name': s.name
    })));
    XLSX.utils.book_append_sheet(wb, wsSchemes, 'Schemes');
  }

  // Constituencies Sheet
  if (filteredConstituencies.length) {
    const wsConstituencies = XLSX.utils.json_to_sheet(filteredConstituencies.map(c => ({ 'ID': c.id, 'Name': c.name })));
    XLSX.utils.book_append_sheet(wb, wsConstituencies, 'Constituencies');
  }

  // Panchayats Sheet
  if (filteredPanchayats.length) {
    const wsPanchayats = XLSX.utils.json_to_sheet(filteredPanchayats.map(p => ({ 'ID': p.id, 'Name': p.name })));
    XLSX.utils.book_append_sheet(wb, wsPanchayats, 'Panchayats');
  }

  // Grants Sheet
  if (filteredGrants.length) {
    const wsGrants = XLSX.utils.json_to_sheet(filteredGrants.map(g => ({
      'ID': g.id, 'Scheme': g.scheme, 'Constituency': g.constituency || '', 'Year': g.year, 'Phase': g.phase, 'Amount (₹)': n(g.amount)
    })));
    XLSX.utils.book_append_sheet(wb, wsGrants, 'Grants');
  }

  // Summaries
  const sm = {};
  projects.forEach(p => {
    if (!sm[p.scheme]) sm[p.scheme] = { count:0, sanctioned:0, workExpenditure:0, contingencyExpenditure:0, grant:0 };
    sm[p.scheme].count++; sm[p.scheme].sanctioned += n(p.sanctionedAmount);
    sm[p.scheme].workExpenditure += n(p.expenditureIncurred);
    sm[p.scheme].contingencyExpenditure += n(p.contingencyExpenditure);
  });
  grants.forEach(g => {
    if (!sm[g.scheme]) sm[g.scheme] = { count:0, sanctioned:0, workExpenditure:0, contingencyExpenditure:0, grant:0 };
    sm[g.scheme].grant += n(g.amount);
  });
  const ws2 = XLSX.utils.json_to_sheet(Object.entries(sm).map(([k,v]) => ({
    'Scheme':k, 'Projects':v.count, 'Grant (₹)':v.grant, 'Sanctioned (₹)':v.sanctioned,
    'Expenditure on Work (₹)':v.workExpenditure, 'Contingency Expenditure (₹)':v.contingencyExpenditure,
    'Total Expenditure (₹)':v.workExpenditure+v.contingencyExpenditure,
    'Balance (₹)':v.sanctioned-v.workExpenditure-v.contingencyExpenditure
  })));
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary By Scheme');

  const st = {};
  projects.forEach(p => {
    const s = p.statusOfWork;
    if (!st[s]) st[s] = { count:0, sanctioned:0, expenditure:0 };
    st[s].count++; st[s].sanctioned += n(p.sanctionedAmount); st[s].expenditure += getTotalExpenditure(p);
  });
  const ws3 = XLSX.utils.json_to_sheet(Object.entries(st).map(([k,v]) => ({
    'Status': k==='completed'?'Completed':k==='in_progress'?'In Progress':'Yet to Start',
    'Projects':v.count, 'Sanctioned (₹)':v.sanctioned, 'Total Expenditure (₹)':v.expenditure, 'Balance (₹)':v.sanctioned-v.expenditure
  })));
  XLSX.utils.book_append_sheet(wb, ws3, 'Summary By Status');

  const cm = {};
  projects.forEach(p => {
    if (!cm[p.constituency]) cm[p.constituency] = { count:0, sanctioned:0, expenditure:0 };
    cm[p.constituency].count++; cm[p.constituency].sanctioned += n(p.sanctionedAmount); cm[p.constituency].expenditure += getTotalExpenditure(p);
  });
  const ws4 = XLSX.utils.json_to_sheet(Object.entries(cm).map(([k,v]) => ({
    'Constituency':k, 'Projects':v.count, 'Sanctioned (₹)':v.sanctioned, 'Total Expenditure (₹)':v.expenditure, 'Balance (₹)':v.sanctioned-v.expenditure
  })));
  XLSX.utils.book_append_sheet(wb, ws4, 'Summary By Constituency');

  XLSX.writeFile(wb, filename);
}

export function exportGrantsToExcel(grants, filename = 'CivilTrack_Grants.xlsx') {
  const wb = XLSX.utils.book_new();
  const data = grants.map((g, i) => ({
    'S.No': i+1,
    'Scheme': g.scheme,
    'Constituency': g.constituency || '',
    'Year': g.year,
    'Phase': g.phase || '',
    'GO Number': g.goNumber || '',
    'GO Date': g.date || '',
    'Amount (₹)': n(g.amount)
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = Array(8).fill({ wch:20 });
  XLSX.utils.book_append_sheet(wb, ws, 'Grants');
  XLSX.writeFile(wb, filename);
}
