import { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { statusOptions } from '../data/sampleData';
import { generateProjectListPDF, savePDF } from '../utils/pdfExport';
import { exportProjectsToExcel } from '../utils/excelExport';
import { downloadKML } from '../utils/kmlExport';
import { FileText, Download, Printer, MapPin } from 'lucide-react';

export default function Reports() {
  const { projects, schemes, constituencies, grants } = useProjects();
  const [filters, setFilters] = useState({ year:'', scheme:'', status:'', constituency:'' });
  const [toast, setToast] = useState('');

  const years = [...new Set(projects.map(p => p.yearOfSanction))].sort((a,b) => b-a);
  const filtered = projects.filter(p => {
    if (filters.year && p.yearOfSanction !== Number(filters.year)) return false;
    if (filters.scheme && p.scheme !== filters.scheme) return false;
    if (filters.status && p.statusOfWork !== filters.status) return false;
    if (filters.constituency && p.constituency !== filters.constituency) return false;
    return true;
  });

  const show = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };
  const handlePDF = () => { savePDF(generateProjectListPDF(filtered, filters), 'CivilTrack_Report.pdf'); show('PDF downloaded!'); };
  const handlePrint = () => {
    const doc = generateProjectListPDF(filtered, filters);
    const url = URL.createObjectURL(doc.output('blob'));
    const w = window.open(url); if (w) w.onload = () => w.print();
  };
  const handleExcel = () => { exportProjectsToExcel(filtered, grants); show('Excel downloaded!'); };
  const handleKML = () => { downloadKML(filtered); show('KML downloaded!'); };

  return (
    <div>
      <div className="page-header"><div><h1>Reports</h1><p>Generate and export filtered project reports</p></div></div>

      <div className="card" style={{ marginBottom:24 }}>
        <div className="card-header"><span className="card-title">Report Filters</span></div>
        <div className="filter-bar" style={{ marginBottom:0 }}>
          <div className="form-group"><label className="form-label">Year</label><select className="form-select" value={filters.year} onChange={e => setFilters(f => ({...f, year:e.target.value}))}><option value="">All</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Scheme</label><select className="form-select" value={filters.scheme} onChange={e => setFilters(f => ({...f, scheme:e.target.value}))}><option value="">All</option>{schemes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={filters.status} onChange={e => setFilters(f => ({...f, status:e.target.value}))}><option value="">All</option>{statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Constituency</label><select className="form-select" value={filters.constituency} onChange={e => setFilters(f => ({...f, constituency:e.target.value}))}><option value="">All</option>{constituencies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
        </div>
      </div>

      <div style={{ marginBottom:16, fontSize:13, color:'var(--text-secondary)' }}>
        <strong style={{ color:'var(--cyan)' }}>{filtered.length}</strong> projects matching filters
      </div>

      <div className="report-options">
        <div className="report-card" onClick={handlePDF}><FileText /><h3>Download PDF</h3><p>Full report with financial summary</p></div>
        <div className="report-card" onClick={handlePrint}><Printer /><h3>Print Report</h3><p>Open in print dialog</p></div>
        <div className="report-card" onClick={handleExcel}><Download /><h3>Export Excel</h3><p>Multi-sheet workbook</p></div>
        <div className="report-card" onClick={handleKML}><MapPin /><h3>Export KML</h3><p>Geo-tagged locations for Google Earth</p></div>
      </div>

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
