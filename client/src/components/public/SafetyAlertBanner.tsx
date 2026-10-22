import React from 'react';
import { SafetyAlert } from '../../types';
import { AlertOctagon, AlertTriangle, Info, ShieldCheck, ArrowRight } from 'lucide-react';

interface SafetyAlertBannerProps {
  alerts: SafetyAlert[];
  onDismiss?: (id: string) => void;
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({ alerts }) => {
  const activeAlerts = alerts.filter(a => a.active);
  if (activeAlerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
      {activeAlerts.map(alert => {
        const isCritical = alert.severity === 'CRITICAL';
        const isWarning = alert.severity === 'WARNING';

        return (
          <div
            key={alert.id}
            className={`alert-banner-box ${isCritical ? 'severity-critical' : isWarning ? 'severity-warning' : 'severity-info'}`}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ marginTop: 2 }}>
                  {isCritical ? (
                    <AlertOctagon size={18} color="#ef4444" />
                  ) : isWarning ? (
                    <AlertTriangle size={18} color="#f59e0b" />
                  ) : (
                    <Info size={18} color="#38bdf8" />
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: isCritical ? '#f87171' : isWarning ? '#fbbf24' : '#38bdf8' }}>
                      {alert.title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {alert.source}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.4 }}>
                    {alert.message}
                  </p>

                  {alert.recommendedAction && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.74rem', color: '#93c5fd', fontWeight: 600 }}>
                      <ArrowRight size={13} />
                      <span>Action: {alert.recommendedAction}</span>
                    </div>
                  )}

                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Issued by: {alert.authorName} • {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
