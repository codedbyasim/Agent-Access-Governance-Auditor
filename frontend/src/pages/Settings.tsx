import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Github, CheckCircle2, Shield, Key, ExternalLink, Unlink } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, connectGitHub, disconnectGitHub } = useAuth();

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
          System Settings & OAuth Integration
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configure user sessions, GitHub OAuth integrations for automated issue notification dispatching (FR-25).
        </p>
      </div>

      {/* User Account Details */}
      <div className="table-container" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Shield size={20} style={{ color: '#60a5fa' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
            Current Authenticated Session
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Logged-in Email
            </div>
            <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '0.2rem' }}>
              {user?.email || 'Not Logged In (Guest Mode)'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Full Name / Officer Title
            </div>
            <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '0.2rem' }}>
              {user?.full_name || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* GitHub OAuth Connection Card */}
      <div className="table-container" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Github size={22} style={{ color: '#ffffff' }} />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
                GitHub Account OAuth Link (§3.5)
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Required for creating GitHub Issues on policy violations (FR-25)
              </p>
            </div>
          </div>

          {user?.has_github_connected ? (
            <div className="badge badge-ok">
              <CheckCircle2 size={14} />
              <span>Connected as @{user.github_username}</span>
            </div>
          ) : (
            <div className="badge badge-public">
              <span>Not Connected</span>
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          {user?.has_github_connected ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#34d399', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  OAuth Token Stored Securely Server-Side (NFR-10)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Connected GitHub User: <strong style={{ color: '#ffffff' }}>@{user.github_username}</strong>
                </div>
              </div>
              <button
                onClick={disconnectGitHub}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                <Unlink size={16} />
                <span>Disconnect GitHub</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  Connect your GitHub Account
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Authorizes the Auditor to create governance violation issues on your behalf.
                </div>
              </div>
              <button
                onClick={connectGitHub}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                <Github size={18} />
                <span>Connect GitHub Account</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GitHub OAuth Setup Guide for Reviewers/Judges */}
      <div className="table-container" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Key size={20} style={{ color: '#fbbf24' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
            GitHub OAuth App Setup Instructions (for Judges & Testers)
          </h2>
        </div>

        <ol style={{ fontSize: '0.875rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
          <li>
            Go to GitHub <a href="https://github.com/settings/developers" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>Developer Settings &gt; OAuth Apps <ExternalLink size={12} /></a> and click <strong>Register a new application</strong>.
          </li>
          <li>
            Set <strong>Application Name</strong> to <code>Agent Access Governance Auditor</code>.
          </li>
          <li>
            Set <strong>Homepage URL</strong> to <code>http://localhost:3000</code>.
          </li>
          <li>
            Set <strong>Authorization callback URL</strong> to:
            <span className="code-tag" style={{ marginLeft: '0.4rem', color: '#34d399' }}>http://localhost:3000/auth/github/callback</span>
          </li>
          <li>
            Copy your <code>Client ID</code> and generate a <code>Client Secret</code>.
          </li>
          <li>
            Add them to your root <code>.env</code> file:
            <pre style={{ backgroundColor: '#0f172a', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#93c5fd' }}>
{`GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback`}
            </pre>
          </li>
        </ol>
      </div>
    </div>
  );
};
