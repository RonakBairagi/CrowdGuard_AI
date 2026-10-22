import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Venue, SafetyAlert, PublicReport, AuditLog, RoutePathResult, UserRole, UserProfile } from '../types';

interface RealtimeContextType {
  venues: Venue[];
  alerts: SafetyAlert[];
  reports: PublicReport[];
  auditLogs: AuditLog[];
  isConnected: boolean;
  currentUser: UserProfile;
  switchUserRole: (roleKey: string) => Promise<void>;
  updateGateStatus: (venueId: string, gateId: string, status: string, notes?: string) => Promise<boolean>;
  updateZoneMetrics: (venueId: string, zoneId: string, metrics: { currentCount?: number; inflowRate?: number; outflowRate?: number }) => Promise<boolean>;
  updateSensorStatus: (venueId: string, sensorId: string, status: string) => Promise<boolean>;
  publishAlert: (venueId: string, alertData: Partial<SafetyAlert>) => Promise<boolean>;
  resolveAlert: (venueId: string, alertId: string) => Promise<boolean>;
  submitPublicReport: (venueId: string, reportData: { category: any; locationDescription: string; details: string; zoneId?: string }) => Promise<PublicReport | null>;
  triagePublicReport: (reportId: string, status: any, notes?: string) => Promise<boolean>;
  calculateRoute: (venueId: string, startNodeId: string, targetNodeId: string, accessible?: boolean, isEmergency?: boolean) => Promise<RoutePathResult>;
  runSimulationAction: (action: string, params?: Record<string, any>) => Promise<boolean>;
  updateVenueMapLayout: (venueId: string, layout: any) => Promise<{ success: boolean; error?: string }>;
  createEventVenue: (eventData: Partial<Venue>) => Promise<Venue | null>;
  refreshAuditLogs: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

const API_BASE = '/api';
const isBrowser = typeof window !== 'undefined';
const WS_URL = isBrowser
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
  : 'ws://localhost:5000/ws';

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'usr-admin-1',
    name: 'Siddhartha Chatterjee (Chief Administrator)',
    email: 'admin@crowdguard.ai',
    role: 'ADMIN',
  });

  // Switch demo user role
  const switchUserRole = async (roleKey: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleKey }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    }
  };

  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'x-user-role': currentUser.role,
      'x-user-id': currentUser.role.toLowerCase(),
    };
  }, [currentUser]);

  // Initial Data Fetch
  const fetchInitialData = useCallback(async () => {
    try {
      const [vRes, aRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/venues`),
        fetch(`${API_BASE}/alerts`),
        fetch(`${API_BASE}/reports`),
      ]);

      if (vRes.ok) setVenues(await vRes.json());
      if (aRes.ok) setAlerts(await aRes.json());
      if (rRes.ok) setReports(await rRes.json());
    } catch (err) {
      console.warn('Initial REST fetch failed, waiting for WebSocket...', err);
    }
  }, []);

  const refreshAuditLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/audit-logs`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch (err) {
      console.error('Audit log fetch error:', err);
    }
  }, [getHeaders]);

  // WebSocket Connection & Real-Time Sync
  useEffect(() => {
    fetchInitialData();
    refreshAuditLogs();

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('⚡ Connected to CrowdGuard AI real-time telemetric stream');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            const { type, data } = payload;

            switch (type) {
              case 'INIT_SNAPSHOT':
                if (data.venues) setVenues(data.venues);
                if (data.alerts) setAlerts(data.alerts);
                if (data.reports) setReports(data.reports);
                break;

              case 'STATE_UPDATE':
                if (data.venues) setVenues(data.venues);
                if (data.alerts) setAlerts(data.alerts);
                if (data.reports) setReports(data.reports);
                break;

              case 'GATE_UPDATED':
                if (data.venues) setVenues(data.venues);
                if (data.alerts) setAlerts(data.alerts);
                refreshAuditLogs();
                break;

              case 'SENSOR_UPDATED':
                if (data.venues) setVenues(data.venues);
                if (data.alerts) setAlerts(data.alerts);
                refreshAuditLogs();
                break;

              case 'ALERT_PUBLISHED':
              case 'ALERT_RESOLVED':
                if (data.alerts) setAlerts(data.alerts);
                refreshAuditLogs();
                break;

              case 'REPORT_SUBMITTED':
              case 'REPORT_UPDATED':
              case 'REPORT_TRIAGED':
                if (data.reports) setReports(data.reports);
                refreshAuditLogs();
                break;

              case 'MAP_UPDATED':
                if (data.venues) setVenues(data.venues);
                refreshAuditLogs();
                break;

              default:
                break;
            }
          } catch (e) {
            console.error('WS message parse error:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws?.close();
        };
      } catch (e) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    // Polling fallback: ensures live sync continues even in serverless environments like Vercel
    const pollInterval = setInterval(() => {
      fetchInitialData();
      refreshAuditLogs();
    }, 4000);

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
    };
  }, [fetchInitialData, refreshAuditLogs]);

  // Operations
  const updateGateStatus = async (venueId: string, gateId: string, status: string, notes?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/venues/${venueId}/gates/${gateId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        await fetchInitialData();
        refreshAuditLogs();
      }
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateZoneMetrics = async (venueId: string, zoneId: string, metrics: { currentCount?: number; inflowRate?: number; outflowRate?: number }): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/venues/${venueId}/zones/${zoneId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(metrics),
      });
      if (res.ok) {
        await fetchInitialData();
        refreshAuditLogs();
      }
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateSensorStatus = async (venueId: string, sensorId: string, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/venues/${venueId}/sensors/${sensorId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchInitialData();
        refreshAuditLogs();
      }
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const publishAlert = async (venueId: string, alertData: Partial<SafetyAlert>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ venueId, ...alertData }),
      });
      if (res.ok) {
        await fetchInitialData();
        refreshAuditLogs();
      }
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };


  const resolveAlert = async (venueId: string, alertId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ venueId }),
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const submitPublicReport = async (venueId: string, reportData: any): Promise<PublicReport | null> => {
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ venueId, ...reportData }),
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const triagePublicReport = async (reportId: string, status: any, notes?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/triage`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const calculateRoute = async (venueId: string, startNodeId: string, targetNodeId: string, accessible = false, isEmergency = false): Promise<RoutePathResult> => {
    try {
      const params = new URLSearchParams({
        venueId,
        startNodeId,
        targetNodeId,
        accessible: String(accessible),
        isEmergency: String(isEmergency),
      });
      const res = await fetch(`${API_BASE}/route?${params.toString()}`);
      if (res.ok) {
        return await res.json();
      }
      return {
        found: false,
        nodes: [],
        distanceMeters: 0,
        estimatedMinutes: 0,
        pathCorridors: [],
        warnings: ['Failed to compute route from server.'],
        message: 'Live route guidance is unavailable. Follow official announcements and instructions from authorised venue staff.',
      };
    } catch (e) {
      return {
        found: false,
        nodes: [],
        distanceMeters: 0,
        estimatedMinutes: 0,
        pathCorridors: [],
        warnings: ['Network unreachable.'],
        message: 'Live route guidance is unavailable. Follow official announcements and instructions from authorised venue staff.',
      };
    }
  };

  const runSimulationAction = async (action: string, params: Record<string, any> = {}): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/simulation/action`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action, ...params }),
      });
      if (res.ok) {
        await fetchInitialData();
        refreshAuditLogs();
      }
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateVenueMapLayout = async (venueId: string, layout: any) => {
    try {
      const res = await fetch(`${API_BASE}/venues/${venueId}/map`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(layout),
      });
      const data = await res.json();
      if (res.ok) return { success: true };
      return { success: false, error: data.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const createEventVenue = async (eventData: Partial<Venue>): Promise<Venue | null> => {
    try {
      const res = await fetch(`${API_BASE}/venues`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(eventData),
      });
      if (res.ok) {
        const created = await res.json();
        return created;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  return (
    <RealtimeContext.Provider
      value={{
        venues,
        alerts,
        reports,
        auditLogs,
        isConnected,
        currentUser,
        switchUserRole,
        updateGateStatus,
        updateZoneMetrics,
        updateSensorStatus,
        publishAlert,
        resolveAlert,
        submitPublicReport,
        triagePublicReport,
        calculateRoute,
        runSimulationAction,
        updateVenueMapLayout,
        createEventVenue,
        refreshAuditLogs,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};
