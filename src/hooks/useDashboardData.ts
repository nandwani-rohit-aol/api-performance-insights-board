
import { useQuery } from '@tanstack/react-query';

interface LogEntry {
  uuid: string;
  details: string;
  api_name: string;
  status: number;
  response_time_in_ms: number;
  request_time: string;
}

// Mock data that simulates your SQLite table structure
const mockData: LogEntry[] = [
  {
    uuid: '1',
    details: 'Sync completed successfully',
    api_name: 'sync-program-based-on-status',
    status: 200,
    response_time_in_ms: 115,
    request_time: '2024-06-18T10:30:00Z'
  },
  {
    uuid: '2',
    details: 'Database connection timeout',
    api_name: 'event-stagedb-sync',
    status: 424,
    response_time_in_ms: 345,
    request_time: '2024-06-18T09:15:00Z'
  },
  {
    uuid: '3',
    details: 'Static data retrieved',
    api_name: 'get-static-data',
    status: 200,
    response_time_in_ms: 70,
    request_time: '2024-06-18T11:45:00Z'
  },
  {
    uuid: '4',
    details: 'Internal server error during payment processing',
    api_name: 'participant-payment-registration',
    status: 500,
    response_time_in_ms: 151,
    request_time: '2024-06-18T08:20:00Z'
  },
  {
    uuid: '5',
    details: 'Program status updated',
    api_name: 'program-status-change',
    status: 200,
    response_time_in_ms: 57,
    request_time: '2024-06-18T12:10:00Z'
  },
  // Add more mock data for demonstration
  {
    uuid: '6',
    details: 'Database connection timeout',
    api_name: 'event-stagedb-sync',
    status: 424,
    response_time_in_ms: 367,
    request_time: '2024-06-17T14:30:00Z'
  },
  {
    uuid: '7',
    details: 'Payment processing failed',
    api_name: 'participant-payment-registration',
    status: 500,
    response_time_in_ms: 289,
    request_time: '2024-06-17T16:45:00Z'
  },
  {
    uuid: '8',
    details: 'Sync completed',
    api_name: 'sync-program-based-on-status',
    status: 200,
    response_time_in_ms: 98,
    request_time: '2024-06-17T13:20:00Z'
  },
  {
    uuid: '9',
    details: 'Static data cached',
    api_name: 'get-static-data',
    status: 200,
    response_time_in_ms: 45,
    request_time: '2024-06-17T15:10:00Z'
  },
  {
    uuid: '10',
    details: 'Timeout error',
    api_name: 'event-stagedb-sync',
    status: 424,
    response_time_in_ms: 1200,
    request_time: '2024-06-16T10:00:00Z'
  }
];

// In a real application, this would connect to your SQLite database
const fetchDashboardData = async (): Promise<LogEntry[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In your real implementation, this would be something like:
  // const response = await fetch('/api/perf-report');
  // return response.json();
  
  return mockData;
};

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};
