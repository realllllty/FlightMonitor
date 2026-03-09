import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChartService } from '../chart/chart.service';
import { FlightService } from '../flight/flight.service';
import { FlightQuote } from '../flight/types';
import { NotifyService } from '../notify/notify.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FlightSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(FlightSchedulerService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly flightService: FlightService,
    private readonly notifyService: NotifyService,
    private readonly chartService: ChartService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Bootstrap run started: triggering immediate flight check and chart push.');

    try {
      await this.runHourlyCheck();
      await this.runFiveHourReport();
      this.logger.log('Bootstrap run completed.');
    } catch (error) {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      this.logger.error(`Bootstrap run failed: ${message}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async runHourlyCheck(): Promise<void> {
    this.logger.log('Hourly job started.');

    const projects = await this.storageService.readProjects();
    const active = projects.filter((x) => x.enabled);

    const allQuotes: FlightQuote[] = [];

    for (const project of active) {
      const quotes = await this.flightService.searchProject(project);
      allQuotes.push(...quotes);

      for (const quote of quotes) {
        if (quote.price <= project.thresholdPrice) {
          await this.notifyService.sendText(
            `✈️ *低价提醒*\n` +
              `项目: ${project.id}\n` +
              `航线: ${quote.from} -> ${quote.to}\n` +
              `日期: ${quote.departDate}${quote.returnDate ? ` / ${quote.returnDate}` : ''}\n` +
              `价格: ${quote.price} ${quote.currency} (阈值 ${project.thresholdPrice})`,
          );
        }
      }
    }

    if (allQuotes.length > 0) {
      await this.storageService.appendHistory(allQuotes);
    }

    this.logger.log(`Hourly job done. ${allQuotes.length} records fetched.`);
  }

  @Cron('0 */5 * * *')
  async runFiveHourReport(): Promise<void> {
    this.logger.log('5-hour chart job started.');

    const history = await this.storageService.readHistory();
    if (history.records.length === 0) {
      this.logger.warn('No history found. Skip chart push.');
      return;
    }

    const chart = await this.chartService.drawHistoryChart(history.records);
    await this.notifyService.sendPhoto(chart, `📈 Flight trend report (${new Date().toISOString()})`);

    this.logger.log('5-hour chart job completed.');
  }
}
