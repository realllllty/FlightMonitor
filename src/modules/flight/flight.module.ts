import { Global, Module } from '@nestjs/common';
import { FlightService } from './flight.service';

@Global()
@Module({
  providers: [FlightService],
  exports: [FlightService],
})
export class FlightModule {}
