import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { statusOptions } from '../data/sampleData';
import { v4 as uuidv4 } from 'uuid';
import { Save, ArrowLeft, MapPin, IndianRupee, AlertTriangle, Calendar, Users, FileText } from 'lucide-react';

const empty = {
  projectName:'', yearOfSanction:new Date().getFullYear(), constituency:'', scheme:'',
  goDate:'', goNumber:'',
  sanctionedAmount:'', tenderedCost:'', contractorName:'', workOrderDate:'',
  dateOfStartContract:'', dateOfCompletionContract:'', actualDateOfStart:'',
  actualDateOfCompletion:'', performanceGuaranteeDate:'', expiryDate:'',
  expenditureIncurred:'', deductions:'',
  extensionOfTime:'', statusOfWork:'yet_to_start', progress:0,
  juniorEngineer:'', assistantEngineer:'',
  ucSentDate:'', securityDepositReleaseDate:'', securityDepositDeductedDate:'', securityAmount:'',
  mBookNumber:'', workAuditRegisterNo:'', category:'', phase:'',
  latitude:'', longitude:'', physicalParametersNotes:'', isLocked:false, lockHash:'', notes:''
};

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n);

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { projects, contractors, engineers, schemes, constituencies, grants, categories, dispatch } = useProjects();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');
  const [dateWarnings, setDateWarnings] = useState([]);

  const jeList = engineers.filter(e => e.designation === 'Junior Engineer');
  const aeList = engineers.filter(e => e.designation === 'Assistant Engineer');

  useEffect(() => {
    if (isEdit) {
      const ex = projects.find(p => p.id === id);
      if (ex) {
        if (ex.isLocked) { navigate('/projects'); return; }
        setForm({ ...ex, physicalParametersNotes: ex.physicalParametersNotes || '' });
      } else navigate('/projects');
    }
  }, [id, isEdit]);

  const set = (f, v) => { setForm(x => ({...x, [f]:v})); if (errors[f]) setErrors(e => ({...e, [f]:''})); };

  // Date validation
  const validateDates = (formData) => {
    const warnings = [];
    const d = (key) => formData[key] ? new Date(formData[key]) : null;

    const startContract = d('dateOfStartContract');
    const completionContract = d('dateOfCompletionContract');
    const actualStart = d('actualDateOfStart');
    const actualCompletion = d('actualDateOfCompletion');
    const workOrder = d('workOrderDate');
    const goDate = d('goDate');

    if (goDate && workOrder && workOrder < goDate) warnings.push('Work Order Date is before GO Date');
    if (workOrder && startContract && startContract < workOrder) warnings.push('Contract Start Date is before Work Order Date');
    if (startContract && completionContract && completionContract < startContract) warnings.push('Contract Completion Date is before Contract Start Date');
    if (actualStart && actualCompletion && actualCompletion < actualStart) warnings.push('Actual Completion is before Actual Start Date');
    if (startContract && actualStart && actualStart < startContract) warnings.push('Actual Start is before Contract Start Date');

    const secDeducted = d('securityDepositDeductedDate');
    const secRelease = d('securityDepositReleaseDate');
    if (secDeducted && secRelease && secRelease < secDeducted) warnings.push('Security Release Date is before Deducted Date');

    const perfGuarantee = d('performanceGuaranteeDate');
    const expiry = d('expiryDate');
    if (perfGuarantee && expiry && expiry < perfGuarantee) warnings.push('Expiry Date is before Performance Guarantee Date');

    return warnings;
  };

  useEffect(() => {
    setDateWarnings(validateDates(form));
  }, [form.goDate, form.workOrderDate, form.dateOfStartContract, form.dateOfCompletionContract,
      form.actualDateOfStart, form.actualDateOfCompletion, form.securityDepositDeductedDate,
      form.securityDepositReleaseDate, form.performanceGuaranteeDate, form.expiryDate]);

  const validate = () => {
    const e = {};
    if (!form.projectName.trim()) e.projectName = 'Required';
    if (!form.constituency) e.constituency = 'Required';
    if (!form.scheme) e.scheme = 'Required';
    if (!form.sanctionedAmount || Number(form.sanctionedAmount) <= 0) e.sanctionedAmount = 'Enter valid amount';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    if (dateWarnings.length > 0) {
      if (!confirm(`Date warnings:\n\n${dateWarnings.map(w => '⚠ ' + w).join('\n')}\n\nDo you still want to save?`)) return;
    }
    const data = { ...form, id: isEdit ? id : uuidv4(),
      sanctionedAmount:Number(form.sanctionedAmount)||0, tenderedCost:Number(form.tenderedCost)||0,
      expenditureIncurred:Number(form.expenditureIncurred)||0, progress:Number(form.progress)||0,
      yearOfSanction:Number(form.yearOfSanction)||new Date().getFullYear(),
      deductions:Number(form.deductions)||0,
      securityAmount:Number(form.securityAmount)||0,
      latitude:Number(form.latitude)||0, longitude:Number(form.longitude)||0,
    };
    dispatch({ type: isEdit ? 'UPDATE_PROJECT' : 'ADD_PROJECT', payload: data });
    setToast(isEdit ? 'Updated!' : 'Created!');
    setTimeout(() => navigate(isEdit ? `/projects/${id}` : '/projects'), 1000);
  };

  const getLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      pos => { set('latitude', pos.coords.latitude.toFixed(6)); set('longitude', pos.coords.longitude.toFixed(6)); },
      () => alert('Location access denied')
    );
  };

  const sanctioned = Number(form.sanctionedAmount)||0;
  const expenditure = Number(form.expenditureIncurred)||0;
  const deductions = Number(form.deductions)||0;
  const utilised = expenditure + deductions;
  const balance = sanctioned - utilised;
  const utilisationPct = sanctioned > 0 ? Math.round((utilised / sanctioned) * 100) : 0;

  const schemeGrantTotal = grants.filter(g => g.scheme === form.scheme).reduce((sum, g) => sum + (g.amount || 0), 0);
  const schemeProjectTotal = projects.filter(p => p.scheme === form.scheme && p.id !== id).reduce((sum, p) => sum + (p.sanctionedAmount || 0), 0);
  const schemeAvailable = schemeGrantTotal - schemeProjectTotal - sanctioned;

  const E = ({f}) => errors[f] ? <span style={{ color:'var(--rose)', fontSize:11 }}>{errors[f]}</span> : null;

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button className="btn btn-secondary btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <div><h1>{isEdit ? 'Edit Project' : 'Add New Project'}</h1><p>{isEdit ? 'Update project details' : 'Fill in project information'}</p></div>
        </div>
      </div>

      {/* Date Warnings */}
      {dateWarnings.length > 0 && (
        <div className="card" style={{ marginBottom:16, borderColor:'var(--amber)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <AlertTriangle size={16} style={{ color:'var(--amber)' }} />
            <span style={{ fontWeight:600, color:'var(--amber)' }}>Date Warnings</span>
          </div>
          {dateWarnings.map((w, i) => (
            <div key={i} style={{ fontSize:12, color:'var(--amber)', padding:'2px 0', paddingLeft:24 }}>⚠ {w}</div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1. Sanction / GO Details */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">Sanction & GO Details</span></div>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Project Name *</label>
              <input className="form-input" value={form.projectName} onChange={e => set('projectName', e.target.value)} placeholder="e.g. Construction of Bridge over River" />
              <E f="projectName" />
            </div>
            <div className="form-group">
              <label className="form-label">Year of Sanction</label>
              <input className="form-input" type="number" value={form.yearOfSanction} onChange={e => set('yearOfSanction', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Constituency *</label>
              <input className="form-input" list="constituency-list" value={form.constituency} onChange={e => set('constituency', e.target.value)} placeholder="Select or type..." />
              <datalist id="constituency-list">
                {constituencies.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
              <E f="constituency" />
            </div>
            <div className="form-group">
              <label className="form-label">Scheme *</label>
              <select className="form-select" value={form.scheme} onChange={e => set('scheme', e.target.value)}>
                <option value="">Select</option>{schemes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select><E f="scheme" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" list="category-list" value={form.category} onChange={e => set('category', e.target.value)} placeholder="Road, Drain, Building..." />
              <datalist id="category-list">
                {categories.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Phase</label>
              <select className="form-select" value={form.phase || ''} onChange={e => set('phase', e.target.value)}>
                <option value="">Select Phase</option>
                <option value="Phase 1">Phase 1</option>
                <option value="Phase 2">Phase 2</option>
                <option value="Phase 3">Phase 3</option>
                <option value="Phase 4">Phase 4</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">GO Number</label>
              <input className="form-input" value={form.goNumber} onChange={e => set('goNumber', e.target.value)} placeholder="GO(Ms)No.xxx/2025/PWD" />
            </div>
            <div className="form-group">
              <label className="form-label">GO Date</label>
              <input className="form-input" type="date" value={form.goDate} onChange={e => set('goDate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* 2. Timeline (includes Contractor) */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title"><Calendar size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Timeline</span></div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Contractor</label>
              <input className="form-input" list="contractor-list" value={form.contractorName} onChange={e => set('contractorName', e.target.value)} placeholder="Select or type..." />
              <datalist id="contractor-list">
                {contractors.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
              <E f="contractorName" />
            </div>
            <div className="form-group"><label className="form-label">Work Order Date</label><input className="form-input" type="date" value={form.workOrderDate} onChange={e => set('workOrderDate', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Start Date (Contract)</label><input className="form-input" type="date" value={form.dateOfStartContract} onChange={e => set('dateOfStartContract', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Completion Date (Contract)</label><input className="form-input" type="date" value={form.dateOfCompletionContract} onChange={e => set('dateOfCompletionContract', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Actual Start</label><input className="form-input" type="date" value={form.actualDateOfStart} onChange={e => set('actualDateOfStart', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Actual Completion</label><input className="form-input" type="date" value={form.actualDateOfCompletion} onChange={e => set('actualDateOfCompletion', e.target.value)} /></div>
            <div className="form-group">
              <label className="form-label">Extension of Time</label>
              <input className="form-input" value={form.extensionOfTime} onChange={e => set('extensionOfTime', e.target.value)} placeholder="e.g. 3 months" />
            </div>
          </div>
        </div>

        {/* 3. Guarantee & Personnel */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title"><Users size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Guarantee & Personnel</span></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Performance Guarantee Date</label><input className="form-input" type="date" value={form.performanceGuaranteeDate} onChange={e => set('performanceGuaranteeDate', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Expiry Date</label><input className="form-input" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} /></div>
            <div className="form-group">
              <label className="form-label">Junior Engineer</label>
              <input className="form-input" list="je-list" value={form.juniorEngineer} onChange={e => set('juniorEngineer', e.target.value)} placeholder="Select or type..." />
              <datalist id="je-list">
                {jeList.map(e => <option key={e.id} value={e.name}>{e.name} — {e.division}</option>)}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Assistant Engineer</label>
              <input className="form-input" list="ae-list" value={form.assistantEngineer} onChange={e => set('assistantEngineer', e.target.value)} placeholder="Select or type..." />
              <datalist id="ae-list">
                {aeList.map(e => <option key={e.id} value={e.name}>{e.name} — {e.division}</option>)}
              </datalist>
            </div>
          </div>
        </div>

        {/* 4. Financial Details */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title"><IndianRupee size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Financial Details</span></div>
          
          {form.scheme && (
            <div className="alert-item info" style={{ marginBottom: 16 }}>
              <div className="alert-icon info"><IndianRupee size={16} /></div>
              <div className="alert-content">
                <h4>Grant Availability for {form.scheme}</h4>
                <p>
                  Total Grant: <strong style={{ color:'var(--cyan)' }}>{fmt(schemeGrantTotal)}</strong> | 
                  Other Projects: <strong style={{ color:'var(--amber)' }}>{fmt(schemeProjectTotal)}</strong> | 
                  Available Balance: <strong style={{ color: schemeAvailable < 0 ? 'var(--rose)' : 'var(--emerald)' }}>{fmt(schemeAvailable)}</strong>
                </p>
              </div>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Sanctioned Amount (₹) *</label>
              <input className="form-input" type="number" value={form.sanctionedAmount} onChange={e => set('sanctionedAmount', e.target.value)} /><E f="sanctionedAmount" />
            </div>
            <div className="form-group">
              <label className="form-label">Tendered Cost (₹)</label>
              <input className="form-input" type="number" value={form.tenderedCost} onChange={e => set('tenderedCost', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Expenditure Incurred (₹)</label>
              <input className="form-input" type="number" value={form.expenditureIncurred} onChange={e => set('expenditureIncurred', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Deductions (₹)</label>
              <input className="form-input" type="number" value={form.deductions} onChange={e => set('deductions', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Utilised Amount (₹)</label>
              <input className="form-input" readOnly value={utilised.toLocaleString('en-IN')} style={{ opacity:0.7, color:'var(--amber)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Balance Amount (₹)</label>
              <input className="form-input" readOnly value={balance.toLocaleString('en-IN')} style={{ opacity:0.7, color: balance < 0 ? 'var(--rose)' : 'var(--emerald)' }} />
            </div>
          </div>

          {/* Financial Percentage Visualisation */}
          {sanctioned > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Utilisation: <strong style={{ color:'var(--cyan)' }}>{utilisationPct}%</strong></span>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Balance: <strong style={{ color: balance < 0 ? 'var(--rose)' : 'var(--emerald)' }}>{100 - utilisationPct}%</strong></span>
              </div>
              <div style={{ display:'flex', height:12, borderRadius:6, overflow:'hidden', background:'rgba(255,255,255,0.08)' }}>
                <div style={{ width:`${Math.min(utilisationPct, 100)}%`, background: utilisationPct > 100 ? 'var(--rose)' : 'linear-gradient(90deg, var(--cyan), var(--blue))', borderRadius:'6px 0 0 6px', transition:'width 0.4s ease' }} />
                <div style={{ flex:1, background: balance < 0 ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.15)', borderRadius:'0 6px 6px 0' }} />
              </div>
              {utilisationPct > 100 && (
                <div style={{ fontSize:11, color:'var(--rose)', marginTop:4 }}>⚠ Expenditure exceeds sanctioned amount by {fmt(Math.abs(balance))}</div>
              )}
            </div>
          )}
        </div>

        {/* 5. Status */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">Status</span></div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.statusOfWork} onChange={e => set('statusOfWork', e.target.value)}>
                {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Progress (%)</label>
              <input className="form-input" type="number" min="0" max="100" value={form.progress} onChange={e => set('progress', e.target.value)} />
              {Number(form.progress) > 0 && (
                <div className="progress-bar" style={{ marginTop:6, height:8 }}>
                  <div className={`progress-fill ${Number(form.progress)>=80?'green':Number(form.progress)>=40?'amber':'red'}`} style={{ width:`${form.progress}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Security Deposit */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">Security Deposit</span></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Security Amount (₹)</label><input className="form-input" type="number" value={form.securityAmount} onChange={e => set('securityAmount', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Security Deposit Deducted Date</label><input className="form-input" type="date" value={form.securityDepositDeductedDate} onChange={e => set('securityDepositDeductedDate', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Security Deposit Release Date</label><input className="form-input" type="date" value={form.securityDepositReleaseDate} onChange={e => set('securityDepositReleaseDate', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">UC Sent On Date</label><input className="form-input" type="date" value={form.ucSentDate} onChange={e => set('ucSentDate', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">M Book Number</label><input className="form-input" value={form.mBookNumber} onChange={e => set('mBookNumber', e.target.value)} placeholder="MB-XXX-YYYY-NNN" /></div>
            <div className="form-group"><label className="form-label">Work Audit Register No.</label><input className="form-input" value={form.workAuditRegisterNo} onChange={e => set('workAuditRegisterNo', e.target.value)} placeholder="WAR/XXX/YYYY/NNN" /></div>
          </div>
        </div>

        {/* 7. Physical Parameters */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title"><FileText size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Physical Parameters</span></div>
          <div className="form-group">
            <textarea className="form-textarea" style={{ minHeight: '100px' }} value={form.physicalParametersNotes} onChange={e => set('physicalParametersNotes', e.target.value)} placeholder="Enter physical parameters and related notes..." />
          </div>
        </div>

        {/* 8. Geo-Tagging */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header">
            <span className="card-title"><MapPin size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Geo-Tagging</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={getLocation}><MapPin size={14} /> Get Current Location</button>
          </div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Latitude</label><input className="form-input" type="number" step="0.000001" value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="e.g. 9.9312" /></div>
            <div className="form-group"><label className="form-label">Longitude</label><input className="form-input" type="number" step="0.000001" value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="e.g. 76.2673" /></div>
          </div>
          {form.latitude && form.longitude && Number(form.latitude) !== 0 && (
            <div style={{ marginTop:12 }}>
              <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`} target="_blank" rel="noopener" className="btn btn-secondary btn-sm">
                <MapPin size={14} /> View on Google Maps
              </a>
            </div>
          )}
        </div>

        {/* 9. Notes/Remarks */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="form-group"><label className="form-label">Notes / Remarks</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." /></div>
        </div>

        <div className="btn-group" style={{ justifyContent:'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary"><Save size={16} /> {isEdit ? 'Update' : 'Create'}</button>
        </div>
      </form>
      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
