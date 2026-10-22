import { AppStore } from '../store';
import { CrowdRiskEngine } from '../engine/riskEngine';
import { VenueRouteEngine } from '../engine/routeEngine';
import { Zone, Sensor } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING CROWDGUARD AI CORE BACKEND & ENGINE TESTS');
  console.log('=======================================================\n');

  const store = new AppStore();
  const venue = store.getVenueById('venue-baghbazar-pandal')!;

  // -----------------------------------------------------------------
  // Test 1: Crowd Risk Engine Calculations
  // -----------------------------------------------------------------
  console.log('--- Test Suite 1: Explainable Crowd Risk Engine ---');
  const riskEngine = new CrowdRiskEngine({ staleThresholdMs: 30000 });

  const normalZone: Zone = {
    id: 'z-test-1',
    name: 'Normal Zone',
    areaSqM: 100,
    capacity: 200,
    currentCount: 80, // 40% capacity, 0.8 /m²
    density: 0.8,
    inflowRate: 20,
    outflowRate: 20,
    riskLevel: 'LOW',
    riskReason: '',
    confidence: 90,
    lastUpdated: new Date().toISOString(),
    bounds: { x: 0, y: 0, width: 100, height: 100 }
  };
  const activeSensor: Sensor = {
    id: 's-test-1',
    venueId: 'v1',
    name: 'Test Sensor',
    type: 'OVERHEAD_PEOPLE_COUNTER',
    status: 'ONLINE',
    lastHeartbeat: new Date().toISOString(),
    currentReading: 80,
    isSimulated: true
  };

  const evalLow = riskEngine.evaluateZoneRisk(normalZone, activeSensor, []);
  assert(evalLow.riskLevel === 'LOW', 'Zone with 40% capacity evaluates to LOW risk');

  // Critical surge test
  const surgeZone: Zone = {
    ...normalZone,
    currentCount: 195, // 97.5% capacity
    density: 1.95,
    inflowRate: 90,
    outflowRate: 20,
  };
  const evalCrit = riskEngine.evaluateZoneRisk(surgeZone, activeSensor, []);
  assert(evalCrit.riskLevel === 'CRITICAL', 'Zone above 95% capacity evaluates to CRITICAL risk');
  assert(evalCrit.riskReason.includes('CRITICAL THRESHOLD'), 'Risk engine provides transparent explainable reasoning');

  // -----------------------------------------------------------------
  // Test 2: Stale Data & Sensor Failure Transition to UNKNOWN
  // -----------------------------------------------------------------
  console.log('\n--- Test Suite 2: Sensor Health & Stale Data Safeguards ---');
  const offlineSensor: Sensor = {
    ...activeSensor,
    status: 'OFFLINE'
  };
  const evalOffline = riskEngine.evaluateZoneRisk(normalZone, offlineSensor, []);
  assert(evalOffline.riskLevel === 'UNKNOWN', 'Offline sensor transitions zone status to UNKNOWN');
  assert(evalOffline.confidence === 0, 'Offline sensor sets confidence to 0%');

  // Stale timestamp test
  const staleZone: Zone = {
    ...normalZone,
    lastUpdated: new Date(Date.now() - 60000).toISOString(), // 60s ago (> 30s threshold)
  };
  const evalStale = riskEngine.evaluateZoneRisk(staleZone, activeSensor, []);
  assert(evalStale.riskLevel === 'UNKNOWN', 'Stale sensor telemetry (>30s) automatically triggers UNKNOWN status');

  // -----------------------------------------------------------------
  // Test 3: Gate Closure & Dynamic Route Recalculation
  // -----------------------------------------------------------------
  console.log('\n--- Test Suite 3: Gate Closure, Verified Alerts & Routing ---');
  // Initial route from Gate 1 to Gate 3
  const initialRoute = VenueRouteEngine.calculateRoute(venue, 'node-bb-g1', 'node-bb-g3');
  assert(initialRoute.found === true, 'Route successfully found when all gates are open');
  assert(initialRoute.pathCorridors.length > 0, 'Path includes corridors');

  // Close Gate 3 via Store
  const closeResult = store.updateGateStatus(
    venue.id,
    'gate-bb-03',
    'CLOSED',
    { name: 'Inspector Roy', role: 'SAFETY_OFFICER' },
    'Closed due to heavy street traffic outside'
  );
  assert(closeResult.success === true, 'Authorized safety officer can close gate');
  assert(closeResult.alertCreated !== undefined, 'Closing exit gate automatically generates verified safety alert');
  assert(closeResult.alertCreated?.message.includes('Gate 3 (South Main Dispersal Exit) is temporarily closed'), 'Alert contains specific gate guidance');

  // Check route to closed Gate 3 now fails safely
  const blockedRoute = VenueRouteEngine.calculateRoute(venue, 'node-bb-g1', 'node-bb-g3');
  assert(blockedRoute.found === false, 'Route planner rejects paths terminating at a CLOSED gate');
  assert(blockedRoute.message?.includes('closed'), 'Planner outputs verified safety advisory instead of imaginary path');

  // Route to alternate open Gate 4 succeeds
  const alternateRoute = VenueRouteEngine.calculateRoute(venue, 'node-bb-g1', 'node-bb-g4');
  assert(alternateRoute.found === true, 'Route planner successfully reroutes pedestrians to alternate open Gate 4');

  // -----------------------------------------------------------------
  // Test 4: Public Reporting & Review Triaging
  // -----------------------------------------------------------------
  console.log('\n--- Test Suite 4: Public Reporting & Triaging ---');
  const report = store.submitPublicReport(
    venue.id,
    {
      category: 'BLOCKED_PASSAGE',
      locationDescription: 'North plaza corridor near stall',
      details: 'Trash cart blocking ramp',
    },
    'Public App Visitor #12'
  );
  assert(report.status === 'UNVERIFIED', 'Public reports default to UNVERIFIED');
  assert(report.corroborationCount === 1, 'Corroboration count begins at 1');

  const triageSuccess = store.triagePublicReport(
    report.id,
    'INVESTIGATING',
    { name: 'Priyanka Ghosh', role: 'VENUE_MANAGER' },
    'Dispatched cleaner unit'
  );
  assert(triageSuccess === true, 'Authority can triage report to INVESTIGATING');
  assert(report.status === 'INVESTIGATING', 'Report status properly updated');

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log('\n=======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
