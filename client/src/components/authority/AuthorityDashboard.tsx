import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Venue } from '../../types';
import { LiveControlCentre } from './LiveControlCentre';
import { SimulationControlDeck } from './SimulationControlDeck';
import { VenueMapEditor } from './VenueMapEditor';
import { AlertsManager } from './AlertsManager';
import { PublicReportsReview } from './PublicReportsReview';
import { EventManager } from './EventManager';
import { AuditLogViewer } from './AuditLogViewer';
import { 
  Activity, 
  Sliders, 
  Map, 
  Bell, 
  Radio, 
  Calendar, 
  FileText, 
  Building2, 
  ShieldCheck 
} from 'lucide-react';

export const AuthorityDashboard: React.FC = () => {
  const { venues, currentUser } = useRealtime();
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id || 'venue-baghbazar-pandal');
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SIMULATION' | 'MAP_EDITOR' | 'ALERTS' | 'REPORTS' | 'EVENTS' | 'AUDIT'>('LIVE');

  const selectedVenue = venues.find(v => v.id === selectedVenueId) || venues[0];

  if (!selectedVenue) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading venue monitoring data...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Venue Switcher & Authority Header */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 'var(--radius-md)', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              ACTIVE SURVEILLANCE TARGET
            </div>
            <select
              value={selectedVenue.id}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                backgroundColor: 'transparent',
                border: 'none',
                color: '#fff',
                padding: '2px 0',
                cursor: 'pointer',
              }}
            >
              {venues.map(v => (
                <option key={v.id} value={v.id} style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                  {v.name} ({v.category.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Operator Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.74rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{currentUser.name}</div>
            <div style={{ color: '#38bdf8' }}>Role: {currentUser.role.replace('_', ' ')} (Server-Side Verified)</div>
          </div>
        </div>
      </div>

      {/* Authority Control Room Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          className={`btn-secondary ${activeTab === 'LIVE' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTab === 'LIVE' ? 'var(--primary)' : 'var(--bg-surface)',
            color: activeTab === 'LIVE' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            padding: '7px 12px',
          }}
          onClick={() => setActiveTab('LIVE')}
        >
          <Activity size={15} />
          <span>Live Monitoring Center</span>
        </button>

        <button
          className={`btn-secondary ${activeTab === 'SIMULATION' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTab === 'SIMULATION' ? '#8b5cf6' : 'var(--bg-surface)',
            color: activeTab === 'SIMULATION' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            padding: '7px 12px',
          }}
          onClick={() => setActiveTab('SIMULATION')}
        >
          <Sliders size={15} />
          <span>Simulation Deck</span>
        </button>

        <button
          className={`btn-secondary ${activeTab === 'MAP_EDITOR' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTab === 'MAP_EDITOR' ? 'var(--primary)' : 'var(--bg-surface)',
            color: activeTab === 'MAP_EDITOR' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            padding: '7px 12px',
          }}
          onClick={() => setActiveTab('MAP_EDITOR')}
        >
          <Map size={15} />
          <span>Venue Map Editor</span>
        </button>

        <button
          className={`btn-secondary ${activeTab === 'ALERTS' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTab === 'ALERTS' ? 'var(--primary)' : 'var(--bg-surface)',
            color: activeTab === 'ALERTS' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            padding: '7px 12px',
          }}
          onClick={() => setActiveTab('ALERTS')}
        >
          <Bell size={15} />
          <span>Safety Alerts</span>
        </button>

        <button
          className={`btn-secondary ${activeTab === 'REPORTS' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTab === 'REPORTS' ? 'var(--primary)' : 'var(--bg-surface)',
            color: activeTab === 'REPORTS' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            padding: '7px 12px',
          }}
          onClick={() => setActiveTab('REPORTS')}
        >
          <Radio size={15} />
          <span>Public Hazard Queue</span>
        </button>

        <button
          className={`btn-secondary ${activeTab === 'EVENTS' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTab === 'EVENTS' ? 'var(--primary)' : 'var(--bg-surface)',
            color: activeTab === 'EVENTS' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            padding: '7px 12px',
          }}
          onClick={() => setActiveTab('EVENTS')}
        >
          <Calendar size={15} />
          <span>Event Registration</span>
        </button>

        <button
          className={`btn-secondary ${activeTab === 'AUDIT' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTab === 'AUDIT' ? 'var(--primary)' : 'var(--bg-surface)',
            color: activeTab === 'AUDIT' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            padding: '7px 12px',
          }}
          onClick={() => setActiveTab('AUDIT')}
        >
          <FileText size={15} />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'LIVE' && (
        <>
          <SimulationControlDeck venue={selectedVenue} />
          <LiveControlCentre venue={selectedVenue} />
        </>
      )}

      {activeTab === 'SIMULATION' && (
        <SimulationControlDeck venue={selectedVenue} />
      )}

      {activeTab === 'MAP_EDITOR' && (
        <VenueMapEditor venue={selectedVenue} />
      )}

      {activeTab === 'ALERTS' && (
        <AlertsManager venue={selectedVenue} />
      )}

      {activeTab === 'REPORTS' && (
        <PublicReportsReview venueId={selectedVenue.id} />
      )}

      {activeTab === 'EVENTS' && (
        <EventManager />
      )}

      {activeTab === 'AUDIT' && (
        <AuditLogViewer venueId={selectedVenue.id} />
      )}
    </div>
  );
};
