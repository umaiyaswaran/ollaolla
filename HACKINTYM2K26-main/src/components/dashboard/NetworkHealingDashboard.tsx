import React, { useState, useEffect } from "react";
import { AlertTriangle, Play, Pause, RotateCcw, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import io, { Socket } from "socket.io-client";
import NetworkGraph3D from "./NetworkHealing3D";
import type {
  NetworkNode,
  NetworkConnection,
  NetworkMetrics,
  FailureEvent,
} from "@/services/networkHealing";

export default function NetworkHealingDashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [failures, setFailures] = useState<FailureEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io("http://localhost:3001", {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to network healing server");
    });

    newSocket.on("network:state", (state: any) => {
      setNodes(state.nodes);
      setConnections(state.connections);
      setMetrics(state.metrics);
      setFailures(state.recentFailures);
    });

    newSocket.on("network:metrics", (newMetrics: NetworkMetrics) => {
      setMetrics(newMetrics);
    });

    newSocket.on("network:failure", (failure: FailureEvent) => {
      setFailures((prev) => [failure, ...prev].slice(0, 50));
    });

    newSocket.on("network:message", (msg: any) => {
      console.log(`[${msg.type}] ${msg.message}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleStart = () => {
    socket?.emit("network:start");
    setIsRunning(true);
  };

  const handleStop = () => {
    socket?.emit("network:stop");
    setIsRunning(false);
  };

  const handleReset = () => {
    socket?.emit("network:reset");
    setFailures([]);
    setSelectedNode(null);
  };

  const handleTriggerFailure = (nodeId: string) => {
    socket?.emit("network:trigger-failure", { nodeId });
  };

  const healthColor = (health: number) => {
    if (health > 80) return "text-green-400";
    if (health > 60) return "text-yellow-400";
    return "text-red-400";
  };

  const failedNodes = nodes.filter((n) => !n.isHealthy);
  const overloadedNodes = nodes.filter((n) => n.isOverloaded);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
          🌐 Self-Healing Network System
        </h1>
        <p className="text-slate-400">AI-driven network with automatic failure detection and rerouting</p>
      </div>

      {/* Control Panel */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-3">
            <Button
              onClick={handleStart}
              disabled={isRunning}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Play size={16} /> Start Simulation
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isRunning}
              className="gap-2 bg-yellow-600 hover:bg-yellow-700"
            >
              <Pause size={16} /> Stop Simulation
            </Button>
            <Button
              onClick={handleReset}
              className="gap-2 bg-slate-600 hover:bg-slate-700"
            >
              <RotateCcw size={16} /> Reset Network
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {isRunning && (
              <Badge className="animate-pulse bg-green-500/20 border-green-500 text-green-300">
                <Activity size={12} className="mr-1" /> Running
              </Badge>
            )}
            {metrics && (
              <div className={`text-sm font-mono ${healthColor(metrics.systemHealth)}`}>
                Health: {metrics.systemHealth}%
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6 lg:grid-cols-4">
        {/* 3D Network Visualization - Takes 2 columns */}
        <div className="col-span-2">
          {metrics && (
            <Card className="bg-slate-900/30 border-cyan-500/20 p-4 h-96">
              <NetworkGraph3D nodes={nodes} connections={connections} metrics={metrics} />
            </Card>
          )}
        </div>

        {/* Real-Time Metrics */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-widest mb-3">
              📊 Network Metrics
            </h3>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Nodes</div>
                <div className="text-xl font-bold text-cyan-300">
                  {metrics?.activeNodes || 0} / {metrics?.totalNodes || 0}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase">Connections</div>
                <div className="text-xl font-bold text-cyan-300">
                  {metrics?.activeConnections || 0} / {metrics?.totalConnections || 0}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase">Avg Latency</div>
                <div className="text-xl font-bold text-cyan-300">
                  {metrics?.averageLatency.toFixed(1) || 0}ms
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase">Rerouted Traffic</div>
                <div className="text-xl font-bold text-cyan-300">
                  {metrics?.reroutedTraffic.toFixed(1) || 0}%
                </div>
              </div>
            </div>
          </Card>

          {/* Failed Nodes Alert */}
          {failedNodes.length > 0 && (
            <Card className="bg-red-500/10 border-red-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-400" />
                <h3 className="text-xs font-bold text-red-300 uppercase tracking-widest">
                  ⚠️ Failed Nodes
                </h3>
              </div>
              <div className="space-y-1">
                {failedNodes.slice(0, 5).map((node) => (
                  <div
                    key={node.id}
                    className="text-xs text-red-300 p-2 bg-red-500/5 rounded border border-red-500/20 cursor-pointer hover:bg-red-500/10"
                    onClick={() => handleTriggerFailure(node.id)}
                  >
                    {node.name}
                  </div>
                ))}
                {failedNodes.length > 5 && (
                  <div className="text-xs text-red-300/50">+{failedNodes.length - 5} more</div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Failure Event Log */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-6">
        <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-widest mb-4">
          🔥 Recent Failure Events
        </h3>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {failures.length === 0 ? (
            <div className="text-xs text-slate-400 italic">No failures detected</div>
          ) : (
            failures.map((failure) => (
              <div
                key={failure.id}
                className="p-3 bg-slate-800/50 border border-slate-700/50 rounded text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className={
                    failure.severity === "critical"
                      ? "text-red-400"
                      : failure.severity === "high"
                        ? "text-orange-400"
                        : failure.severity === "medium"
                          ? "text-yellow-400"
                          : "text-blue-400"
                  }>
                    ⚡ {failure.type.toUpperCase()}
                  </span>
                  <span className="text-slate-500">
                    {new Date(failure.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-slate-300">
                  Node: <span className="text-cyan-300">{failure.nodeId}</span>
                </div>

                {failure.reroute && (
                  <div className="text-slate-300">
                    Rerouted: {failure.reroute.originalPath.slice(0, 2).join(" → ")} →{" "}
                    <span className="text-cyan-300">{failure.reroute.newPath.slice(1, -1).join(" → ")}</span> →{" "}
                    {failure.reroute.originalPath.slice(-1)[0]}
                  </div>
                )}

                {failure.resolved && (
                  <div className="text-green-400">✓ Resolved after {failure.recoveryTime}ms</div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Statistics Summary */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4 text-center">
            <div className="text-[10px] text-slate-400 uppercase mb-2">Failed Nodes</div>
            <div className={`text-2xl font-bold ${metrics.failedNodes > 0 ? "text-red-400" : "text-green-400"}`}>
              {metrics.failedNodes}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4 text-center">
            <div className="text-[10px] text-slate-400 uppercase mb-2">Overloaded Nodes</div>
            <div className={`text-2xl font-bold ${metrics.overloadedNodes > 0 ? "text-yellow-400" : "text-green-400"}`}>
              {metrics.overloadedNodes}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4 text-center">
            <div className="text-[10px] text-slate-400 uppercase mb-2">Link Failures</div>
            <div className={`text-2xl font-bold ${metrics.failedConnections > 0 ? "text-orange-400" : "text-green-400"}`}>
              {metrics.failedConnections}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4 text-center">
            <div className="text-[10px] text-slate-400 uppercase mb-2">System Health</div>
            <div className={`text-2xl font-bold ${healthColor(metrics.systemHealth)}`}>
              {metrics.systemHealth}%
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
