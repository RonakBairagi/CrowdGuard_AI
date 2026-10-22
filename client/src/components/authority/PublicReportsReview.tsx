import React from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { PublicReport } from '../../types';
import { 
  Radio, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  User, 
  BellRing 
} from 'lucide-react';

interface PublicReportsReviewProps {
  venueId?: string;
}

export const PublicReportsReview: React.FC<PublicReportsReviewProps> = ({ venueId }) => {
  const { reports, triagePublicReport, publishAlert } = useRealtime();

  const filteredReports = venueId ? reports.filter(r => r.venueId === venueId) : reports;

  const handleTriage = async (reportId: string, status: PublicReport['status']) => {
    await triagePublicReport(reportId, status, `Triaged by operator to ${status}`);
  };

  const handleConfirmAndAlert = async (report: PublicReport) => {
    // 1. Mark confirmed
    await triagePublicReport(report.id, 'CONFIRMED', 'Confirmed by on-site marshals');
    // 2. Publish verified alert
    await publishAlert(report.venueId, {
      severity: 'WARNING',
      title: `VERIFIED HAZARD: ${report.category.replace('_', ' ')}`,
      message: `Safety marshals confirmed hazard at ${report.locationDescription}: ${report.details || 'Crowd bottlenecking reported'}. Please follow diversion paths.`,
      source: 'AUTHORITY',
      recommendedAction: 'Keep clear of affected passage.',
    });
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, background: 'rgba(249, 115, 22, 0.15)', borderRadius: 'var(--radius-md)', color: '#f97316' }}>
            <Radio size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem' }}>Public Hazard Reports Queue</h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Review visitor-submitted safety notices. Single reports remain <strong>UNVERIFIED</strong> until corroborated or dispatched for on-site inspection.
            </p>
          </div>
        </div>

        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          Total Submissions: {filteredReports.length}
        </span>
      </div>

      {filteredReports.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          No pending public reports for this venue.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredReports.map(report => {
            const isUnverified = report.status === 'UNVERIFIED';
            const isInvestigating = report.status === 'INVESTIGATING';
            const isConfirmed = report.status === 'CONFIRMED';
            const isDismissed = report.status === 'DISMISSED';

            return (
              <div
                key={report.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: `1px solid ${isUnverified ? 'rgba(249, 115, 22, 0.35)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: isUnverified ? 'rgba(249, 115, 22, 0.2)' : isInvestigating ? 'rgba(56, 189, 248, 0.2)' : isConfirmed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: isUnverified ? '#fb923c' : isInvestigating ? '#38bdf8' : isConfirmed ? '#34d399' : '#f87171',
                        border: `1px solid ${isUnverified ? 'rgba(249, 115, 22, 0.4)' : 'transparent'}`,
                      }}
                    >
                      {report.status}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                      {report.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    <span>{new Date(report.timestamp).toLocaleTimeString()}</span>
                    {report.corroborationCount > 1 && (
                      <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                        {report.corroborationCount} corroborations
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    <MapPin size={12} />
                    <span>Location: <strong>{report.locationDescription}</strong></span>
                  </div>
                  {report.details && (
                    <div style={{ marginTop: 2, padding: '4px 8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      "{report.details}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={12} /> Reported by: {report.reportedBy}
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {isUnverified && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                        onClick={() => handleTriage(report.id, 'INVESTIGATING')}
                      >
                        Dispatch Marshal
                      </button>
                    )}

                    {!isConfirmed && (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                        onClick={() => handleConfirmAndAlert(report)}
                      >
                        <BellRing size={12} /> Confirm & Publish Alert
                      </button>
                    )}

                    {!isDismissed && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '4px 8px', color: '#f87171' }}
                        onClick={() => handleTriage(report.id, 'DISMISSED')}
                      >
                        <XCircle size={12} /> Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
