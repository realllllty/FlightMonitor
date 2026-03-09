import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FlightSearchProject, HistoryStore } from '../flight/types';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly projectPath = path.join(this.dataDir, 'search-projects.json');
  private readonly historyPath = path.join(this.dataDir, 'flight-history.json');

  async readProjects(): Promise<FlightSearchProject[]> {
    await this.ensureDataFiles();
    const raw = await fs.readFile(this.projectPath, 'utf8');
    return JSON.parse(raw) as FlightSearchProject[];
  }

  async readHistory(): Promise<HistoryStore> {
    await this.ensureDataFiles();
    const raw = await fs.readFile(this.historyPath, 'utf8');
    return JSON.parse(raw) as HistoryStore;
  }

  async appendHistory(records: HistoryStore['records']): Promise<void> {
    const history = await this.readHistory();
    history.records.push(...records);
    await fs.writeFile(this.historyPath, JSON.stringify(history, null, 2));
    this.logger.log(`Appended ${records.length} records to history.`);
  }

  private async ensureDataFiles(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });

    await this.ensureFile(this.projectPath, JSON.stringify([], null, 2));
    await this.ensureFile(this.historyPath, JSON.stringify({ records: [] }, null, 2));
  }

  private async ensureFile(filePath: string, defaultContent: string): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, defaultContent);
      this.logger.warn(`Created missing data file: ${filePath}`);
    }
  }
}
