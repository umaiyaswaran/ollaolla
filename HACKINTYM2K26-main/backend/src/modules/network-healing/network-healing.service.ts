import { Injectable } from '@nestjs/common';
import {
  SelfHealingNetwork,
  initializeNetwork,
  getNetworkInstance,
} from '../../../src/services/networkHealing';

@Injectable()
export class NetworkHealingService {
  private network: SelfHealingNetwork | null = null;

  constructor() {
    // Initialize network on service creation
    this.network = initializeNetwork(100);
  }

  private getNetwork(): SelfHealingNetwork {
    if (!this.network) {
      this.network = initializeNetwork(100);
    }
    return this.network;
  }

  getNetworkState() {
    return this.getNetwork().getNetworkState();
  }

  getNetworkMetrics() {
    return this.getNetwork().getNetworkMetrics();
  }

  startSimulation() {
    this.getNetwork().startSimulation();
  }

  stopSimulation() {
    this.getNetwork().stopSimulation();
  }

  reset() {
    this.stopSimulation();
    this.network = initializeNetwork(100);
  }

  triggerNodeFailure(nodeId: string) {
    const network = this.getNetwork();
    const networkAny = network as any;
    networkAny.triggerNodeFailure(nodeId);
  }

  getFailureHistory() {
    const network = this.getNetwork();
    const networkAny = network as any;
    const failures = networkAny.failureHistory || [];
    const recentFailures = failures.slice(-50);

    return {
      totalFailures: failures.length,
      recentFailures,
      statistics: {
        nodeFailures: failures.filter((f: any) => f.type === 'node_crash').length,
        linkFailures: failures.filter((f: any) => f.type === 'link_failure').length,
        overloadEvents: failures.filter((f: any) => f.type === 'overload').length,
        latencySpikes: failures.filter((f: any) => f.type === 'latency_spike').length,
      },
    };
  }

  getNodeDetails(nodeId: string) {
    const network = this.getNetwork();
    const networkAny = network as any;
    const node = networkAny.nodes.get(nodeId);

    if (!node) {
      return { error: `Node ${nodeId} not found` };
    }

    const connectedNodes = node.connections.map((connId: string) => ({
      id: connId,
      name: networkAny.nodes.get(connId)?.name || 'Unknown',
    }));

    const connections = Array.from(networkAny.connections.values()).filter(
      (c: any) => c.fromNode === node.id || c.toNode === node.id
    );

    return {
      node,
      connectedNodes,
      connections,
    };
  }

  getHealthStats() {
    const network = this.getNetwork();
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

    nodesByRegion.forEach((region: any) => {
      region.avgCpu /= region.total;
      region.avgMemory /= region.total;
    });

    const metrics = network.getNetworkMetrics();

    return {
      metrics,
      byRegion: Object.fromEntries(nodesByRegion),
      failureStats: {
        total: failures.length,
        lastHour: failures.filter((f: any) => Date.now() - f.timestamp < 3600000).length,
        byType: {
          nodeCrash: failures.filter((f: any) => f.type === 'node_crash').length,
          linkFailure: failures.filter((f: any) => f.type === 'link_failure').length,
          overload: failures.filter((f: any) => f.type === 'overload').length,
          latencySpike: failures.filter((f: any) => f.type === 'latency_spike').length,
        },
        resolved: failures.filter((f: any) => f.resolved).length,
        unresolved: failures.filter((f: any) => !f.resolved).length,
      },
    };
  }
}
