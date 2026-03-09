import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FlightQuote, FlightSearchProject, SearchTime } from './types';

@Injectable()
export class FlightService {
  private readonly logger = new Logger(FlightService.name);

  constructor(private readonly configService: ConfigService) {}

  async searchProject(project: FlightSearchProject): Promise<FlightQuote[]> {
    const quotes = await Promise.all(
      project.times.map((time) => this.searchTime(project, time)),
    );

    return quotes;
  }

  private async searchTime(project: FlightSearchProject, time: SearchTime): Promise<FlightQuote> {
    const providerName = this.configService.get<string>('FLIGHT_PROVIDER', 'mock');

    const price = providerName === 'mock'
      ? this.mockPrice(project.thresholdPrice)
      : await this.fetchFromEndpoint(project, time);

    const quote: FlightQuote = {
      projectId: project.id,
      from: project.from,
      to: project.to,
      type: time.type,
      departDate: time.departDate,
      returnDate: time.returnDate,
      price,
      currency: project.currency,
      provider: providerName,
      searchedAt: new Date().toISOString(),
    };

    this.logger.log(
      `[${project.id}] ${project.from}->${project.to} ${time.departDate} ${time.returnDate ?? ''} = ${price}`,
    );

    return quote;
  }

  private mockPrice(baseThreshold: number): number {
    const min = Math.round(baseThreshold * 0.6);
    const max = Math.round(baseThreshold * 1.4);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private async fetchFromEndpoint(project: FlightSearchProject, time: SearchTime): Promise<number> {
    const endpoint = this.configService.get<string>('FLIGHT_PROVIDER_ENDPOINT');
    if (!endpoint) {
      throw new Error('FLIGHT_PROVIDER_ENDPOINT is required when FLIGHT_PROVIDER is not mock');
    }

    const url = new URL(endpoint);
    url.searchParams.set('from', project.from);
    url.searchParams.set('to', project.to);
    url.searchParams.set('departDate', time.departDate);
    url.searchParams.set('tripType', time.type);
    if (time.returnDate) {
      url.searchParams.set('returnDate', time.returnDate);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('FLIGHT_PROVIDER_TOKEN', '')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Provider response failed with ${response.status}`);
    }

    const data = (await response.json()) as { price: number };
    if (typeof data.price !== 'number') {
      throw new Error('Provider JSON must include numeric price field');
    }

    return data.price;
  }
}
