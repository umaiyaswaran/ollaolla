import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NetworkHealingService } from './network-healing.service';

@WebSocketGateway({
  namespace: 'network-healing',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class NetworkHealingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private updateInterval: NodeJS.Timer | null = null;

  constructor(private networkHealingService: NetworkHealingService) {
    this.startBroadcasting();
  }

  handleConnection(client: Socket) {
    console.log(`✅ WebSocket connected: ${client.id}`);
    // Send initial state
    const state = this.networkHealingService.getNetworkState();
    client.emit('network:state', state);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ WebSocket disconnected: ${client.id}`);
  }

  @SubscribeMessage('network:start')
  handleStartSimulation(client: Socket) {
    this.networkHealingService.startSimulation();
    this.server.emit('network:message', {
      type: 'success',
      message: 'Network simulation started',
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('network:stop')
  handleStopSimulation(client: Socket) {
    this.networkHealingService.stopSimulation();
    this.server.emit('network:message', {
      type: 'info',
      message: 'Network simulation stopped',
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('network:reset')
  handleReset(client: Socket) {
    this.networkHealingService.reset();
    this.server.emit('network:message', {
      type: 'info',
      message: 'Network reset',
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('network:trigger-failure')
  handleTriggerFailure(client: Socket, data: { nodeId: string }) {
    const { nodeId } = data;
    this.networkHealingService.triggerNodeFailure(nodeId);
    this.server.emit('network:message', {
      type: 'error',
      message: `Node failure triggered on ${nodeId}`,
      timestamp: Date.now(),
    });
  }

  private startBroadcasting() {
    if (this.updateInterval) clearInterval(this.updateInterval);

    this.updateInterval = setInterval(() => {
      // Broadcast state every 2 seconds
      const metrics = this.networkHealingService.getNetworkMetrics();
      this.server.emit('network:metrics', metrics);

      // Full state every 5 seconds
      if (Math.random() > 0.6) {
        const state = this.networkHealingService.getNetworkState();
        this.server.emit('network:state', state);
      }
    }, 1000);
  }

  onModuleDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
