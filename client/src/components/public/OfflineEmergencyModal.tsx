import React from 'react';
import { Venue } from '../../types';
import { PhoneCall, ShieldAlert, AlertTriangle, X, HeartPulse, Flame, Compass } from 'lucide-react';

interface OfflineEmergencyModalProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineEmergencyModal: React.FC<OfflineEmergencyModalProps> = ({ venue, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', color: '#ef4444' }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Offline Emergency Information</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {venue.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Offline Warning Notice */}
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontWeight: 700, fontSize: '0.82rem' }}>
            <AlertTriangle size={16} />
            <span>CAUTION: Offline Mode Active</span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.4 }}>
            Live sensor feeds, crowd density measurements, and gate statuses <strong>may no longer be current</strong>.
            During network disruption, prioritise official PA announcements and obey on-site police, marshals, and emergency responders.
          </p>
        </div>

        {/* Emergency Contacts */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <PhoneCall size={14} color="#38bdf8" />
            <span>VERIFIED ON-SITE EMERGENCY NUMBERS</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {venue.emergencyContacts.map((contact, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{contact.role}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Direct Hot-line</div>
                </div>
                <a
                  href={`tel:${contact.phone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  <PhoneCall size={13} />
                  <span>{contact.phone}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Offline Safety Directive Instructions */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Compass size={14} color="#10b981" />
            <span>AUTHORISED SAFETY INSTRUCTIONS</span>
          </h4>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
            <ul style={{ paddingLeft: 18, fontSize: '0.78rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {venue.safetyInstructions.map((instruction, idx) => (
                <li key={idx}>{instruction}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Emergency Exits List */}
        <div>
          <h4 style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={14} color="#f97316" />
            <span>EMERGENCY DISPERSAL GATES</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {venue.gates.filter(g => g.type === 'EMERGENCY_EXIT' || g.type === 'EXIT').map(gate => (
              <div
                key={gate.id}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <strong>{gate.name}</strong>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {gate.notes || 'Dispersal route'}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: gate.accessible ? '#34d399' : 'var(--text-muted)' }}>
                  {gate.accessible ? '♿ Accessible' : 'Standard'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
