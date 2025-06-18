
import Database from 'better-sqlite3';

interface LogEntry {
  uuid: string;
  details: string;
  api_name: string;
  status: number;
  response_time_in_ms: number;
  request_time: string;
}

class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string = './perf_report.db') {
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create the table if it doesn't exist
    const createTable = `
      CREATE TABLE IF NOT EXISTS perf_report (
        uuid TEXT PRIMARY KEY,
        details TEXT DEFAULT '',
        api_name TEXT,
        status INTEGER,
        response_time_in_ms INTEGER,
        request_time TEXT DEFAULT (datetime('now'))
      )
    `;
    this.db.exec(createTable);
  }

  getAllLogs(): LogEntry[] {
    const stmt = this.db.prepare('SELECT * FROM perf_report ORDER BY request_time DESC');
    return stmt.all() as LogEntry[];
  }

  getLogsByDateRange(startDate: string, endDate: string): LogEntry[] {
    const stmt = this.db.prepare(
      'SELECT * FROM perf_report WHERE request_time BETWEEN ? AND ? ORDER BY request_time DESC'
    );
    return stmt.all(startDate, endDate) as LogEntry[];
  }

  getLogsByApiName(apiName: string): LogEntry[] {
    const stmt = this.db.prepare('SELECT * FROM perf_report WHERE api_name = ? ORDER BY request_time DESC');
    return stmt.all(apiName) as LogEntry[];
  }

  getLogsByStatus(status: number): LogEntry[] {
    const stmt = this.db.prepare('SELECT * FROM perf_report WHERE status = ? ORDER BY request_time DESC');
    return stmt.all(status) as LogEntry[];
  }

  insertLog(log: Omit<LogEntry, 'uuid'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO perf_report (uuid, details, api_name, status, response_time_in_ms, request_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const uuid = crypto.randomUUID();
    stmt.run(uuid, log.details, log.api_name, log.status, log.response_time_in_ms, log.request_time);
  }

  close() {
    this.db.close();
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();
export type { LogEntry };
