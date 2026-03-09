import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);
  private readonly server: string;
  private readonly topic: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.server = this.configService.get<string>('NTFY_SERVER', 'https://ntfy.sh');
    this.topic = this.configService.get<string>('NTFY_TOPIC', 'flight-monitor-default-topic');
    this.enabled = this.configService.get<string>('NOTIFY_ENABLED', 'true') === 'true';

    if (!this.enabled) {
      this.logger.warn('Notifier disabled by NOTIFY_ENABLED=false.');
      return;
    }

    this.logger.log(`ntfy notifier enabled: ${this.server}/${this.topic}`);
  }

  async sendText(message: string): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[DryRun][ntfy] ${message}`);
      return;
    }

    const response = await fetch(`${this.server}/${this.topic}`, {
      method: 'POST',
      headers: {
        Title: 'FlightMonitor 低价提醒',
        Priority: 'urgent',
        Tags: 'airplane,rotating_light',
      },
      body: message,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ntfy text push failed: ${response.status} ${text}`);
    }
  }

  async sendPhoto(buffer: Buffer, caption: string): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[DryRun][ntfy][chart] ${caption}`);
      return;
    }

    const response = await fetch(`${this.server}/${this.topic}`, {
      method: 'POST',
      headers: {
        Title: caption,
        Priority: 'default',
        Tags: 'chart_with_upwards_trend,airplane',
        Filename: `flight-trend-${Date.now()}.png`,
        'Content-Type': 'image/png',
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ntfy chart push failed: ${response.status} ${text}`);
    }
  }
}
