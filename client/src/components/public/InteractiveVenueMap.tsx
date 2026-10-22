import React, { useState, useEffect } from 'react';
import { Venue, RoutePathResult, MapNode } from '../../types';
import { useRealtime } from '../../context/RealtimeContext';
import { Language, TRANSLATIONS } from '../../utils/i18n';
import { Navigation, AlertTriangle, ShieldCheck, Accessibility, Compass, RotateCcw, AlertOctagon } from 'lucide-react';

interface InteractiveVenueMapProps {
  venue: Venue;
  lang: Language;
  onGateSelect?: (gateId: string) => void;
}

export const InteractiveVenueMap: React.FC<InteractiveVenueMapProps> = ({ venue, lang }) => {
  const { calculateRoute } = useRealtime();
  const t = TRANSLATIONS[lang];

  // Default start at first entry gate, destination at first exit gate
  const entryNodes = venue.nodes.filter(n => {
    const gate = venue.gates.find(g => g.id === n.gateId);
    return gate && (gate.type === 'ENTRY' || gate.type === 'BIDIRECTIONAL');
  });
  const exitNodes = venue.nodes.filter(n => {
    const gate = venue.gates.find(g => g.id === n.gateId);
    return gate && (gate.type === 'EXIT' || gate.type === 'EMERGENCY_EXIT' || gate.type === 'BIDIRECTIONAL');
  });

  const [startNodeId, setStartNodeId] = useState<string>(entryNodes[0]?.id || venue.nodes[0]?.id || '');
  const [targetNodeId, setTargetNodeId] = useState<string>(exitNodes[0]?.id || venue.nodes[venue.nodes.length - 1]?.id || '');
  const [preferAccessible, setPreferAccessible] = useState<boolean>(false);
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<RoutePathResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<MapNode | null>(null);

  // Auto-calculate route on parameter change or when venue updates (e.g. gate closure)
  const computeCurrentRoute = async () => {
    if (!startNodeId || !targetNodeId) return;
    setIsCalculating(true);
    const result = await calculateRoute(venue.id, startNodeId, targetNodeId, preferAccessible, isEmergency);
    setRouteResult(result);
    setIsCalculating(false);
  };

  useEffect(() => {
    computeCurrentRoute();
  }, [venue, startNodeId, targetNodeId, preferAccessible, isEmergency]);

  // SVG dimensions
  const viewBoxWidth = 840;
  const viewBoxHeight = 520;

  // Zone Color Helper
  const getZoneColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return { fill: 'rgba(16, 185, 129, 0.12)', stroke: 'rgba(16, 185, 129, 0.4)' };
      case 'MODERATE': return { fill: 'rgba(245, 158, 11, 0.14)', stroke: 'rgba(245, 158, 11, 0.45)' };
      case 'HIGH': return { fill: 'rgba(249, 115, 22, 0.18)', stroke: 'rgba(249, 115, 22, 0.55)' };
      case 'CRITICAL': return { fill: 'rgba(239, 68, 68, 0.22)', stroke: 'rgba(239, 68, 68, 0.7)' };
      case 'UNKNOWN':
      default: return { fill: 'rgba(168, 85, 247, 0.15)', stroke: 'rgba(168, 85, 247, 0.5)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Route Selector Controls */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.86rem' }}>
            <Navigation size={16} color="var(--primary)" />
            <span>{t.safeRoutes}</span>
          </div>
          <button
            onClick={() => setIsEmergency(!isEmergency)}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: isEmergency ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
              color: isEmergency ? '#fff' : '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <AlertOctagon size={12} />
            <span>{isEmergency ? 'EMERGENCY EVACUATION ON' : 'TEST EVACUATION'}</span>
          </button>
        </div>

        <div className="grid-2" style={{ gap: 8 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
              {t.selectStart}
            </label>
            <select
              value={startNodeId}
              onChange={(e) => setStartNodeId(e.target.value)}
              style={{ width: '100%', fontSize: '0.8rem', padding: '6px 8px' }}
            >
              {venue.nodes.map(n => {
                const gate = venue.gates.find(g => g.id === n.gateId);
                const isClosed = gate?.status === 'CLOSED';
                return (
                  <option key={n.id} value={n.id}>
                    {n.name} {isClosed ? '(CLOSED)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
              {t.selectDestination}
            </label>
            <select
              value={targetNodeId}
              onChange={(e) => setTargetNodeId(e.target.value)}
              style={{ width: '100%', fontSize: '0.8rem', padding: '6px 8px' }}
            >
              {venue.nodes.map(n => {
                const gate = venue.gates.find(g => g.id === n.gateId);
                const isClosed = gate?.status === 'CLOSED';
                return (
                  <option key={n.id} value={n.id}>
                    {n.name} {isClosed ? '(CLOSED)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preferAccessible}
              onChange={(e) => setPreferAccessible(e.target.checked)}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <Accessibility size={14} color="#38bdf8" />
            <span>{t.accessibleOnly}</span>
          </label>

          <button
            className="btn-primary"
            style={{ fontSize: '0.76rem', padding: '5px 12px' }}
            onClick={computeCurrentRoute}
            disabled={isCalculating}
          >
            <Compass size={14} />
            <span>Recalculate Route</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Map Canvas */}
      <div className="map-canvas-container">
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            </pattern>
            {/* Pulsing Marker */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Zones Overlay */}
          {venue.zones.map(zone => {
            const colors = getZoneColor(zone.riskLevel);
            return (
              <g key={zone.id}>
                <rect
                  x={zone.bounds.x}
                  y={zone.bounds.y}
                  width={zone.bounds.width}
                  height={zone.bounds.height}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="2"
                  strokeDasharray={zone.riskLevel === 'UNKNOWN' ? '6 4' : 'none'}
                  rx="12"
                  className={zone.riskLevel === 'CRITICAL' ? 'zone-pulse' : ''}
                />
                <text
                  x={zone.bounds.x + 12}
                  y={zone.bounds.y + 22}
                  fill="var(--text-secondary)"
                  fontSize="12"
                  fontWeight="700"
                >
                  {zone.name.toUpperCase()}
                </text>
                <text
                  x={zone.bounds.x + 12}
                  y={zone.bounds.y + 38}
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {zone.currentCount} visitors ({zone.density} {t.personsPerSqM})
                </text>
              </g>
            );
          })}

          {/* Corridors / Walkways */}
          {venue.corridors.map(c => {
            const from = venue.nodes.find(n => n.id === c.fromNodeId);
            const to = venue.nodes.find(n => n.id === c.toNodeId);
            if (!from || !to) return null;

            const isPartOfActiveRoute = routeResult?.pathCorridors?.some(rc => rc.id === c.id);

            return (
              <g key={c.id}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={
                    c.isBlocked
                      ? '#ef4444'
                      : isPartOfActiveRoute
                      ? '#38bdf8'
                      : 'rgba(255, 255, 255, 0.18)'
                  }
                  strokeWidth={isPartOfActiveRoute ? 6 : c.widthMeters > 3 ? 3 : 2}
                  strokeDasharray={c.isBlocked ? '6 4' : isPartOfActiveRoute ? 'none' : 'none'}
                  strokeLinecap="round"
                  filter={isPartOfActiveRoute ? 'url(#glow)' : undefined}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {venue.nodes.map(n => {
            const isStart = n.id === startNodeId;
            const isTarget = n.id === targetNodeId;
            const gate = venue.gates.find(g => g.id === n.gateId);
            const isClosed = gate?.status === 'CLOSED';
            const isRouteNode = routeResult?.nodes.some(rn => rn.id === n.id);

            let nodeColor = '#94a3b8';
            if (isStart) nodeColor = '#10b981';
            else if (isTarget) nodeColor = isClosed ? '#ef4444' : '#38bdf8';
            else if (isClosed) nodeColor = '#ef4444';
            else if (isRouteNode) nodeColor = '#38bdf8';

            return (
              <g
                key={n.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedNodeDetails(n)}
              >
                <circle
                  cx={n.x}
                  y={n.y}
                  r={isStart || isTarget ? 10 : 6}
                  fill={nodeColor}
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />
                {/* Node Label */}
                <text
                  x={n.x}
                  y={n.y + (n.y > viewBoxHeight - 30 ? -12 : 18)}
                  textAnchor="middle"
                  fill={isStart || isTarget ? '#ffffff' : 'var(--text-secondary)'}
                  fontSize={isStart || isTarget ? '11' : '9'}
                  fontWeight={isStart || isTarget ? '700' : '500'}
                  style={{ pointerEvents: 'none' }}
                >
                  {n.name.split(' (')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Map Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            fontSize: '0.68rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            <span>Origin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#38bdf8' }}></span>
            <span>Target</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
            <span>Closed Gate / Hazard</span>
          </div>
        </div>
      </div>

      {/* Route Guidance Feedback Box */}
      {routeResult && (
        <div
          className="card"
          style={{
            borderLeft: `4px solid ${routeResult.found ? '#10b981' : '#ef4444'}`,
            backgroundColor: routeResult.found ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {routeResult.found ? (
                <ShieldCheck size={20} color="#10b981" />
              ) : (
                <AlertTriangle size={20} color="#ef4444" />
              )}
              <div>
                <h4 style={{ fontSize: '0.92rem', color: routeResult.found ? '#34d399' : '#f87171' }}>
                  {routeResult.found ? 'Verified Safe Route Calculated' : 'Route Guidance Unavailable'}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: 2 }}>
                  {routeResult.message}
                </p>
              </div>
            </div>

            {routeResult.found && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8' }}>
                  ~{routeResult.estimatedMinutes} min
                </span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {routeResult.distanceMeters} metres
                </span>
              </div>
            )}
          </div>

          {/* Warnings along route */}
          {routeResult.warnings.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
              {routeResult.warnings.map((w, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#fbbf24' }}>
                  <AlertTriangle size={12} />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Turn-by-turn sequence */}
          {routeResult.found && routeResult.nodes.length > 1 && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                STEP-BY-STEP WAYPOINTS:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {routeResult.nodes.map((node, i) => (
                  <React.Fragment key={node.id}>
                    <span
                      style={{
                        padding: '2px 8px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: i === 0 ? '#10b981' : i === routeResult.nodes.length - 1 ? '#38bdf8' : 'var(--text-primary)',
                      }}
                    >
                      {node.name.split(' (')[0]}
                    </span>
                    {i < routeResult.nodes.length - 1 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>➔</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Node Details Popup */}
      {selectedNodeDetails && (
        <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{selectedNodeDetails.name}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Type: {selectedNodeDetails.type}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
              onClick={() => {
                setStartNodeId(selectedNodeDetails.id);
                setSelectedNodeDetails(null);
              }}
            >
              Set as Origin
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
              onClick={() => {
                setTargetNodeId(selectedNodeDetails.id);
                setSelectedNodeDetails(null);
              }}
            >
              Set as Target
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
