import { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { statusOptions } from '../data/sampleData';
import {
  generateProjectListPDF,
  generateCompletedWorkByDateRangePDF,
  generateWorkByTenderedCostPDF,
  savePDF,
} from '../utils/pdfExport';
import { exportProjectsToExcel } from '../utils/excelExport';
import { downloadKML } from '../utils/kmlExport';
import { FileText, Download, Printer, MapPin, CheckCircle, IndianRupee, SlidersHorizontal } from 'lucide-react';

/* ─── tiny helpers ─────────────────────────────────────────────── */
const fmtL = (n) => {
  if (!n) return '0.00 L';
  const abs = Math.abs(Number(n));
  if (abs >= 10000000) return `${(abs / 10000000).toFixed(2)} Cr`;
  return `${(abs / 100000).toFixed(2)} L`;
};

const inDateRange = (dateStr, from, to) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(to)) return false;
  return true;
};

const inCostRange = (cost, min, max) => {
  const c = Number(cost) || 0;
  if (min !== '' && c < Number(min)) return false;
  if (max !== '' && c > Number(max)) return false;
  return true;
};

/* ─── sub-components ────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle, accent = 'var(--cyan)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, borderRadius: 8, padding: '6px 8px', display: 'flex' }}>
        <Icon size={18} style={{ color: accent }} />
      </span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function MatchBadge({ count }) {
  return (
    <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
      <strong style={{ color: 'var(--cyan)' }}>{count}</strong> project{count !== 1 ? 's' : ''} matching filters
    </div>
  );
}

function SummaryStrip({ items, accent }) {
  return (
    <div style={{
      marginTop: 16,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: 10,
    }}>
      {items.map(({ label, val }) => (
        <div key={label} style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
          <div style={{ fontWeight: 700, color: accent, fontSize: 15 }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Reports() {
  const { projects, schemes, constituencies, grants } = useProjects();
  const [toast, setToast] = useState('');

  /* ── Tab state ─────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('standard');

  /* ── Standard report filters ───────────────────────── */
  const [filters, setFilters] = useState({ year: '', scheme: '', status: '', constituency: '' });

  /* ── Completed-by-date-range filters ───────────────── */
  const [dateFilters, setDateFilters] = useState({ fromDate: '', toDate: '', scheme: '', constituency: '' });

  /* ── Tendered-cost-range filters ───────────────────── */
  const [costFilters, setCostFilters] = useState({ minCost: '', maxCost: '', scheme: '', constituency: '', status: '' });

  const years = [...new Set(projects.map(p => p.yearOfSanction))].sort((a, b) => b - a);
  const show = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  /* ── Filtered datasets ─────────────────────────────── */
  const standardFiltered = projects.filter(p => {
    if (filters.year && p.yearOfSanction !== Number(filters.year)) return false;
    if (filters.scheme && p.scheme !== filters.scheme) return false;
    if (filters.status && p.statusOfWork !== filters.status) return false;
    if (filters.constituency && p.constituency !== filters.constituency) return false;
    return true;
  });

  const completedFiltered = projects.filter(p => {
    if (p.statusOfWork !== 'completed') return false;
    if (!inDateRange(p.actualDateOfCompletion, dateFilters.fromDate, dateFilters.toDate)) return false;
    if (dateFilters.scheme && p.scheme !== dateFilters.scheme) return false;
    if (dateFilters.constituency && p.constituency !== dateFilters.constituency) return false;
    return true;
  });

  const costFiltered = projects.filter(p => {
    if (!inCostRange(p.tenderedCost, costFilters.minCost, costFilters.maxCost)) return false;
    if (costFilters.scheme && p.scheme !== costFilters.scheme) return false;
    if (costFilters.constituency && p.constituency !== costFilters.constituency) return false;
    if (costFilters.status && p.statusOfWork !== costFilters.status) return false;
    return true;
  });

  /* ── Handlers: standard ─────────────────────────────── */
  const handlePDF     = () => { savePDF(generateProjectListPDF(standardFiltered, filters), 'CivilTrack_Report.pdf'); show('PDF downloaded!'); };
  const handlePrint   = () => { const doc = generateProjectListPDF(standardFiltered, filters); const url = URL.createObjectURL(doc.output('blob')); const w = window.open(url); if (w) w.onload = () => w.print(); };
  const handleExcel   = () => { exportProjectsToExcel(standardFiltered, grants); show('Excel downloaded!'); };
  const handleKML     = () => { downloadKML(standardFiltered); show('KML downloaded!'); };

  /* ── Handlers: completed date range ───────────────── */
  const handleCompletedPDF   = () => { savePDF(generateCompletedWorkByDateRangePDF(completedFiltered, dateFilters), 'CivilTrack_CompletedWork_Report.pdf'); show('Completed Work PDF downloaded!'); };
  const handleCompletedPrint = () => { const doc = generateCompletedWorkByDateRangePDF(completedFiltered, dateFilters); const url = URL.createObjectURL(doc.output('blob')); const w = window.open(url); if (w) w.onload = () => w.print(); };
  const handleCompletedExcel = () => { exportProjectsToExcel(completedFiltered, grants); show('Excel downloaded!'); };

  /* ── Handlers: tendered cost range ────────────────── */
  const handleCostPDF   = () => { savePDF(generateWorkByTenderedCostPDF(costFiltered, costFilters), 'CivilTrack_TenderedCost_Report.pdf'); show('Tendered Cost PDF downloaded!'); };
  const handleCostPrint = () => { const doc = generateWorkByTenderedCostPDF(costFiltered, costFilters); const url = URL.createObjectURL(doc.output('blob')); const w = window.open(url); if (w) w.onload = () => w.print(); };
  const handleCostExcel = () => { exportProjectsToExcel(costFiltered, grants); show('Excel downloaded!'); };

  /* ── Tabs config ─────────────────────────────────── */
  const tabs = [
    { id: 'standard',       label: 'Standard Report',        icon: SlidersHorizontal },
    { id: 'completed_date', label: 'Completed Work by Date', icon: CheckCircle },
    { id: 'tendered_cost',  label: 'Work by Tendered Cost',  icon: IndianRupee },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1>Reports</h1><p>Generate and export filtered project reports</p></div>
      </div>

      {/* ── Tab bar ──────────────────────────────────── */}
      <div className="report-tab-bar">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`report-tab-${id}`}
            className={`report-tab-btn${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ═══ TAB 1 — STANDARD REPORT ════════════════════ */}
      {activeTab === 'standard' && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <SectionHeader icon={SlidersHorizontal} title="Report Filters" subtitle="Filter projects by year, scheme, status, or constituency" />
            </div>
            <div className="filter-bar" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">Year</label>
                <select className="form-select" value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}>
                  <option value="">All</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Scheme</label>
                <select className="form-select" value={filters.scheme} onChange={e => setFilters(f => ({ ...f, scheme: e.target.value }))}>
                  <option value="">All</option>{schemes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                  <option value="">All</option>{statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Constituency</label>
                <select className="form-select" value={filters.constituency} onChange={e => setFilters(f => ({ ...f, constituency: e.target.value }))}>
                  <option value="">All</option>{constituencies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <MatchBadge count={standardFiltered.length} />

          <div className="report-options">
            <div className="report-card" onClick={handlePDF}><FileText /><h3>Download PDF</h3><p>Full report with financial summary</p></div>
            <div className="report-card" onClick={handlePrint}><Printer /><h3>Print Report</h3><p>Open in print dialog</p></div>
            <div className="report-card" onClick={handleExcel}><Download /><h3>Export Excel</h3><p>Multi-sheet workbook</p></div>
            <div className="report-card" onClick={handleKML}><MapPin /><h3>Export KML</h3><p>Geo-tagged locations for Google Earth</p></div>
          </div>
        </>
      )}

      {/* ═══ TAB 2 — COMPLETED WORK BY DATE RANGE ══════ */}
      {activeTab === 'completed_date' && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <SectionHeader
                icon={CheckCircle}
                title="Completed Work — Date Range Filter"
                subtitle="Shows only completed projects whose actual completion date falls within the selected range"
                accent="var(--emerald)"
              />
            </div>

            <div className="report-info-banner" style={{ '--banner-color': 'var(--emerald)', '--banner-glow': 'var(--emerald-glow)' }}>
              <CheckCircle size={14} />
              Only projects with <strong style={{ marginLeft: 3 }}>Status = Completed</strong>&nbsp;
              and a recorded <strong>Actual Completion Date</strong> within your selected range will appear.
            </div>

            <div className="filter-bar" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">From Date</label>
                <input type="date" className="form-input" value={dateFilters.fromDate} onChange={e => setDateFilters(f => ({ ...f, fromDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">To Date</label>
                <input type="date" className="form-input" value={dateFilters.toDate} onChange={e => setDateFilters(f => ({ ...f, toDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Scheme</label>
                <select className="form-select" value={dateFilters.scheme} onChange={e => setDateFilters(f => ({ ...f, scheme: e.target.value }))}>
                  <option value="">All</option>{schemes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Constituency</label>
                <select className="form-select" value={dateFilters.constituency} onChange={e => setDateFilters(f => ({ ...f, constituency: e.target.value }))}>
                  <option value="">All</option>{constituencies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {completedFiltered.length > 0 && (
              <SummaryStrip accent="var(--emerald)" items={[
                { label: 'Projects',          val: completedFiltered.length },
                { label: 'Total Sanctioned',  val: fmtL(completedFiltered.reduce((s, p) => s + (p.sanctionedAmount || 0), 0)) },
                { label: 'Total Tendered',    val: fmtL(completedFiltered.reduce((s, p) => s + (p.tenderedCost || 0), 0)) },
                { label: 'Total Expenditure', val: fmtL(completedFiltered.reduce((s, p) => s + (p.expenditureIncurred || 0), 0)) },
              ]} />
            )}
          </div>

          <MatchBadge count={completedFiltered.length} />

          <div className="report-options">
            <div className="report-card report-card--emerald" onClick={handleCompletedPDF}><FileText /><h3>Download PDF</h3><p>Completed work report with timeline details</p></div>
            <div className="report-card report-card--emerald" onClick={handleCompletedPrint}><Printer /><h3>Print Report</h3><p>Open in print dialog</p></div>
            <div className="report-card report-card--emerald" onClick={handleCompletedExcel}><Download /><h3>Export Excel</h3><p>Export to spreadsheet</p></div>
          </div>
        </>
      )}

      {/* ═══ TAB 3 — ALL WORK BY TENDERED COST RANGE ══ */}
      {activeTab === 'tendered_cost' && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <SectionHeader
                icon={IndianRupee}
                title="All Work — Tendered Cost Range Filter"
                subtitle="Filter all projects whose tendered cost falls within the specified range (in Rupees)"
                accent="var(--amber)"
              />
            </div>

            <div className="report-info-banner" style={{ '--banner-color': 'var(--amber)', '--banner-glow': 'var(--amber-glow)' }}>
              <IndianRupee size={14} />
              Enter costs in <strong style={{ marginLeft: 3 }}>Rupees</strong>. Leave Min or Max blank to apply an open-ended range.
              All statuses are included unless filtered below.
            </div>

            <div className="filter-bar" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">Min Tendered Cost (₹)</label>
                <input type="number" className="form-input" placeholder="e.g. 1000000" min="0" value={costFilters.minCost} onChange={e => setCostFilters(f => ({ ...f, minCost: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Tendered Cost (₹)</label>
                <input type="number" className="form-input" placeholder="e.g. 50000000" min="0" value={costFilters.maxCost} onChange={e => setCostFilters(f => ({ ...f, maxCost: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={costFilters.status} onChange={e => setCostFilters(f => ({ ...f, status: e.target.value }))}>
                  <option value="">All</option>{statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Scheme</label>
                <select className="form-select" value={costFilters.scheme} onChange={e => setCostFilters(f => ({ ...f, scheme: e.target.value }))}>
                  <option value="">All</option>{schemes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Constituency</label>
                <select className="form-select" value={costFilters.constituency} onChange={e => setCostFilters(f => ({ ...f, constituency: e.target.value }))}>
                  <option value="">All</option>{constituencies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {costFiltered.length > 0 && (
              <SummaryStrip accent="var(--amber)" items={[
                { label: 'Projects',          val: costFiltered.length },
                { label: 'Total Tendered',    val: fmtL(costFiltered.reduce((s, p) => s + (p.tenderedCost || 0), 0)) },
                { label: 'Total Sanctioned',  val: fmtL(costFiltered.reduce((s, p) => s + (p.sanctionedAmount || 0), 0)) },
                { label: 'Total Expenditure', val: fmtL(costFiltered.reduce((s, p) => s + (p.expenditureIncurred || 0), 0)) },
                { label: 'Completed',         val: costFiltered.filter(p => p.statusOfWork === 'completed').length },
                { label: 'In Progress',       val: costFiltered.filter(p => p.statusOfWork === 'in_progress').length },
              ]} />
            )}
          </div>

          <MatchBadge count={costFiltered.length} />

          <div className="report-options">
            <div className="report-card report-card--amber" onClick={handleCostPDF}><FileText /><h3>Download PDF</h3><p>Tendered cost report with financial details</p></div>
            <div className="report-card report-card--amber" onClick={handleCostPrint}><Printer /><h3>Print Report</h3><p>Open in print dialog</p></div>
            <div className="report-card report-card--amber" onClick={handleCostExcel}><Download /><h3>Export Excel</h3><p>Export to spreadsheet</p></div>
          </div>
        </>
      )}

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
