import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors()); // Allow frontend to access

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

// Start server
app.listen(3001, () => {
  console.log('API server running at http://localhost:3001');
});
