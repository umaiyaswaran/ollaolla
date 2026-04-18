/**
 * Self-Healing Network System
 * Simulates large-scale network (100+ nodes) with automatic failure detection and rerouting
 */

export interface NetworkNode {
  id: string;
  name: string;
  type: "core" | "edge" | "service" | "client";
  region: string;
  cpu: number; // 0-100
  memory: number; // 0-100
  latency: number; // ms to nearest hub
  isHealthy: boolean;
  isOverloaded: boolean;
  failureRisk: number; // 0-100
  connections: string[]; // Connected node IDs
  position: { x: number; y: number; z: number };
}

export interface NetworkConnection {
  id: string;
  fromNode: string;
  toNode: string;
  bandwidth: number; // Mbps
  latency: number; // ms
  packetLoss: number; // 0-100
  isActive: boolean;
  utilization: number; // 0-100
  isRerouted: boolean;
}

export interface NetworkMetrics {
  totalNodes: number;
  activeNodes: number;
  failedNodes: number;
  overloadedNodes: number;
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  averageLatency: number;
  systemHealth: number; // 0-100
  reroutedTraffic: number; // percentage
  recoveryRate: number; // nodes recovered in last minute
}

export interface FailureEvent {
  id: string;
  nodeId: string;
  type: "node_crash" | "link_failure" | "overload" | "latency_spike";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  affectedConnections: number;
  resolved: boolean;
  recoveryTime?: number;
  reroute?: {
    originalPath: string[];
    newPath: string[];
    trafficMoved: number; // percentage
  };
}

/**
 * Main Network Healing System
 */
export class SelfHealingNetwork {
  nodes: Map<string, NetworkNode> = new Map();
  connections: Map<string, NetworkConnection> = new Map();
  failureHistory: FailureEvent[] = [];
  private simulationRunning = false;
  private failureDetectionInterval: NodeJS.Timer | null = null;
  private recoveryInterval: NodeJS.Timer | null = null;

  constructor(nodeCount: number = 100) {
    this.initializeNetwork(nodeCount);
  }

  /**
   * Initialize large-scale network topology
   */
  private initializeNetwork(nodeCount: number) {
    console.log(`Initializing network with ${nodeCount} nodes...`);

    // Create nodes across different regions
    const regions = ["us-east", "us-west", "eu-central", "asia-pacific", "global-core"];
    const types: ("core" | "edge" | "service" | "client")[] = ["core", "edge", "service", "client"];

    for (let i = 0; i < nodeCount; i++) {
      const region = regions[i % regions.length];
      const type = i < 5 ? "core" : i < 20 ? "edge" : i < 60 ? "service" : "client";

      const nodeId = `node-${i}`;
      const node: NetworkNode = {
        id: nodeId,
        name: `${type.toUpperCase()}-${region}-${i}`,
        type,
        region,
        cpu: Math.random() * 70,
        memory: Math.random() * 70,
        latency: Math.random() * 100 + (type === "core" ? 5 : 20),
        isHealthy: true,
        isOverloaded: false,
        failureRisk: Math.random() * 15,
        connections: [],
        position: this.generateNodePosition(i, nodeCount),
      };

      this.nodes.set(nodeId, node);
    }

    // Create connections
    const coreNodes = Array.from(this.nodes.values()).filter((n) => n.type === "core");
    const edgeNodes = Array.from(this.nodes.values()).filter((n) => n.type === "edge");
    const serviceNodes = Array.from(this.nodes.values()).filter((n) => n.type === "service");
    const clientNodes = Array.from(this.nodes.values()).filter((n) => n.type === "client");

    // Connect core nodes (mesh topology)
    for (let i = 0; i < coreNodes.length; i++) {
      for (let j = i + 1; j < coreNodes.length; j++) {
        this.createConnection(coreNodes[i].id, coreNodes[j].id, 10000, 1);
      }
    }

    // Connect edge to core (hub-spoke)
    edgeNodes.forEach((edge) => {
      const randomCore = coreNodes[Math.floor(Math.random() * coreNodes.length)];
      this.createConnection(edge.id, randomCore.id, 5000, 5);
    });

    // Connect services to edges
    serviceNodes.forEach((service) => {
      const randomEdge = edgeNodes[Math.floor(Math.random() * edgeNodes.length)];
      this.createConnection(service.id, randomEdge.id, 1000, 10);
      // Add redundant connection
      if (Math.random() > 0.6) {
        const backupEdge = edgeNodes[Math.floor(Math.random() * edgeNodes.length)];
        if (backupEdge.id !== randomEdge.id) {
          this.createConnection(service.id, backupEdge.id, 1000, 10);
        }
      }
    });

    // Connect clients to services
    clientNodes.forEach((client) => {
      const randomService = serviceNodes[Math.floor(Math.random() * serviceNodes.length)];
      this.createConnection(client.id, randomService.id, 100, 20);
    });

    console.log(`✓ Network initialized with ${this.nodes.size} nodes and ${this.connections.size} connections`);
  }

  /**
   * Create a network connection with redundancy awareness
   */
  private createConnection(fromId: string, toId: string, bandwidth: number, baseLatency: number) {
    const connectionId = `conn-${fromId}-${toId}`;
    const connection: NetworkConnection = {
      id: connectionId,
      fromNode: fromId,
      toNode: toId,
      bandwidth,
      latency: baseLatency + Math.random() * 10,
      packetLoss: Math.random() * 0.5,
      isActive: true,
      utilization: Math.random() * 60,
      isRerouted: false,
    };

    this.connections.set(connectionId, connection);

    // Track connection in nodes
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (fromNode && !fromNode.connections.includes(toId)) {
      fromNode.connections.push(toId);
    }
    if (toNode && !toNode.connections.includes(fromId)) {
      toNode.connections.push(fromId);
    }
  }

  /**
   * Generate 3D position for visualization
   */
  private generateNodePosition(index: number, total: number): { x: number; y: number; z: number } {
    const angle = (index / total) * Math.PI * 2;
    const radius = 100 + (index % 5) * 40;
    return {
      x: Math.cos(angle) * radius,
      y: (Math.random() - 0.5) * 100,
      z: Math.sin(angle) * radius,
    };
  }

  /**
   * Start network simulation with continuous monitoring
   */
  startSimulation() {
    this.simulationRunning = true;
    console.log("Starting network simulation...");

    // Failure detection every 2 seconds
    this.failureDetectionInterval = setInterval(() => {
      this.detectFailures();
      this.updateNodeMetrics();
    }, 2000);

    // Recovery mechanism every 5 seconds
    this.recoveryInterval = setInterval(() => {
      this.attemptRecovery();
    }, 5000);
  }

  /**
   * Stop simulation
   */
  stopSimulation() {
    this.simulationRunning = false;
    if (this.failureDetectionInterval) clearInterval(this.failureDetectionInterval);
    if (this.recoveryInterval) clearInterval(this.recoveryInterval);
    console.log("Network simulation stopped");
  }

  /**
   * Detect network failures using ML heuristics
   */
  private detectFailures() {
    this.nodes.forEach((node) => {
      // Simulate failure based on risk score
      if (node.failureRisk > 85 && Math.random() > 0.7) {
        this.triggerNodeFailure(node.id);
      }

      // Detect overload conditions
      if (node.cpu > 85 || node.memory > 85) {
        if (!node.isOverloaded) {
          this.handleNodeOverload(node.id);
        }
      }

      // Detect latency spikes
      if (node.latency > 150 && !node.isHealthy) {
        this.handleLatencySpike(node.id);
      }

      // Self-healing: gradually recover healthy nodes
      if (!node.isHealthy && Math.random() > 0.5) {
        node.failureRisk = Math.max(0, node.failureRisk - 2);
      }
    });

    // Monitor connection health
    this.connections.forEach((conn) => {
      if (conn.utilization > 90) {
        conn.utilization = Math.min(100, conn.utilization + 5);
        conn.packetLoss = Math.min(5, conn.packetLoss + 0.5);
      } else {
        conn.utilization = Math.max(0, conn.utilization - 1);
        conn.packetLoss = Math.max(0, conn.packetLoss - 0.1);
      }

      // Link failure detection
      if (conn.packetLoss > 3 || conn.latency > 200) {
        if (conn.isActive) {
          this.triggerLinkFailure(conn.id);
        }
      }
    });
  }

  /**
   * Trigger a node failure event
   */
  private triggerNodeFailure(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (!node || !node.isHealthy) return;

    node.isHealthy = false;
    node.cpu = 100;
    node.memory = 100;
    node.failureRisk = 100;

    // Disable all connections to this node
    const affectedConnections: string[] = [];
    this.connections.forEach((conn) => {
      if (conn.fromNode === nodeId || conn.toNode === nodeId) {
        conn.isActive = false;
        affectedConnections.push(conn.id);
      }
    });

    const failureEvent: FailureEvent = {
      id: `failure-${Date.now()}`,
      nodeId,
      type: "node_crash",
      severity: node.type === "core" ? "critical" : node.type === "edge" ? "high" : "medium",
      timestamp: Date.now(),
      affectedConnections: affectedConnections.length,
      resolved: false,
    };

    this.failureHistory.push(failureEvent);
    console.log(`🚨 Node failure detected: ${node.name} (${affectedConnections.length} connections affected)`);

    // Trigger rerouting for affected traffic
    this.rerouteTraffic(nodeId, affectedConnections);
  }

  /**
   * Trigger a link failure
   */
  private triggerLinkFailure(connId: string) {
    const conn = this.connections.get(connId);
    if (!conn || !conn.isActive) return;

    conn.isActive = false;

    const failureEvent: FailureEvent = {
      id: `failure-${Date.now()}`,
      nodeId: conn.fromNode,
      type: "link_failure",
      severity: "high",
      timestamp: Date.now(),
      affectedConnections: 1,
      resolved: false,
    };

    this.failureHistory.push(failureEvent);
    console.log(
      `🔗 Link failure: ${conn.fromNode} → ${conn.toNode} (${conn.bandwidth}Mbps, latency: ${conn.latency}ms)`
    );

    // Find alternate path
    this.rerouteTraffic(conn.fromNode, [connId]);
  }

  /**
   * Handle node overload with load balancing
   */
  private handleNodeOverload(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.isOverloaded = true;

    // Find alternative nodes
    const healthyAlternatives = Array.from(this.nodes.values())
      .filter((n) => n.isHealthy && !n.isOverloaded && n.type === node.type && n.region === node.region)
      .slice(0, 3);

    if (healthyAlternatives.length > 0) {
      console.log(`📊 Load balancing: ${node.name} → ${healthyAlternatives.map((n) => n.name).join(", ")}`);

      // Create new connections to healthier nodes
      healthyAlternatives.forEach((alt) => {
        this.connections.forEach((conn) => {
          if ((conn.fromNode === nodeId || conn.toNode === nodeId) && conn.isActive) {
            // Clone traffic to alternative
            const otherEnd = conn.fromNode === nodeId ? conn.toNode : conn.fromNode;
            this.createConnection(
              alt.id,
              otherEnd,
              conn.bandwidth * 0.5,
              conn.latency
            );
          }
        });
      });
    }
  }

  /**
   * Handle latency spikes with path optimization
   */
  private handleLatencySpike(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Reduce traffic to high-latency nodes
    this.connections.forEach((conn) => {
      if (conn.fromNode === nodeId || conn.toNode === nodeId) {
        if (conn.latency > 150) {
          conn.utilization = Math.max(0, conn.utilization - 30);
          console.log(`⏱️ Reducing traffic on high-latency link (${conn.latency}ms)`);
        }
      }
    });
  }

  /**
   * Find optimal alternative path using Dijkstra's algorithm
   */
  private findAlternativePath(sourceId: string, destId: string, excludeNodes: Set<string>): string[] {
    if (excludeNodes.has(sourceId) || excludeNodes.has(destId)) {
      return [];
    }

    const distances: Map<string, number> = new Map();
    const previous: Map<string, string> = new Map();
    const unvisited = new Set(this.nodes.keys());

    // Initialize distances
    this.nodes.forEach((_, id) => {
      distances.set(id, id === sourceId ? 0 : Infinity);
    });

    while (unvisited.size > 0) {
      let current: string | null = null;
      let minDist = Infinity;

      for (const node of unvisited) {
        const dist = distances.get(node) || Infinity;
        if (dist < minDist) {
          minDist = dist;
          current = node;
        }
      }

      if (current === null || current === destId) break;
      unvisited.delete(current);

      // Check neighbors
      const currentNode = this.nodes.get(current);
      if (currentNode) {
        for (const neighbor of currentNode.connections) {
          if (excludeNodes.has(neighbor) || !unvisited.has(neighbor)) continue;

          let weight = Infinity;
          this.connections.forEach((conn) => {
            if ((conn.fromNode === current && conn.toNode === neighbor) || 
                (conn.toNode === current && conn.fromNode === neighbor)) {
              if (conn.isActive) {
                weight = conn.latency + (conn.utilization / 10);
              }
            }
          });

          const newDist = (distances.get(current) || Infinity) + weight;
          if (newDist < (distances.get(neighbor) || Infinity)) {
            distances.set(neighbor, newDist);
            previous.set(neighbor, current);
          }
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let current: string | undefined = destId;

    while (current !== undefined) {
      path.unshift(current);
      current = previous.get(current);
    }

    return path[0] === sourceId ? path : [];
  }

  /**
   * Reroute traffic around failed nodes
   */
  private rerouteTraffic(failedNodeId: string, affectedConnections: string[]) {
    const failedNode = this.nodes.get(failedNodeId);
    if (!failedNode) return;

    const excludeNodes = new Set<string>([failedNodeId]);
    let trafficRerouted = 0;

    for (const connId of affectedConnections) {
      const conn = this.connections.get(connId);
      if (!conn) continue;

      const otherEnd = conn.fromNode === failedNodeId ? conn.toNode : conn.fromNode;
      const newPath = this.findAlternativePath(
        conn.fromNode === failedNodeId ? failedNodeId : otherEnd,
        conn.fromNode === failedNodeId ? otherEnd : failedNodeId,
        excludeNodes
      );

      if (newPath.length > 0) {
        conn.isRerouted = true;
        trafficRerouted += conn.utilization;

        const lastFailure = this.failureHistory[this.failureHistory.length - 1];
        if (lastFailure) {
          lastFailure.reroute = {
            originalPath: [conn.fromNode, failedNodeId, conn.toNode],
            newPath,
            trafficMoved: conn.utilization,
          };
        }

        console.log(`🔄 Traffic rerouted: ${newPath.join(" → ")}`);
      }
    }

    console.log(`✅ Rerouted ${trafficRerouted.toFixed(1)}% of traffic`);
  }

  /**
   * Attempt to recover failed nodes
   */
  private attemptRecovery() {
    let recovered = 0;

    this.nodes.forEach((node) => {
      if (!node.isHealthy && node.failureRisk < 30) {
        // Attempt recovery
        node.isHealthy = true;
        node.isOverloaded = false;
        node.cpu = Math.random() * 40;
        node.memory = Math.random() * 40;
        node.failureRisk = Math.random() * 10;

        // Re-enable connections
        this.connections.forEach((conn) => {
          if ((conn.fromNode === node.id || conn.toNode === node.id) && !conn.isActive && conn.isRerouted) {
            if (Math.random() > 0.3) {
              conn.isActive = true;
              conn.isRerouted = false;
              console.log(`✨ Connection restored: ${conn.fromNode} ↔ ${conn.toNode}`);
            }
          }
        });

        recovered++;
        console.log(`🔧 Node recovered: ${node.name}`);
      }
    });

    if (recovered > 0) {
      console.log(`✅ ${recovered} node(s) recovered`);
    }
  }

  /**
   * Update dynamic node metrics (CPU, memory, latency)
   */
  private updateNodeMetrics() {
    this.nodes.forEach((node) => {
      if (node.isHealthy) {
        // Simulate organic load changes
        node.cpu = Math.max(0, Math.min(100, node.cpu + (Math.random() - 0.45) * 5));
        node.memory = Math.max(0, Math.min(100, node.memory + (Math.random() - 0.45) * 5));

        // Latency variations
        node.latency = Math.max(5, node.latency + (Math.random() - 0.5) * 3);

        // Reduce overload status if metrics improve
        if (node.isOverloaded && node.cpu < 70 && node.memory < 70) {
          node.isOverloaded = false;
          console.log(`📉 ${node.name} recovered from overload`);
        }
      }
    });
  }

  /**
   * Get current network metrics
   */
  getNetworkMetrics(): NetworkMetrics {
    const nodes = Array.from(this.nodes.values());
    const connections = Array.from(this.connections.values());

    const activeNodes = nodes.filter((n) => n.isHealthy).length;
    const failedNodes = nodes.filter((n) => !n.isHealthy).length;
    const overloadedNodes = nodes.filter((n) => n.isOverloaded).length;

    const activeConnections = connections.filter((c) => c.isActive).length;
    const failedConnections = connections.filter((c) => !c.isActive).length;
    const reroutedConnections = connections.filter((c) => c.isRerouted).length;

    const avgLatency =
      nodes.reduce((sum, n) => sum + n.latency, 0) / nodes.length || 0;

    const systemHealth =
      ((activeNodes / nodes.length) * 60 + 
       (activeConnections / connections.length) * 40);

    return {
      totalNodes: nodes.length,
      activeNodes,
      failedNodes,
      overloadedNodes,
      totalConnections: connections.length,
      activeConnections,
      failedConnections,
      averageLatency: avgLatency,
      systemHealth: Math.round(systemHealth),
      reroutedTraffic: (reroutedConnections / connections.length) * 100,
      recoveryRate: Math.round(activeNodes / 60), // Simplified metric
    };
  }

  /**
   * Get network state for visualization
   */
  getNetworkState() {
    return {
      nodes: Array.from(this.nodes.values()),
      connections: Array.from(this.connections.values()),
      metrics: this.getNetworkMetrics(),
      recentFailures: this.failureHistory.slice(-20), // Last 20 failures
    };
  }
}

// Export singleton instance
export let networkInstance: SelfHealingNetwork | null = null;

export function initializeNetwork(nodeCount: number = 100): SelfHealingNetwork {
  networkInstance = new SelfHealingNetwork(nodeCount);
  return networkInstance;
}

export function getNetworkInstance(): SelfHealingNetwork | null {
  return networkInstance;
}
