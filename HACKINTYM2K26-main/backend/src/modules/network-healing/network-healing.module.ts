import { Module } from '@nestjs/common';
import { NetworkHealingController } from './network-healing.controller';
import { NetworkHealingService } from './network-healing.service';
import { NetworkHealingGateway } from './network-healing.gateway';

@Module({
  controllers: [NetworkHealingController],
  providers: [NetworkHealingService, NetworkHealingGateway],
  exports: [NetworkHealingService],
})
export class NetworkHealingModule {}
