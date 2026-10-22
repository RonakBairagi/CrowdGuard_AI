export type UserRole = 
  | 'ADMIN' 
  | 'ORGANIZER' 
  | 'VENUE_MANAGER' 
  | 'SAFETY_OFFICER' 
  | 'PUBLIC';

export type CrowdRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export type GateStatus = 'OPEN' | 'RESTRICTED' | 'CLOSED' | 'EMERGENCY_ONLY';

export type GateType = 'ENTRY' | 'EXIT' | 'EMERGENCY_EXIT' | 'BIDIRECTIONAL';

export type SensorType = 
  | 'OVERHEAD_PEOPLE_COUNTER' 
  | 'GATE_TURNSTILE_IN' 
  | 'GATE_TURNSTILE_OUT' 
  | 'CAMERA_ANALYTICS_AGGREGATE';

export type SensorStatus = 'ONLINE' | 'OFFLINE' | 'STALE' | 'SIMULATED';

export interface Zone {
  id: string;
  name: string;
  areaSqM: number;
  capacity: number;
  currentCount: number;
  density: number;
  inflowRate: number;
  outflowRate: number;
  riskLevel: CrowdRiskLevel;
  riskReason: string;
  confidence: number;
  sensorId?: string;
  lastUpdated: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Gate {
  id: string;
  name: string;
  type: GateType;
  status: GateStatus;
  connectedZoneId: string;
  nodeId: string;
  coords: { x: number; y: number };
  notes?: string;
  accessible: boolean;
  lastUpdated?: string;
}

export interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'GATE' | 'JUNCTION' | 'POI' | 'EMERGENCY_STATION';
  zoneId?: string;
  gateId?: string;
}

export interface Corridor {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  lengthMeters: number;
  widthMeters: number;
  bidirectional: boolean;
  isAccessible: boolean;
  isRestricted: boolean;
  isBlocked: boolean;
}

export interface Sensor {
  id: string;
  venueId: string;
  zoneId?: string;
  name: string;
  type: SensorType;
  status: SensorStatus;
  lastHeartbeat: string;
  currentReading: number;
  batteryPercent?: number;
  isSimulated: boolean;
  firmwareVersion?: string;
}

export interface SafetyAlert {
  id: string;
  venueId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  source: 'AUTHORITY' | 'SYSTEM_RULE' | 'SAFETY_OFFICER';
  authorName: string;
  timestamp: string;
  active: boolean;
  affectedGateIds?: string[];
  affectedZoneIds?: string[];
  recommendedAction?: string;
}

export interface PublicReport {
  id: string;
  venueId: string;
  category: 
    | 'OVERCROWDED_AREA' 
    | 'BLOCKED_PASSAGE' 
    | 'CLOSED_EXIT' 
    | 'POSSIBLE_EMERGENCY' 
    | 'MEDICAL_ASSISTANCE';
  locationDescription: string;
  zoneId?: string;
  details: string;
  timestamp: string;
  status: 'UNVERIFIED' | 'INVESTIGATING' | 'CONFIRMED' | 'DISMISSED';
  reportedBy: string;
  corroborationCount: number;
}

export interface AuditLog {
  id: string;
  venueId: string;
  action: string;
  performedBy: string;
  role: UserRole;
  timestamp: string;
  details: string;
}

export interface Venue {
  id: string;
  name: string;
  tagline?: string;
  category: 
    | 'RAILWAY_STATION' 
    | 'METRO' 
    | 'DURGA_PUJA' 
    | 'BOOK_FAIR' 
    | 'FESTIVAL' 
    | 'CONCERT' 
    | 'STADIUM' 
    | 'PUBLIC_GATHERING';
  address: string;
  city: string;
  coords: { lat: number; lng: number };
  totalCapacity: number;
  currentCrowdEstimate: number;
  overallRiskLevel: CrowdRiskLevel;
  overallRiskReason: string;
  lastAssessmentTime: string;
  activeEventName: string;
  operatingHours: string;
  emergencyContacts: { role: string; phone: string }[];
  safetyInstructions: string[];
  emergencyAnnouncements: string[];
  isPublished: boolean;
  zones: Zone[];
  gates: Gate[];
  nodes: MapNode[];
  corridors: Corridor[];
  sensors: Sensor[];
  isSimulated: boolean;
}

export interface RoutePathResult {
  found: boolean;
  nodes: MapNode[];
  distanceMeters: number;
  estimatedMinutes: number;
  pathCorridors: Corridor[];
  warnings: string[];
  message?: string;
  isEmergencyEvacuation?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
