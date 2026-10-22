import React from 'react';
import { CrowdRiskLevel, GateStatus, SensorStatus } from '../../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle, ShieldAlert, Wifi, WifiOff } from 'lucide-react';

export const RiskBadge: React.FC<{ level: CrowdRiskLevel; showIcon?: boolean }> = ({ level, showIcon = true }) => {
  switch (level) {
    case 'LOW':
      return (
        <span className="risk-badge risk-low" title="Safe normal crowd density">
          {showIcon && <ShieldCheck size={14} />}
          <span>LOW RISK</span>
        </span>
      );
    case 'MODERATE':
      return (
        <span className="risk-badge risk-moderate" title="Moderate attendance; monitor ingress">
          {showIcon && <AlertTriangle size={14} />}
          <span>MODERATE</span>
        </span>
      );
    case 'HIGH':
      return (
        <span className="risk-badge risk-high" title="Warning threshold reached">
          {showIcon && <AlertTriangle size={14} />}
          <span>HIGH DENSITY</span>
        </span>
      );
    case 'CRITICAL':
      return (
        <span className="risk-badge risk-critical" title="Dangerous crowd density - dispersal required">
          {showIcon && <AlertOctagon size={14} />}
          <span>CRITICAL RISK</span>
        </span>
      );
    case 'UNKNOWN':
    default:
      return (
        <span className="risk-badge risk-unknown" title="Sensor data missing or stale">
          {showIcon && <HelpCircle size={14} />}
          <span>UNKNOWN</span>
        </span>
      );
  }
};

export const GateStatusBadge: React.FC<{ status: GateStatus }> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return <span className="gate-badge gate-open">● OPEN</span>;
    case 'CLOSED':
      return <span className="gate-badge gate-closed">✕ CLOSED</span>;
    case 'RESTRICTED':
      return <span className="gate-badge gate-restricted">⚠ RESTRICTED</span>;
    case 'EMERGENCY_ONLY':
      return <span className="gate-badge gate-emergency">⚡ EMERGENCY ONLY</span>;
    default:
      return <span className="gate-badge">{status}</span>;
  }
};

export const SensorStatusBadge: React.FC<{ status: SensorStatus }> = ({ status }) => {
  switch (status) {
    case 'ONLINE':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#34d399', fontSize: '0.72rem', fontWeight: 600 }}>
          <Wifi size={13} /> ONLINE
        </span>
      );
    case 'OFFLINE':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f87171', fontSize: '0.72rem', fontWeight: 600 }}>
          <WifiOff size={13} /> OFFLINE
        </span>
      );
    case 'STALE':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: '0.72rem', fontWeight: 600 }}>
          <AlertTriangle size={13} /> STALE TELEMETRY
        </span>
      );
    default:
      return <span>{status}</span>;
  }
};
