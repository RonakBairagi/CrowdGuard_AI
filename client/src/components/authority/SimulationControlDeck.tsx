import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Venue } from '../../types';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertOctagon, 
  DoorClosed, 
  DoorOpen, 
  WifiOff, 
  Wifi, 
  RotateCcw, 
  BellRing, 
  CheckCircle, 
  Play, 
  SlidersHorizontal 
} from 'lucide-react';

interface SimulationControlDeckProps {
  venue: Venue;
}

export const SimulationControlDeck: React.FC<SimulationControlDeckProps> = ({ venue }) => {
  const { runSimulationAction, updateGateStatus, updateSensorStatus } = useRealtime();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleAction = async (action: string, params: Record<string, any> = {}) => {
    setActiveAction(action);
    const ok = await runSimulationAction(action, { venueId: venue.id, ...params });
    setActiveAction(null);
    if (ok) {
      showFeedback(`Executed action: ${action}`);
    }
  };

  // Find Exit Gate 3 or first exit
  const exitGate = venue.gates.find(g => g.type === 'EXIT' || g.type === 'EMERGENCY_EXIT');
  const isExitClosed = exitGate?.status === 'CLOSED';

  // Find First Sensor
  const firstSensor = venue.sensors[0];
  const isSensorOffline = firstSensor?.status === 'OFFLINE';

  return (
    <div className="card" style={{ padding: 18, border: '1px solid rgba(139, 92, 246, 0.4)', background: 'linear-gradient(180deg, #12182b 0%, #0d1222 100%)' }}>
      {/* Simulation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, background: 'rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-md)', color: '#c084fc' }}>
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Simulated Telemetry & Event Controller</h3>
              <span className="demo-badge-tag">DEMO DATA — NOT LIVE REAL-WORLD MONITORING</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Inject telemetry shifts and safety triggers. Changes reflect instantaneously in the Public Interface via WebSockets.
            </p>
          </div>
        </div>

        {feedbackMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
            <CheckCircle size={14} />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* Control Buttons Grid */}
      <div className="grid-3" style={{ gap: 10 }}>
        {/* Scenario 1: Crowd Influx Increase */}
        <button
          className="btn-secondary"
          style={{ padding: '10px 12px', justifyContent: 'flex-start', borderLeft: '3px solid #38bdf8' }}
          onClick={() => handleAction('INCREASE_CROWD', { delta: 120 })}
          disabled={activeAction !== null}
        >
          <TrendingUp size={16} color="#38bdf8" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Simulate Ingress Spike</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>+120 persons into active zones</div>
          </div>
        </button>

        {/* Scenario 2: Crowd Dispersal */}
        <button
          className="btn-secondary"
          style={{ padding: '10px 12px', justifyContent: 'flex-start', borderLeft: '3px solid #10b981' }}
          onClick={() => handleAction('DECREASE_CROWD', { delta: 90 })}
          disabled={activeAction !== null}
        >
          <TrendingDown size={16} color="#10b981" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Simulate Crowd Dispersal</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>-90 persons via open exits</div>
          </div>
        </button>

        {/* Scenario 3: Critical Danger Surge */}
        <button
          className="btn-secondary"
          style={{ padding: '10px 12px', justifyContent: 'flex-start', borderLeft: '3px solid #ef4444' }}
          onClick={() => handleAction('SUDDEN_SURGE')}
          disabled={activeAction !== null}
        >
          <AlertOctagon size={16} color="#ef4444" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f87171' }}>Simulate Sudden Surge</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Triggers CRITICAL Risk Alert</div>
          </div>
        </button>

        {/* Scenario 4: Gate Closure Toggle (Demonstration Step 6 & 7) */}
        <button
          className="btn-secondary"
          style={{
            padding: '10px 12px',
            justifyContent: 'flex-start',
            borderLeft: `3px solid ${isExitClosed ? '#10b981' : '#f59e0b'}`,
          }}
          onClick={() => {
            if (exitGate) {
              const nextStatus = isExitClosed ? 'OPEN' : 'CLOSED';
              updateGateStatus(venue.id, exitGate.id, nextStatus, `Simulated toggle to ${nextStatus}`);
              showFeedback(`Toggled ${exitGate.name} to ${nextStatus}`);
            }
          }}
        >
          {isExitClosed ? <DoorOpen size={16} color="#10b981" /> : <DoorClosed size={16} color="#f59e0b" />}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>
              {isExitClosed ? `Reopen ${exitGate?.name.split(' (')[0]}` : `Close ${exitGate?.name.split(' (')[0]}`}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {isExitClosed ? 'Restores open route' : 'Reroutes pedestrian paths'}
            </div>
          </div>
        </button>

        {/* Scenario 5: Sensor Disconnect / Failure (Demonstration Step 8 & 9) */}
        <button
          className="btn-secondary"
          style={{
            padding: '10px 12px',
            justifyContent: 'flex-start',
            borderLeft: `3px solid ${isSensorOffline ? '#34d399' : '#a855f7'}`,
          }}
          onClick={() => {
            if (firstSensor) {
              const nextStatus = isSensorOffline ? 'ONLINE' : 'OFFLINE';
              updateSensorStatus(venue.id, firstSensor.id, nextStatus);
              showFeedback(`Sensor set to ${nextStatus}; Zone state updated`);
            }
          }}
        >
          {isSensorOffline ? <Wifi size={16} color="#34d399" /> : <WifiOff size={16} color="#a855f7" />}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>
              {isSensorOffline ? 'Restore Sensor Telemetry' : 'Simulate Sensor Failure'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {isSensorOffline ? 'Restores zone confidence' : 'Zone transitions to UNKNOWN'}
            </div>
          </div>
        </button>

        {/* Scenario 6: Reset Clean State */}
        <button
          className="btn-secondary"
          style={{ padding: '10px 12px', justifyContent: 'flex-start', borderLeft: '3px solid #64748b' }}
          onClick={() => handleAction('RESET_DEFAULT')}
          disabled={activeAction !== null}
        >
          <RotateCcw size={16} color="#94a3b8" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Reset Demo Data</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Restore baseline safe state</div>
          </div>
        </button>
      </div>
    </div>
  );
};
