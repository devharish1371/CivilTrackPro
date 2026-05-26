import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { statusOptions } from '../data/sampleData';
import { v4 as uuidv4 } from 'uuid';
import { Save, ArrowLeft, MapPin, IndianRupee } from 'lucide-react';

const empty = {
  projectName:'', yearOfSanction:new Date().getFullYear(), constituency:'', scheme:'',
  goDate:'', goNumber:'',
  sanctionedAmount:'', tenderedCost:'', contractorName:'', workOrderDate:'',
  dateOfStartContract:'', dateOfCompletionContract:'', actualDateOfStart:'',
  actualDateOfCompletion:'', performanceGuaranteeDate:'', expiryDate:'',
  expenditureIncurred:'', deductions:'',
  extensionOfTime:'', statusOfWork:'yet_to_start', progress:0,
  juniorEngineer:'', assistantEngineer:'',
  ucSentDate:'', securityDepositReleaseDate:'', securityAmount:'',
  mBookNumber:'', workAuditRegisterNo:'',
  latitude:'', longitude:'', isLocked:false, lockHash:'', notes:''
};

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n);

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { projects, contractors, engineers, schemes, constituencies, grants, dispatch } = useProjects();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');

  const jeList = engineers.filter(e => e.designation === 'Junior Engineer');
  const aeList = engineers.filter(e => e.designation === 'Assistant Engineer');

  useEffect(() => {
    if (isEdit) {
      const ex = projects.find(p => p.id === id);
      if (ex) {
        if (ex.isLocked) { navigate('/projects'); return; }
        setForm({ ...ex });
      } else navigate('/projects');
    }
  }, [id, isEdit]);

  const set = (f, v) => { setForm(x => ({...x, [f]:v})); if (errors[f]) setErrors(e => ({...e, [f]:''})); };

  const validate = () => {
    const e = {};
    if (!form.projectName.trim()) e.projectName = 'Required';
    if (!form.constituency) e.constituency = 'Required';
    if (!form.scheme) e.scheme = 'Required';
    if (!form.sanctionedAmount || Number(form.sanctionedAmount) <= 0) e.sanctionedAmount = 'Enter valid amount';
    if (!form.contractorName.trim()) e.contractorName = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
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
      <form onSubmit={handleSubmit}>
        {/* Sanction / GO Details */}
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
              <label className="form-label">GO Number</label>
              <input className="form-input" value={form.goNumber} onChange={e => set('goNumber', e.target.value)} placeholder="GO(Ms)No.xxx/2025/PWD" />
            </div>
            <div className="form-group">
              <label className="form-label">GO Date</label>
              <input className="form-input" type="date" value={form.goDate} onChange={e => set('goDate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">Financial Details</span></div>
          
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
        </div>

        {/* Contractor & Status */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">Contractor & Status</span></div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Contractor *</label>
              <select className="form-select" value={form.contractorName} onChange={e => set('contractorName', e.target.value)}>
                <option value="">Select or type below</option>
                {contractors.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select><E f="contractorName" />
            </div>
            <div className="form-group">
              <label className="form-label">Or Enter Contractor Name</label>
              <input className="form-input" value={form.contractorName} onChange={e => set('contractorName', e.target.value)} placeholder="M/s ..." />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.statusOfWork} onChange={e => set('statusOfWork', e.target.value)}>
                {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Progress (%)</label>
              <input className="form-input" type="number" min="0" max="100" value={form.progress} onChange={e => set('progress', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Extension of Time</label>
              <input className="form-input" value={form.extensionOfTime} onChange={e => set('extensionOfTime', e.target.value)} placeholder="e.g. 3 months" />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">Timeline</span></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Work Order Date</label><input className="form-input" type="date" value={form.workOrderDate} onChange={e => set('workOrderDate', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Start Date (Contract)</label><input className="form-input" type="date" value={form.dateOfStartContract} onChange={e => set('dateOfStartContract', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Completion Date (Contract)</label><input className="form-input" type="date" value={form.dateOfCompletionContract} onChange={e => set('dateOfCompletionContract', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Actual Start</label><input className="form-input" type="date" value={form.actualDateOfStart} onChange={e => set('actualDateOfStart', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Actual Completion</label><input className="form-input" type="date" value={form.actualDateOfCompletion} onChange={e => set('actualDateOfCompletion', e.target.value)} /></div>
          </div>
        </div>

        {/* Physical Parameters */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">Physical Parameters</span></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">UC Sent On Date</label><input className="form-input" type="date" value={form.ucSentDate} onChange={e => set('ucSentDate', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Security Deposit Release Date</label><input className="form-input" type="date" value={form.securityDepositReleaseDate} onChange={e => set('securityDepositReleaseDate', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Security Amount (₹)</label><input className="form-input" type="number" value={form.securityAmount} onChange={e => set('securityAmount', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">M Book Number</label><input className="form-input" value={form.mBookNumber} onChange={e => set('mBookNumber', e.target.value)} placeholder="MB-XXX-YYYY-NNN" /></div>
            <div className="form-group"><label className="form-label">Work Audit Register No.</label><input className="form-input" value={form.workAuditRegisterNo} onChange={e => set('workAuditRegisterNo', e.target.value)} placeholder="WAR/XXX/YYYY/NNN" /></div>
          </div>
        </div>

        {/* Guarantee & Personnel */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">Guarantee & Personnel</span></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Performance Guarantee Date</label><input className="form-input" type="date" value={form.performanceGuaranteeDate} onChange={e => set('performanceGuaranteeDate', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Expiry Date</label><input className="form-input" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} /></div>
            <div className="form-group">
              <label className="form-label">Junior Engineer</label>
              <select className="form-select" value={form.juniorEngineer} onChange={e => set('juniorEngineer', e.target.value)}>
                <option value="">Select</option>{jeList.map(e => <option key={e.id} value={e.name}>{e.name} — {e.division}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assistant Engineer</label>
              <select className="form-select" value={form.assistantEngineer} onChange={e => set('assistantEngineer', e.target.value)}>
                <option value="">Select</option>{aeList.map(e => <option key={e.id} value={e.name}>{e.name} — {e.division}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Geo-Tagging */}
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

        {/* Notes */}
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
