import { generateProjectListPDF } from './src/utils/pdfExport.js';
try {
  const doc = generateProjectListPDF([]);
  console.log('Success!', typeof doc.output);
} catch (e) {
  console.error('Error:', e);
}
