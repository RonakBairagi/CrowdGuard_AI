import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Venue, SafetyAlert } from '../../types';
import { Language, TRANSLATIONS } from '../../utils/i18n';
import { PublicVenueDetail } from './PublicVenueDetail';
import { RiskBadge } from '../common/StatusBadges';
import { SafetyAlertBanner } from './SafetyAlertBanner';
import { ReportIssueModal } from './ReportIssueModal';
import { OfflineEmergencyModal } from './OfflineEmergencyModal';
import { 
  MapPin, 
  Search, 
  Filter, 
  ShieldAlert, 
  DoorOpen, 
  DoorClosed, 
  Navigation, 
  Bell, 
  HelpCircle, 
  Home, 
  Map as MapIcon, 
  ChevronRight, 
  Crosshair, 
  Layers 
} from 'lucide-react';

interface PublicMobileAppProps {
  lang: Language;
}

export const PublicMobileApp: React.FC<PublicMobileAppProps> = ({ lang }) => {
  const { venues, alerts } = useRealtime();
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [simulatedGpsActive, setSimulatedGpsActive] = useState<boolean>(true);
  const [manualLocation, setManualLocation] = useState<string>('Kolkata Central');
  const [activeBottomNav, setActiveBottomNav] = useState<'HOME' | 'MAP' | 'ALERTS' | 'REPORT' | 'OFFLINE'>('HOME');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isOfflineOpen, setIsOfflineOpen] = useState(false);

  const t = TRANSLATIONS[lang];

  const categories = [
    { key: 'ALL', label: 'All Places' },
    { key: 'DURGA_PUJA', label: 'Durga Puja' },
    { key: 'RAILWAY_STATION', label: 'Railway Stations' },
    { key: 'METRO', label: 'Metro' },
    { key: 'FESTIVAL', label: 'Festivals' },
    { key: 'CONCERT', label: 'Concerts' },
  ];

  // Filter venues
  const filteredVenues = venues.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  // If currently inspecting a specific venue
  if (selectedVenue) {
    return (
      <div className="mobile-content-area">
        <PublicVenueDetail
          venue={selectedVenue}
          lang={lang}
          onBack={() => setSelectedVenueId(null)}
        />
      </div>
    );
  }

  return (
    <div className="mobile-content-area" style={{ padding: '14px 16px' }}>
      {/* Location Bar with GPS / Manual Switch (Section 2.A) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          <MapPin size={15} color="var(--primary)" />
          <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {simulatedGpsActive ? 'North Kolkata (Simulated GPS)' : manualLocation}
          </span>
        </div>

        <button
          onClick={() => setSimulatedGpsActive(!simulatedGpsActive)}
          style={{
            background: 'transparent',
            color: simulatedGpsActive ? '#38bdf8' : 'var(--text-muted)',
            fontSize: '0.7rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          title={simulatedGpsActive ? 'Click to switch to manual location input' : 'Click to enable simulated GPS'}
        >
          <Crosshair size={13} />
          <span>{simulatedGpsActive ? 'GPS ON' : 'MANUAL'}</span>
        </button>
      </div>

      {/* Manual Location Selector dropdown if GPS is toggled off */}
      {!simulatedGpsActive && (
        <div style={{ marginBottom: 12 }}>
          <select
            value={manualLocation}
            onChange={(e) => setManualLocation(e.target.value)}
            style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <option value="North Kolkata (Baghbazar)">North Kolkata (Baghbazar / Shyambazar)</option>
            <option value="Howrah Station Hub">Howrah Railway Terminal & Subways</option>
            <option value="South Kolkata (Gariahat)">South Kolkata (Gariahat / Deshapriya)</option>
            <option value="Salt Lake Stadium Zone">Salt Lake Stadium & Yuva Bharati</option>
          </select>
        </div>
      )}

      {/* Global Active Safety Alerts Banner */}
      <SafetyAlertBanner alerts={alerts} />

      {/* Search Input (Section 2.B) */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search
          size={16}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', paddingLeft: 36, fontSize: '0.82rem' }}
        />
      </div>

      {/* Category Pills (Section 2.B) */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 12,
          scrollbarWidth: 'none',
        }}
      >
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setSelectedCategory(c.key)}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.74rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: selectedCategory === c.key ? 'var(--primary)' : 'var(--bg-surface)',
              color: selectedCategory === c.key ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${selectedCategory === c.key ? 'var(--primary)' : 'var(--border-subtle)'}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Section Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
          {t.nearbyVenues} ({filteredVenues.length})
        </h3>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Real-time updates</span>
      </div>

      {/* Venue Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredVenues.map(venue => {
          const openGates = venue.gates.filter(g => g.status === 'OPEN').length;
          const totalGates = venue.gates.length;

          return (
            <div
              key={venue.id}
              className="card"
              onClick={() => setSelectedVenueId(venue.id)}
              style={{ cursor: 'pointer', padding: 14 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {venue.category.replace('_', ' ')}
                  </span>
                  <h4 style={{ fontSize: '0.96rem', marginTop: 1, color: 'var(--text-primary)' }}>
                    {venue.name}
                  </h4>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {venue.activeEventName}
                  </div>
                </div>
                <RiskBadge level={venue.overallRiskLevel} />
              </div>

              {/* Crowd count & gate indicators */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.72rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Crowd: <strong style={{ color: 'var(--text-primary)' }}>{venue.currentCrowdEstimate}</strong> / {venue.totalCapacity}
                  </span>
                  <span style={{ color: openGates > 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                    {openGates}/{totalGates} Gates Open
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--primary)', fontWeight: 600 }}>
                  <span>View Map</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Tiles */}
      <div className="grid-2" style={{ marginTop: 14 }}>
        <div
          className="card"
          onClick={() => {
            if (venues[0]) setSelectedVenueId(venues[0].id);
          }}
          style={{ cursor: 'pointer', padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{ padding: 8, borderRadius: 'var(--radius-md)', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Navigation size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Safe Route Guide</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Avoid closed gates</div>
          </div>
        </div>

        <div
          className="card"
          onClick={() => setIsOfflineOpen(true)}
          style={{ cursor: 'pointer', padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{ padding: 8, borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Offline Directives</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Emergency protocols</div>
          </div>
        </div>
      </div>

      {venues[0] && (
        <OfflineEmergencyModal
          venue={venues[0]}
          isOpen={isOfflineOpen}
          onClose={() => setIsOfflineOpen(false)}
        />
      )}
    </div>
  );
};
