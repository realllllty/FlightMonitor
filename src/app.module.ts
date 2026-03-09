import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ChartModule } from './modules/chart/chart.module';
import { FlightModule } from './modules/flight/flight.module';
import { NotifyModule } from './modules/notify/notify.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    StorageModule,
    NotifyModule,
    FlightModule,
    ChartModule,
    SchedulerModule,
  ],
  providers: [Logger],
})
export class AppModule {}
