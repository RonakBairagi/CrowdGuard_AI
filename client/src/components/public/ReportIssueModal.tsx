import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Venue, PublicReport } from '../../types';
import { AlertTriangle, Send, X, ShieldAlert, Check } from 'lucide-react';

interface ReportIssueModalProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ venue, isOpen, onClose }) => {
  const { submitPublicReport } = useRealtime();
  const [category, setCategory] = useState<PublicReport['category']>('OVERCROWDED_AREA');
  const [locationDescription, setLocationDescription] = useState('');
  const [zoneId, setZoneId] = useState(venue.zones[0]?.id || '');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationDescription.trim()) return;

    setIsSubmitting(true);
    const result = await submitPublicReport(venue.id, {
      category,
      locationDescription,
      zoneId,
      details,
    });
    setIsSubmitting(false);

    if (result) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setLocationDescription('');
        setDetails('');
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-md)', color: '#ef4444' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Report a Safety Hazard</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {venue.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Check size={28} />
            </div>
            <h4 style={{ fontSize: '1.05rem', color: '#34d399' }}>Report Submitted</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              Tagged as <strong>UNVERIFIED</strong>. Venue safety personnel have been notified for inspection.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '0.74rem', color: '#fbbf24', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Notice:</strong> All submissions are logged as <em>unverified public reports</em> until vetted by on-site safety personnel. For life-threatening emergencies, alert the nearest police marshal or booth immediately.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Hazard Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                style={{ width: '100%' }}
              >
                <option value="OVERCROWDED_AREA">Overcrowded Bottleneck</option>
                <option value="BLOCKED_PASSAGE">Blocked Corridor / Passage</option>
                <option value="CLOSED_EXIT">Closed or Obstructed Exit Gate</option>
                <option value="POSSIBLE_EMERGENCY">Possible Safety Hazard / Panic Risk</option>
                <option value="MEDICAL_ASSISTANCE">Medical Assistance Needed</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Specific Location Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Near Gate 3 corridor, next to water dispenser"
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Associated Venue Zone (Optional)
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                style={{ width: '100%' }}
              >
                {venue.zones.map(z => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.riskLevel} Risk)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Additional Details (What is happening?)
              </label>
              <textarea
                rows={3}
                placeholder="Describe current crowd movement, physical blockages, or urgent observations..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                <Send size={14} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Unverified Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
