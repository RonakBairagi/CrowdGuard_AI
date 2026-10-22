import React, { useState } from 'react';
import { Venue, GateStatus } from '../../types';
import { useRealtime } from '../../context/RealtimeContext';
import { RiskBadge, GateStatusBadge, SensorStatusBadge } from '../common/StatusBadges';
import { 
  Users, 
  Activity, 
  ArrowDownRight, 
  ArrowUpRight, 
  ShieldAlert, 
  Wifi, 
  DoorClosed, 
  DoorOpen, 
  Clock, 
  Sliders, 
  CheckCircle, 
  Radio 
} from 'lucide-react';

interface LiveControlCentreProps {
  venue: Venue;
}

export const LiveControlCentre: React.FC<LiveControlCentreProps> = ({ venue }) => {
  const { updateGateStatus, updateZoneMetrics, updateSensorStatus, alerts, reports } = useRealtime();
  const [selectedZoneId, setSelectedZoneId] = useState<string>(venue.zones[0]?.id || '');
  const [manualCount, setManualCount] = useState<number>(300);

  const activeVenueAlerts = alerts.filter(a => a.venueId === venue.id && a.active);
  const pendingReports = reports.filter(r => r.venueId === venue.id && r.status === 'UNVERIFIED');

  const selectedZone = venue.zones.find(z => z.id === selectedZoneId) || venue.zones[0];

  const handleGateToggle = (gateId: string, currentStatus: GateStatus) => {
    const nextStatus: GateStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    updateGateStatus(venue.id, gateId, nextStatus, `Manual authority override to ${nextStatus}`);
  };

  const handleApplyZoneOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;
    updateZoneMetrics(venue.id, selectedZone.id, { currentCount: Number(manualCount) });
  };

  const capacityRatio = venue.totalCapacity > 0 ? Math.round((venue.currentCrowdEstimate / venue.totalCapacity) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Telemetry KPI Bar */}
      <div className="grid-4" style={{ gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL VENUE OCCUPANCY</span>
            <Users size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>
            {venue.currentCrowdEstimate}
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}> / {venue.totalCapacity}</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: capacityRatio > 80 ? '#f87171' : '#34d399', marginTop: 2 }}>
            {capacityRatio}% safe capacity utilization
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>OVERALL RISK ASSESSMENT</span>
            <Activity size={16} color={venue.overallRiskLevel === 'CRITICAL' ? '#ef4444' : '#10b981'} />
          </div>
          <div style={{ marginTop: 2 }}>
            <RiskBadge level={venue.overallRiskLevel} />
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {venue.overallRiskReason}
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ACTIVE VERIFIED ALERTS</span>
            <ShieldAlert size={16} color={activeVenueAlerts.length > 0 ? '#f59e0b' : '#34d399'} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: activeVenueAlerts.length > 0 ? '#fbbf24' : '#34d399' }}>
            {activeVenueAlerts.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {activeVenueAlerts.length > 0 ? 'Publicly broadcasting' : 'Normal conditions'}
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>UNVERIFIED PUBLIC REPORTS</span>
            <Radio size={16} color={pendingReports.length > 0 ? '#f97316' : '#94a3b8'} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: pendingReports.length > 0 ? '#f97316' : 'var(--text-primary)' }}>
            {pendingReports.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Awaiting authority verification
          </div>
        </div>
      </div>

      {/* Main Grid: Zone Telemetry Heatmap & Gate Control Center */}
      <div className="grid-2" style={{ gap: 14 }}>
        {/* Left Column: Zone Breakdown & Risk Reasoning */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.95rem' }}>Zone Monitoring & Inflow Telemetry</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {venue.zones.map(zone => {
              const sensor = venue.sensors.find(s => s.id === zone.sensorId);
              const isSelected = zone.id === selectedZoneId;

              return (
                <div
                  key={zone.id}
                  onClick={() => {
                    setSelectedZoneId(zone.id);
                    setManualCount(zone.currentCount);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-surface)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? '#38bdf8' : 'var(--text-primary)' }}>
                        {zone.name}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                        Sensor: {sensor?.name || 'Unassigned'} • Area: {zone.areaSqM} m²
                      </div>
                    </div>
                    <RiskBadge level={zone.riskLevel} />
                  </div>

                  {/* Density & Inflow/Outflow metrics */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', marginTop: 4 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span>
                        Count: <strong>{zone.currentCount}</strong> / {zone.capacity}
                      </span>
                      <span>
                        Density: <strong>{zone.density}</strong> p/m²
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ArrowUpRight size={12} /> +{zone.inflowRate}/m
                      </span>
                      <span style={{ color: '#93c5fd', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ArrowDownRight size={12} /> -{zone.outflowRate}/m
                      </span>
                    </div>
                  </div>

                  {/* Explainable Reasoning */}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)', paddingTop: 4 }}>
                    {zone.riskReason}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Density Override Form */}
          {selectedZone && (
            <form onSubmit={handleApplyZoneOverride} style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={13} color="var(--primary)" />
                <span>Override Metrics for "{selectedZone.name}"</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  value={manualCount}
                  onChange={(e) => setManualCount(Number(e.target.value))}
                  style={{ width: 140, fontSize: '0.8rem' }}
                />
                <button type="submit" className="btn-secondary" style={{ fontSize: '0.76rem', padding: '6px 12px' }}>
                  Update Count & Re-evaluate Risk
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Gate Status Control Room */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.95rem' }}>Gate Ingress & Egress Control</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Instant propagation to Public Maps
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {venue.gates.map(gate => {
              const isOpen = gate.status === 'OPEN';
              const isClosed = gate.status === 'CLOSED';

              return (
                <div
                  key={gate.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{gate.name}</span>
                      <GateStatusBadge status={gate.status} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {gate.notes || 'Connecting pedestrian route'} • Type: {gate.type.replace('_', ' ')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className={isOpen ? 'btn-danger' : 'btn-primary'}
                      style={{ fontSize: '0.74rem', padding: '5px 12px' }}
                      onClick={() => handleGateToggle(gate.id, gate.status)}
                    >
                      {isOpen ? (
                        <>
                          <DoorClosed size={14} /> Close Gate
                        </>
                      ) : (
                        <>
                          <DoorOpen size={14} /> Reopen Gate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connected Sensors Telemetry */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
              HARDWARE SENSOR TELEMETRY & HEALTH
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {venue.sensors.map(sensor => (
                <div
                  key={sensor.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <strong>{sensor.name}</strong>
                    <div style={{ color: 'var(--text-muted)' }}>
                      ID: {sensor.id} • Firmware: {sensor.firmwareVersion || 'v1.0'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SensorStatusBadge status={sensor.status} />
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                      onClick={() => {
                        const next = sensor.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
                        updateSensorStatus(venue.id, sensor.id, next);
                      }}
                    >
                      {sensor.status === 'ONLINE' ? 'Cut Signal' : 'Restore'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
