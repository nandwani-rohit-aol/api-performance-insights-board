
import { databaseService, LogEntry } from '../services/database';

export const fetchDashboardData = async (): Promise<LogEntry[]> => {
  try {
    // Fetch all logs from the SQLite database
    const logs = databaseService.getAllLogs();
    console.log(`Fetched ${logs.length} logs from database`);
    return logs;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data from database');
  }
};

export const fetchLogsByDateRange = async (startDate: string, endDate: string): Promise<LogEntry[]> => {
  try {
    return databaseService.getLogsByDateRange(startDate, endDate);
  } catch (error) {
    console.error('Error fetching logs by date range:', error);
    throw new Error('Failed to fetch logs by date range');
  }
};

export const fetchLogsByApiName = async (apiName: string): Promise<LogEntry[]> => {
  try {
    return databaseService.getLogsByApiName(apiName);
  } catch (error) {
    console.error('Error fetching logs by API name:', error);
    throw new Error('Failed to fetch logs by API name');
  }
};

export const addLogEntry = async (log: Omit<LogEntry, 'uuid'>): Promise<void> => {
  try {
    databaseService.insertLog(log);
    console.log('Log entry added successfully');
  } catch (error) {
    console.error('Error adding log entry:', error);
    throw new Error('Failed to add log entry');
  }
};
