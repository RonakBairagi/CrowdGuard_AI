import { WebSocket } from 'ws';
import { 
  Venue, 
  SafetyAlert, 
  PublicReport, 
  AuditLog, 
  GateStatus, 
  SensorStatus, 
  UserRole,
  Zone,
  Gate,
  MapNode,
  Corridor
} from './types';
import { SEED_VENUES, SEED_ALERTS, SEED_REPORTS, SEED_AUDIT_LOGS } from './data/seedData';
import { CrowdRiskEngine, DEFAULT_RISK_CONFIG } from './engine/riskEngine';

export class AppStore {
  private venues: Venue[];
  private alerts: SafetyAlert[];
  private reports: PublicReport[];
  private auditLogs: AuditLog[];
  private riskEngine: CrowdRiskEngine;
  private wsClients: Set<WebSocket>;
  private staleCheckInterval: NodeJS.Timeout | null = null;
  public staleThresholdMs: number = 45000;

  constructor() {
    // Clone seed data to allow mutable in-memory state
    this.venues = JSON.parse(JSON.stringify(SEED_VENUES));
    this.alerts = JSON.parse(JSON.stringify(SEED_ALERTS));
    this.reports = JSON.parse(JSON.stringify(SEED_REPORTS));
    this.auditLogs = JSON.parse(JSON.stringify(SEED_AUDIT_LOGS));
    this.riskEngine = new CrowdRiskEngine({ staleThresholdMs: this.staleThresholdMs });
    this.wsClients = new Set();

    // Start background stale-data watchdog
    this.startWatchdog();
  }

  // --- WebSocket Connection Management ---
  public addClient(ws: WebSocket) {
    this.wsClients.add(ws);
    // Send initial snapshot on connect
    ws.send(JSON.stringify({
      type: 'INIT_SNAPSHOT',
      data: {
        venues: this.venues,
        alerts: this.alerts,
        reports: this.reports,
        timestamp: new Date().toISOString(),
      }
    }));
  }

  public removeClient(ws: WebSocket) {
    this.wsClients.delete(ws);
  }

  public broadcast(type: string, payload: any) {
    const message = JSON.stringify({
      type,
      data: payload,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (err) {
          console.error('Error broadcasting to WS client', err);
        }
      }
    }
  }

  // --- Watchdog for Stale Telemetry ---
  private startWatchdog() {
    this.staleCheckInterval = setInterval(() => {
      let stateChanged = false;

      for (const venue of this.venues) {
        for (const zone of venue.zones) {
          const sensor = venue.sensors.find(s => s.id === zone.sensorId);
          const evaluation = this.riskEngine.evaluateZoneRisk(zone, sensor, venue.gates);

          if (zone.riskLevel !== evaluation.riskLevel || zone.riskReason !== evaluation.riskReason) {
            zone.riskLevel = evaluation.riskLevel;
            zone.riskReason = evaluation.riskReason;
            zone.confidence = evaluation.confidence;
            stateChanged = true;
          }
        }

        // Re-evaluate overall
        const overall = this.riskEngine.evaluateVenueOverall(venue);
        if (venue.overallRiskLevel !== overall.overallRiskLevel || venue.currentCrowdEstimate !== overall.totalCrowd) {
          venue.overallRiskLevel = overall.overallRiskLevel;
          venue.overallRiskReason = overall.overallRiskReason;
          venue.currentCrowdEstimate = overall.totalCrowd;
          stateChanged = true;
        }
      }

      if (stateChanged) {
        this.broadcast('STATE_UPDATE', {
          venues: this.venues,
          alerts: this.alerts,
        });
      }
    }, 5000);
  }

  // --- Venue Queries ---
  public getVenues(): Venue[] {
    return this.venues;
  }

  public getVenueById(id: string): Venue | undefined {
    return this.venues.find(v => v.id === id);
  }

  public getAlerts(venueId?: string): SafetyAlert[] {
    if (venueId) {
      return this.alerts.filter(a => a.venueId === venueId);
    }
    return this.alerts;
  }

  public getReports(venueId?: string): PublicReport[] {
    if (venueId) {
      return this.reports.filter(r => r.venueId === venueId);
    }
    return this.reports;
  }

  public getAuditLogs(venueId?: string): AuditLog[] {
    if (venueId) {
      return this.auditLogs.filter(l => l.venueId === venueId);
    }
    return this.auditLogs;
  }

  // --- Mutating Operations (RBAC Protected on API level) ---

  /**
   * Updates gate status, creates verified alert if exit is closed, updates routing availability.
   */
  public updateGateStatus(
    venueId: string, 
    gateId: string, 
    newStatus: GateStatus, 
    actor: { name: string; role: UserRole },
    notes?: string
  ): { success: boolean; gate?: Gate; alertCreated?: SafetyAlert } {
    const venue = this.venues.find(v => v.id === venueId);
    if (!venue) return { success: false };

    const gate = venue.gates.find(g => g.id === gateId);
    if (!gate) return { success: false };

    const oldStatus = gate.status;
    gate.status = newStatus;
    gate.lastUpdated = new Date().toISOString();
    if (notes) gate.notes = notes;

    // Audit log entry
    this.addAuditLog(
      venueId,
      'GATE_STATUS_CHANGED',
      actor.name,
      actor.role,
      `Gate "${gate.name}" status changed from ${oldStatus} to ${newStatus}. ${notes || ''}`
    );

    let createdAlert: SafetyAlert | undefined;

    // Automatic verified alert propagation for Exit gate closure as requested in Prompt Section 2.E & Section 6
    if (newStatus === 'CLOSED' && (gate.type === 'EXIT' || gate.type === 'EMERGENCY_EXIT')) {
      const openExits = venue.gates.filter(g => g.id !== gate.id && (g.type === 'EXIT' || g.type === 'EMERGENCY_EXIT') && g.status === 'OPEN');
      const alternateGateText = openExits.length > 0 ? `Follow the verified route to ${openExits[0].name}` : 'Await instruction from safety personnel';

      createdAlert = {
        id: `alert-auto-${Date.now()}`,
        venueId,
        severity: 'WARNING',
        title: `SAFETY ALERT: ${gate.name} is Temporarily Closed`,
        message: `SAFETY ALERT: ${gate.name} is temporarily closed. ${alternateGateText} and obey on-site staff instructions.`,
        source: 'AUTHORITY',
        authorName: `${actor.name} (${actor.role})`,
        timestamp: new Date().toISOString(),
        active: true,
        affectedGateIds: [gate.id],
        recommendedAction: `Divert pedestrian flow to ${openExits.map(g => g.name).join(' or ') || 'Open Exits'}.`,
      };
      this.alerts.unshift(createdAlert);
    }

    // Re-evaluate risk
    this.recalculateVenueRisk(venue);

    // Broadcast change in real time
    this.broadcast('GATE_UPDATED', {
      venueId,
      gate,
      alert: createdAlert,
      venues: this.venues,
      alerts: this.alerts,
    });

    return { success: true, gate, alertCreated: createdAlert };
  }

  /**
   * Updates zone crowd metrics (sensors or manual simulation).
   */
  public updateZoneMetrics(
    venueId: string,
    zoneId: string,
    metrics: { currentCount?: number; inflowRate?: number; outflowRate?: number },
    actor?: { name: string; role: UserRole }
  ): boolean {
    const venue = this.venues.find(v => v.id === venueId);
    if (!venue) return false;

    const zone = venue.zones.find(z => z.id === zoneId);
    if (!zone) return false;

    if (metrics.currentCount !== undefined) {
      zone.currentCount = Math.max(0, metrics.currentCount);
      zone.density = zone.areaSqM > 0 ? Number((zone.currentCount / zone.areaSqM).toFixed(2)) : 0;
    }
    if (metrics.inflowRate !== undefined) zone.inflowRate = metrics.inflowRate;
    if (metrics.outflowRate !== undefined) zone.outflowRate = metrics.outflowRate;
    zone.lastUpdated = new Date().toISOString();

    // Re-evaluate zone and venue risk
    const sensor = venue.sensors.find(s => s.id === zone.sensorId);
    const evalResult = this.riskEngine.evaluateZoneRisk(zone, sensor, venue.gates);
    zone.riskLevel = evalResult.riskLevel;
    zone.riskReason = evalResult.riskReason;
    zone.confidence = evalResult.confidence;

    // Check if CRITICAL surge rule triggered automatic alert
    if (zone.riskLevel === 'CRITICAL') {
      const existingAlert = this.alerts.find(a => a.venueId === venueId && a.active && a.affectedZoneIds?.includes(zone.id));
      if (!existingAlert) {
        const criticalAlert: SafetyAlert = {
          id: `alert-surge-${Date.now()}`,
          venueId,
          severity: 'CRITICAL',
          title: `HIGH CROWD DENSITY: ${zone.name}`,
          message: `Rapid crowd accumulation detected in ${zone.name} (${zone.currentCount} persons). Ingress throttling active. Follow venue marshals.`,
          source: 'SYSTEM_RULE',
          authorName: 'Crowd-Risk Evaluation Engine',
          timestamp: new Date().toISOString(),
          active: true,
          affectedZoneIds: [zone.id],
          recommendedAction: 'Slow down entry and guide crowd to open dispersal areas.',
        };
        this.alerts.unshift(criticalAlert);
      }
    }

    this.recalculateVenueRisk(venue);

    if (actor) {
      this.addAuditLog(
        venueId,
        'ZONE_METRICS_MANUAL_ADJUSTMENT',
        actor.name,
        actor.role,
        `Adjusted ${zone.name}: Count=${zone.currentCount}, Inflow=${zone.inflowRate}, Outflow=${zone.outflowRate}`
      );
    }

    this.broadcast('STATE_UPDATE', {
      venues: this.venues,
      alerts: this.alerts,
    });

    return true;
  }

  /**
   * Toggles or updates sensor status (ONLINE, OFFLINE, STALE).
   */
  public updateSensorStatus(
    venueId: string,
    sensorId: string,
    status: SensorStatus,
    actor?: { name: string; role: UserRole }
  ): boolean {
    const venue = this.venues.find(v => v.id === venueId);
    if (!venue) return false;

    const sensor = venue.sensors.find(s => s.id === sensorId);
    if (!sensor) return false;

    const oldStatus = sensor.status;
    sensor.status = status;
    sensor.lastHeartbeat = status === 'ONLINE' ? new Date().toISOString() : sensor.lastHeartbeat;

    // If sensor went OFFLINE or STALE, mark connected zone as UNKNOWN
    if (sensor.zoneId) {
      const zone = venue.zones.find(z => z.id === sensor.zoneId);
      if (zone) {
        if (status === 'OFFLINE' || status === 'STALE') {
          zone.riskLevel = 'UNKNOWN';
          zone.confidence = 0;
          zone.riskReason = `Sensor telemetry offline (${sensor.name}). Live crowd conditions unverifiable. Last valid data: ${new Date(zone.lastUpdated).toLocaleTimeString()}.`;
        } else if (status === 'ONLINE') {
          zone.lastUpdated = new Date().toISOString();
          const evaluation = this.riskEngine.evaluateZoneRisk(zone, sensor, venue.gates);
          zone.riskLevel = evaluation.riskLevel;
          zone.riskReason = evaluation.riskReason;
          zone.confidence = evaluation.confidence;
        }
      }
    }

    this.recalculateVenueRisk(venue);

    this.addAuditLog(
      venueId,
      'SENSOR_STATUS_UPDATE',
      actor?.name || 'Simulation Controller',
      actor?.role || 'SYSTEM_ADMIN' as UserRole,
      `Sensor "${sensor.name}" (${sensor.id}) changed status from ${oldStatus} to ${status}.`
    );

    this.broadcast('SENSOR_UPDATED', {
      venueId,
      sensor,
      venues: this.venues,
      alerts: this.alerts,
    });

    return true;
  }

  /**
   * Ingests sensor data from external camera or IoT counter.
   */
  public ingestSensorData(sensorId: string, reading: number, venueId: string): boolean {
    const venue = this.venues.find(v => v.id === venueId);
    if (!venue) return false;

    const sensor = venue.sensors.find(s => s.id === sensorId);
    if (!sensor) return false;

    sensor.currentReading = reading;
    sensor.lastHeartbeat = new Date().toISOString();
    sensor.status = 'ONLINE';

    if (sensor.zoneId) {
      const zone = venue.zones.find(z => z.id === sensor.zoneId);
      if (zone) {
        zone.currentCount = reading;
        zone.lastUpdated = new Date().toISOString();
        const evalResult = this.riskEngine.evaluateZoneRisk(zone, sensor, venue.gates);
        zone.riskLevel = evalResult.riskLevel;
        zone.riskReason = evalResult.riskReason;
        zone.confidence = evalResult.confidence;
      }
    }

    this.recalculateVenueRisk(venue);
    this.broadcast('STATE_UPDATE', { venues: this.venues, alerts: this.alerts });
    return true;
  }

  /**
   * Publishes an authorized safety alert.
   */
  public publishAlert(
    venueId: string,
    alertData: Omit<SafetyAlert, 'id' | 'timestamp' | 'active'>,
    actor: { name: string; role: UserRole }
  ): SafetyAlert {
    const alert: SafetyAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      active: true,
      authorName: `${actor.name} (${actor.role})`,
    };

    this.alerts.unshift(alert);
    this.addAuditLog(
      venueId,
      'ALERT_PUBLISHED',
      actor.name,
      actor.role,
      `Published [${alert.severity}] alert: "${alert.title}"`
    );

    this.broadcast('ALERT_PUBLISHED', { alert, alerts: this.alerts });
    return alert;
  }

  /**
   * Resolves or dismisses an alert.
   */
  public resolveAlert(venueId: string, alertId: string, actor: { name: string; role: UserRole }): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.active = false;
    this.addAuditLog(
      venueId,
      'ALERT_RESOLVED',
      actor.name,
      actor.role,
      `Resolved alert: "${alert.title}"`
    );

    this.broadcast('ALERT_RESOLVED', { alertId, alerts: this.alerts });
    return true;
  }

  /**
   * Submits a public user report (flagged as UNVERIFIED).
   */
  public submitPublicReport(
    venueId: string,
    reportData: { category: PublicReport['category']; locationDescription: string; details: string; zoneId?: string },
    reportedBy: string = 'Public Visitor'
  ): PublicReport {
    // Check for corroboration if report is similar in the same venue within 15 mins
    const existing = this.reports.find(
      r => r.venueId === venueId && 
      r.category === reportData.category && 
      r.status === 'UNVERIFIED' &&
      Date.now() - new Date(r.timestamp).getTime() < 15 * 60 * 1000
    );

    if (existing) {
      existing.corroborationCount += 1;
      this.broadcast('REPORT_UPDATED', { report: existing, reports: this.reports });
      return existing;
    }

    const report: PublicReport = {
      id: `rep-${Date.now()}`,
      venueId,
      category: reportData.category,
      locationDescription: reportData.locationDescription,
      zoneId: reportData.zoneId,
      details: reportData.details,
      timestamp: new Date().toISOString(),
      status: 'UNVERIFIED',
      reportedBy,
      corroborationCount: 1,
    };

    this.reports.unshift(report);
    this.broadcast('REPORT_SUBMITTED', { report, reports: this.reports });
    return report;
  }

  /**
   * Authority reviews / triages public report.
   */
  public triagePublicReport(
    reportId: string,
    status: PublicReport['status'],
    actor: { name: string; role: UserRole },
    resolutionNotes?: string
  ): boolean {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return false;

    const oldStatus = report.status;
    report.status = status;

    this.addAuditLog(
      report.venueId,
      'PUBLIC_REPORT_TRIAGED',
      actor.name,
      actor.role,
      `Report "${report.category}" at "${report.locationDescription}" moved from ${oldStatus} to ${status}. Notes: ${resolutionNotes || 'None'}`
    );

    this.broadcast('REPORT_TRIAGED', { report, reports: this.reports });
    return true;
  }

  /**
   * Updates venue map layout (zones, gates, nodes, corridors) with safety validation.
   */
  public updateVenueMapLayout(
    venueId: string,
    layout: { zones: Zone[]; gates: Gate[]; nodes: MapNode[]; corridors: Corridor[] },
    actor: { name: string; role: UserRole }
  ): { success: boolean; error?: string } {
    const venue = this.venues.find(v => v.id === venueId);
    if (!venue) return { success: false, error: 'Venue not found' };

    // Safety validation: must have at least 1 entrance and at least 1 exit
    const hasEntry = layout.gates.some(g => g.type === 'ENTRY' || g.type === 'BIDIRECTIONAL');
    const hasExit = layout.gates.some(g => g.type === 'EXIT' || g.type === 'EMERGENCY_EXIT' || g.type === 'BIDIRECTIONAL');

    if (!hasEntry || !hasExit) {
      return { success: false, error: 'Invalid map: Venue layout must have at least one verified entrance and one exit.' };
    }

    // Safety validation: each gate must link to a valid MapNode
    for (const gate of layout.gates) {
      const nodeExists = layout.nodes.some(n => n.id === gate.nodeId);
      if (!nodeExists) {
        return { success: false, error: `Invalid configuration: Gate "${gate.name}" references non-existent node "${gate.nodeId}".` };
      }
    }

    venue.zones = layout.zones;
    venue.gates = layout.gates;
    venue.nodes = layout.nodes;
    venue.corridors = layout.corridors;

    this.recalculateVenueRisk(venue);

    this.addAuditLog(
      venueId,
      'MAP_LAYOUT_CONFIGURED',
      actor.name,
      actor.role,
      `Published updated map layout (${layout.zones.length} zones, ${layout.gates.length} gates, ${layout.corridors.length} corridors).`
    );

    this.broadcast('MAP_UPDATED', { venueId, venue, venues: this.venues });
    return { success: true };
  }

  /**
   * Creates a new event / venue.
   */
  public createEventVenue(
    venueData: Partial<Venue>,
    actor: { name: string; role: UserRole }
  ): Venue {
    const newVenue: Venue = {
      id: `venue-${Date.now()}`,
      name: venueData.name || 'Untitled Venue',
      tagline: venueData.tagline || 'Safety Monitoring Active',
      category: venueData.category || 'PUBLIC_GATHERING',
      address: venueData.address || 'Address pending',
      city: venueData.city || 'Kolkata',
      coords: venueData.coords || { lat: 22.5726, lng: 88.3639 },
      totalCapacity: venueData.totalCapacity || 1000,
      currentCrowdEstimate: 0,
      overallRiskLevel: 'LOW',
      overallRiskReason: 'New event initialized. Safe normal operating parameters.',
      lastAssessmentTime: new Date().toISOString(),
      activeEventName: venueData.activeEventName || 'Public Gathering 2026',
      operatingHours: venueData.operatingHours || '08:00 AM - 10:00 PM',
      emergencyContacts: venueData.emergencyContacts || [{ role: 'Control Room', phone: '112' }],
      safetyInstructions: venueData.safetyInstructions || ['Follow designated walkways.'],
      emergencyAnnouncements: venueData.emergencyAnnouncements || [],
      isPublished: true,
      isSimulated: true,
      zones: venueData.zones || [],
      gates: venueData.gates || [],
      nodes: venueData.nodes || [],
      corridors: venueData.corridors || [],
      sensors: venueData.sensors || [],
    };

    this.venues.push(newVenue);
    this.addAuditLog(
      newVenue.id,
      'EVENT_CREATED',
      actor.name,
      actor.role,
      `Created event venue "${newVenue.name}" (Capacity: ${newVenue.totalCapacity})`
    );

    this.broadcast('STATE_UPDATE', { venues: this.venues, alerts: this.alerts });
    return newVenue;
  }

  /**
   * Resets simulation data to default seed.
   */
  public resetToSeed(venueId?: string) {
    if (venueId) {
      const seedVenue = SEED_VENUES.find(v => v.id === venueId);
      if (seedVenue) {
        const index = this.venues.findIndex(v => v.id === venueId);
        if (index !== -1) {
          this.venues[index] = JSON.parse(JSON.stringify(seedVenue));
        }
      }
    } else {
      this.venues = JSON.parse(JSON.stringify(SEED_VENUES));
      this.alerts = JSON.parse(JSON.stringify(SEED_ALERTS));
      this.reports = JSON.parse(JSON.stringify(SEED_REPORTS));
    }

    this.broadcast('STATE_UPDATE', { venues: this.venues, alerts: this.alerts, reports: this.reports });
  }

  // Helper
  private recalculateVenueRisk(venue: Venue) {
    for (const zone of venue.zones) {
      const sensor = venue.sensors.find(s => s.id === zone.sensorId);
      const evalResult = this.riskEngine.evaluateZoneRisk(zone, sensor, venue.gates);
      zone.riskLevel = evalResult.riskLevel;
      zone.riskReason = evalResult.riskReason;
      zone.confidence = evalResult.confidence;
    }

    const overall = this.riskEngine.evaluateVenueOverall(venue);
    venue.overallRiskLevel = overall.overallRiskLevel;
    venue.overallRiskReason = overall.overallRiskReason;
    venue.currentCrowdEstimate = overall.totalCrowd;
    venue.lastAssessmentTime = new Date().toISOString();
  }

  private addAuditLog(venueId: string, action: string, performedBy: string, role: UserRole, details: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      venueId,
      action,
      performedBy,
      role,
      timestamp: new Date().toISOString(),
      details,
    };
    this.auditLogs.unshift(log);
  }
}

export const store = new AppStore();
