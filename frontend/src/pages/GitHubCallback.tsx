import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { callbackGitHubOAuth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Github, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export const GitHubCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code provided in callback URL.');
      return;
    }

    const processOAuth = async () => {
      try {
        await callbackGitHubOAuth(code);
        await refreshUser();
        setStatus('success');
        setTimeout(() => {
          navigate('/settings');
        }, 1500);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'GitHub OAuth token exchange failed.');
      }
    };

    processOAuth();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="table-container" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '2.5rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '50%', marginBottom: '1.25rem', color: '#60a5fa' }}>
          <Github size={36} />
        </div>

        {status === 'processing' && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Loader2 size={18} className="spin" />
              <span>Verifying GitHub Authorization...</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Exchanging authorization code and securely linking your GitHub account server-side.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ color: '#34d399', marginBottom: '0.5rem' }}>
              <CheckCircle2 size={40} style={{ margin: '0 auto 0.75rem' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                GitHub Account Connected Successfully!
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Redirecting you to Settings...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ color: '#f87171', marginBottom: '0.5rem' }}>
              <AlertTriangle size={40} style={{ margin: '0 auto 0.75rem' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                Connection Failed
              </h2>
            </div>
            <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/settings')}
              style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Return to Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
