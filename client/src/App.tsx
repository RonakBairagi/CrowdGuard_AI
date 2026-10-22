import React, { useState } from 'react';
import { RealtimeProvider } from './context/RealtimeContext';
import { Navbar, ViewMode } from './components/common/Navbar';
import { PublicMobileApp } from './components/public/PublicMobileApp';
import { AuthorityDashboard } from './components/authority/AuthorityDashboard';
import { Language } from './utils/i18n';
import { Smartphone, LayoutDashboard, Shield } from 'lucide-react';

export function AppContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('DUAL_VIEW');
  const [lang, setLang] = useState<Language>('en');

  return (
    <div className="app-shell">
      {/* Global Top Navbar */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        lang={lang}
        setLang={setLang}
      />

      {/* Main View Router based on viewMode */}
      {viewMode === 'DUAL_VIEW' && (
        <div className="dual-view-container">
          {/* Left Column: Simulated Visitor Smartphone */}
          <div className="dual-phone-column">
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              <Smartphone size={14} color="var(--primary)" />
              <span>PUBLIC VISITOR INTERFACE (SMARTPHONE)</span>
            </div>

            <div className="phone-mockup">
              {/* Phone Status Bar & Notch */}
              <div className="phone-status-bar">
                <span>09:41</span>
                <div className="phone-notch"></div>
                <span>5G 100%</span>
              </div>

              {/* Mobile App */}
              <PublicMobileApp lang={lang} />
            </div>
          </div>

          {/* Right Column: Authority Command Dashboard */}
          <div className="dual-dashboard-column">
            <AuthorityDashboard />
          </div>
        </div>
      )}

      {viewMode === 'MOBILE_ONLY' && (
        <div className="public-full-mobile">
          <PublicMobileApp lang={lang} />
        </div>
      )}

      {viewMode === 'AUTHORITY_ONLY' && (
        <div style={{ flex: 1, backgroundColor: 'var(--bg-canvas)' }}>
          <AuthorityDashboard />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <RealtimeProvider>
      <AppContent />
    </RealtimeProvider>
  );
}
