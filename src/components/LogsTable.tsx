
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowUpDown, Search, Eye, Loader2 } from "lucide-react";
import { databaseService, LogEntry, LogFilters } from '../services/database';
import { useQuery } from '@tanstack/react-query';

interface LogsTableProps {
  globalFilters?: LogFilters;
}

export const LogsTable: React.FC<LogsTableProps> = ({ globalFilters = {} }) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  
  // Local filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [apiFilter, setApiFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('request_time');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  
  // Applied filters (only updated when Apply button is clicked)
  const [appliedFilters, setAppliedFilters] = useState<LogFilters>({});

  const { data: apiNames } = useQuery({
    queryKey: ['api-names'],
    queryFn: databaseService.getApiNames,
  });

  const combinedFilters = {
    ...globalFilters,
    ...appliedFilters,
    sort_field: sortField,
    sort_direction: sortDirection
  };

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['logs', page, limit, combinedFilters],
    queryFn: () => databaseService.getLogs(page, limit, combinedFilters),
  });

  const handleApplyFilters = () => {
    const newFilters: LogFilters = {};
    
    if (searchTerm) newFilters.search = searchTerm;
    if (statusFilter !== 'all') newFilters.status = statusFilter;
    if (apiFilter !== 'all') newFilters.api_name = apiFilter;
    
    setAppliedFilters(newFilters);
    setPage(1); // Reset to first page when applying new filters
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setApiFilter('all');
    setAppliedFilters({});
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortDirection('DESC');
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

  const renderPagination = () => {
    if (!logsData?.pagination) return null;
    
    const { page: currentPage, total_pages } = logsData.pagination;
    const pages = [];
    
    // Show first page, current page range, and last page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(total_pages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              className={currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            />
          </PaginationItem>
          
          {pages.map(pageNum => (
            <PaginationItem key={pageNum}>
              <PaginationLink
                onClick={() => setPage(pageNum)}
                isActive={pageNum === currentPage}
                className="cursor-pointer"
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(total_pages, currentPage + 1))}
              className={currentPage >= total_pages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
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
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
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
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : (
            <>
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
                      {logsData?.logs.map((log) => (
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
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {logsData?.logs.length || 0} of {logsData?.pagination.total || 0} logs
                </div>
                {renderPagination()}
              </div>
            </>
          )}
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
