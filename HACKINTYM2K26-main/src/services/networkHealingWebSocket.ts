/**
 * WebSocket Handler for Real-Time Network Healing Updates
 * Broadcasts network state changes to connected clients
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { getNetworkInstance } from "./networkHealing";

let io: SocketIOServer | null = null;
let updateInterval: NodeJS.Timer | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`✅ WebSocket connected: ${socket.id}`);

    // Send initial state
    const network = getNetworkInstance();
    if (network) {
      socket.emit("network:state", network.getNetworkState());
    }

    // Listen for client events
    socket.on("network:start", () => {
      const network = getNetworkInstance();
      if (network) {
        network.startSimulation();
        broadcastMessage("info", "Network simulation started");
      }
    });

    socket.on("network:stop", () => {
      const network = getNetworkInstance();
      if (network) {
        network.stopSimulation();
        broadcastMessage("info", "Network simulation stopped");
      }
    });

    socket.on("network:trigger-failure", (data) => {
      const { nodeId } = data;
      const network = getNetworkInstance();
      if (network && nodeId) {
        const networkAny = network as any;
        networkAny.triggerNodeFailure(nodeId);
        broadcastMessage("error", `Node failure triggered on ${nodeId}`);
      }
    });

    socket.on("network:reset", () => {
      const network = getNetworkInstance();
      if (network) {
        network.stopSimulation();
        console.log("Network reset requested");
        broadcastMessage("info", "Network reset");
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ WebSocket disconnected: ${socket.id}`);
    });
  });

  // Start broadcasting network updates every 1 second
  startBroadcasting();

  return io;
}

/**
 * Start broadcasting network state to all clients
 */
function startBroadcasting() {
  if (updateInterval) clearInterval(updateInterval);

  updateInterval = setInterval(() => {
    const network = getNetworkInstance();
    if (network && io) {
      const state = network.getNetworkState();
      const metrics = network.getNetworkMetrics();

      // Broadcast full state every 2 seconds
      if (Math.random() > 0.5) {
        io.emit("network:state", state);
      } else {
        // More frequent metric updates
        io.emit("network:metrics", metrics);
      }

      // Broadcast failures
      const networkAny = network as any;
      if (networkAny.failureHistory.length > 0) {
        const lastFailure = networkAny.failureHistory[networkAny.failureHistory.length - 1];
        io.emit("network:failure", lastFailure);
      }
    }
  }, 1000);
}

/**
 * Stop broadcasting
 */
export function stopBroadcasting() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

/**
 * Broadcast message to all connected clients
 */
export function broadcastMessage(type: "info" | "error" | "warning" | "success", message: string) {
  if (io) {
    io.emit("network:message", {
      type,
      message,
      timestamp: Date.now(),
    });
  }
}

/**
 * Get the SocketIO instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}

export default initializeWebSocket;
