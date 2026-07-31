const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
let accessToken = null;

export function getAccessToken() { return accessToken; }
export function setAccessToken(token) { accessToken = token; }

export function initGoogleAuth(clientId, callback) {
  if (!window.google?.accounts?.oauth2) {
    console.warn('Google Identity Services not loaded');
    return null;
  }
  return google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    callback: (resp) => {
      if (resp.access_token) { accessToken = resp.access_token; callback(resp); }
    },
  });
}

export function signOut() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
  }
}

async function api(endpoint, method = 'GET', body = null) {
  if (!accessToken) throw new Error('Not authenticated');
  const opts = { method, headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SHEETS_API}/${endpoint}`, opts);
  if (!res.ok) { const e = await res.text(); throw new Error(`Sheets API ${res.status}: ${e}`); }
  return res.json();
}

const PROJECT_HEADERS = [
  'ID','Project Name','Year','Constituency','Village Panchayat','Scheme','GO Date','GO Number',
  'Sanctioned Amount','Tendered Cost','Contractor','Work Order Date','Start (Contract)',
  'Completion (Contract)','Actual Start','Actual Completion','Performance Guarantee Date',
  'Expiry Date','Expenditure','Deductions','Extension of Time','Status','Progress',
  'Junior Engineer','Assistant Engineer','UC Sent Date','Security Release Date',
  'Security Amount','M Book No','Audit Register No','Latitude','Longitude','Locked','Notes'
];
const CONTRACTOR_HEADERS = ['ID','Name','Phone','Email','Address','Registration No','Category'];
const ENGINEER_HEADERS = ['ID','Name','Designation','Phone','Email','Division'];
const SCHEME_HEADERS = ['ID', 'Name'];
const CONSTITUENCY_HEADERS = ['ID', 'Name'];
const PANCHAYAT_HEADERS = ['ID', 'Name'];
const GRANT_HEADERS = ['ID', 'Scheme', 'Amount', 'Date', 'GO Number'];

export async function createSheet(title) {
  const res = await fetch(SHEETS_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: 'Projects' } },
        { properties: { title: 'Contractors' } },
        { properties: { title: 'Engineers' } },
        { properties: { title: 'Schemes' } },
        { properties: { title: 'Constituencies' } },
        { properties: { title: 'Panchayats' } },
        { properties: { title: 'Grants' } },
      ]
    })
  });
  if (!res.ok) throw new Error('Failed to create sheet');
  const data = await res.json();
  const sheetId = data.spreadsheetId;
  await api(`${sheetId}/values:batchUpdate`, 'POST', {
    valueInputOption: 'RAW',
    data: [
      { range: 'Projects!A1', values: [PROJECT_HEADERS] },
      { range: 'Contractors!A1', values: [CONTRACTOR_HEADERS] },
      { range: 'Engineers!A1', values: [ENGINEER_HEADERS] },
      { range: 'Schemes!A1', values: [SCHEME_HEADERS] },
      { range: 'Constituencies!A1', values: [CONSTITUENCY_HEADERS] },
      { range: 'Panchayats!A1', values: [PANCHAYAT_HEADERS] },
      { range: 'Grants!A1', values: [GRANT_HEADERS] },
    ]
  });
  return sheetId;
}

export async function initExistingSheet(sheetId) {
  const info = await api(`${sheetId}`);
  const existingTitles = info.sheets.map(s => s.properties.title);
  
  const required = ['Projects', 'Contractors', 'Engineers', 'Schemes', 'Constituencies', 'Panchayats', 'Grants'];
  const toCreate = required.filter(r => !existingTitles.includes(r));
  
  if (toCreate.length > 0) {
    const requests = toCreate.map(title => ({ addSheet: { properties: { title } } }));
    await api(`${sheetId}:batchUpdate`, 'POST', { requests });
  }

  await api(`${sheetId}/values:batchUpdate`, 'POST', {
    valueInputOption: 'RAW',
    data: [
      { range: 'Projects!A1', values: [PROJECT_HEADERS] },
      { range: 'Contractors!A1', values: [CONTRACTOR_HEADERS] },
      { range: 'Engineers!A1', values: [ENGINEER_HEADERS] },
      { range: 'Schemes!A1', values: [SCHEME_HEADERS] },
      { range: 'Constituencies!A1', values: [CONSTITUENCY_HEADERS] },
      { range: 'Panchayats!A1', values: [PANCHAYAT_HEADERS] },
      { range: 'Grants!A1', values: [GRANT_HEADERS] },
    ]
  });
}

function projectToRow(p) {
  return [
    p.id, p.projectName, p.yearOfSanction, p.constituency, p.villagePanchayat||'', p.scheme,
    p.goDate||'', p.goNumber||'',
    p.sanctionedAmount||0, p.tenderedCost||0, p.contractorName, p.workOrderDate||'',
    p.dateOfStartContract||'', p.dateOfCompletionContract||'',
    p.actualDateOfStart||'', p.actualDateOfCompletion||'',
    p.performanceGuaranteeDate||'', p.expiryDate||'',
    p.expenditureIncurred||0, p.deductions||0, p.extensionOfTime||'',
    p.statusOfWork, p.progress||0, p.juniorEngineer||'', p.assistantEngineer||'',
    p.ucSentDate||'', p.securityDepositReleaseDate||'', p.securityAmount||0,
    p.mBookNumber||'', p.workAuditRegisterNo||'',
    p.latitude||'', p.longitude||'', p.isLocked?'TRUE':'FALSE', p.notes||''
  ];
}

function rowToProject(row) {
  const ucCell = String(row[25] || '').trim();
  const ucCellStatus = ucCell.toLowerCase();
  const ucSentDate = ucCellStatus === 'yes' || ucCellStatus === 'no' ? '' : ucCell;
  return {
    id: row[0], projectName: row[1], yearOfSanction: Number(row[2])||0,
    constituency: row[3], villagePanchayat: row[4]||'', scheme: row[5], goDate: row[6]||'', goNumber: row[7]||'',
    sanctionedAmount: Number(row[8])||0, tenderedCost: Number(row[9])||0,
    contractorName: row[10]||'', workOrderDate: row[11]||'',
    dateOfStartContract: row[12]||'', dateOfCompletionContract: row[13]||'',
    actualDateOfStart: row[14]||'', actualDateOfCompletion: row[15]||'',
    performanceGuaranteeDate: row[16]||'', expiryDate: row[17]||'',
    expenditureIncurred: Number(row[18])||0, deductions: Number(row[19])||0,
    extensionOfTime: row[20]||'', statusOfWork: row[21]||'yet_to_start',
    progress: Number(row[22])||0, juniorEngineer: row[23]||'', assistantEngineer: row[24]||'',
    ucSent: ucCellStatus === 'yes' || (ucCell && ucCellStatus !== 'no') ? 'Yes' : 'No',
    ucSentDate, securityDepositReleaseDate: row[26]||'',
    securityAmount: Number(row[27])||0, mBookNumber: row[28]||'', workAuditRegisterNo: row[29]||'',
    latitude: Number(row[30])||0, longitude: Number(row[31])||0,
    isLocked: row[32]==='TRUE', lockHash: '', notes: row[33]||''
  };
}

export async function pushToSheet(sheetId, projects, contractors, engineers, schemes, constituencies, panchayats, grants) {
  await api(`${sheetId}/values:batchClear`, 'POST', {
    ranges: ['Projects!A2:AH10000','Contractors!A2:G10000','Engineers!A2:F10000', 'Schemes!A2:B1000', 'Constituencies!A2:B1000', 'Panchayats!A2:B1000', 'Grants!A2:E10000']
  });
  const data = [];
  if (projects.length) data.push({ range: 'Projects!A2', values: projects.map(projectToRow) });
  if (contractors.length) data.push({ range: 'Contractors!A2', values: contractors.map(c => [c.id,c.name,c.phone,c.email,c.address,c.registrationNo,c.category]) });
  if (engineers.length) data.push({ range: 'Engineers!A2', values: engineers.map(e => [e.id,e.name,e.designation,e.phone,e.email,e.division]) });
  if (schemes.length) data.push({ range: 'Schemes!A2', values: schemes.map(s => [s.id, s.name]) });
  if (constituencies.length) data.push({ range: 'Constituencies!A2', values: constituencies.map(c => [c.id, c.name]) });
  if (panchayats.length) data.push({ range: 'Panchayats!A2', values: panchayats.map(p => [p.id, p.name]) });
  if (grants.length) data.push({ range: 'Grants!A2', values: grants.map(g => [g.id, g.scheme, g.amount, g.date, g.goNumber]) });
  
  if (data.length) {
    await api(`${sheetId}/values:batchUpdate`, 'POST', { valueInputOption: 'RAW', data });
  }
}

export async function pullFromSheet(sheetId) {
  const res = await api(`${sheetId}/values:batchGet?ranges=Projects!A2:AH10000&ranges=Contractors!A2:G10000&ranges=Engineers!A2:F10000&ranges=Schemes!A2:B1000&ranges=Constituencies!A2:B1000&ranges=Panchayats!A2:B1000&ranges=Grants!A2:E10000`);
  const [pSheet, cSheet, eSheet, sSheet, conSheet, panSheet, gSheet] = res.valueRanges || [];
  const projects = (pSheet?.values || []).filter(r => r[0]).map(rowToProject);
  const contractors = (cSheet?.values || []).filter(r => r[0]).map(r => ({ id:r[0], name:r[1]||'', phone:r[2]||'', email:r[3]||'', address:r[4]||'', registrationNo:r[5]||'', category:r[6]||'' }));
  const engineers = (eSheet?.values || []).filter(r => r[0]).map(r => ({ id:r[0], name:r[1]||'', designation:r[2]||'', phone:r[3]||'', email:r[4]||'', division:r[5]||'' }));
  const schemes = (sSheet?.values || []).filter(r => r[0]).map(r => ({ id:r[0], name:r[1]||'' }));
  const constituencies = (conSheet?.values || []).filter(r => r[0]).map(r => ({ id:r[0], name:r[1]||'' }));
  const panchayats = (panSheet?.values || []).filter(r => r[0]).map(r => ({ id:r[0], name:r[1]||'' }));
  const grants = (gSheet?.values || []).filter(r => r[0]).map(r => ({ id:r[0], scheme:r[1]||'', amount:Number(r[2])||0, date:r[3]||'', goNumber:r[4]||'' }));
  return { projects, contractors, engineers, schemes, constituencies, panchayats, grants };
}
