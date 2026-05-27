import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

export async function importProjectsFromExcel(file, existingProjects) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        
        const wsName = wb.SheetNames.find(n => n === 'All Projects') || wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        if (!ws) throw new Error("Could not find 'All Projects' sheet in Excel.");
        
        const rows = XLSX.utils.sheet_to_json(ws);
        
        const imported = rows.map(row => {
          // If ID is missing, try to match by exact Project Name, else generate new
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
        
        resolve(imported);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsArrayBuffer(file);
  });
}
