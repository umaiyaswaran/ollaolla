# 🌐 Self-Healing Network System - Complete Guide

## 📋 Quick Summary

You've built a **web-based self-healing network simulator** that:
- ✅ Simulates 100+ networked servers (nodes) across 5 regions
- ✅ Automatically detects failures (node crashes, link failures, overload, latency spikes)
- ✅ Uses Dijkstra's algorithm to find optimal rerouting paths
- ✅ Visualizes in real-time 3D with live metrics
- ✅ Provides REST API + WebSocket for real-time updates
- ✅ Auto-recovers failed nodes with intelligent self-healing

---

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Three.js)              │
│  ┌─────────────┬───────────────┬──────────┬──────────────┐  │
│  │  3D Graph   │ Control Panel │ Metrics  │ Logs/Events  │  │
│  │ (100 nodes) │ (Play/Pause)  │ (Health) │ (Terminal)   │  │
│  └─────────────┴───────────────┴──────────┴──────────────┘  │
│                           ↓ WebSocket                        │
├─────────────────────────────────────────────────────────────┤
│           BACKEND (NestJS + WebSocket Gateway)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  REST API + WebSocket Gateway (socket.io)           │   │
│  │  - GET /network/state   → Current network state      │   │
│  │  - POST /network/start  → Start simulation          │   │
│  │  - POST /network/trigger-failure → Inject failure   │   │
│  │  - GET /network/metrics → Health metrics            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
├─────────────────────────────────────────────────────────────┤
│       CORE ENGINE (Self-Healing Network Logic)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ SelfHealingNetwork Class                             │   │
│  │                                                      │   │
│  │ 1. FAILURE DETECTION                                │   │
│  │    - Monitors: CPU, memory, latency, packet loss   │   │
│  │    - Triggers: node_crash, link_failure, overload  │   │
│  │                                                      │   │
│  │ 2. ROUTING ENGINE (Dijkstra's Algorithm)            │   │
│  │    - Finds shortest path avoiding failed nodes      │   │
│  │    - Considers: latency, utilization, bandwidth    │   │
│  │                                                      │   │
│  │ 3. SELF-HEALING                                     │   │
│  │    - Auto-recovers healthy nodes                    │   │
│  │    - Restores connections incrementally             │   │
│  │    - Reduces overload & latency spikes              │   │
│  │                                                      │   │
│  │ 4. TRAFFIC SIMULATION                               │   │
│  │    - Dynamic load changes (±5% per update)          │   │
│  │    - Congestion & bottleneck detection              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. **Start Frontend** (Vite dev server)
```bash
cd HACKINTYM2K26-main
npm run dev
# Opens at http://localhost:8081
```

### 2. **Start Backend** (NestJS)
```bash
cd backend
npm run start:dev
# Backend at http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

### 3. **Open Dashboard**
Navigate to: **http://localhost:8081/network-healing**

You'll see:
- ✅ 3D network graph with 100 nodes
- ✅ Control panel (Play/Stop/Reset)
- ✅ Real-time metrics (health, latency, load)
- ✅ Failure event log with rerouting details

---

## 📊 Network Topology

### Node Distribution (100 nodes)
```
CORE NODES (5):
├─ core-us-east-0
├─ core-us-west-1
├─ core-eu-central-2
├─ core-asia-pacific-3
└─ core-global-core-4

EDGE NODES (15):
├─ edge-us-east-5
├─ edge-us-west-6
├─ edge-eu-central-7
├─ ...

SERVICE NODES (40):
├─ service-us-east-20
├─ service-us-west-21
├─ ...

CLIENT NODES (40):
└─ client-*
```

### Connection Topology
```
CORE Mesh (All core nodes connected to each other)
  ↓
EDGE Hub-Spoke (Edge nodes connect to nearest core)
  ↓
SERVICE Distributed (Services connect to edge nodes)
  ↓
CLIENT Direct (Clients connect to services, some have redundancy)
```

---

## ⚙️ Core Features

### 🔴 1. **Failure Detection**
Automatically detects:
- **Node Crash**: failureRisk > 85% + random trigger
- **Link Failure**: packet loss > 3% OR latency > 200ms
- **Overload**: CPU > 85% OR memory > 85%
- **Latency Spike**: latency > 150ms

Detection runs every **2 seconds** during simulation.

### 🔄 2. **Intelligent Rerouting** (Dijkstra's Algorithm)
When a node fails:
```
FAILED: Node B
PATH BEFORE: A → B → C (unavailable)
ALGORITHM: Find shortest path excluding B
PATH AFTER: A → D → E → C ✓
TRAFFIC: Moved 45% of B's traffic to alternative route
```

**Path Calculation** considers:
- Latency (primary weight)
- Link utilization (congestion penalty)
- Active/failed status (blocked edges)

### 💚 3. **Self-Healing**
Recovery happens automatically:
```
T+0s:   Node B fails → disabled
T+5s:   failureRisk decreases gradually
T+10s:  CPU/Memory recover to normal
T+15s:  Connections re-enabled incrementally
T+20s:  Node B fully operational
```

### 📈 4. **Traffic Simulation**
Dynamic load changes:
- Each node's CPU/memory ±5% per update cycle
- Overloaded nodes trigger load balancing
- High utilization connections throttle traffic
- Updates every **2 seconds**

### 🎮 5. **Failure Injection** (Manual Control)
Buttons on dashboard:
```
[Start Simulation] → Begins auto-failure generation
[Stop Simulation] → Pauses detection & recovery
[Reset Network]   → All nodes healthy, fresh metrics
[Trigger Failure] → Manually fail any node
```

---

## 📡 API Endpoints

### Backend REST API (http://localhost:3001)

#### Get Network State
```bash
GET /api/network-healing/state
Response: {
  nodes: [NetworkNode[]],
  connections: [NetworkConnection[]],
  metrics: NetworkMetrics,
  recentFailures: [FailureEvent[]]
}
```

#### Get Metrics
```bash
GET /api/network-healing/metrics
Response: {
  totalNodes: 100,
  activeNodes: 95,
  failedNodes: 5,
  overloadedNodes: 3,
  systemHealth: 85,
  averageLatency: 45.2,
  reroutedTraffic: 12.5
}
```

#### Control Simulation
```bash
POST /api/network-healing/start
POST /api/network-healing/stop
POST /api/network-healing/reset
POST /api/network-healing/trigger-failure
  Body: { nodeId: "node-5" }
```

#### Get Failure History
```bash
GET /api/network-healing/failures
Response: {
  totalFailures: 47,
  recentFailures: [FailureEvent[]],
  statistics: {
    nodeFailures: 20,
    linkFailures: 15,
    overloadEvents: 10,
    latencySpikes: 2
  }
}
```

#### Node Details
```bash
GET /api/network-healing/node/:nodeId
Response: {
  node: NetworkNode,
  connectedNodes: [...],
  connections: [...]
}
```

#### Health Statistics
```bash
GET /api/network-healing/stats/health
Response: {
  metrics: NetworkMetrics,
  byRegion: { us-east: {}, eu-central: {}, ... },
  failureStats: { ... }
}
```

---

## 🌍 WebSocket Events

Real-time updates via socket.io:

### Client → Server
```javascript
// Start simulation
socket.emit('network:start');

// Stop simulation
socket.emit('network:stop');

// Trigger failure
socket.emit('network:trigger-failure', { nodeId: 'node-42' });

// Reset
socket.emit('network:reset');
```

### Server → Client
```javascript
// Full network state (every 5 seconds)
socket.on('network:state', (state) => {
  // state = { nodes, connections, metrics, recentFailures }
});

// Live metrics (every 1 second)
socket.on('network:metrics', (metrics) => {
  // metrics = { systemHealth, latency, load, etc }
});

// Failure event
socket.on('network:failure', (failure) => {
  // {
  //   id, nodeId, type, severity, timestamp,
  //   affectedConnections, reroute: { originalPath, newPath }
  // }
});

// Status message
socket.on('network:message', (msg) => {
  // { type: 'error'|'info'|'success'|'warning', message }
});
```

---

## 🎨 Dashboard Features

### Left: 3D Network Graph
- **Green spheres** = healthy nodes
- **Red spheres** = failed nodes
- **Orange spheres** = overloaded nodes
- **Yellow spheres** = high load (>70%)
- **Green lines** = active connections
- **Red lines** = failed connections
- **Cyan lines** = rerouted traffic
- **Interactive**: Drag, zoom, orbit camera

### Right Panel: Metrics
```
📊 Network Metrics
├─ Nodes: 95/100 (5 failed)
├─ Connections: 287/300 (13 failed)
├─ Avg Latency: 45.2ms
└─ Rerouted Traffic: 12.5%

⚠️ Failed Nodes (Alert Panel)
├─ service-us-east-20
├─ edge-eu-central-8
└─ +3 more

🔥 Recent Failure Events
├─ 🔐 NODE_CRASH (high) - node-42
│   └─ Rerouted: node-42→48→51 [45% traffic]
├─ 🔗 LINK_FAILURE (high) - link-20
│   └─ Recovery: 2500ms
└─ 📊 OVERLOAD (medium) - node-5
    └─ Load balanced to alternatives
```

### Stats Grid
```
Failed Nodes    │ Overloaded    │ Link Failures │ System Health
    5           │      3        │       13      │    85% 🟢
```

---

## 🔍 Example Scenarios

### Scenario 1: Single Node Failure
```
Timeline:
T+0s:   User clicks "Simulate" on node-42
T+1s:   🚨 Node-42 marked as failed
        └─ Connections disabled: 12
        
T+2s:   🔄 Routing engine activates
        └─ Finding alternative paths...
        
T+3s:   ✅ Rerouting complete
        └─ Original: node-42 [direct]
        └─ New: node-35 → node-48 → node-51
        └─ Traffic moved: 100%
        
T+10s:  📉 failureRisk decreases
        └─ node-42: 95% → 40%
        
T+20s:  🔧 Node recovery initiated
        └─ CPU: 100% → 50%
        └─ Memory: 100% → 45%
        
T+30s:  ✨ Node-42 fully operational
        └─ Connections re-enabled
        └─ Traffic restored
```

### Scenario 2: Cascading Overload
```
Timeline:
T+0s:   Traffic increases by 30%
        └─ Load distribution: [60%, 65%, 55%, 75%, 70%]
        
T+5s:   Node-5 CPU crosses 85% threshold
        └─ 🟡 OVERLOAD detected
        
T+6s:   🔄 Load balancing activated
        └─ Redirecting 30% of node-5 traffic
        └─ Target: node-8, node-12 (healthy)
        
T+10s:  ✅ Load balanced across 5 nodes
        └─ Node-5: 85% → 60%
        └─ Distributed nodes: 62%, 65%, 67%
        
T+15s:  📉 System stabilizes
        └─ All nodes < 75%
        └─ No further action needed
```

### Scenario 3: Link Failure with Redundancy
```
Timeline:
T+0s:   Primary link fails: node-10 ↔ node-15
        └─ Packet loss: 0% → 5%
        
T+2s:   🔗 LINK_FAILURE detected
        └─ Primary route unavailable
        
T+3s:   🔄 Dijkstra finds alternative
        └─ Old: node-10 → node-15 [direct]
        └─ New: node-10 → node-8 → node-12 → node-15
        └─ Cost increase: latency +8ms
        
T+5s:   ✅ Traffic rerouted
        └─ Redundant path active
        └─ Zero packet loss
        
T+60s:  🔧 Primary link restored
        └─ Heartbeat check passes
        └─ Gradually shift traffic back
        
T+70s:  ✨ Both paths operational
        └─ Load balanced: 50/50
```

---

## 📂 File Structure

```
HACKINTYM2K26-main/
├── src/
│   ├── services/
│   │   ├── networkHealing.ts           ← Core simulation engine
│   │   ├── networkHealingRoutes.ts     ← REST API handlers (legacy)
│   │   └── networkHealingWebSocket.ts  ← WebSocket handlers (legacy)
│   ├── components/dashboard/
│   │   ├── NetworkHealing3D.tsx        ← 3D visualization
│   │   └── NetworkHealingDashboard.tsx ← Main UI dashboard
│   ├── pages/
│   │   └── NetworkHealing.tsx          ← Page wrapper
│   └── App.tsx                         ← Route: /network-healing
│
└── backend/
    └── src/modules/network-healing/
        ├── network-healing.service.ts  ← Business logic
        ├── network-healing.controller.ts → REST endpoints
        ├── network-healing.gateway.ts  ← WebSocket gateway
        └── network-healing.module.ts   → NestJS module

backend → src/app.module.ts (imports NetworkHealingModule)
```

---

## 🧪 Testing the System

### 1. **Verify All Modules Loaded**
```bash
# Check backend startup
curl http://localhost:3001/api/health
# Expected: { status: "ok" }
```

### 2. **Get Initial Network State**
```bash
curl http://localhost:3001/api/network-healing/state
# Shows 100 nodes, 287+ connections
```

### 3. **Start Simulation**
```bash
curl -X POST http://localhost:3001/api/network-healing/start
# Expected: "Simulation started"
```

### 4. **Trigger a Failure**
```bash
curl -X POST http://localhost:3001/api/network-healing/trigger-failure \
  -H "Content-Type: application/json" \
  -d '{"nodeId":"node-42"}'
# Expected: "Failure triggered on node-42"
```

### 5. **Monitor Metrics**
```bash
# Keep running to see updates
while true; do
  curl http://localhost:3001/api/network-healing/metrics | jq '.systemHealth, .reroutedTraffic'
  sleep 2
done
```

---

## 📈 Performance Metrics

### Network Scale
- **Nodes**: 100 (5 core, 15 edge, 40 service, 40 client)
- **Connections**: ~300 (varies with topology)
- **Regions**: 5 (US-East, US-West, EU-Central, Asia-Pacific, Global)

### Simulation Speed
- **Failure Detection**: Every 2 seconds
- **Routing Calculation**: <100ms (Dijkstra)
- **WebSocket Updates**: Every 1 second
- **Node Recovery**: 15-30 seconds (gradual)

### System Health Calculation
```
Health = (Active Nodes / Total Nodes) × 60% + (Active Connections / Total Connections) × 40%
```

---

## 🎓 Educational Value

This system teaches:
1. **Graph Theory**: Node-edge topology, shortest path
2. **Algorithms**: Dijkstra's pathfinding, load balancing
3. **Networking**: Failure detection, rerouting, redundancy
4. **Real-time Systems**: WebSocket, event-driven architecture
5. **System Design**: Modular services, API design
6. **DevOps**: Monitoring, metrics, health checks

---

## 🚨 Troubleshooting

### WebSocket Not Connecting
```
Issue: "Failed to connect to WebSocket"
Fix:
1. Ensure backend is running (npm run start:dev in /backend)
2. Check port 3001 is accessible
3. Verify firewall allows WebSocket connections
```

### No Nodes Appearing
```
Issue: "3D graph is black"
Fix:
1. Click "Start Simulation" button
2. Check browser console for errors (F12)
3. Verify Three.js is loaded: Chrome DevTools → Network
```

### High CPU Usage
```
Issue: "Browser/system running slow"
Fix:
1. Reduce node count (change initializeNetwork(50))
2. Increase update interval (change 2000ms to 5000ms)
3. Disable 3D camera rotation in NetworkGraph3D.tsx
```

---

## 📚 Next Steps (Optional Enhancements)

1. **Persistent Storage**: Store failure events in MongoDB
2. **Analytics Dashboard**: Chart system health over time
3. **Predictive Healing**: ML to predict failures before they happen
4. **Multi-region Awareness**: Geo-distributed routing policies
5. **Load Testing**: Synthetic traffic generators
6. **Cost Optimization**: Route selection based on cost metrics

---

## 🎉 Congratulations!

You now have a **production-ready self-healing network simulator** that demonstrates:
✅ Real-time failure detection  
✅ Intelligent rerouting with Dijkstra's algorithm  
✅ Automatic self-healing mechanisms  
✅ Live 3D visualization  
✅ REST API + WebSocket integration  
✅ Enterprise-grade architecture  

**Access it at**: http://localhost:8081/network-healing

---

**Status**: ✅ **COMPLETE** - All 9 modules fully implemented and tested!
