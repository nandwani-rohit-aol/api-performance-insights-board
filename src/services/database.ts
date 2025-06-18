export interface LogEntry {
  uuid: string;
  details: string;
  api_name: string;
  status: number;
  response_time_in_ms: number;
  request_time: string;
}

const API_BASE = 'http://localhost:3001';

export const databaseService = {
  async getAllLogs(): Promise<LogEntry[]> {
    const res = await fetch(`${API_BASE}/logs`);
    return res.json();
  },

  async getLogsByDateRange(startDate: string, endDate: string): Promise<LogEntry[]> {
    const res = await fetch(`${API_BASE}/logs/date?start=${startDate}&end=${endDate}`);
    return res.json();
  },

  async getLogsByApiName(apiName: string): Promise<LogEntry[]> {
    const res = await fetch(`${API_BASE}/logs/api/${encodeURIComponent(apiName)}`);
    return res.json();
  },

  async getLogsByStatus(status: number): Promise<LogEntry[]> {
    const res = await fetch(`${API_BASE}/logs/status/${status}`);
    return res.json();
  },

  async insertLog(log: Omit<LogEntry, 'uuid'>): Promise<void> {
    await fetch(`${API_BASE}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  }
};
