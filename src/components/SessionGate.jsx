import { useState, useEffect } from 'react';
import { Building2, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, FIREBASE_AUTH_EMAIL } from '../utils/firebase';

const SESSION_KEY = 'ct_session_unlocked';

export function isSessionUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function unlockSession() {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

export async function lockSession() {
  sessionStorage.removeItem(SESSION_KEY);
  try {
    await signOut(auth);
  } catch {
    // ignore sign-out errors during lock
  }
}

export async function signInWithAppPassword(password) {
  await signInWithEmailAndPassword(auth, FIREBASE_AUTH_EMAIL, password);
  unlockSession();
}

function formatAuthError(error) {
  if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found') {
    return 'Incorrect password. Please try again.';
  }
  if (error?.code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.';
  }
  if (error?.code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Wait a moment and try again.';
  }
  return error?.message || 'Sign-in failed';
}

export default function SessionGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const sessionOpen = isSessionUnlocked();
      if (user && sessionOpen) {
        setUnlocked(true);
      } else {
        setUnlocked(false);
        if (sessionOpen && !user) {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
      setChecking(false);
    });
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signInWithAppPassword(password);
      setUnlocked(true);
    } catch (err) {
      setError(formatAuthError(err));
      setPassword('');
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
    setSubmitting(false);
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (unlocked) return children;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-color)',
      padding: 16,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        animation: shaking ? 'shake 0.5s ease' : 'fadeInUp 0.4s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(6, 182, 212, 0.3)',
          }}>
            <Building2 size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>CivilTrack Pro</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Project Management Dashboard</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48,
              borderRadius: '50%',
              background: 'var(--surface-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
              border: '1px solid var(--border-subtle)',
            }}>
              <Lock size={20} color="var(--text-muted)" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Enter Access Password</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Required to sync changes across all devices
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16, position: 'relative' }}>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={6}
                placeholder="6-digit password"
                value={password}
                onChange={e => { setPassword(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                autoFocus
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: 34,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p style={{ color: 'var(--rose)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <LogIn size={16} /> {submitting ? 'Signing in...' : 'Unlock Dashboard'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 16 }}>
          © 2025 CivilTrack Pro · Secured with password protection
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
