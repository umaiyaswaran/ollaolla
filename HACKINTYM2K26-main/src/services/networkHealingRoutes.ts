/**
 * Network Healing System - Express API Routes
 * Handles network simulation, failure triggers, and metrics
 */

import express, { Request, Response } from "express";
import { initializeNetwork, getNetworkInstance } from "./networkHealing";

const router = express.Router();

// Initialize network on first request
let initialized = false;

router.use((req, res, next) => {
  if (!initialized) {
    initializeNetwork(100); // 100 nodes
    initialized = true;
  }
  next();
});

/**
 * GET /api/network/state
 * Get current network state (nodes, connections, metrics)
 */
router.get("/state", (req: Request, res: Response) => {
  const network = getNetworkInstance();
  if (!network) {
    return res.status(500).json({ error: "Network not initialized" });
  }

  const state = network.getNetworkState();
  res.json(state);
});

/**
 * GET /api/network/metrics
 * Get network health metrics
 */
router.get("/metrics", (req: Request, res: Response) => {
  const network = getNetworkInstance();
  if (!network) {
    return res.status(500).json({ error: "Network not initialized" });
  }

  const metrics = network.getNetworkMetrics();
  res.json(metrics);
});

/**
 * POST /api/network/start
 * Start network simulation
 */
router.post("/start", (req: Request, res: Response) => {
  const network = getNetworkInstance();
  if (!network) {
    return res.status(500).json({ error: "Network not initialized" });
  }

  network.startSimulation();
  res.json({ status: "started", message: "Network simulation started" });
});

/**
 * POST /api/network/stop
 * Stop network simulation
 */
router.post("/stop", (req: Request, res: Response) => {
  const network = getNetworkInstance();
  if (!network) {
    return res.status(500).json({ error: "Network not initialized" });
  }

  network.stopSimulation();
  res.json({ status: "stopped", message: "Network simulation stopped" });
});

/**
 * POST /api/network/trigger-failure
 * Manually trigger a node failure (for testing)
 */
router.post("/trigger-failure", (req: Request, res: Response) => {
  const network = getNetworkInstance();
  if (!network) {
    return res.status(500).json({ error: "Network not initialized" });
  }

  const { nodeId } = req.body;
  if (!nodeId) {
    return res.status(400).json({ error: "nodeId required" });
  }

  // Access private method via type cast (for demo purposes)
  const networkAny = network as any;
  networkAny.triggerNodeFailure(nodeId);

  res.json({ status: "failure_triggered", nodeId, message: `Failure triggered on ${nodeId}` });
});

/**
 * POST /api/network/reset
 * Reset network to healthy state
 */
router.post("/reset", (req: Request, res: Response) => {
  const network = getNetworkInstance();
  if (!network) {
    return res.status(500).json({ error: "Network not initialized" });
  }

  // Reset by stopping and reinitializing
  network.stopSimulation();
  initialized = false;
  initializeNetwork(100);

  res.json({ status: "reset", message: "Network reset to healthy state" });
});

/**
 * GET /api/network/failures
 * Get recent failure history
 */
router.get("/failures", (req: Request, res: Response) => {
  const network = getNetworkInstance();
  if (!network) {
    return res.status(500).json({ error: "Network not initialized" });
  }

  const networkAny = network as any;
  const failures = networkAny.failureHistory || [];
  const recentFailures = failures.slice(-50); // Last 50 failures

  res.json({
    totalFailures: failures.length,
    recentFailures,
    statistics: {
      nodeFailures: failures.filter((f: any) => f.type === "node_crash").length,
      linkFailures: failures.filter((f: any) => f.type === "link_failure").length,
      overloadEvents: failures.filter((f: any) => f.type === "overload").length,
      latencySpikes: failures.filter((f: any) => f.type === "latency_spike").length,
    },
  });
});

/**
 * GET /api/network/node/:nodeId
 * Get details for a specific node
 */
router.get("/node/:nodeId", (req: Request, res: Response) => {
  const network = getNetworkInstance();
  if (!network) {
    return res.status(500).json({ error: "Network not initialized" });
  }

  const networkAny = network as any;
  const node = networkAny.nodes.get(req.params.nodeId);

  if (!node) {
    return res.status(404).json({ error: `Node ${req.params.nodeId} not found` });
  }

  // Get connected nodes
  const connectedNodes = node.connections.map((connId: string) => ({
    id: connId,
    name: networkAny.nodes.get(connId)?.name || "Unknown",
  }));

  // Get connections involving this node
  const connections = Array.from(networkAny.connections.values()).filter(
    (c: any) => c.fromNode === node.id || c.toNode === node.id
  );

  res.json({
    node,
    connectedNodes,
    connections,
  });
});

/**
 * GET /api/network/stats/health
 * Get aggregated health statistics
 */
router.get("/stats/health", (req: Request, res: Response) => {
  const network = getNetworkInstance();
  if (!network) {
    return res.status(500).json({ error: "Network not initialized" });
  }

  const networkAny = network as any;
  const nodes = Array.from(networkAny.nodes.values());
  const connections = Array.from(networkAny.connections.values());
  const failures = networkAny.failureHistory || [];

  const nodesByRegion = new Map<string, any>();
  nodes.forEach((node: any) => {
    if (!nodesByRegion.has(node.region)) {
      nodesByRegion.set(node.region, {
        total: 0,
        healthy: 0,
        failed: 0,
        overloaded: 0,
        avgCpu: 0,
        avgMemory: 0,
        nodes: [],
      });
    }

    const region = nodesByRegion.get(node.region);
    region.total++;
    if (node.isHealthy) region.healthy++;
    else region.failed++;
    if (node.isOverloaded) region.overloaded++;
    region.avgCpu += node.cpu;
    region.avgMemory += node.memory;
    region.nodes.push(node.id);
  });

  // Finalize region stats
  nodesByRegion.forEach((region: any) => {
    region.avgCpu /= region.total;
    region.avgMemory /= region.total;
  });

  const metrics = network.getNetworkMetrics();

  res.json({
    metrics,
    byRegion: Object.fromEntries(nodesByRegion),
    failureStats: {
      total: failures.length,
      lastHour: failures.filter((f: any) => Date.now() - f.timestamp < 3600000).length,
      byType: {
        nodeCrash: failures.filter((f: any) => f.type === "node_crash").length,
        linkFailure: failures.filter((f: any) => f.type === "link_failure").length,
        overload: failures.filter((f: any) => f.type === "overload").length,
        latencySpike: failures.filter((f: any) => f.type === "latency_spike").length,
      },
      avgRecoveryTime: calculateAvgRecoveryTime(failures),
      resolved: failures.filter((f: any) => f.resolved).length,
      unresolved: failures.filter((f: any) => !f.resolved).length,
    },
  });
});

/**
 * Helper: Calculate average recovery time from failures
 */
function calculateAvgRecoveryTime(failures: any[]): number {
  const recoveredFailures = failures.filter((f: any) => f.recoveryTime);
  if (recoveredFailures.length === 0) return 0;

  const total = recoveredFailures.reduce((sum: number, f: any) => sum + (f.recoveryTime || 0), 0);
  return total / recoveredFailures.length;
}

export default router;
