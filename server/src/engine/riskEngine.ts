import { Zone, Gate, Sensor, CrowdRiskLevel, Venue } from '../types';

export interface RiskAssessmentConfig {
  staleThresholdMs: number; // default 45000 ms (45 sec)
  densityLowMax: number;    // < 1.5 people/m²
  densityModMax: number;    // < 2.5 people/m²
  densityHighMax: number;   // < 3.8 people/m²
  capacityLowRatio: number; // < 0.65 (65%)
  capacityModRatio: number; // < 0.82 (82%)
  capacityHighRatio: number;// < 0.95 (95%)
}

export const DEFAULT_RISK_CONFIG: RiskAssessmentConfig = {
  staleThresholdMs: 45000,
  densityLowMax: 1.5,
  densityModMax: 2.5,
  densityHighMax: 3.8,
  capacityLowRatio: 0.65,
  capacityModRatio: 0.82,
  capacityHighRatio: 0.95,
};

export class CrowdRiskEngine {
  private config: RiskAssessmentConfig;

  constructor(config: Partial<RiskAssessmentConfig> = {}) {
    this.config = { ...DEFAULT_RISK_CONFIG, ...config };
  }

  /**
   * Assesses a single zone's risk profile with full explainability.
   */
  public evaluateZoneRisk(
    zone: Zone,
    sensor?: Sensor,
    allGates: Gate[] = []
  ): { riskLevel: CrowdRiskLevel; riskReason: string; confidence: number } {
    const now = Date.now();
    const lastUpdateMs = new Date(zone.lastUpdated).getTime();
    const timeDeltaMs = now - lastUpdateMs;

    // Check 1: Stale Data / Disconnected Sensor
    if (sensor && (sensor.status === 'OFFLINE' || sensor.status === 'STALE')) {
      return {
        riskLevel: 'UNKNOWN',
        riskReason: `Sensor telemetry offline (${sensor.name}). Live crowd conditions unverifiable. Last valid data: ${new Date(zone.lastUpdated).toLocaleTimeString()}.`,
        confidence: 0,
      };
    }

    if (timeDeltaMs > this.config.staleThresholdMs) {
      return {
        riskLevel: 'UNKNOWN',
        riskReason: `Data timeout: No sensor updates received for ${Math.round(timeDeltaMs / 1000)}s (exceeds ${this.config.staleThresholdMs / 1000}s freshness threshold). Marked UNKNOWN for public safety.`,
        confidence: 0,
      };
    }

    // Check 2: Zone physical metrics
    const capacityRatio = zone.capacity > 0 ? zone.currentCount / zone.capacity : 0;
    const density = zone.areaSqM > 0 ? Number((zone.currentCount / zone.areaSqM).toFixed(2)) : 0;
    const flowDelta = zone.inflowRate - zone.outflowRate;

    // Gate bottlenecks in this zone
    const connectedGates = allGates.filter(g => g.connectedZoneId === zone.id);
    const closedExits = connectedGates.filter(g => (g.type === 'EXIT' || g.type === 'EMERGENCY_EXIT') && g.status === 'CLOSED');

    let baseConfidence = 92;
    if (sensor && sensor.isSimulated) {
      baseConfidence = 85; // Simulated feed confidence indication
    }

    // Evaluate Risk Levels
    if (capacityRatio >= this.config.capacityHighRatio || density >= this.config.densityHighMax || (capacityRatio >= 0.85 && closedExits.length > 0)) {
      const exitNotice = closedExits.length > 0 ? ` WARNING: ${closedExits.map(g => g.name).join(', ')} is CLOSED.` : '';
      return {
        riskLevel: 'CRITICAL',
        riskReason: `CRITICAL THRESHOLD: Zone capacity at ${Math.round(capacityRatio * 100)}% (${zone.currentCount}/${zone.capacity}), density ${density} persons/m². Influx delta: ${flowDelta > 0 ? '+' : ''}${flowDelta}/min.${exitNotice} Immediate crowd dispersal required.`,
        confidence: baseConfidence,
      };
    }

    if (capacityRatio >= this.config.capacityModRatio || density >= this.config.densityModMax || (flowDelta > 40 && capacityRatio > 0.70)) {
      return {
        riskLevel: 'HIGH',
        riskReason: `WARNING: High crowd pressure at ${Math.round(capacityRatio * 100)}% capacity (${density} persons/m²). Inflow (${zone.inflowRate}/min) significantly exceeds outflow (${zone.outflowRate}/min). Monitor for bottlenecking.`,
        confidence: baseConfidence,
      };
    }

    if (capacityRatio >= this.config.capacityLowRatio || density >= this.config.densityLowMax || flowDelta > 25) {
      return {
        riskLevel: 'MODERATE',
        riskReason: `Moderate crowd density (${Math.round(capacityRatio * 100)}% capacity, ${density} persons/m²). Movement is steady but ingress flow is elevated (+${flowDelta}/min).`,
        confidence: baseConfidence,
      };
    }

    return {
      riskLevel: 'LOW',
      riskReason: `Normal operating conditions. Zone capacity at ${Math.round(capacityRatio * 100)}% (${density} persons/m²). Flow is balanced and corridor movement is unhindered.`,
      confidence: baseConfidence,
    };
  }

  /**
   * Assesses venue-wide overall status based on zones, gates, and sensors.
   */
  public evaluateVenueOverall(venue: Venue): {
    overallRiskLevel: CrowdRiskLevel;
    overallRiskReason: string;
    totalCrowd: number;
  } {
    const totalCrowd = venue.zones.reduce((sum, z) => sum + z.currentCount, 0);
    const capacityRatio = venue.totalCapacity > 0 ? totalCrowd / venue.totalCapacity : 0;

    const hasCriticalZone = venue.zones.some(z => z.riskLevel === 'CRITICAL');
    const hasHighZone = venue.zones.some(z => z.riskLevel === 'HIGH');
    const hasUnknownZone = venue.zones.some(z => z.riskLevel === 'UNKNOWN');
    const allUnknown = venue.zones.length > 0 && venue.zones.every(z => z.riskLevel === 'UNKNOWN');

    const closedExits = venue.gates.filter(g => (g.type === 'EXIT' || g.type === 'EMERGENCY_EXIT') && g.status === 'CLOSED');

    if (allUnknown) {
      return {
        overallRiskLevel: 'UNKNOWN',
        overallRiskReason: 'Telemetry unavailable: All zone sensors report stale or disconnected signals. Follow venue staff instructions.',
        totalCrowd,
      };
    }

    if (hasCriticalZone || capacityRatio >= 0.95) {
      return {
        overallRiskLevel: 'CRITICAL',
        overallRiskReason: `Critical risk detected in active sector. Total venue attendance is ${totalCrowd}/${venue.totalCapacity} (${Math.round(capacityRatio * 100)}%). Active safety interventions engaged.`,
        totalCrowd,
      };
    }

    if (hasHighZone || capacityRatio >= 0.80 || closedExits.length >= 2) {
      return {
        overallRiskLevel: 'HIGH',
        overallRiskReason: `Elevated crowd density in high-traffic zones (${Math.round(capacityRatio * 100)}% overall capacity). Diversion to alternate gates recommended.`,
        totalCrowd,
      };
    }

    if (capacityRatio >= 0.60 || venue.zones.some(z => z.riskLevel === 'MODERATE')) {
      return {
        overallRiskLevel: 'MODERATE',
        overallRiskReason: `Steady visitor volume (${totalCrowd} visitors, ${Math.round(capacityRatio * 100)}% capacity). All open gates operational.${hasUnknownZone ? ' Note: Sensor telemetry degraded in one zone.' : ''}`,
        totalCrowd,
      };
    }

    return {
      overallRiskLevel: 'LOW',
      overallRiskReason: `Safe crowd conditions. Total occupancy at ${Math.round(capacityRatio * 100)}% of safe capacity. All verified entry/exit paths clear.`,
      totalCrowd,
    };
  }
}
