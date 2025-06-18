
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, Filter } from "lucide-react";

interface LogEntry {
  uuid: string;
  details: string;
  api_name: string;
  status: number;
  response_time_in_ms: number;
  request_time: string;
}

interface LogsTableProps {
  data: LogEntry[];
}

export const LogsTable: React.FC<LogsTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [apiFilter, setApiFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof LogEntry>('request_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const uniqueApis = useMemo(() => {
    return Array.from(new Set(data.map(log => log.api_name))).sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(log => {
      const matchesSearch = log.api_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.details.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'success' && log.status >= 200 && log.status < 300) ||
                           (statusFilter === 'error' && log.status >= 400) ||
                           log.status.toString() === statusFilter;
      
      const matchesApi = apiFilter === 'all' || log.api_name === apiFilter;
      
      return matchesSearch && matchesStatus && matchesApi;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'request_time') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, statusFilter, apiFilter, sortField, sortDirection]);

  const handleSort = (field: keyof LogEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{status}</Badge>;
    } else if (status >= 400 && status < 500) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{status}</Badge>;
    } else if (status >= 500) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{status}</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          API Request Logs
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 pt-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by API name or details..."
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
              <SelectItem value="200">200</SelectItem>
              <SelectItem value="400">400</SelectItem>
              <SelectItem value="404">404</SelectItem>
              <SelectItem value="424">424</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={apiFilter} onValueChange={setApiFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by API" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All APIs</SelectItem>
              {uniqueApis.map(api => (
                <SelectItem key={api} value={api}>{api}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4 text-left">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('request_time')}
                      className="font-semibold"
                    >
                      Time <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-4 text-left">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('api_name')}
                      className="font-semibold"
                    >
                      API Name <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-4 text-left">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('status')}
                      className="font-semibold"
                    >
                      Status <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-4 text-left">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('response_time_in_ms')}
                      className="font-semibold"
                    >
                      Response Time <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-4 text-left font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((log) => (
                  <tr key={log.uuid} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm">
                      {new Date(log.request_time).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium">{log.api_name}</td>
                    <td className="p-4">{getStatusBadge(log.status)}</td>
                    <td className="p-4">
                      <span className={`font-medium ${
                        log.response_time_in_ms > 1000 ? 'text-red-600' :
                        log.response_time_in_ms > 500 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {log.response_time_in_ms}ms
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                      {log.details || 'No details'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAndSortedData.length} of {data.length} logs
        </div>
      </CardContent>
    </Card>
  );
};
