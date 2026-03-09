import { Module } from '@nestjs/common';
import { FlightSchedulerService } from './scheduler.service';

@Module({
  providers: [FlightSchedulerService],
})
export class SchedulerModule {}
