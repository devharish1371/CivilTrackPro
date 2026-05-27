import * as XLSX from 'xlsx';

const n = (v) => Number(v) || 0;

export function exportProjectsToExcel(projects, grants = [], filename = 'CivilTrack_Projects.xlsx', startDate = null, endDate = null) {
  const wb = XLSX.utils.book_new();

  let filteredProjects = projects;
  if (startDate || endDate) {
    filteredProjects = projects.filter(p => {
      const dt = new Date(p.updatedAt || new Date());
      if (startDate && dt < new Date(startDate)) return false;
      if (endDate && dt > new Date(endDate)) return false;
      return true;
    });
  }

  // Sheet 1: All Projects
  const main = filteredProjects.map((p, i) => ({
    'ID': p.id,
    'S.No': i+1, 'Project Name': p.projectName, 'Category': p.category||'', 'Year': p.yearOfSanction,
    'Constituency': p.constituency, 'Scheme': p.scheme,
    'GO Number': p.goNumber||'', 'GO Date': p.goDate||'',
    'Sanctioned (₹)': n(p.sanctionedAmount), 'Tendered Cost (₹)': n(p.tenderedCost),
    'Contractor': p.contractorName, 'Work Order Date': p.workOrderDate||'',
    'Start (Contract)': p.dateOfStartContract||'', 'Completion (Contract)': p.dateOfCompletionContract||'',
    'Actual Start': p.actualDateOfStart||'', 'Actual Completion': p.actualDateOfCompletion||'',
    'Performance Guarantee': p.performanceGuaranteeDate||'', 'Expiry Date': p.expiryDate||'',
    'Expenditure (₹)': n(p.expenditureIncurred), 'Deductions (₹)': n(p.deductions),
    'Utilised (₹)': n(p.expenditureIncurred) + n(p.deductions),
    'Balance (₹)': n(p.sanctionedAmount) - n(p.expenditureIncurred) - n(p.deductions),
    'Extension': p.extensionOfTime||'None',
    'Status': p.statusOfWork==='completed'?'Completed':p.statusOfWork==='in_progress'?'In Progress':'Yet to Start',
    'Progress (%)': p.progress, 'JE': p.juniorEngineer, 'AE': p.assistantEngineer,
    'UC Sent': p.ucSentDate||'', 'Security Deducted': p.securityDepositDeductedDate||'', 'Security Release': p.securityDepositReleaseDate||'',
    'Security Amount (₹)': n(p.securityAmount),
    'M Book No': p.mBookNumber||'', 'Audit Register': p.workAuditRegisterNo||'',
    'Latitude': p.latitude||'', 'Longitude': p.longitude||'',
    'Physical Parameters': p.physicalParametersNotes||'', 'Notes': p.notes||''
  }));
  const ws1 = XLSX.utils.json_to_sheet(main);
  ws1['!cols'] = Array(34).fill({ wch:16 });
  ws1['!cols'][1] = { wch:40 };
  XLSX.utils.book_append_sheet(wb, ws1, 'All Projects');

  // Sheet 2: By Scheme
  const sm = {};
  projects.forEach(p => {
    if (!sm[p.scheme]) sm[p.scheme] = { count:0, sanctioned:0, expenditure:0, grant:0, deductions:0 };
    sm[p.scheme].count++; sm[p.scheme].sanctioned += n(p.sanctionedAmount);
    sm[p.scheme].expenditure += n(p.expenditureIncurred);
    sm[p.scheme].deductions += n(p.deductions);
  });
  grants.forEach(g => {
    if (!sm[g.scheme]) sm[g.scheme] = { count:0, sanctioned:0, expenditure:0, grant:0, deductions:0 };
    sm[g.scheme].grant += n(g.amount);
  });
  const ws2 = XLSX.utils.json_to_sheet(Object.entries(sm).map(([k,v]) => ({
    'Scheme':k, 'Projects':v.count, 'Grant (₹)':v.grant, 'Sanctioned (₹)':v.sanctioned,
    'Expenditure (₹)':v.expenditure, 'Deductions (₹)':v.deductions,
    'Utilised (₹)':v.expenditure+v.deductions, 'Balance (₹)':v.sanctioned-v.expenditure-v.deductions
  })));
  XLSX.utils.book_append_sheet(wb, ws2, 'By Scheme');

  // Sheet 3: By Status
  const st = {};
  projects.forEach(p => {
    const s = p.statusOfWork;
    if (!st[s]) st[s] = { count:0, sanctioned:0, expenditure:0 };
    st[s].count++; st[s].sanctioned += n(p.sanctionedAmount); st[s].expenditure += n(p.expenditureIncurred);
  });
  const ws3 = XLSX.utils.json_to_sheet(Object.entries(st).map(([k,v]) => ({
    'Status': k==='completed'?'Completed':k==='in_progress'?'In Progress':'Yet to Start',
    'Projects':v.count, 'Sanctioned (₹)':v.sanctioned, 'Expenditure (₹)':v.expenditure, 'Balance (₹)':v.sanctioned-v.expenditure
  })));
  XLSX.utils.book_append_sheet(wb, ws3, 'By Status');

  // Sheet 4: By Constituency
  const cm = {};
  projects.forEach(p => {
    if (!cm[p.constituency]) cm[p.constituency] = { count:0, sanctioned:0, expenditure:0 };
    cm[p.constituency].count++; cm[p.constituency].sanctioned += n(p.sanctionedAmount); cm[p.constituency].expenditure += n(p.expenditureIncurred);
  });
  const ws4 = XLSX.utils.json_to_sheet(Object.entries(cm).map(([k,v]) => ({
    'Constituency':k, 'Projects':v.count, 'Sanctioned (₹)':v.sanctioned, 'Expenditure (₹)':v.expenditure, 'Balance (₹)':v.sanctioned-v.expenditure
  })));
  XLSX.utils.book_append_sheet(wb, ws4, 'By Constituency');

  XLSX.writeFile(wb, filename);
}
