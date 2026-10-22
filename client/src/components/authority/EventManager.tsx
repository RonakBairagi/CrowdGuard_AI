import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Venue } from '../../types';
import { Calendar, Plus, CheckCircle, ShieldCheck, MapPin, Users, Clock } from 'lucide-react';

export const EventManager: React.FC = () => {
  const { createEventVenue, venues } = useRealtime();

  const [eventName, setEventName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [category, setCategory] = useState<Venue['category']>('PUBLIC_GATHERING');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Kolkata');
  const [capacity, setCapacity] = useState(2000);
  const [operatingHours, setOperatingHours] = useState('08:00 AM - 11:00 PM');
  const [chiefContact, setChiefContact] = useState('+91 98300 11223');
  const [safetyInstructions, setSafetyInstructions] = useState('Keep moving through marked barricades.\nFollow on-duty volunteer instructions.\nDo not block emergency fire exits.');

  const [createdSuccess, setCreatedSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !venueName.trim()) return;

    setIsSubmitting(true);
    const newVenue = await createEventVenue({
      name: venueName,
      activeEventName: eventName,
      category,
      address,
      city,
      totalCapacity: Number(capacity),
      operatingHours,
      emergencyContacts: [
        { role: 'Event Safety Director', phone: chiefContact },
        { role: 'Police Control Room', phone: '100' },
      ],
      safetyInstructions: safetyInstructions.split('\n').filter(s => s.trim().length > 0),
      zones: [
        {
          id: `zone-${Date.now()}-entry`,
          name: 'Main Assembly Plaza',
          areaSqM: Math.round(capacity * 0.4),
          capacity: Math.round(capacity * 0.6),
          currentCount: 100,
          density: 0.25,
          inflowRate: 30,
          outflowRate: 28,
          riskLevel: 'LOW',
          riskReason: 'New venue initialized. Normal flow.',
          confidence: 90,
          lastUpdated: new Date().toISOString(),
          bounds: { x: 80, y: 60, width: 320, height: 220 },
        },
        {
          id: `zone-${Date.now()}-hall`,
          name: 'Main Stage / Hall',
          areaSqM: Math.round(capacity * 0.5),
          capacity: Math.round(capacity * 0.4),
          currentCount: 80,
          density: 0.2,
          inflowRate: 25,
          outflowRate: 25,
          riskLevel: 'LOW',
          riskReason: 'Normal flow.',
          confidence: 90,
          lastUpdated: new Date().toISOString(),
          bounds: { x: 440, y: 60, width: 320, height: 220 },
        },
      ],
      gates: [
        {
          id: `gate-${Date.now()}-1`,
          name: 'Gate 1 (Main Ingress)',
          type: 'ENTRY',
          status: 'OPEN',
          connectedZoneId: `zone-${Date.now()}-entry`,
          nodeId: `node-${Date.now()}-1`,
          coords: { x: 80, y: 170 },
          accessible: true,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: `gate-${Date.now()}-2`,
          name: 'Gate 2 (Main Dispersal Exit)',
          type: 'EXIT',
          status: 'OPEN',
          connectedZoneId: `zone-${Date.now()}-hall`,
          nodeId: `node-${Date.now()}-2`,
          coords: { x: 740, y: 170 },
          accessible: true,
          lastUpdated: new Date().toISOString(),
        },
      ],
      nodes: [
        { id: `node-${Date.now()}-1`, name: 'Gate 1 Entry', x: 80, y: 170, type: 'GATE' },
        { id: `node-${Date.now()}-hub`, name: 'Central Aisle Junction', x: 410, y: 170, type: 'JUNCTION' },
        { id: `node-${Date.now()}-2`, name: 'Gate 2 Exit', x: 740, y: 170, type: 'GATE' },
      ],
      corridors: [
        {
          id: `c-${Date.now()}-1`,
          name: 'Entry to Aisle',
          fromNodeId: `node-${Date.now()}-1`,
          toNodeId: `node-${Date.now()}-hub`,
          lengthMeters: 40,
          widthMeters: 4.0,
          bidirectional: true,
          isAccessible: true,
          isRestricted: false,
          isBlocked: false,
        },
        {
          id: `c-${Date.now()}-2`,
          name: 'Aisle to Exit',
          fromNodeId: `node-${Date.now()}-hub`,
          toNodeId: `node-${Date.now()}-2`,
          lengthMeters: 40,
          widthMeters: 4.0,
          bidirectional: true,
          isAccessible: true,
          isRestricted: false,
          isBlocked: false,
        },
      ],
      sensors: [],
    });
    setIsSubmitting(false);

    if (newVenue) {
      setCreatedSuccess(`Event "${newVenue.activeEventName}" published successfully.`);
      setEventName('');
      setVenueName('');
      setAddress('');
      setTimeout(() => setCreatedSuccess(null), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(236, 72, 153, 0.15)', borderRadius: 'var(--radius-md)', color: '#ec4899' }}>
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem' }}>Authorized Event & Venue Registration</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Configure event boundaries, authorized assessment capacities, and emergency guidelines (Section 3.B).
              </p>
            </div>
          </div>

          {createdSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '5px 12px', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle size={15} />
              <span>{createdSuccess}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="grid-2" style={{ gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                Event / Festival Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kolkata International Book Fair 2026"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                Venue / Complex Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Boi Mela Prangan, Central Park Salt Lake"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="grid-3" style={{ gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                style={{ width: '100%' }}
              >
                <option value="BOOK_FAIR">Book Fair / Exhibition</option>
                <option value="DURGA_PUJA">Durga Puja / Cultural Pandal</option>
                <option value="RAILWAY_STATION">Railway Station / Terminal</option>
                <option value="METRO">Metro Station</option>
                <option value="FESTIVAL">Festival / Fairgrounds</option>
                <option value="CONCERT">Concert / Live Music</option>
                <option value="STADIUM">Sports Stadium</option>
                <option value="PUBLIC_GATHERING">Public Gathering / Rally</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                Safe Capacity (Authorized Safety Assessment) *
              </label>
              <input
                type="number"
                required
                min="100"
                max="100000"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                Operating Hours
              </label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                Full Address & Landmarks
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Salt Lake Sector II, Kolkata - 700091"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                Chief Safety Marshal / Police Contact Phone
              </label>
              <input
                type="text"
                value={chiefContact}
                onChange={(e) => setChiefContact(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
              Applicable Safety Instructions (One per line)
            </label>
            <textarea
              rows={3}
              value={safetyInstructions}
              onChange={(e) => setSafetyInstructions(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Plus size={15} />
              <span>{isSubmitting ? 'Registering...' : 'Register & Publish Event'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Currently Active Venues Summary */}
      <div className="card" style={{ padding: 16 }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: 10 }}>Active Events in System ({venues.length})</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {venues.map(v => (
            <div
              key={v.id}
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
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{v.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Event: {v.activeEventName} • Category: {v.category.replace('_', ' ')}
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.74rem' }}>
                <div>Safe Capacity: <strong>{v.totalCapacity}</strong></div>
                <div style={{ color: '#34d399' }}>✓ Published</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
