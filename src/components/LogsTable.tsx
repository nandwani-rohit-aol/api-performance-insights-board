import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowUpDown, Search, Filter, Eye } from "lucide-react";

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
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

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
    <>
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
                    <th className="p-4 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.map((log) => (
                    <tr key={log.uuid} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLog(log)}>
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
                      <td className="p-4">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              API Call Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">API Name</label>
                  <p className="text-lg font-semibold">{selectedLog.api_name}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Status Code</label>
                  <div>{getStatusBadge(selectedLog.status)}</div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Response Time</label>
                  <p className={`text-lg font-semibold ${
                    selectedLog.response_time_in_ms > 1000 ? 'text-red-600' :
                    selectedLog.response_time_in_ms > 500 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {selectedLog.response_time_in_ms}ms
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Request Time</label>
                  <p className="text-lg">{new Date(selectedLog.request_time).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">UUID</label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedLog.uuid}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Details</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedLog.details ? (
                    <pre className="whitespace-pre-wrap text-sm">{selectedLog.details}</pre>
                  ) : (
                    <p className="text-gray-500 italic">No details available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
