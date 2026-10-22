import { Venue, MapNode, Corridor, RoutePathResult, Gate } from '../types';

interface GraphEdge {
  targetNodeId: string;
  corridor: Corridor;
  weight: number;
}

export class VenueRouteEngine {
  /**
   * Calculates the safest path between startNodeId and destinationNodeId.
   * Takes into account closed gates, restricted corridors, zone crowd risk, and accessible preferences.
   */
  public static calculateRoute(
    venue: Venue,
    startNodeId: string,
    targetNodeId: string,
    preferAccessible: boolean = false,
    isEmergencyEvacuation: boolean = false
  ): RoutePathResult {
    const startNode = venue.nodes.find(n => n.id === startNodeId);
    const targetNode = venue.nodes.find(n => n.id === targetNodeId);

    if (!startNode || !targetNode) {
      return {
        found: false,
        nodes: [],
        distanceMeters: 0,
        estimatedMinutes: 0,
        pathCorridors: [],
        warnings: ['Specified origin or destination node does not exist in venue configuration.'],
        message: 'Live route guidance is unavailable. Follow official announcements and instructions from authorised venue staff.',
      };
    }

    if (startNodeId === targetNodeId) {
      return {
        found: true,
        nodes: [startNode],
        distanceMeters: 0,
        estimatedMinutes: 0,
        pathCorridors: [],
        warnings: ['You are currently at the destination.'],
        message: 'You have arrived at your selected point.',
      };
    }

    // Verify gates at start and target
    const startGate = venue.gates.find(g => g.nodeId === startNodeId);
    const targetGate = venue.gates.find(g => g.nodeId === targetNodeId);

    if (startGate && startGate.status === 'CLOSED') {
      return {
        found: false,
        nodes: [],
        distanceMeters: 0,
        estimatedMinutes: 0,
        pathCorridors: [],
        warnings: [`Origin gate "${startGate.name}" is currently CLOSED by venue management.`],
        message: `Origin Gate ${startGate.name} is closed. Please proceed to an alternative active gate under staff direction.`,
      };
    }

    if (targetGate && targetGate.status === 'CLOSED') {
      return {
        found: false,
        nodes: [],
        distanceMeters: 0,
        estimatedMinutes: 0,
        pathCorridors: [],
        warnings: [`Destination gate "${targetGate.name}" is currently CLOSED by safety officials.`],
        message: `Destination ${targetGate.name} is closed. Please follow staff instructions to an alternative open gate.`,
      };
    }

    // Build Adjacency Graph
    const adjacency = new Map<string, GraphEdge[]>();
    for (const node of venue.nodes) {
      adjacency.set(node.id, []);
    }

    for (const corridor of venue.corridors) {
      // Exclude blocked corridors
      if (corridor.isBlocked) continue;

      // Exclude restricted corridors unless emergency evacuation allows it
      if (corridor.isRestricted && !isEmergencyEvacuation) continue;

      // Accessible filtering: if accessibility required and corridor is not accessible, skip or heavy penalty
      if (preferAccessible && !corridor.isAccessible) continue;

      const fromNode = venue.nodes.find(n => n.id === corridor.fromNodeId);
      const toNode = venue.nodes.find(n => n.id === corridor.toNodeId);
      if (!fromNode || !toNode) continue;

      // Calculate dynamic risk weight
      const weightForward = this.calculateCorridorWeight(venue, corridor, toNode, preferAccessible, isEmergencyEvacuation);
      const weightBackward = this.calculateCorridorWeight(venue, corridor, fromNode, preferAccessible, isEmergencyEvacuation);

      if (weightForward !== Infinity) {
        adjacency.get(corridor.fromNodeId)?.push({
          targetNodeId: corridor.toNodeId,
          corridor,
          weight: weightForward,
        });
      }

      if (corridor.bidirectional && weightBackward !== Infinity) {
        adjacency.get(corridor.toNodeId)?.push({
          targetNodeId: corridor.fromNodeId,
          corridor,
          weight: weightBackward,
        });
      }
    }

    // Dijkstra's Algorithm
    const distances = new Map<string, number>();
    const previous = new Map<string, { nodeId: string; corridor: Corridor }>();
    const unvisited = new Set<string>();

    for (const node of venue.nodes) {
      distances.set(node.id, Infinity);
      unvisited.add(node.id);
    }
    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      // Find lowest distance node
      let currentSmallest: string | null = null;
      let minDistance = Infinity;
      for (const nodeId of unvisited) {
        const d = distances.get(nodeId) ?? Infinity;
        if (d < minDistance) {
          minDistance = d;
          currentSmallest = nodeId;
        }
      }

      if (currentSmallest === null || minDistance === Infinity) {
        break; // remaining unvisited nodes are unreachable
      }

      if (currentSmallest === targetNodeId) {
        break; // reached target
      }

      unvisited.delete(currentSmallest);

      const edges = adjacency.get(currentSmallest) || [];
      for (const edge of edges) {
        if (!unvisited.has(edge.targetNodeId)) continue;

        const candidateDist = minDistance + edge.weight;
        if (candidateDist < (distances.get(edge.targetNodeId) ?? Infinity)) {
          distances.set(edge.targetNodeId, candidateDist);
          previous.set(edge.targetNodeId, { nodeId: currentSmallest, corridor: edge.corridor });
        }
      }
    }

    // Check if target was reached
    if ((distances.get(targetNodeId) ?? Infinity) === Infinity) {
      return {
        found: false,
        nodes: [],
        distanceMeters: 0,
        estimatedMinutes: 0,
        pathCorridors: [],
        warnings: ['No safe path found avoiding closed gates and hazard zones.'],
        message: 'Live route guidance is unavailable. Follow official announcements and instructions from authorised venue staff.',
      };
    }

    // Reconstruct Path
    const pathNodes: MapNode[] = [];
    const pathCorridors: Corridor[] = [];
    let curr: string | undefined = targetNodeId;

    while (curr) {
      const nodeObj = venue.nodes.find(n => n.id === curr);
      if (nodeObj) pathNodes.unshift(nodeObj);

      const prevStep = previous.get(curr);
      if (prevStep) {
        pathCorridors.unshift(prevStep.corridor);
        curr = prevStep.nodeId;
      } else {
        curr = undefined;
      }
    }

    // Calculate physical distance & time
    const totalDistanceMeters = pathCorridors.reduce((acc, c) => acc + c.lengthMeters, 0);
    // Walking speed ~ 1.2 m/s (~70 m/min) in crowds ~ 40 m/min
    const estimatedMinutes = Math.max(1, Math.round(totalDistanceMeters / 45));

    const warnings: string[] = [];
    // Collect warnings along the route
    for (const node of pathNodes) {
      if (node.zoneId) {
        const zone = venue.zones.find(z => z.id === node.zoneId);
        if (zone) {
          if (zone.riskLevel === 'HIGH') {
            warnings.push(`Route traverses high-density zone: "${zone.name}". Move attentively.`);
          } else if (zone.riskLevel === 'CRITICAL') {
            warnings.push(`CAUTION: Critical density zone "${zone.name}" along route. Follow marshals.`);
          } else if (zone.riskLevel === 'UNKNOWN') {
            warnings.push(`Notice: Zone "${zone.name}" has degraded sensor reporting.`);
          }
        }
      }
    }

    return {
      found: true,
      nodes: pathNodes,
      distanceMeters: totalDistanceMeters,
      estimatedMinutes,
      pathCorridors,
      warnings,
      message: `Verified safe route calculated via ${pathCorridors.length} corridors (${totalDistanceMeters}m).`,
      isEmergencyEvacuation,
    };
  }

  /**
   * Dynamic weight penalizes high crowd density and closed or bottlenecked features.
   */
  private static calculateCorridorWeight(
    venue: Venue,
    corridor: Corridor,
    destinationNode: MapNode,
    preferAccessible: boolean,
    isEmergency: boolean
  ): number {
    let baseWeight = corridor.lengthMeters;

    // Gate checks on destination node
    if (destinationNode.gateId) {
      const gate = venue.gates.find(g => g.id === destinationNode.gateId);
      if (gate && gate.status === 'CLOSED') {
        return Infinity; // Closed gate is strictly impassable
      }
    }

    // Zone crowd penalties
    if (destinationNode.zoneId) {
      const zone = venue.zones.find(z => z.id === destinationNode.zoneId);
      if (zone) {
        if (zone.riskLevel === 'CRITICAL') {
          // If critical, avoid unless in emergency evacuation
          return isEmergency ? baseWeight * 3 : Infinity;
        }
        if (zone.riskLevel === 'HIGH') {
          // Add heavy cost penalty so router seeks alternative low/moderate density paths
          baseWeight += 150;
        } else if (zone.riskLevel === 'MODERATE') {
          baseWeight += 25;
        }
      }
    }

    // Corridor width factor: narrower corridors incur slight penalty during busy conditions
    if (corridor.widthMeters < 2.0) {
      baseWeight *= 1.25;
    }

    return baseWeight;
  }
}
