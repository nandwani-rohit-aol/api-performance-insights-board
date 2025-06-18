
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface LogEntry {
  uuid: string;
  details: string;
  api_name: string;
  status: number;
  response_time_in_ms: number;
  request_time: string;
}

interface PerformanceChartProps {
  data: LogEntry[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const grouped = data.reduce((acc, log) => {
      const hour = new Date(log.request_time).toISOString().slice(0, 13) + ':00';
      if (!acc[hour]) {
        acc[hour] = {
          time: hour,
          requests: 0,
          avgResponseTime: 0,
          errors: 0,
          totalResponseTime: 0
        };
      }
      acc[hour].requests += 1;
      acc[hour].totalResponseTime += log.response_time_in_ms;
      acc[hour].avgResponseTime = Math.round(acc[hour].totalResponseTime / acc[hour].requests);
      if (log.status >= 400) {
        acc[hour].errors += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [data]);

  const apiPerformanceData = useMemo(() => {
    const grouped = data.reduce((acc, log) => {
      if (!acc[log.api_name]) {
        acc[log.api_name] = {
          api_name: log.api_name,
          count: 0,
          totalResponseTime: 0,
          errors: 0
        };
      }
      acc[log.api_name].count += 1;
      acc[log.api_name].totalResponseTime += log.response_time_in_ms;
      if (log.status >= 400) {
        acc[log.api_name].errors += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((item: any) => ({
      ...item,
      avgResponseTime: Math.round(item.totalResponseTime / item.count),
      errorRate: Math.round((item.errors / item.count) * 100)
    }));
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Response Time Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number, name: string) => [
                  `${value}${name === 'avgResponseTime' ? 'ms' : ''}`,
                  name === 'avgResponseTime' ? 'Avg Response Time' : 'Requests'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="avgResponseTime" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requests by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Bar dataKey="requests" fill="#82ca9d" />
              <Bar dataKey="errors" fill="#ff6b6b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>API Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={apiPerformanceData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="api_name" type="category" width={200} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value}${name === 'avgResponseTime' ? 'ms' : name === 'errorRate' ? '%' : ''}`,
                  name === 'avgResponseTime' ? 'Avg Response Time' : 
                  name === 'errorRate' ? 'Error Rate' : 'Total Calls'
                ]}
              />
              <Bar dataKey="avgResponseTime" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
