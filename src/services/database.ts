
export interface LogEntry {
  uuid: string;
  details: string;
  api_name: string;
  status: number;
  response_time_in_ms: number;
  request_time: string;
}

export interface PaginatedResponse {
  logs: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface DashboardStats {
  total_calls: number;
  today_calls: number;
  week_calls: number;
  success_rate: number;
  error_rate: number;
  avg_response_time: number;
  min_response_time: number;
  max_response_time: number;
  slowest_call: LogEntry | null;
}

export interface LogFilters {
  search?: string;
  status?: string;
  api_name?: string;
  start_date?: string;
  end_date?: string;
  sort_field?: string;
  sort_direction?: 'ASC' | 'DESC';
}

const API_BASE = 'http://localhost:3001';

export const databaseService = {
  async getLogs(page: number = 1, limit: number = 50, filters: LogFilters = {}): Promise<PaginatedResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== ''))
    });

    const res = await fetch(`${API_BASE}/logs?${params}`);
    return res.json();
  },

  async getDashboardStats(filters: LogFilters = {}): Promise<DashboardStats> {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== ''))
    );

    const res = await fetch(`${API_BASE}/dashboard/stats?${params}`);
    return res.json();
  },

  async getApiNames(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/api-names`);
    return res.json();
  },

  async getApiStats(filters: LogFilters = {}): Promise<any[]> {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== ''))
    );

    const res = await fetch(`${API_BASE}/reports/api-stats?${params}`);
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
