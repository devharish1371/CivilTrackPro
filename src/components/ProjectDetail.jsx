import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { generateProjectDetailPDF, savePDF, sharePDF } from '../utils/pdfExport';
import { downloadKML } from '../utils/kmlExport';
import { ArrowLeft, Edit, Trash2, FileText, Share2, Calendar, IndianRupee, Users, AlertTriangle, Lock, Unlock, MapPin, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, dispatch } = useProjects();
  const p = projects.find(pr => pr.id === id);
  const [lockModal, setLockModal] = useState(false);
  const [lockPw, setLockPw] = useState('');
  const [lockError, setLockError] = useState('');

  if (!p) return <div className="empty-state"><h3>Project not found</h3><button className="btn btn-primary" onClick={() => navigate('/projects')}>Back</button></div>;

  const utilised = (p.expenditureIncurred||0) + (p.deductions||0);
  const balance = (p.sanctionedAmount||0) - utilised;
  const now = new Date();
  const expiryDays = p.expiryDate ? Math.ceil((new Date(p.expiryDate) - now)/86400000) : null;
  const contractDays = p.dateOfCompletionContract && p.statusOfWork !== 'completed' ? Math.ceil((new Date(p.dateOfCompletionContract) - now)/86400000) : null;
  const securityDays = p.securityDepositReleaseDate ? Math.ceil((new Date(p.securityDepositReleaseDate) - now)/86400000) : null;

  const handleDelete = () => { if (!p.isLocked && confirm('Delete?')) { dispatch({ type:'DELETE_PROJECT', payload:id }); navigate('/projects'); } };
  const handlePDF = () => savePDF(generateProjectDetailPDF(p), `${p.projectName.replace(/\s+/g,'_')}.pdf`);
  const handleShare = () => sharePDF(generateProjectDetailPDF(p), `${p.projectName.replace(/\s+/g,'_')}.pdf`);

  const confirmLock = async () => {
    if (!lockPw) { setLockError('Enter password'); return; }
    if (lockPw !== '1970') { setLockError('Incorrect password'); return; }
    
    dispatch({ type:'UPDATE_PROJECT', payload:{...p, isLocked: !p.isLocked } }); 
    setLockModal(false);
  };

  const D = ({label, value, cls}) => (
    <div className="detail-item"><label>{label}</label><div className={`value ${cls||''}`}>{value || '—'}</div></div>
  );

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button className="btn btn-secondary btn-icon" onClick={() => navigate('/projects')}><ArrowLeft size={18} /></button>
          <div>
            <h1 style={{ display:'flex', alignItems:'center', gap:8 }}>
              {p.isLocked && <Lock size={18} style={{ color:'var(--amber)' }} />}
              {p.projectName}
            </h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`status-badge ${p.statusOfWork}`}>{p.statusOfWork==='completed'?'Completed':p.statusOfWork==='in_progress'?'In Progress':'Yet to Start'}</span>
              {p.updatedAt && <span style={{ fontSize:12, color:'var(--text-muted)' }}>Last updated: {new Date(p.updatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>}
            </p>
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary btn-sm" onClick={handlePDF}><FileText size={14} /> PDF</button>
          <button className="btn btn-secondary btn-sm" onClick={handleShare}><Share2 size={14} /> Share</button>
          {p.latitude && p.longitude && <button className="btn btn-secondary btn-sm" onClick={() => downloadKML([p])}><MapPin size={14} /> KML</button>}
          <button className="btn btn-primary btn-sm" onClick={() => !p.isLocked && navigate(`/projects/${id}/edit`)} disabled={p.isLocked}><Edit size={14} /> Edit</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={p.isLocked}><Trash2 size={14} /></button>
          <button className={`btn btn-sm ${p.isLocked ? 'btn-success':'btn-secondary'}`} onClick={() => { setLockModal(true); setLockPw(''); setLockError(''); }}>
            {p.isLocked ? <Lock size={14} /> : <Unlock size={14} />} {p.isLocked ? 'Unlock' : 'Lock'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {expiryDays !== null && expiryDays <= 30 && (
        <div className={`alert-item ${expiryDays<0?'danger':'warning'}`} style={{ marginBottom:12 }}>
          <div className={`alert-icon ${expiryDays<0?'danger':'warning'}`}><AlertTriangle size={16} /></div>
          <div className="alert-content"><h4>{expiryDays<0?'Guarantee Expired!':'Guarantee Expiring'}</h4><p>{expiryDays<0?`${Math.abs(expiryDays)}d overdue`:`${expiryDays}d left`}</p></div>
        </div>
      )}
      {contractDays !== null && contractDays <= 30 && (
        <div className={`alert-item ${contractDays<0?'danger':'warning'}`} style={{ marginBottom:12 }}>
          <div className={`alert-icon ${contractDays<0?'danger':'warning'}`}><AlertTriangle size={16} /></div>
          <div className="alert-content"><h4>{contractDays<0?'Contract Expired!':'Contract Ending'}</h4><p>{contractDays<0?`${Math.abs(contractDays)}d overdue`:`${contractDays}d left`}</p></div>
        </div>
      )}
      {securityDays !== null && securityDays <= 15 && (
        <div className={`alert-item ${securityDays<0?'danger':'info'}`} style={{ marginBottom:12 }}>
          <div className={`alert-icon ${securityDays<0?'danger':'info'}`}><AlertTriangle size={16} /></div>
          <div className="alert-content"><h4>{securityDays<0?'Security Deposit Overdue!':'Security Deposit Due'}</h4><p>{securityDays<0?`${Math.abs(securityDays)}d overdue`:`${securityDays}d left`}</p></div>
        </div>
      )}

      {/* Sanction & GO */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title">Sanction & GO Details</span></div>
        <div className="detail-grid">
          <D label="Year of Sanction" value={p.yearOfSanction} />
          <D label="Constituency" value={p.constituency} />
          <D label="Scheme" value={p.scheme} />
          <D label="Category" value={p.category} />
          <D label="Phase" value={p.phase} />
          <D label="GO Number" value={p.goNumber} />
          <D label="GO Date" value={fmtDate(p.goDate)} />
        </div>
      </div>

      {/* Timeline */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title"><Calendar size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Timeline</span></div>
        <div className="detail-grid">
          <D label="Contractor" value={p.contractorName} />
          <D label="Work Order Date" value={fmtDate(p.workOrderDate)} />
          <D label="Start (Contract)" value={fmtDate(p.dateOfStartContract)} />
          <D label="Completion (Contract)" value={fmtDate(p.dateOfCompletionContract)} />
          <D label="Actual Start" value={fmtDate(p.actualDateOfStart)} />
          <D label="Actual Completion" value={fmtDate(p.actualDateOfCompletion)} />
          <D label="Extension of Time" value={p.extensionOfTime || 'None'} />
        </div>
      </div>

      {/* Guarantee & Personnel */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title"><Users size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Guarantee & Personnel</span></div>
        <div className="detail-grid">
          <D label="Performance Guarantee" value={fmtDate(p.performanceGuaranteeDate)} />
          <D label="Expiry Date" value={fmtDate(p.expiryDate)} cls={expiryDays!==null && expiryDays<=30?'danger':''} />
          <D label="Junior Engineer" value={p.juniorEngineer} />
          <D label="Assistant Engineer" value={p.assistantEngineer} />
        </div>
      </div>

      {/* Financial */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title"><IndianRupee size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Financial</span></div>
        <div className="detail-grid">
          <D label="Sanctioned Amount" value={fmt(p.sanctionedAmount)} cls="amount" />
          <D label="Tendered Cost" value={fmt(p.tenderedCost)} cls="amount" />
          <D label="Expenditure Incurred" value={fmt(p.expenditureIncurred)} cls="highlight" />
          <D label="Deductions" value={fmt(p.deductions||0)} cls="highlight" />
          <D label="Utilised Amount" value={fmt(utilised)} cls="highlight" />
          <D label="Balance Amount" value={fmt(balance)} cls={balance<0?'danger':'amount'} />
        </div>
        
        {/* Financial Percentage Visualisation */}
        {p.sanctionedAmount > 0 && (() => {
          const utilisationPct = Math.round((utilised / p.sanctionedAmount) * 100);
          return (
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
          );
        })()}
      </div>

      {/* Status */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title">Status</span></div>
        <div className="detail-grid">
          <D label="Status" value={p.statusOfWork==='completed'?'Completed':p.statusOfWork==='in_progress'?'In Progress':'Yet to Start'} />
          <div className="detail-item">
            <label>Progress</label>
            <div className="value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{p.progress}%</span>
              <div className="progress-bar" style={{ width: '100px', height: 8, display: 'inline-block' }}>
                <div className={`progress-fill ${p.progress>=80?'green':p.progress>=40?'amber':'red'}`} style={{ width:`${p.progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Deposit */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title">Security Deposit</span></div>
        <div className="detail-grid">
          <D label="Security Amount" value={fmt(p.securityAmount||0)} cls="amount" />
          <D label="Security Deducted On" value={fmtDate(p.securityDepositDeductedDate)} />
          <D label="Security Deposit Release" value={fmtDate(p.securityDepositReleaseDate)} />
          <D label="UC Sent On" value={fmtDate(p.ucSentDate)} />
          <D label="M Book Number" value={p.mBookNumber} />
          <D label="Work Audit Register No" value={p.workAuditRegisterNo} />
        </div>
      </div>

      {/* Physical Parameters */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title"><FileText size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Physical Parameters</span></div>
        <p style={{ color:'var(--text-secondary)', fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{p.physicalParametersNotes || '—'}</p>
      </div>

      {/* Geo */}
      {p.latitude && p.longitude && Number(p.latitude) !== 0 && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title"><MapPin size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Geo-Tagging</span></div>
          <div className="detail-grid">
            <D label="Latitude" value={p.latitude} />
            <D label="Longitude" value={p.longitude} />
            <div className="detail-item">
              <label>Map</label>
              <a href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`} target="_blank" rel="noopener" className="btn btn-secondary btn-sm" style={{ marginTop:4 }}>
                <ExternalLink size={14} /> Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {p.notes && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">Notes / Remarks</span></div>
          <p style={{ color:'var(--text-secondary)', fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{p.notes}</p>
        </div>
      )}

      {/* Lock Modal */}
      {lockModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setLockModal(false)}>
          <div className="card" style={{ width:360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom:12 }}>{p.isLocked ? '🔓 Unlock' : '🔒 Lock'}</h3>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>{p.isLocked ? 'Enter master password to unlock:' : 'Enter master password to lock:'}</p>
            <input className="form-input" type="password" placeholder="Password" value={lockPw} onChange={e => { setLockPw(e.target.value); setLockError(''); }} onKeyDown={e => e.key==='Enter' && confirmLock()} autoFocus />
            {lockError && <p style={{ color:'var(--rose)', fontSize:12, marginTop:6 }}>{lockError}</p>}
            <div className="btn-group" style={{ marginTop:16, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setLockModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={confirmLock}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
