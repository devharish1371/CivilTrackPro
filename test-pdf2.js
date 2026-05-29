import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
try {
  const doc = new jsPDF();
  autoTable(doc, { head: [['A']], body: [['B']] });
  console.log('Success!', typeof doc.output);
} catch (e) {
  console.error('Error:', e);
}
