import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const db = new Database('./perf_reports.db');

// Ensure table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS perf_report (
    uuid TEXT PRIMARY KEY,
    details TEXT DEFAULT '',
    api_name TEXT,
    status INTEGER,
    response_time_in_ms INTEGER,
    request_time TEXT DEFAULT (datetime('now'))
  );
`);

// Helper function to build WHERE clause
const buildWhereClause = (filters: any) => {
  const conditions = [];
  const params = [];
  
  if (filters.search) {
    conditions.push('(api_name LIKE ? OR details LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'success') {
      conditions.push('status >= 200 AND status < 300');
    } else if (filters.status === 'error') {
      conditions.push('status >= 400');
    } else {
      conditions.push('status = ?');
      params.push(parseInt(filters.status));
    }
  }
  
  if (filters.api_name && filters.api_name !== 'all') {
    conditions.push('api_name = ?');
    params.push(filters.api_name);
  }
  
  if (filters.start_date) {
    conditions.push('request_time >= ?');
    params.push(filters.start_date);
  }
  
  if (filters.end_date) {
    conditions.push('request_time <= ?');
    params.push(filters.end_date);
  }
  
  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

// GET logs with pagination and filtering
app.get('/logs', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;
  const sortField = req.query.sort_field || 'request_time';
  const sortDirection = req.query.sort_direction || 'DESC';
  
  const filters = {
    search: req.query.search,
    status: req.query.status,
    api_name: req.query.api_name,
    start_date: req.query.start_date,
    end_date: req.query.end_date
  };
  
  const { whereClause, params } = buildWhereClause(filters);
  
  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM perf_report ${whereClause}`;
  const totalResult = db.prepare(countQuery).get(...params) as { total: number };
  
  // Get paginated results
  const dataQuery = `
    SELECT * FROM perf_report 
    ${whereClause}
    ORDER BY ${sortField} ${sortDirection}
    LIMIT ? OFFSET ?
  `;
  const logs = db.prepare(dataQuery).all(...params, limit, offset);
  
  res.json({
    logs,
    pagination: {
      page,
      limit,
      total: totalResult.total,
      total_pages: Math.ceil(totalResult.total / limit)
    }
  });
});

// GET dashboard stats
app.get('/dashboard/stats', (req, res) => {
  const filters = {
    search: req.query.search,
    status: req.query.status,
    api_name: req.query.api_name,
    start_date: req.query.start_date,
    end_date: req.query.end_date
  };
  
  const { whereClause, params } = buildWhereClause(filters);
  
  // Basic stats
  const statsQuery = `
    SELECT 
      COUNT(*) as total_calls,
      AVG(response_time_in_ms) as avg_response_time,
      MIN(response_time_in_ms) as min_response_time,
      MAX(response_time_in_ms) as max_response_time,
      COUNT(CASE WHEN status >= 200 AND status < 300 THEN 1 END) as success_count,
      COUNT(CASE WHEN status >= 400 THEN 1 END) as error_count
    FROM perf_report ${whereClause}
  `;
  
  const stats = db.prepare(statsQuery).get(...params) as any;
  
  // Slowest call
  const slowestQuery = `
    SELECT * FROM perf_report ${whereClause}
    ORDER BY response_time_in_ms DESC LIMIT 1
  `;
  const slowestCall = db.prepare(slowestQuery).get(...params);
  
  // Today and week stats
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const todayCount = db.prepare(`SELECT COUNT(*) as count FROM perf_report WHERE request_time >= ?`).get(today) as { count: number };
  const weekCount = db.prepare(`SELECT COUNT(*) as count FROM perf_report WHERE request_time >= ?`).get(weekAgo) as { count: number };
  
  res.json({
    total_calls: stats.total_calls || 0,
    today_calls: todayCount.count || 0,
    week_calls: weekCount.count || 0,
    success_rate: stats.total_calls > 0 ? Math.round((stats.success_count / stats.total_calls) * 100) : 0,
    error_rate: stats.total_calls > 0 ? Math.round((stats.error_count / stats.total_calls) * 100) : 0,
    avg_response_time: Math.round(stats.avg_response_time || 0),
    min_response_time: stats.min_response_time || 0,
    max_response_time: stats.max_response_time || 0,
    slowest_call: slowestCall
  });
});

// GET unique API names for filter dropdown
app.get('/api-names', (req, res) => {
  const apis = db.prepare('SELECT DISTINCT api_name FROM perf_report ORDER BY api_name').all();
  res.json(apis.map((row: any) => row.api_name));
});

// GET API stats for reports
app.get('/reports/api-stats', (req, res) => {
  const filters = {
    search: req.query.search,
    status: req.query.status,
    api_name: req.query.api_name,
    start_date: req.query.start_date,
    end_date: req.query.end_date
  };
  
  const { whereClause, params } = buildWhereClause(filters);
  
  const statsQuery = `
    SELECT 
      api_name,
      status,
      COUNT(*) as frequency,
      AVG(response_time_in_ms) as avg_time,
      MIN(response_time_in_ms) as min_time,
      MAX(response_time_in_ms) as max_time
    FROM perf_report ${whereClause}
    GROUP BY api_name, status
    ORDER BY frequency DESC
  `;
  
  const stats = db.prepare(statsQuery).all(...params);
  res.json(stats);
});

// GET all logs
app.get('/logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM perf_report ORDER BY request_time DESC').all();
  res.json(logs);
});

// GET logs by date range
app.get('/logs/date', (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'Missing start or end date' });
  const logs = db.prepare(
    'SELECT * FROM perf_report WHERE request_time BETWEEN ? AND ? ORDER BY request_time DESC'
  ).all(start, end);
  res.json(logs);
});

// GET logs by API name
app.get('/logs/api/:apiName', (req, res) => {
  const logs = db.prepare(
    'SELECT * FROM perf_report WHERE api_name = ? ORDER BY request_time DESC'
  ).all(req.params.apiName);
  res.json(logs);
});

// GET logs by status
app.get('/logs/status/:status', (req, res) => {
  const logs = db.prepare(
    'SELECT * FROM perf_report WHERE status = ? ORDER BY request_time DESC'
  ).all(parseInt(req.params.status));
  res.json(logs);
});

// POST to insert a log
app.post('/logs', (req, res) => {
  const { details, api_name, status, response_time_in_ms, request_time } = req.body;
  const uuid = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO perf_report (uuid, details, api_name, status, response_time_in_ms, request_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(uuid, details, api_name, status, response_time_in_ms, request_time || new Date().toISOString());
  res.status(201).json({ uuid });
});

app.listen(3001, () => {
  console.log('API server running at http://localhost:3001');
});
