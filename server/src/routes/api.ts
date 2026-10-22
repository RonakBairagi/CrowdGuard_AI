import { Router, Response } from 'express';
import { store } from '../store';
import { AuthenticatedRequest, requireRole, DEMO_USERS } from '../middleware/authMiddleware';
import { VenueRouteEngine } from '../engine/routeEngine';
import { GateStatus, SensorStatus } from '../types';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), platform: 'CrowdGuard AI' });
});

// Demo Login & Role Switcher
apiRouter.post('/auth/demo-login', (req, res) => {
  const { roleKey } = req.body;
  const user = DEMO_USERS[roleKey] || DEMO_USERS.public;
  res.json({
    user,
    token: `demo-token-${user.role.toLowerCase()}`,
    permissions: {
      canEditGates: ['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER'].includes(user.role),
      canPublishAlerts: ['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER'].includes(user.role),
      canEditVenueMap: ['ADMIN', 'VENUE_MANAGER', 'ORGANIZER'].includes(user.role),
      canTriageReports: ['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER'].includes(user.role),
      canControlSimulation: ['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER'].includes(user.role),
      isPublic: user.role === 'PUBLIC',
    }
  });
});

// Venues List (Public & Authority)
apiRouter.get('/venues', (req, res) => {
  res.json(store.getVenues());
});

// Single Venue Detail (Public & Authority)
apiRouter.get('/venues/:id', (req, res) => {
  const venue = store.getVenueById(req.params.id);
  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }
  res.json(venue);
});

// Create Event Venue (Admin, Organizer)
apiRouter.post('/venues', requireRole(['ADMIN', 'ORGANIZER']), (req: AuthenticatedRequest, res: Response) => {
  const newVenue = store.createEventVenue(req.body, {
    name: req.user!.name,
    role: req.user!.role,
  });
  res.status(201).json(newVenue);
});

// Update Venue Map Layout (Admin, Organizer, Venue Manager)
apiRouter.put('/venues/:id/map', requireRole(['ADMIN', 'ORGANIZER', 'VENUE_MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const result = store.updateVenueMapLayout(
    req.params.id,
    req.body,
    { name: req.user!.name, role: req.user!.role }
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ message: 'Venue map layout verified and updated successfully.' });
});

// Update Gate Status (Admin, Venue Manager, Safety Officer)
apiRouter.patch('/venues/:id/gates/:gateId', requireRole(['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER']), (req: AuthenticatedRequest, res: Response) => {
  const { status, notes } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Gate status is required' });
  }

  const result = store.updateGateStatus(
    req.params.id,
    req.params.gateId,
    status as GateStatus,
    { name: req.user!.name, role: req.user!.role },
    notes
  );

  if (!result.success) {
    return res.status(404).json({ error: 'Venue or Gate not found' });
  }

  res.json({
    message: `Gate status successfully updated to ${status}`,
    gate: result.gate,
    alertCreated: result.alertCreated,
  });
});

// Update Zone Metrics / Manual Override (Admin, Venue Manager, Safety Officer)
apiRouter.patch('/venues/:id/zones/:zoneId', requireRole(['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER']), (req: AuthenticatedRequest, res: Response) => {
  const { currentCount, inflowRate, outflowRate } = req.body;
  const ok = store.updateZoneMetrics(
    req.params.id,
    req.params.zoneId,
    { currentCount, inflowRate, outflowRate },
    { name: req.user!.name, role: req.user!.role }
  );

  if (!ok) {
    return res.status(404).json({ error: 'Venue or Zone not found' });
  }

  res.json({ message: 'Zone crowd metrics updated' });
});

// Toggle Sensor Status (Admin, Venue Manager, Safety Officer)
apiRouter.patch('/venues/:id/sensors/:sensorId', requireRole(['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER']), (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const ok = store.updateSensorStatus(
    req.params.id,
    req.params.sensorId,
    status as SensorStatus,
    { name: req.user!.name, role: req.user!.role }
  );

  if (!ok) {
    return res.status(404).json({ error: 'Venue or Sensor not found' });
  }

  res.json({ message: `Sensor status updated to ${status}` });
});

// Sensor Ingestion API (for IoT Counters / Camera Analytics)
apiRouter.post('/sensors/ingest', (req, res) => {
  const { sensorId, venueId, reading } = req.body;
  if (!sensorId || !venueId || reading === undefined) {
    return res.status(400).json({ error: 'sensorId, venueId, and reading are required' });
  }

  const ok = store.ingestSensorData(sensorId, Number(reading), venueId);
  if (!ok) {
    return res.status(404).json({ error: 'Invalid sensor or venue ID' });
  }

  res.json({ status: 'acknowledged', sensorId, reading, timestamp: new Date().toISOString() });
});

// Route Calculation (Public & Authority)
apiRouter.get('/route', (req, res) => {
  const { venueId, startNodeId, targetNodeId, accessible, isEmergency } = req.query;

  if (!venueId || !startNodeId || !targetNodeId) {
    return res.status(400).json({ error: 'venueId, startNodeId, and targetNodeId are required' });
  }

  const venue = store.getVenueById(String(venueId));
  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  const result = VenueRouteEngine.calculateRoute(
    venue,
    String(startNodeId),
    String(targetNodeId),
    accessible === 'true',
    isEmergency === 'true'
  );

  res.json(result);
});

// Alerts
apiRouter.get('/alerts', (req, res) => {
  const venueId = req.query.venueId as string | undefined;
  res.json(store.getAlerts(venueId));
});

apiRouter.post('/alerts', requireRole(['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER']), (req: AuthenticatedRequest, res: Response) => {
  const { venueId, severity, title, message, affectedGateIds, affectedZoneIds, recommendedAction } = req.body;
  if (!venueId || !title || !message) {
    return res.status(400).json({ error: 'venueId, title, and message are required' });
  }

  const alert = store.publishAlert(
    venueId,
    {
      venueId,
      severity: severity || 'WARNING',
      title,
      message,
      source: 'AUTHORITY',
      authorName: req.user!.name,
      affectedGateIds,
      affectedZoneIds,
      recommendedAction,
    },
    { name: req.user!.name, role: req.user!.role }
  );

  res.status(201).json(alert);
});

apiRouter.patch('/alerts/:id/resolve', requireRole(['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER']), (req: AuthenticatedRequest, res: Response) => {
  const venueId = req.body.venueId || 'venue-baghbazar-pandal';
  const ok = store.resolveAlert(venueId, req.params.id, {
    name: req.user!.name,
    role: req.user!.role,
  });

  if (!ok) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  res.json({ message: 'Alert resolved' });
});

// Public Reports
apiRouter.get('/reports', (req, res) => {
  const venueId = req.query.venueId as string | undefined;
  res.json(store.getReports(venueId));
});

apiRouter.post('/reports', (req: AuthenticatedRequest, res: Response) => {
  const { venueId, category, locationDescription, details, zoneId } = req.body;
  if (!venueId || !category || !locationDescription) {
    return res.status(400).json({ error: 'venueId, category, and locationDescription are required' });
  }

  const report = store.submitPublicReport(
    venueId,
    { category, locationDescription, details: details || '', zoneId },
    req.user?.name || 'Visitor'
  );

  res.status(201).json(report);
});

apiRouter.patch('/reports/:id/triage', requireRole(['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER']), (req: AuthenticatedRequest, res: Response) => {
  const { status, notes } = req.body;
  const ok = store.triagePublicReport(
    req.params.id,
    status,
    { name: req.user!.name, role: req.user!.role },
    notes
  );

  if (!ok) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.json({ message: 'Report status updated' });
});

// Audit Logs (Authority Only)
apiRouter.get('/audit-logs', requireRole(['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER', 'ORGANIZER']), (req, res) => {
  const venueId = req.query.venueId as string | undefined;
  res.json(store.getAuditLogs(venueId));
});

// Prototype Simulation Actions (Section 4 & 13)
apiRouter.post('/simulation/action', requireRole(['ADMIN', 'VENUE_MANAGER', 'SAFETY_OFFICER']), (req: AuthenticatedRequest, res: Response) => {
  const { action, venueId, zoneId, gateId, sensorId, delta } = req.body;
  const targetVenue = store.getVenueById(venueId || 'venue-baghbazar-pandal');

  if (!targetVenue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  switch (action) {
    case 'INCREASE_CROWD': {
      const zId = zoneId || targetVenue.zones[1].id;
      const targetZone = targetVenue.zones.find(z => z.id === zId);
      if (targetZone) {
        store.updateZoneMetrics(
          targetVenue.id,
          targetZone.id,
          {
            currentCount: targetZone.currentCount + (delta || 80),
            inflowRate: targetZone.inflowRate + 30,
          },
          { name: req.user!.name, role: req.user!.role }
        );
      }
      return res.json({ message: 'Simulated crowd increase applied', action });
    }

    case 'DECREASE_CROWD': {
      const zId = zoneId || targetVenue.zones[1].id;
      const targetZone = targetVenue.zones.find(z => z.id === zId);
      if (targetZone) {
        store.updateZoneMetrics(
          targetVenue.id,
          targetZone.id,
          {
            currentCount: Math.max(20, targetZone.currentCount - (delta || 70)),
            outflowRate: targetZone.outflowRate + 25,
          },
          { name: req.user!.name, role: req.user!.role }
        );
      }
      return res.json({ message: 'Simulated crowd decrease applied', action });
    }

    case 'SUDDEN_SURGE': {
      // Simulate extreme surge pushing zone past critical capacity
      const targetZone = targetVenue.zones[1]; // Sanctum queue or platforms
      store.updateZoneMetrics(
        targetVenue.id,
        targetZone.id,
        {
          currentCount: Math.round(targetZone.capacity * 1.05),
          inflowRate: 180,
          outflowRate: 30,
        },
        { name: req.user!.name, role: req.user!.role }
      );
      return res.json({ message: `Sudden critical crowd surge simulated in ${targetZone.name}!`, action });
    }

    case 'TOGGLE_GATE': {
      const gId = gateId || targetVenue.gates.find(g => g.type === 'EXIT')?.id;
      if (gId) {
        const targetGate = targetVenue.gates.find(g => g.id === gId);
        if (targetGate) {
          const nextStatus: GateStatus = targetGate.status === 'OPEN' ? 'CLOSED' : 'OPEN';
          store.updateGateStatus(
            targetVenue.id,
            targetGate.id,
            nextStatus,
            { name: req.user!.name, role: req.user!.role },
            `Simulated toggle to ${nextStatus}`
          );
        }
      }
      return res.json({ message: 'Gate status toggled', action });
    }

    case 'DISCONNECT_SENSOR': {
      const sId = sensorId || targetVenue.sensors[0].id;
      store.updateSensorStatus(
        targetVenue.id,
        sId,
        'OFFLINE',
        { name: req.user!.name, role: req.user!.role }
      );
      return res.json({ message: 'Sensor disconnected; zone transitioned to UNKNOWN', action });
    }

    case 'RESTORE_SENSOR': {
      const sId = sensorId || targetVenue.sensors[0].id;
      store.updateSensorStatus(
        targetVenue.id,
        sId,
        'ONLINE',
        { name: req.user!.name, role: req.user!.role }
      );
      return res.json({ message: 'Sensor restored ONLINE; risk engine reassessed', action });
    }

    case 'RESET_DEFAULT': {
      store.resetToSeed(targetVenue.id);
      return res.json({ message: 'Venue reset to clean demo seed state', action });
    }

    default:
      return res.status(400).json({ error: `Unknown simulation action "${action}"` });
  }
});
