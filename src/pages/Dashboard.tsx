
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { LogsTable } from "@/components/LogsTable";
import { PerformanceChart } from "@/components/PerformanceChart";
import { ApiStatsTable } from "@/components/ApiStatsTable";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const { data: logs, isLoading } = useDashboardData();
  
  const metrics = useMemo(() => {
    if (!logs) return null;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayLogs = logs.filter(log => new Date(log.request_time) >= today);
    const weekLogs = logs.filter(log => new Date(log.request_time) >= weekAgo);
    
    const successfulCalls = logs.filter(log => log.status >= 200 && log.status < 300);
    const errorCalls = logs.filter(log => log.status >= 400);
    
    const avgResponseTime = logs.length > 0 
      ? Math.round(logs.reduce((sum, log) => sum + log.response_time_in_ms, 0) / logs.length)
      : 0;
      
    const slowestCall = logs.reduce((slowest, log) => 
      log.response_time_in_ms > (slowest?.response_time_in_ms || 0) ? log : slowest, null);
    
    return {
      totalCalls: logs.length,
      todayCalls: todayLogs.length,
      weekCalls: weekLogs.length,
      successRate: logs.length > 0 ? Math.round((successfulCalls.length / logs.length) * 100) : 0,
      errorRate: logs.length > 0 ? Math.round((errorCalls.length / logs.length) * 100) : 0,
      avgResponseTime,
      slowestCall
    };
  }, [logs]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">API Performance Dashboard</h1>
          <p className="text-lg text-gray-600">Monitor, analyze, and optimize your API performance</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total API Calls</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{metrics?.totalCalls || 0}</div>
              <p className="text-xs text-blue-600 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{metrics?.successRate || 0}%</div>
              <p className="text-xs text-green-600 mt-1">2xx status codes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">{metrics?.avgResponseTime || 0}ms</div>
              <p className="text-xs text-amber-600 mt-1">All endpoints</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{metrics?.errorRate || 0}%</div>
              <p className="text-xs text-red-600 mt-1">4xx & 5xx errors</p>
            </CardContent>
          </Card>
        </div>

        {/* Slowest Call Alert */}
        {metrics?.slowestCall && (
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <TrendingDown className="h-5 w-5" />
                Slowest API Call
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-orange-900">{metrics.slowestCall.api_name}</p>
                  <p className="text-sm text-orange-700">
                    {new Date(metrics.slowestCall.request_time).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-900">
                    {metrics.slowestCall.response_time_in_ms}ms
                  </div>
                  <Badge variant={metrics.slowestCall.status >= 400 ? "destructive" : "secondary"}>
                    {metrics.slowestCall.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PerformanceChart data={logs || []} />
          </TabsContent>

          <TabsContent value="logs">
            <LogsTable data={logs || []} />
          </TabsContent>

          <TabsContent value="analytics">
            <PerformanceChart data={logs || []} />
          </TabsContent>

          <TabsContent value="reports">
            <ApiStatsTable data={logs || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
