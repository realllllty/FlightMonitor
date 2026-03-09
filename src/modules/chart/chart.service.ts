import { Injectable } from '@nestjs/common';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { FlightQuote } from '../flight/types';

@Injectable()
export class ChartService {
  private readonly renderer = new ChartJSNodeCanvas({ width: 1400, height: 700, backgroundColour: '#ffffff' });

  async drawHistoryChart(records: FlightQuote[]): Promise<Buffer> {
    const grouped = new Map<string, FlightQuote[]>();

    for (const record of records) {
      const key = `${record.projectId}:${record.departDate}:${record.returnDate ?? 'oneway'}`;
      const list = grouped.get(key) ?? [];
      list.push(record);
      grouped.set(key, list);
    }

    const datasets = Array.from(grouped.entries()).map(([key, list], index) => ({
      label: key,
      data: list.sort((a, b) => a.searchedAt.localeCompare(b.searchedAt)).map((x) => x.price),
      borderColor: this.color(index),
      backgroundColor: this.color(index),
      tension: 0.2,
      fill: false,
    }));

    const labels = records
      .map((x) => x.searchedAt)
      .sort((a, b) => a.localeCompare(b));

    return this.renderer.renderToBuffer({
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: false,
        scales: {
          x: {
            title: { display: true, text: 'Search Time' },
          },
          y: {
            title: { display: true, text: 'Price' },
          },
        },
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Flight price trends (all projects)',
          },
        },
      },
    });
  }

  private color(index: number): string {
    const palette = ['#3772FF', '#00A878', '#FF9F1C', '#EF476F', '#9B5DE5', '#1982C4'];
    return palette[index % palette.length];
  }
}
