import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

export async function importProjectsFromExcel(file, existingProjects, existingContractors, existingEngineers, existingSchemes, existingConstituencies, existingGrants) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        
        const result = {};

        // Parse Projects
        const projSheetName = wb.SheetNames.find(n => n === 'All Projects') || wb.SheetNames[0];
        const projWs = wb.Sheets[projSheetName];
        if (projWs) {
          const rows = XLSX.utils.sheet_to_json(projWs);
          result.projects = rows.map(row => {
            let id = row['ID'];
            if (!id) {
              const match = existingProjects.find(p => p.projectName === row['Project Name']);
              id = match ? match.id : uuidv4();
            }

            const statusStr = row['Status'] || '';
            const mappedStatus = statusStr === 'Completed' ? 'completed' 
                               : statusStr === 'In Progress' ? 'in_progress' 
                               : 'yet_to_start';

            return {
              id,
              projectName: row['Project Name'] || 'Unnamed Project',
              category: row['Category'] || '',
              phase: row['Phase'] || '',
              yearOfSanction: Number(row['Year']) || new Date().getFullYear(),
              constituency: row['Constituency'] || '',
              scheme: row['Scheme'] || '',
              goNumber: row['GO Number'] || '',
              goDate: row['GO Date'] || '',
              sanctionedAmount: Number(row['Sanctioned (₹)']) || 0,
              tenderedCost: Number(row['Tendered Cost (₹)']) || 0,
              contractorName: row['Contractor'] || '',
              workOrderDate: row['Work Order Date'] || '',
              dateOfStartContract: row['Start (Contract)'] || '',
              dateOfCompletionContract: row['Completion (Contract)'] || '',
              actualDateOfStart: row['Actual Start'] || '',
              actualDateOfCompletion: row['Actual Completion'] || '',
              performanceGuaranteeDate: row['Performance Guarantee'] || '',
              expiryDate: row['Expiry Date'] || '',
              expenditureIncurred: Number(row['Expenditure (₹)']) || 0,
              deductions: Number(row['Deductions (₹)']) || 0,
              extensionOfTime: row['Extension'] === 'None' ? '' : (row['Extension'] || ''),
              statusOfWork: mappedStatus,
              progress: Number(row['Progress (%)']) || 0,
              juniorEngineer: row['JE'] || '',
              assistantEngineer: row['AE'] || '',
              ucSentDate: row['UC Sent'] || '',
              securityDepositDeductedDate: row['Security Deducted'] || '',
              securityDepositReleaseDate: row['Security Release'] || '',
              securityAmount: Number(row['Security Amount (₹)']) || 0,
              mBookNumber: row['M Book No'] || '',
              workAuditRegisterNo: row['Audit Register'] || '',
              latitude: row['Latitude'] || '',
              longitude: row['Longitude'] || '',
              physicalParametersNotes: row['Physical Parameters'] || '',
              notes: row['Notes'] || '',
              updatedAt: new Date().toISOString()
            };
          });
        }

        // Parse Contractors
        if (wb.Sheets['Contractors']) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['Contractors']);
          result.contractors = rows.map(r => ({
            id: r['ID'] || uuidv4(),
            name: r['Name'],
            classOfContractor: r['Class'] || '',
            dateOfExpiry: r['Expiry Date'] || '',
            updatedAt: new Date().toISOString()
          })).filter(c => c.name);
        }

        // Parse Engineers
        if (wb.Sheets['Engineers']) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['Engineers']);
          result.engineers = rows.map(r => ({
            id: r['ID'] || uuidv4(),
            name: r['Name'],
            type: r['Type'] || 'je',
            updatedAt: new Date().toISOString()
          })).filter(e => e.name);
        }

        // Parse Schemes
        if (wb.Sheets['Schemes']) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['Schemes']);
          result.schemes = rows.map(r => ({
            id: r['ID'] || uuidv4(),
            name: r['Name'],
            updatedAt: new Date().toISOString()
          })).filter(s => s.name);
        }

        // Parse Constituencies
        if (wb.Sheets['Constituencies']) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['Constituencies']);
          result.constituencies = rows.map(r => ({
            id: r['ID'] || uuidv4(),
            name: r['Name'],
            updatedAt: new Date().toISOString()
          })).filter(c => c.name);
        }

        // Parse Grants
        if (wb.Sheets['Grants']) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets['Grants']);
          result.grants = rows.map(r => ({
            id: r['ID'] || uuidv4(),
            scheme: r['Scheme'] || '',
            constituency: r['Constituency'] || '',
            year: Number(r['Year']) || new Date().getFullYear(),
            phase: r['Phase'] || '',
            amount: Number(r['Amount (₹)']) || 0,
            updatedAt: new Date().toISOString()
          })).filter(g => g.amount > 0);
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsArrayBuffer(file);
  });
}
