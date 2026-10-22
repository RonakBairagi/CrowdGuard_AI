import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Language, TRANSLATIONS } from '../../utils/i18n';
import { DemoLoginModal } from './DemoLoginModal';
import { Shield, Smartphone, LayoutDashboard, Columns, Globe, Radio } from 'lucide-react';

export type ViewMode = 'MOBILE_ONLY' | 'AUTHORITY_ONLY' | 'DUAL_VIEW';

interface NavbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ viewMode, setViewMode, lang, setLang }) => {
  const { isConnected, currentUser } = useRealtime();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const t = TRANSLATIONS[lang];

  return (
    <>
      <header className="top-nav">
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Shield size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="brand-title">
              CrowdGuard <span style={{ color: 'var(--primary)', fontWeight: 800 }}>AI</span>
            </div>
            <div className="brand-tagline">
              {t.tagline}
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="view-tabs">
          <button
            className={`view-tab-btn ${viewMode === 'DUAL_VIEW' ? 'active' : ''}`}
            onClick={() => setViewMode('DUAL_VIEW')}
            title="Real-time side-by-side synchronized demonstration"
          >
            <Columns size={15} />
            <span>Dual Sync View</span>
          </button>
          <button
            className={`view-tab-btn ${viewMode === 'MOBILE_ONLY' ? 'active' : ''}`}
            onClick={() => setViewMode('MOBILE_ONLY')}
            title="Public smartphone visitor interface"
          >
            <Smartphone size={15} />
            <span>Public Mobile App</span>
          </button>
          <button
            className={`view-tab-btn ${viewMode === 'AUTHORITY_ONLY' ? 'active' : ''}`}
            onClick={() => setViewMode('AUTHORITY_ONLY')}
            title="Authority command & monitoring dashboard"
          >
            <LayoutDashboard size={15} />
            <span>Authority Dashboard</span>
          </button>
        </div>

        {/* Right side controls */}
        <div className="nav-controls">
          {/* Real-time Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.74rem',
              color: isConnected ? '#34d399' : '#f87171',
              backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            }}
            title={isConnected ? 'Connected to live real-time WebSocket' : 'Reconnecting to telemetry service...'}
          >
            <Radio size={13} className={isConnected ? 'animate-pulse' : ''} />
            <span>{isConnected ? 'LIVE SYNC' : 'CONNECTING'}</span>
          </div>

          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe size={14} color="var(--text-secondary)" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              style={{
                fontSize: '0.76rem',
                padding: '3px 8px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <option value="en">English (EN)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>

          {/* Role Pill / Demo Login */}
          <div className="role-pill" onClick={() => setIsDemoModalOpen(true)} title="Click to switch demo role">
            <span className="role-tag">{currentUser.role.replace('_', ' ')}</span>
            <span style={{ fontSize: '0.78rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.name.split(' ')[0]}
            </span>
          </div>
        </div>
      </header>

      {/* Demo Notice Banner */}
      <div className="demo-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="demo-badge-tag">{t.demoDataBadge}</span>
          <span>Prototype simulation mode active with explainable risk rules and instant bidirectional gate sync.</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#a5b4fc' }}>
          Real-time Engine: <strong>Active</strong> | Rule Config: <strong>Authorized Safety Matrix</strong>
        </div>
      </div>

      <DemoLoginModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </>
  );
};
