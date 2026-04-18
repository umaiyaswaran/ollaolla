import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NetworkHealingService } from './network-healing.service';
import {
  NetworkMetrics,
  NetworkNode,
  NetworkConnection,
  FailureEvent,
} from '../../../src/services/networkHealing';

@ApiTags('Network Healing')
@Controller('api/network-healing')
export class NetworkHealingController {
  constructor(private networkHealingService: NetworkHealingService) {}

  @Get('state')
  @ApiOperation({ summary: 'Get current network state' })
  @ApiResponse({ status: 200, description: 'Network state' })
  getNetworkState() {
    return this.networkHealingService.getNetworkState();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get network health metrics' })
  @ApiResponse({ status: 200, description: 'Network metrics' })
  getNetworkMetrics(): NetworkMetrics {
    return this.networkHealingService.getNetworkMetrics();
  }

  @Post('start')
  @ApiOperation({ summary: 'Start network simulation' })
  @ApiResponse({ status: 200, description: 'Simulation started' })
  startSimulation() {
    this.networkHealingService.startSimulation();
    return { status: 'started', message: 'Network simulation started' };
  }

  @Post('stop')
  @ApiOperation({ summary: 'Stop network simulation' })
  @ApiResponse({ status: 200, description: 'Simulation stopped' })
  stopSimulation() {
    this.networkHealingService.stopSimulation();
    return { status: 'stopped', message: 'Network simulation stopped' };
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset network to healthy state' })
  @ApiResponse({ status: 200, description: 'Network reset' })
  resetNetwork() {
    this.networkHealingService.reset();
    return { status: 'reset', message: 'Network reset to healthy state' };
  }

  @Post('trigger-failure')
  @ApiOperation({ summary: 'Manually trigger a node failure' })
  @ApiResponse({ status: 200, description: 'Failure triggered' })
  triggerFailure(@Body() body: { nodeId: string }) {
    const { nodeId } = body;
    this.networkHealingService.triggerNodeFailure(nodeId);
    return { status: 'failure_triggered', nodeId };
  }

  @Get('failures')
  @ApiOperation({ summary: 'Get recent failure events' })
  @ApiResponse({ status: 200, description: 'Failure history' })
  getFailures() {
    return this.networkHealingService.getFailureHistory();
  }

  @Get('node/:nodeId')
  @ApiOperation({ summary: 'Get details for a specific node' })
  @ApiResponse({ status: 200, description: 'Node details' })
  getNodeDetails(@Param('nodeId') nodeId: string) {
    return this.networkHealingService.getNodeDetails(nodeId);
  }

  @Get('stats/health')
  @ApiOperation({ summary: 'Get health statistics' })
  @ApiResponse({ status: 200, description: 'Health stats' })
  getHealthStats() {
    return this.networkHealingService.getHealthStats();
  }
}
