import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingDown, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { databaseService, LogFilters } from '../services/database';

interface LogEntry {
  uuid: string;
  details: string;
  api_name: string;
  status: number;
  response_time_in_ms: number;
  request_time: string;
}

interface ApiStatsTableProps {
  globalFilters?: LogFilters;
}

export const ApiStatsTable: React.FC<ApiStatsTableProps> = ({ globalFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [apiFilter, setApiFilter] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState<LogFilters>({});

  const { data: apiNames } = useQuery({
    queryKey: ['api-names'],
    queryFn: databaseService.getApiNames,
  });

  const combinedFilters = {
    ...globalFilters,
    ...appliedFilters
  };

  const { data: apiStats, isLoading } = useQuery({
    queryKey: ['api-stats', combinedFilters],
    queryFn: () => databaseService.getApiStats(combinedFilters),
  });

  const handleApplyFilters = () => {
    const newFilters: LogFilters = {};
    
    if (searchTerm) newFilters.search = searchTerm;
    if (statusFilter !== 'all') newFilters.status = statusFilter;
    if (apiFilter !== 'all') newFilters.api_name = apiFilter;
    
    setAppliedFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setApiFilter('all');
    setAppliedFilters({});
  };

  // Group stats by API for failure analysis
  const failureStats = React.useMemo(() => {
    if (!apiStats) return [];
    
    const grouped = apiStats
      .filter(stat => stat.status >= 400)
      .reduce((acc: any, stat) => {
        if (!acc[stat.api_name]) {
          acc[stat.api_name] = {
            api_name: stat.api_name,
            total_failures: 0,
            avg_response_time: 0,
            total_response_time: 0,
            most_common_status: null,
            most_common_count: 0
          };
        }
        
        acc[stat.api_name].total_failures += stat.frequency;
        acc[stat.api_name].total_response_time += stat.avg_time * stat.frequency;
        
        if (stat.frequency > acc[stat.api_name].most_common_count) {
          acc[stat.api_name].most_common_status = stat.status;
          acc[stat.api_name].most_common_count = stat.frequency;
        }
        
        return acc;
      }, {});

    return Object.values(grouped).map((item: any) => ({
      ...item,
      avg_response_time: Math.round(item.total_response_time / item.total_failures)
    })).sort((a: any, b: any) => b.total_failures - a.total_failures);
  }, [apiStats]);

  // Group stats by API for slowest analysis
  const slowestApis = React.useMemo(() => {
    if (!apiStats) return [];
    
    const grouped = apiStats.reduce((acc: any, stat) => {
      if (!acc[stat.api_name]) {
        acc[stat.api_name] = {
          api_name: stat.api_name,
          total_calls: 0,
          total_time: 0,
          slowest_call: 0
        };
      }
      
      acc[stat.api_name].total_calls += stat.frequency;
      acc[stat.api_name].total_time += stat.avg_time * stat.frequency;
      acc[stat.api_name].slowest_call = Math.max(acc[stat.api_name].slowest_call, stat.max_time || stat.avg_time);
      
      return acc;
    }, {});

    return Object.values(grouped).map((item: any) => ({
      ...item,
      avg_response_time: Math.round(item.total_time / item.total_calls)
    })).sort((a: any, b: any) => b.avg_response_time - a.avg_response_time);
  }, [apiStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading API statistics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by API name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status Codes</SelectItem>
                  <SelectItem value="success">Success (2xx)</SelectItem>
                  <SelectItem value="error">Errors (4xx/5xx)</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={apiFilter} onValueChange={setApiFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by API" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All APIs</SelectItem>
                  {apiNames?.map(api => (
                    <SelectItem key={api} value={api}>{api}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} size="sm">
                Apply Filters
              </Button>
              <Button onClick={handleClearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    {apiStats?.map((stat: any, index) => (
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
                            stat.avg_time > 1000 ? 'text-red-600' :
                            stat.avg_time > 500 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {Math.round(stat.avg_time)}
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
                      <th className="p-4 text-left font-semibold">Most Common Error</th>
                      <th className="p-4 text-left font-semibold">Avg Response Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failureStats.map((stat: any, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{stat.api_name}</td>
                        <td className="p-4">
                          <Badge variant="destructive">{stat.total_failures}</Badge>
                        </td>
                        <td className="p-4">
                          {stat.most_common_status && (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-red-100 text-red-800">
                                {stat.most_common_status}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                ({stat.most_common_count}x)
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-medium text-red-600">{stat.avg_response_time}ms</td>
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
                    </tr>
                  </thead>
                  <tbody>
                    {slowestApis.map((api: any, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{api.api_name}</td>
                        <td className="p-4">
                          <span className={`font-medium ${
                            api.avg_response_time > 1000 ? 'text-red-600' :
                            api.avg_response_time > 500 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {api.avg_response_time}ms
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-red-600">{api.slowest_call}ms</span>
                        </td>
                        <td className="p-4 font-medium">{api.total_calls}</td>
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
