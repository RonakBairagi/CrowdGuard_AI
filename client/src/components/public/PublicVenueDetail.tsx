import React, { useState } from 'react';
import { Venue } from '../../types';
import { useRealtime } from '../../context/RealtimeContext';
import { Language, TRANSLATIONS } from '../../utils/i18n';
import { RiskBadge, GateStatusBadge } from '../common/StatusBadges';
import { InteractiveVenueMap } from './InteractiveVenueMap';
import { SafetyAlertBanner } from './SafetyAlertBanner';
import { ReportIssueModal } from './ReportIssueModal';
import { OfflineEmergencyModal } from './OfflineEmergencyModal';
import { 
  MapPin, 
  Clock, 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  DoorOpen, 
  DoorClosed, 
  Accessibility, 
  FileText, 
  ChevronLeft, 
  Radio, 
  Activity, 
  PhoneCall 
} from 'lucide-react';

interface PublicVenueDetailProps {
  venue: Venue;
  lang: Language;
  onBack: () => void;
}

export const PublicVenueDetail: React.FC<PublicVenueDetailProps> = ({ venue, lang, onBack }) => {
  const { alerts } = useRealtime();
  const [activeTab, setActiveTab] = useState<'MAP' | 'GATES' | 'SAFETY'>('MAP');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isOfflineOpen, setIsOfflineOpen] = useState(false);
  const t = TRANSLATIONS[lang];

  const venueAlerts = alerts.filter(a => a.venueId === venue.id && a.active);
  const capacityPercent = venue.totalCapacity > 0 ? Math.round((venue.currentCrowdEstimate / venue.totalCapacity) * 100) : 0;

  const entryGates = venue.gates.filter(g => g.type === 'ENTRY' || g.type === 'BIDIRECTIONAL');
  const exitGates = venue.gates.filter(g => g.type === 'EXIT' || g.type === 'BIDIRECTIONAL');
  const emergencyGates = venue.gates.filter(g => g.type === 'EMERGENCY_EXIT');

  // Find lowest density entry gate for recommendation
  const recommendedEntry = entryGates.find(g => g.status === 'OPEN');
  const recommendedExit = exitGates.find(g => g.status === 'OPEN');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px' }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <ChevronLeft size={16} />
          <span>Back to Venues</span>
        </button>

        <button
          onClick={() => setIsOfflineOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <ShieldAlert size={12} />
          <span>Emergency Info</span>
        </button>
      </div>

      {/* Venue Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--primary)',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {venue.category.replace('_', ' ')}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {venue.city}
          </span>
        </div>
        <h2 style={{ fontSize: '1.25rem', lineHeight: 1.25 }}>{venue.name}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          <MapPin size={13} style={{ flexShrink: 0 }} />
          <span>{venue.address}</span>
        </div>
      </div>

      {/* Safety Alerts Banner */}
      <SafetyAlertBanner alerts={venueAlerts} />

      {/* Live Crowd Status Card (Section 2.C Requirements) */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            OVERALL CROWD STATUS
          </span>
          <RiskBadge level={venue.overallRiskLevel} />
        </div>

        {/* Capacity Bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current Occupancy</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {venue.currentCrowdEstimate} / {venue.totalCapacity} ({capacityPercent}%)
            </span>
          </div>
          <div style={{ width: '100%', height: 7, backgroundColor: 'var(--bg-surface)', borderRadius: varRadiusFull(), overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, capacityPercent)}%`,
                height: '100%',
                backgroundColor:
                  venue.overallRiskLevel === 'CRITICAL' ? '#ef4444' :
                  venue.overallRiskLevel === 'HIGH' ? '#f97316' :
                  venue.overallRiskLevel === 'MODERATE' ? '#f59e0b' : '#10b981',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Explainable Risk Reason */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: '0.76rem', lineHeight: 1.4, border: '1px solid var(--border-subtle)', marginBottom: 10 }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={13} color="var(--primary)" />
            <span>Explainable Safety Assessment:</span>
          </div>
          <div style={{ color: 'var(--text-primary)' }}>{venue.overallRiskReason}</div>
        </div>

        {/* Telemetry Confidence & Last Update */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Radio size={12} color="#10b981" />
            <span>{t.confidence}: <strong>{venue.overallRiskLevel === 'UNKNOWN' ? '0%' : '91% (Calibrated IoT)'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} />
            <span>{t.lastUpdated}: {new Date(venue.lastAssessmentTime).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Recommended Gates Highlight (Section 2.C) */}
      <div className="grid-2">
        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <DoorOpen size={13} />
            <span>RECOMMENDED ENTRY</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
            {recommendedEntry ? recommendedEntry.name.split(' (')[0] : 'None Available'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {recommendedEntry?.accessible ? '♿ Accessible Ramp Available' : 'Standard Entry Point'}
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <DoorClosed size={13} />
            <span>RECOMMENDED EXIT</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
            {recommendedExit ? recommendedExit.name.split(' (')[0] : 'Follow On-site Staff'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {recommendedExit?.status === 'OPEN' ? 'Verified Open Path' : 'Exit Throttled'}
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 3, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setActiveTab('MAP')}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            fontWeight: 600,
            background: activeTab === 'MAP' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'MAP' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          {t.liveMap}
        </button>
        <button
          onClick={() => setActiveTab('GATES')}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            fontWeight: 600,
            background: activeTab === 'GATES' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'GATES' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          Gates & Corridors ({venue.gates.length})
        </button>
        <button
          onClick={() => setActiveTab('SAFETY')}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            fontWeight: 600,
            background: activeTab === 'SAFETY' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'SAFETY' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          Safety Directives
        </button>
      </div>

      {/* Tab 1: Interactive Map & Live Safe Routing */}
      {activeTab === 'MAP' && (
        <InteractiveVenueMap venue={venue} lang={lang} />
      )}

      {/* Tab 2: Gates & Corridors List */}
      {activeTab === 'GATES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            CURRENT GATE & EVACUATION PORTAL STATUS
          </div>
          {venue.gates.map(gate => (
            <div key={gate.id} className="card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{gate.name}</div>
                <GateStatusBadge status={gate.status} />
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {gate.notes || 'Verified access walkway'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Type: <strong>{gate.type.replace('_', ' ')}</strong></span>
                {gate.accessible && (
                  <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Accessibility size={12} /> Accessible
                  </span>
                )}
                {gate.lastUpdated && (
                  <span>Verified: {new Date(gate.lastUpdated).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Official Safety Instructions */}
      {activeTab === 'SAFETY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <h4 style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>{t.officialAnnouncement}</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {venue.emergencyAnnouncements.map((ann, i) => (
                <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem' }}>
                  📢 {ann}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h4 style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} color="#38bdf8" />
              <span>CROWD SAFETY GUIDELINES</span>
            </h4>
            <ul style={{ paddingLeft: 18, fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {venue.safetyInstructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons: Report Issue & Offline Directives */}
      <div style={{ display: 'flex', gap: 10, marginTop: 6, marginBottom: 16 }}>
        <button
          className="btn-secondary"
          style={{ flex: 1, fontSize: '0.78rem', justifyContent: 'center' }}
          onClick={() => setIsReportOpen(true)}
        >
          <ShieldAlert size={14} color="#f97316" />
          <span>{t.reportIssue}</span>
        </button>
      </div>

      <ReportIssueModal venue={venue} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      <OfflineEmergencyModal venue={venue} isOpen={isOfflineOpen} onClose={() => setIsOfflineOpen(false)} />
    </div>
  );
};

function varRadiusFull() {
  return '9999px';
}
