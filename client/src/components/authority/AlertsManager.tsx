import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Venue, SafetyAlert } from '../../types';
import { Bell, Send, CheckCircle, AlertTriangle, AlertOctagon, Info, Trash2 } from 'lucide-react';

interface AlertsManagerProps {
  venue: Venue;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({ venue }) => {
  const { alerts, publishAlert, resolveAlert } = useRealtime();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<SafetyAlert['severity']>('WARNING');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [selectedGateId, setSelectedGateId] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  const venueAlerts = alerts.filter(a => a.venueId === venue.id);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsPublishing(true);
    const ok = await publishAlert(venue.id, {
      severity,
      title,
      message,
      recommendedAction: recommendedAction || undefined,
      affectedGateIds: selectedGateId ? [selectedGateId] : undefined,
    });
    setIsPublishing(false);

    if (ok) {
      setPublishedSuccess(true);
      setTitle('');
      setMessage('');
      setRecommendedAction('');
      setTimeout(() => setPublishedSuccess(false), 3000);
    }
  };

  const handleResolve = async (alertId: string) => {
    await resolveAlert(venue.id, alertId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Create Alert Form */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-md)', color: '#ef4444' }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem' }}>Broadcast Verified Safety Alert</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Target: {venue.name}. Critical notices immediately display as urgent banners on public visitor smartphones.
              </p>
            </div>
          </div>

          {publishedSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '5px 12px', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle size={15} />
              <span>Broadcast dispatched to visitors!</span>
            </div>
          )}
        </div>

        <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="grid-3" style={{ gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Severity Level *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                style={{ width: '100%' }}
              >
                <option value="WARNING">WARNING (Crowd congestion / Gate advisory)</option>
                <option value="CRITICAL">CRITICAL (Emergency / Immediate evacuation)</option>
                <option value="INFO">INFO (General flow / Accessibility notice)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Alert Headline *</label>
              <input
                type="text"
                required
                placeholder="e.g. Exit Gate B Closed for Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Affected Gate (Optional)</label>
              <select
                value={selectedGateId}
                onChange={(e) => setSelectedGateId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">None / Venue-wide</option>
                {venue.gates.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Public Message / Calming Directive *</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. SAFETY ALERT: Gate 3 is temporarily closed. Follow verified route to Gate 4 and obey on-site marshals."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Recommended Action</label>
              <input
                type="text"
                placeholder="e.g. Divert to West Gate 2 or follow green arrows."
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingTop: 16 }}>
              <button type="submit" className="btn-primary" disabled={isPublishing}>
                <Send size={14} />
                <span>{isPublishing ? 'Broadcasting...' : 'Broadcast Alert'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Existing Alerts Table */}
      <div className="card" style={{ padding: 16 }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Active & Historical Alerts ({venueAlerts.length})</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {venueAlerts.map(alert => (
            <div
              key={alert.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'WARNING' ? '#f59e0b' : '#38bdf8'}`,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{alert.title}</span>
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: alert.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)', color: alert.active ? '#34d399' : 'var(--text-muted)' }}>
                    {alert.active ? 'ACTIVE BROADCAST' : 'RESOLVED'}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {alert.message}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Source: {alert.source} • Issued by {alert.authorName} at {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {alert.active && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                  onClick={() => handleResolve(alert.id)}
                >
                  <CheckCircle size={13} color="#34d399" />
                  <span>Resolve Alert</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
