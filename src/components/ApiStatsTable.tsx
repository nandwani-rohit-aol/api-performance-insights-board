
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingDown, AlertTriangle, Clock } from "lucide-react";

interface LogEntry {
  uuid: string;
  details: string;
  api_name: string;
  status: number;
  response_time_in_ms: number;
  request_time: string;
}

interface ApiStatsTableProps {
  data: LogEntry[];
}

export const ApiStatsTable: React.FC<ApiStatsTableProps> = ({ data }) => {
  const apiStats = useMemo(() => {
    const grouped = data.reduce((acc, log) => {
      const key = `${log.api_name}-${log.status}`;
      if (!acc[key]) {
        acc[key] = {
          api_name: log.api_name,
          status: log.status,
          frequency: 0,
          totalResponseTime: 0,
          requests: []
        };
      }
      acc[key].frequency += 1;
      acc[key].totalResponseTime += log.response_time_in_ms;
      acc[key].requests.push(log);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((item: any) => ({
      ...item,
      avgTime: Math.round(item.totalResponseTime / item.frequency)
    })).sort((a: any, b: any) => b.frequency - a.frequency);
  }, [data]);

  const failureStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const failures = data.filter(log => log.status >= 400);
    
    const grouped = failures.reduce((acc, log) => {
      if (!acc[log.api_name]) {
        acc[log.api_name] = {
          api_name: log.api_name,
          totalFailures: 0,
          todayFailures: 0,
          weekFailures: 0,
          commonStatus: {},
          avgResponseTime: 0,
          totalResponseTime: 0
        };
      }
      
      acc[log.api_name].totalFailures += 1;
      acc[log.api_name].totalResponseTime += log.response_time_in_ms;
      
      if (new Date(log.request_time) >= today) {
        acc[log.api_name].todayFailures += 1;
      }
      if (new Date(log.request_time) >= weekAgo) {
        acc[log.api_name].weekFailures += 1;
      }
      
      if (!acc[log.api_name].commonStatus[log.status]) {
        acc[log.api_name].commonStatus[log.status] = 0;
      }
      acc[log.api_name].commonStatus[log.status] += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((item: any) => {
      const mostCommonStatus = Object.entries(item.commonStatus)
        .sort(([,a]: any, [,b]: any) => b - a)[0];
      
      return {
        ...item,
        avgResponseTime: Math.round(item.totalResponseTime / item.totalFailures),
        mostCommonStatus: mostCommonStatus ? parseInt(mostCommonStatus[0]) : null,
        mostCommonStatusCount: mostCommonStatus ? mostCommonStatus[1] : 0
      };
    }).sort((a: any, b: any) => b.totalFailures - a.totalFailures);
  }, [data]);

  const slowestApis = useMemo(() => {
    const grouped = data.reduce((acc, log) => {
      if (!acc[log.api_name]) {
        acc[log.api_name] = {
          api_name: log.api_name,
          totalTime: 0,
          count: 0,
          slowestCall: log.response_time_in_ms,
          slowestCallTime: log.request_time
        };
      }
      
      acc[log.api_name].totalTime += log.response_time_in_ms;
      acc[log.api_name].count += 1;
      
      if (log.response_time_in_ms > acc[log.api_name].slowestCall) {
        acc[log.api_name].slowestCall = log.response_time_in_ms;
        acc[log.api_name].slowestCallTime = log.request_time;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((item: any) => ({
      ...item,
      avgResponseTime: Math.round(item.totalTime / item.count)
    })).sort((a: any, b: any) => b.avgResponseTime - a.avgResponseTime);
  }, [data]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance Report</TabsTrigger>
          <TabsTrigger value="failures">Failure Analysis</TabsTrigger>
          <TabsTrigger value="slowest">Slowest APIs</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>API Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-4 text-left font-semibold">API Function</th>
                      <th className="p-4 text-left font-semibold">Status Code</th>
                      <th className="p-4 text-left font-semibold">Frequency</th>
                      <th className="p-4 text-left font-semibold">Avg Time (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiStats.map((stat: any, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{stat.api_name}</td>
                        <td className="p-4">
                          <Badge 
                            className={
                              stat.status >= 200 && stat.status < 300 
                                ? "bg-green-100 text-green-800" 
                                : stat.status >= 400 && stat.status < 500
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {stat.status}
                          </Badge>
                        </td>
                        <td className="p-4 font-medium">{stat.frequency}</td>
                        <td className="p-4">
                          <span className={`font-medium ${
                            stat.avgTime > 1000 ? 'text-red-600' :
                            stat.avgTime > 500 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {stat.avgTime}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                API Failure Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-4 text-left font-semibold">API Name</th>
                      <th className="p-4 text-left font-semibold">Total Failures</th>
                      <th className="p-4 text-left font-semibold">Today</th>
                      <th className="p-4 text-left font-semibold">This Week</th>
                      <th className="p-4 text-left font-semibold">Most Common Error</th>
                      <th className="p-4 text-left font-semibold">Avg Response Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failureStats.map((stat: any, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{stat.api_name}</td>
                        <td className="p-4">
                          <Badge variant="destructive">{stat.totalFailures}</Badge>
                        </td>
                        <td className="p-4 font-medium text-red-600">{stat.todayFailures}</td>
                        <td className="p-4 font-medium text-orange-600">{stat.weekFailures}</td>
                        <td className="p-4">
                          {stat.mostCommonStatus && (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-red-100 text-red-800">
                                {stat.mostCommonStatus}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                ({stat.mostCommonStatusCount}x)
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-medium text-red-600">{stat.avgResponseTime}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slowest">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Slowest API Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-4 text-left font-semibold">API Name</th>
                      <th className="p-4 text-left font-semibold">Avg Response Time</th>
                      <th className="p-4 text-left font-semibold">Slowest Call</th>
                      <th className="p-4 text-left font-semibold">Total Calls</th>
                      <th className="p-4 text-left font-semibold">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowestApis.map((api: any, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{api.api_name}</td>
                        <td className="p-4">
                          <span className={`font-medium ${
                            api.avgResponseTime > 1000 ? 'text-red-600' :
                            api.avgResponseTime > 500 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {api.avgResponseTime}ms
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-red-600">{api.slowestCall}ms</span>
                        </td>
                        <td className="p-4 font-medium">{api.count}</td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(api.slowestCallTime).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
