
import { create } from "zustand";

export type NodeStatus = "healthy" | "warning" | "critical" | "healing";
export type ServerRole = "edge" | "compute" | "database" | "cache" | "core";

export interface ServerNode {
  id: string;
  label: string;
  role: ServerRole;
  status: NodeStatus;
  position: [number, number, number];
  latency: number;       // ms
  cpu: number;           // 0-100
  load: number;          // 0-100 traffic share
  errors: number;
  capacity: number;      // req/s capacity
}

export interface Edge {
  from: string;
  to: string;
  active: boolean;
  flowRate: number; // 0..1
}

export type LogLevel = "info" | "warn" | "alert" | "heal" | "ok";
export interface DecisionLog {
  id: string;
  ts: number;
  level: LogLevel;
  message: string;
  reason?: string;
}

export interface MonitorTarget {
  url: string;
  status: "idle" | "ok" | "slow" | "down";
  httpStatus?: number;
  latencyMs?: number;
  lastChecked?: number;
  history: { t: number; latency: number; ok: boolean }[];
}

interface SimState {
  nodes: ServerNode[];
  edges: Edge[];
  logs: DecisionLog[];
  trafficLevel: number;     // 0..100 slider
  totalRps: number;
  monitor: MonitorTarget | null;
  selectedNodeId: string | null;
  predictedFailureId: string | null;

  // actions
  setTraffic: (n: number) => void;
  selectNode: (id: string | null) => void;
  injectFailure: (kind: "kill" | "slow" | "overload", id: string) => void;
  triggerRandomFailure: () => void;
  setMonitorUrl: (url: string) => void;
  pushLog: (l: Omit<DecisionLog, "id" | "ts">) => void;
  tick: () => void;
  checkMonitor: () => Promise<void>;
}

const ROLE_CAPACITY: Record<ServerRole, number> = {
  edge: 4000, compute: 2500, database: 1500, cache: 6000, core: 5000,
};

const initialNodes: ServerNode[] = [
  { id: "core", label: "CORE", role: "core", status: "healthy", position: [0, 0, 0], latency: 8, cpu: 32, load: 30, errors: 0, capacity: ROLE_CAPACITY.core },
  { id: "edge-a", label: "EDGE-A", role: "edge", status: "healthy", position: [-3.2, 1.6, 1.2], latency: 14, cpu: 40, load: 25, errors: 0, capacity: ROLE_CAPACITY.edge },
  { id: "edge-b", label: "EDGE-B", role: "edge", status: "healthy", position: [3.4, 1.4, -1.0], latency: 17, cpu: 38, load: 22, errors: 0, capacity: ROLE_CAPACITY.edge },
  { id: "compute-1", label: "CMP-1", role: "compute", status: "healthy", position: [-2.4, -1.8, -1.6], latency: 22, cpu: 50, load: 35, errors: 0, capacity: ROLE_CAPACITY.compute },
  { id: "compute-2", label: "CMP-2", role: "compute", status: "healthy", position: [2.2, -1.6, 1.8], latency: 24, cpu: 47, load: 33, errors: 0, capacity: ROLE_CAPACITY.compute },
  { id: "cache", label: "CACHE", role: "cache", status: "healthy", position: [0, 2.4, -2.2], latency: 5, cpu: 28, load: 40, errors: 0, capacity: ROLE_CAPACITY.cache },
  { id: "db", label: "DB", role: "database", status: "healthy", position: [0, -2.6, 0.4], latency: 30, cpu: 55, load: 28, errors: 0, capacity: ROLE_CAPACITY.database },
];

const initialEdges: Edge[] = [
  { from: "edge-a", to: "core", active: true, flowRate: 0.6 },
  { from: "edge-b", to: "core", active: true, flowRate: 0.6 },
  { from: "core", to: "compute-1", active: true, flowRate: 0.5 },
  { from: "core", to: "compute-2", active: true, flowRate: 0.5 },
  { from: "core", to: "cache", active: true, flowRate: 0.7 },
  { from: "compute-1", to: "db", active: true, flowRate: 0.4 },
  { from: "compute-2", to: "db", active: true, flowRate: 0.4 },
  { from: "cache", to: "core", active: true, flowRate: 0.5 },
];

let logCounter = 0;
const newId = () => `${Date.now()}-${++logCounter}`;

const classify = (n: ServerNode): NodeStatus => {
  if (n.cpu >= 98 || n.errors > 12) return "critical";
  if (n.latency > 220 || n.cpu > 80 || n.errors > 4) return "warning";
  return "healthy";
};

export const useSimStore = create<SimState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  logs: [
    { id: newId(), ts: Date.now(), level: "info", message: "Topology initialized. 7 nodes online." },
    { id: newId(), ts: Date.now(), level: "ok", message: "Homeostasis reached. All vitals nominal." },
  ],
  trafficLevel: 40,
  totalRps: 12000,
  monitor: null,
  selectedNodeId: null,
  predictedFailureId: null,

  setTraffic: (n) => set({ trafficLevel: Math.max(0, Math.min(100, n)) }),
  selectNode: (id) => set({ selectedNodeId: id }),

  pushLog: (l) =>
    set((s) => ({
      logs: [...s.logs, { ...l, id: newId(), ts: Date.now() }].slice(-80),
    })),

  injectFailure: (kind, id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return;
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== id) return n;
        if (kind === "kill") return { ...n, status: "critical", cpu: 100, errors: 25, latency: 999 };
        if (kind === "slow") return { ...n, status: "warning", latency: Math.max(n.latency, 420) };
        if (kind === "overload") return { ...n, cpu: Math.min(100, n.cpu + 50), load: Math.min(100, n.load + 40) };
        return n;
      }),
    }));
    get().pushLog({
      level: "alert",
      message: `[INJECT] ${kind.toUpperCase()} fault on ${node.label}`,
      reason: `Operator-issued ${kind} directive`,
    });
  },

  triggerRandomFailure: () => {
    const candidates = get().nodes.filter((n) => n.id !== "core" && n.status !== "critical");
    if (!candidates.length) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const kinds = ["slow", "overload"] as const;
    get().injectFailure(kinds[Math.floor(Math.random() * kinds.length)], target.id);
  },

  setMonitorUrl: (url) => {
    set({
      monitor: { url, status: "idle", history: [] },
    });
    get().pushLog({ level: "info", message: `[MONITOR] Tracking ${url}` });
    void get().checkMonitor();
  },

  checkMonitor: async () => {
    const m = get().monitor;
    if (!m) return;
    const start = performance.now();
    let ok = false;
    let httpStatus: number | undefined;
    try {
      // no-cors gives opaque response but lets us measure latency & reachability
      await fetch(m.url, { mode: "no-cors", cache: "no-store" });
      ok = true;
      httpStatus = 200;
    } catch {
      ok = false;
    }
    const latency = Math.round(performance.now() - start);
    const status: MonitorTarget["status"] = !ok ? "down" : latency > 800 ? "slow" : "ok";
    set((s) => ({
      monitor: s.monitor
        ? {
            ...s.monitor,
            status,
            httpStatus: ok ? httpStatus : undefined,
            latencyMs: latency,
            lastChecked: Date.now(),
            history: [...s.monitor.history, { t: Date.now(), latency, ok }].slice(-30),
          }
        : null,
    }));
    if (status !== "ok") {
      get().pushLog({
        level: status === "down" ? "alert" : "warn",
        message: `[MONITOR] ${m.url} → ${status.toUpperCase()} (${latency}ms)`,
        reason: status === "down" ? "Connection failed" : "Latency over 800ms threshold",
      });
    }
  },

  tick: () => {
    const { trafficLevel, nodes, edges, pushLog } = get();
    const trafficMul = 0.4 + trafficLevel / 100; // 0.4..1.4

    // Update node telemetry based on traffic + status
    const updated: ServerNode[] = nodes.map((n) => {
      let { cpu, latency, errors, load, status } = n;
      const baseCpu = 25 + Math.random() * 10;
      const trafficCpu = trafficMul * (n.role === "database" ? 35 : 25);

      if (status === "critical") {
        cpu = Math.min(100, cpu + (Math.random() - 0.3) * 4);
        latency = 800 + Math.random() * 400;
        errors = Math.min(50, errors + Math.floor(Math.random() * 3));
      } else if (status === "warning") {
        cpu = Math.min(100, baseCpu + trafficCpu + 25 + (Math.random() - 0.5) * 8);
        latency = Math.max(200, latency * 0.95 + (Math.random() - 0.5) * 60);
        errors = Math.max(0, errors + (Math.random() < 0.3 ? 1 : -1));
      } else if (status === "healing") {
        cpu = Math.max(20, cpu * 0.9);
        latency = Math.max(20, latency * 0.85);
        errors = Math.max(0, errors - 1);
      } else {
        cpu = baseCpu + trafficCpu * 0.7 + (Math.random() - 0.5) * 6;
        latency = 8 + Math.random() * 30 + trafficMul * 15;
        errors = Math.max(0, errors - 1);
      }

      load = Math.max(5, Math.min(100, load + (Math.random() - 0.5) * 8));
      const next: ServerNode = { ...n, cpu, latency, errors, load };
      const newStatus = status === "healing" && cpu < 50 && errors < 2 ? "healthy" : classify(next);
      next.status = status === "healing" && newStatus !== "healthy" ? "healing" : newStatus;
      return next;
    });

    // --- AI / rule-based healing decisions ---
    let predictedFailureId: string | null = null;
    let healed = false;
    const newEdges = [...edges];

    for (const n of updated) {
      // Predictive: rising CPU + rising latency
      if (n.status === "healthy" && n.cpu > 75 && n.latency > 90 && Math.random() < 0.4) {
        predictedFailureId = n.id;
        pushLog({
          level: "warn",
          message: `[PREDICT] Node ${n.label} trending toward saturation`,
          reason: `CPU ${n.cpu.toFixed(0)}% + latency ${n.latency.toFixed(0)}ms`,
        });
      }

      if (n.status === "critical") {
        // Reroute traffic away
        const affectedEdges = newEdges.filter((e) => e.from === n.id || e.to === n.id);
        for (const e of affectedEdges) e.active = false;

        // Find a peer of same role to absorb
        const peer = updated.find(
          (p) => p.role === n.role && p.id !== n.id && p.status !== "critical"
        );
        if (peer && Math.random() < 0.5) {
          pushLog({
            level: "heal",
            message: `[AUTONOMIC] Failover ${n.label} → ${peer.label}`,
            reason: `Rerouting via healthy ${peer.role}; isolating failed node`,
          });
          // Mark peer slightly higher load
          peer.load = Math.min(100, peer.load + 20);
          // Begin healing the failed node
          n.status = "healing";
          n.errors = Math.max(0, n.errors - 5);
          healed = true;
          break;
        } else if (Math.random() < 0.3) {
          pushLog({
            level: "heal",
            message: `[AUTONOMIC] Restart sequence initiated on ${n.label}`,
            reason: "No same-role peer available; auto-restart",
          });
          n.status = "healing";
          healed = true;
        }
      }

      if (n.status === "warning" && n.cpu > 90 && Math.random() < 0.3) {
        pushLog({
          level: "heal",
          message: `[AUTONOMIC] Load shedding on ${n.label}`,
          reason: "Prioritizing critical traffic; deferring low-priority requests",
        });
        n.load = Math.max(20, n.load - 25);
        n.cpu = Math.max(40, n.cpu - 15);
      }
    }

    // Re-activate edges to nodes that have healed
    for (const e of newEdges) {
      const fromN = updated.find((n) => n.id === e.from);
      const toN = updated.find((n) => n.id === e.to);
      if (fromN && toN && fromN.status !== "critical" && toN.status !== "critical") {
        if (!e.active) {
          e.active = true;
          pushLog({
            level: "ok",
            message: `[AUTONOMIC] Pathway ${e.from} → ${e.to} restored`,
          });
        }
      }
      // flow rate based on traffic + node load
      const baseFlow = 0.3 + (trafficLevel / 100) * 0.7;
      e.flowRate = e.active ? baseFlow * (0.6 + (toN?.load ?? 50) / 200) : 0;
    }

    const totalRps = Math.round(
      updated.reduce((sum, n) => sum + (n.status === "critical" ? 0 : n.capacity * (n.load / 100)), 0)
    );

    set({ nodes: updated, edges: newEdges, totalRps, predictedFailureId });

    if (healed) {
      // small chance of auto monitor re-check
    }
  },
}));
