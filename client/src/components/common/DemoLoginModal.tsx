import React from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { UserRole } from '../../types';
import { Shield, User, Wrench, Calendar, Key, CheckCircle, X } from 'lucide-react';

interface DemoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoLoginModal: React.FC<DemoLoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchUserRole } = useRealtime();

  if (!isOpen) return null;

  const roles = [
    {
      key: 'public',
      role: 'PUBLIC' as UserRole,
      title: 'Public Visitor',
      desc: 'Access crowd conditions, interactive venue navigation, safety alerts, and submit hazard reports.',
      icon: User,
      color: '#38bdf8',
    },
    {
      key: 'safety',
      role: 'SAFETY_OFFICER' as UserRole,
      title: 'Safety Officer / Police Marshal',
      desc: 'Authorized to toggle gate closures, publish verified emergency alerts, and triage hazard reports.',
      icon: Shield,
      color: '#f59e0b',
    },
    {
      key: 'manager',
      role: 'VENUE_MANAGER' as UserRole,
      title: 'Venue Operations Manager',
      desc: 'Monitor zone densities, control ingress/egress gates, and oversee venue map layouts.',
      icon: Wrench,
      color: '#10b981',
    },
    {
      key: 'organizer',
      role: 'ORGANIZER' as UserRole,
      title: 'Event Organiser',
      desc: 'Create and configure new venues, define safety assessment capacities, and edit event schedules.',
      icon: Calendar,
      color: '#ec4899',
    },
    {
      key: 'admin',
      role: 'ADMIN' as UserRole,
      title: 'System Administrator',
      desc: 'Full administrative control over all venues, sensors, audit logs, and prototype simulation controls.',
      icon: Key,
      color: '#a855f7',
    },
  ];

  const handleSelect = async (key: string) => {
    await switchUserRole(key);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(56, 189, 248, 0.15)', borderRadius: 'var(--radius-md)', color: '#38bdf8' }}>
              <Key size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Demo Access & Role Selector</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Select an authorized persona to test server-side permissions
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = currentUser.role === r.role;
            return (
              <div
                key={r.key}
                onClick={() => handleSelect(r.key)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: `${r.color}20`, color: r.color, marginTop: 2 }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#38bdf8' : 'var(--text-primary)' }}>
                      {r.title}
                    </span>
                    {isSelected && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>
                        <CheckCircle size={14} /> ACTIVE
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {r.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
