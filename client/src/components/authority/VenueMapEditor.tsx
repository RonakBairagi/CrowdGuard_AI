import React, { useState } from 'react';
import { Venue, Zone, Gate, Corridor, MapNode } from '../../types';
import { useRealtime } from '../../context/RealtimeContext';
import { 
  Map, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  DoorOpen, 
  DoorClosed, 
  Layers, 
  Info 
} from 'lucide-react';

interface VenueMapEditorProps {
  venue: Venue;
}

export const VenueMapEditor: React.FC<VenueMapEditorProps> = ({ venue }) => {
  const { updateVenueMapLayout } = useRealtime();

  // Local editable draft state
  const [zones, setZones] = useState<Zone[]>(JSON.parse(JSON.stringify(venue.zones)));
  const [gates, setGates] = useState<Gate[]>(JSON.parse(JSON.stringify(venue.gates)));
  const [nodes, setNodes] = useState<MapNode[]>(JSON.parse(JSON.stringify(venue.nodes)));
  const [corridors, setCorridors] = useState<Corridor[]>(JSON.parse(JSON.stringify(venue.corridors)));

  const [activeTab, setActiveTab] = useState<'ZONES' | 'GATES' | 'CORRIDORS'>('ZONES');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // New Gate Form state
  const [newGateName, setNewGateName] = useState('');
  const [newGateType, setNewGateType] = useState<Gate['type']>('EXIT');
  const [newGateAccessible, setNewGateAccessible] = useState(true);

  const handleSaveLayout = async () => {
    setValidationError(null);
    setSaveSuccess(false);

    // Validation (Section 3.C)
    const hasEntry = gates.some(g => g.type === 'ENTRY' || g.type === 'BIDIRECTIONAL');
    const hasExit = gates.some(g => g.type === 'EXIT' || g.type === 'EMERGENCY_EXIT' || g.type === 'BIDIRECTIONAL');

    if (!hasEntry) {
      setValidationError('Validation Error: Venue map must include at least one active Entry Gate.');
      return;
    }

    if (!hasExit) {
      setValidationError('Validation Error: Venue map must include at least one verified Exit or Emergency Exit.');
      return;
    }

    setIsSaving(true);
    const result = await updateVenueMapLayout(venue.id, {
      zones,
      gates,
      nodes,
      corridors,
    });
    setIsSaving(false);

    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setValidationError(result.error || 'Failed to save venue map layout.');
    }
  };

  const handleAddGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGateName.trim()) return;

    const newGateId = `gate-${Date.now()}`;
    const newNodeId = `node-${Date.now()}`;

    // Add MapNode first
    const newNode: MapNode = {
      id: newNodeId,
      name: newGateName,
      x: 100 + Math.floor(Math.random() * 600),
      y: 80 + Math.floor(Math.random() * 350),
      type: 'GATE',
      gateId: newGateId,
      zoneId: zones[0]?.id,
    };

    const newGate: Gate = {
      id: newGateId,
      name: newGateName,
      type: newGateType,
      status: 'OPEN',
      connectedZoneId: zones[0]?.id || '',
      nodeId: newNodeId,
      coords: { x: newNode.x, y: newNode.y },
      accessible: newGateAccessible,
      lastUpdated: new Date().toISOString(),
    };

    // Connect with a corridor to the first existing node
    const firstExistingNode = nodes[0];
    const newCorridor: Corridor = {
      id: `c-new-${Date.now()}`,
      name: `${newGateName} Connector Walkway`,
      fromNodeId: newNodeId,
      toNodeId: firstExistingNode ? firstExistingNode.id : newNodeId,
      lengthMeters: 30,
      widthMeters: 3.5,
      bidirectional: true,
      isAccessible: newGateAccessible,
      isRestricted: false,
      isBlocked: false,
    };

    setNodes([...nodes, newNode]);
    setGates([...gates, newGate]);
    setCorridors([...corridors, newCorridor]);

    setNewGateName('');
  };

  const handleDeleteGate = (gateId: string) => {
    const gateToDelete = gates.find(g => g.id === gateId);
    if (!gateToDelete) return;

    setGates(gates.filter(g => g.id !== gateId));
    setNodes(nodes.filter(n => n.id !== gateToDelete.nodeId));
    setCorridors(corridors.filter(c => c.fromNodeId !== gateToDelete.nodeId && c.toNodeId !== gateToDelete.nodeId));
  };

  const handleToggleCorridorBlock = (corridorId: string) => {
    setCorridors(corridors.map(c => {
      if (c.id === corridorId) {
        return { ...c, isBlocked: !c.isBlocked };
      }
      return c;
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Editor Header */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Map size={18} color="var(--primary)" />
              <span>Venue Map Layout & Topology Editor</span>
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Configure gates, walkways, monitoring zones, and corridors. Updates apply to public navigation maps after verification.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {saveSuccess && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: '0.76rem', fontWeight: 600 }}>
                <CheckCircle size={15} /> Verified & Published!
              </span>
            )}
            <button
              className="btn-primary"
              onClick={handleSaveLayout}
              disabled={isSaving}
            >
              <Save size={15} />
              <span>{isSaving ? 'Verifying...' : 'Save & Publish Map'}</span>
            </button>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className={`btn-secondary ${activeTab === 'ZONES' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTab === 'ZONES' ? 'var(--primary)' : 'var(--bg-surface)',
            color: activeTab === 'ZONES' ? '#fff' : 'var(--text-secondary)',
          }}
          onClick={() => setActiveTab('ZONES')}
        >
          Crowd Zones ({zones.length})
        </button>
        <button
          className={`btn-secondary ${activeTab === 'GATES' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTab === 'GATES' ? 'var(--primary)' : 'var(--bg-surface)',
            color: activeTab === 'GATES' ? '#fff' : 'var(--text-secondary)',
          }}
          onClick={() => setActiveTab('GATES')}
        >
          Gates & Evacuation Portals ({gates.length})
        </button>
        <button
          className={`btn-secondary ${activeTab === 'CORRIDORS' ? 'active' : ''}`}
          style={{
            backgroundColor: activeTab === 'CORRIDORS' ? 'var(--primary)' : 'var(--bg-surface)',
            color: activeTab === 'CORRIDORS' ? '#fff' : 'var(--text-secondary)',
          }}
          onClick={() => setActiveTab('CORRIDORS')}
        >
          Walkway Corridors ({corridors.length})
        </button>
      </div>

      {/* Tab Content 1: Zones */}
      {activeTab === 'ZONES' && (
        <div className="card" style={{ padding: 16 }}>
          <h4 style={{ fontSize: '0.88rem', marginBottom: 12 }}>Configured Crowd-Monitoring Zones</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {zones.map((zone, idx) => (
              <div
                key={zone.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{zone.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ID: {zone.id} • Assigned Sensor: {zone.sensorId || 'None'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Safe Capacity: </span>
                    <input
                      type="number"
                      value={zone.capacity}
                      onChange={(e) => {
                        const newCap = Number(e.target.value);
                        setZones(zones.map(z => z.id === zone.id ? { ...z, capacity: newCap } : z));
                      }}
                      style={{ width: 80, padding: '3px 6px', fontSize: '0.76rem' }}
                    />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Area (m²): </span>
                    <input
                      type="number"
                      value={zone.areaSqM}
                      onChange={(e) => {
                        const newArea = Number(e.target.value);
                        setZones(zones.map(z => z.id === zone.id ? { ...z, areaSqM: newArea } : z));
                      }}
                      style={{ width: 75, padding: '3px 6px', fontSize: '0.76rem' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Gates */}
      {activeTab === 'GATES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Add New Gate Form */}
          <form onSubmit={handleAddGate} className="card" style={{ padding: 14 }}>
            <h4 style={{ fontSize: '0.86rem', marginBottom: 10 }}>Add New Gate or Emergency Exit</h4>
            <div className="grid-4" style={{ gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Gate Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gate 6 (VIP / North)"
                  value={newGateName}
                  onChange={(e) => setNewGateName(e.target.value)}
                  style={{ width: '100%', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Type</label>
                <select
                  value={newGateType}
                  onChange={(e) => setNewGateType(e.target.value as any)}
                  style={{ width: '100%', fontSize: '0.78rem' }}
                >
                  <option value="ENTRY">Entry Gate</option>
                  <option value="EXIT">Exit Gate</option>
                  <option value="EMERGENCY_EXIT">Emergency Exit</option>
                  <option value="BIDIRECTIONAL">Bidirectional</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newGateAccessible}
                    onChange={(e) => setNewGateAccessible(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Wheelchair Accessible</span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '0.76rem' }}>
                  <Plus size={14} /> Add Gate
                </button>
              </div>
            </div>
          </form>

          {/* Gates List */}
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: '0.88rem', marginBottom: 12 }}>Configured Gates</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gates.map(gate => (
                <div
                  key={gate.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{gate.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Type: {gate.type} • Status: {gate.status} • {gate.accessible ? '♿ Accessible' : 'Standard'}
                    </div>
                  </div>

                  <button
                    className="btn-secondary"
                    style={{ color: '#f87171', padding: '4px 8px' }}
                    onClick={() => handleDeleteGate(gate.id)}
                    title="Remove gate"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Corridors */}
      {activeTab === 'CORRIDORS' && (
        <div className="card" style={{ padding: 16 }}>
          <h4 style={{ fontSize: '0.88rem', marginBottom: 12 }}>Pedestrian Walkways & Corridors</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {corridors.map(c => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${c.isBlocked ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Length: {c.lengthMeters}m • Width: {c.widthMeters}m • {c.bidirectional ? 'Bidirectional' : 'One-way'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.72rem', color: c.isBlocked ? '#f87171' : '#34d399', fontWeight: 600 }}>
                    {c.isBlocked ? '🚫 BLOCKED' : '✓ CLEAR'}
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                    onClick={() => handleToggleCorridorBlock(c.id)}
                  >
                    {c.isBlocked ? 'Unblock Passage' : 'Simulate Blockage'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
